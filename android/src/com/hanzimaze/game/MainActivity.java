package com.hanzimaze.game;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.ActivityManager;
import android.app.ApplicationExitInfo;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Fullscreen WebView shell around assets/index.html, shared by every game APK.
 * Bridges: AndroidTTS (Chinese, plus Finnish when the phone has a voice for it) and AndroidSensors (tilt + compass).
 * A game whose manifest sets meta-data hanzimaze.origin=https is served from https://appassets.androidplatform.net/
 * instead of file://, which makes it a secure, cross-origin-isolated page (camera, threaded WebAssembly).
 * Opt-in meta-data for non-game apps: hanzimaze.bars=show keeps the system bars (and lets the keyboard resize the page),
 * hanzimaze.bridges=net,stt adds AndroidNet (HTTPS POST without CORS) and AndroidSTT (speech recognition);
 * "asr" backs AndroidSTT with an offline recognizer when the APK carries one (see offlineStt()).
 * If the page's process dies, the activity starts over instead of closing; an https page is told why with
 * ?recovered=crash|killed. Page console messages go to logcat under the tag "hanzimaze-web".
 * Crash report: AndroidShell.mark(stage) remembers what the page was doing; after the app died, the next start
 * offers AndroidShell.lastExit(): Android's exit reason, the Java stack or the readable part of the native
 * tombstone, and the last stage, so a crash on a phone without a USB cable can still be diagnosed.
 */
public class MainActivity extends Activity {

    private static final Locale FINNISH = new Locale("fi", "FI");
    private static final String GOOGLE_TTS = "com.google.android.tts";
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final int CAMERA_REQUEST = 7;
    static final int MIC_REQUEST = 8;
    private static final int FILE_REQUEST = 9;

    private WebView web;
    private TextToSpeech tts, ttsFi;
    private volatile boolean ttsReady, fiReady;
    private String fiEngine = "";
    private String ttsLang = "zh";
    private float zhRate = 0.8f, fiRate = 0.85f;
    private SensorBridge sensors;
    private boolean httpsOrigin;
    private PermissionRequest pendingCamera;
    private ValueCallback<Uri[]> fileCallback;
    private boolean immersive = true;
    private SpeechEngine stt;
    private boolean webGone;

    /** What the shell needs from whichever recognizer backs AndroidSTT. */
    interface SpeechEngine {
        void permissionResult(boolean granted);
        void release();
    }
    // why the previous page died (kept across recreate()), and how often that happened lately
    private static String lastGone;
    private static boolean crashHookSet;
    private static String exitReport;      // worked out once per process
    private static boolean reportShown;
    private static int goneCount;
    private static long goneAt;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        recordCrashes();
        if (exitReport == null) exitReport = buildExitReport();
        immersive = !"show".equals(metaString("hanzimaze.bars"));
        if (immersive) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (exitReport.length() > 0 && !reportShown) {
            // The app died last time: say why before building the page, in case building it is what fails.
            reportShown = true;
            showExitReport(new Runnable() {
                @Override
                public void run() { if (!isFinishing()) setUp(); }
            });
        } else {
            setUp();
        }
    }

    private void setUp() {
        web = new WebView(this);
        // Paint the theme's window colour until the page draws, so each game opens without a flash.
        int bg = Color.rgb(0xcf, 0xe3, 0xef);
        TypedValue tv = new TypedValue();
        if (getTheme().resolveAttribute(android.R.attr.windowBackground, tv, true)
                && tv.type >= TypedValue.TYPE_FIRST_COLOR_INT && tv.type <= TypedValue.TYPE_LAST_COLOR_INT) bg = tv.data;
        web.setBackgroundColor(bg);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100); // ignore system font size so the HUD layout holds
        httpsOrigin = "https".equals(metaString("hanzimaze.origin"));
        web.setWebViewClient(httpsOrigin ? new AssetClient() : new ShellClient());
        web.setWebChromeClient(new CameraChromeClient());
        sensors = new SensorBridge();
        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        web.addJavascriptInterface(sensors, "AndroidSensors");
        web.addJavascriptInterface(new ShellBridge(), "AndroidShell");
        String bridges = metaString("hanzimaze.bridges");
        if (bridges != null && bridges.contains("net")) web.addJavascriptInterface(new NetBridge(), "AndroidNet");
        if (bridges != null && bridges.contains("asr")) stt = offlineStt();
        if (stt == null && bridges != null && bridges.contains("stt")) stt = new SttBridge();
        if (stt != null) web.addJavascriptInterface(stt, "AndroidSTT");
        setContentView(web);
        if (immersive) hideSystemBars();

        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(final int status) {
                // onInit may come before the constructor has returned (it does when the phone shows the app no
                // speech engine), so look at the engine on the next loop turn, when `tts` is set.
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() { ttsStarted(status); }
                });
            }
        });

        // Older games stay on file:// so their saved progress (stored per origin) is kept.
        String recovered = lastGone != null ? "?recovered=" + lastGone : "";
        lastGone = null;
        web.loadUrl(httpsOrigin ? "https://" + APP_HOST + "/index.html" + recovered : "file:///android_asset/index.html");
    }

    private void ttsStarted(int status) {
        if (tts == null || isFinishing()) return;
        if (status == TextToSpeech.SUCCESS) {
            int r = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
            ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            tts.setSpeechRate(zhRate);
            tts.setOnUtteranceProgressListener(doneListener);
        }
        setUpFinnish(status == TextToSpeech.SUCCESS);
    }

    private String metaString(String key) {
        try {
            ActivityInfo ai = getPackageManager().getActivityInfo(getComponentName(), PackageManager.GET_META_DATA);
            return ai.metaData != null ? ai.metaData.getString(key) : null;
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }

    /** Every game's WebViewClient. When the page's process crashes or is killed for memory, Android would close
     *  the whole app unless this returns true; instead the activity starts over (but gives up after 3 times a minute). */
    private class ShellClient extends WebViewClient {
        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            lastGone = detail.didCrash() ? "crash" : "killed";
            Log.w("hanzimaze", "page process gone: " + lastGone);
            webGone = true;
            if (view.getParent() instanceof ViewGroup) ((ViewGroup) view.getParent()).removeView(view);
            long now = System.currentTimeMillis();
            goneCount = now - goneAt < 60000 ? goneCount + 1 : 1;
            goneAt = now;
            final boolean again = goneCount <= 3;
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    if (isFinishing()) return;
                    if (again) recreate(); else finish();
                }
            });
            return true;
        }
    }

    /** Serves the APK's assets at https://appassets.androidplatform.net/ with cross-origin isolation headers. */
    private class AssetClient extends ShellClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri u = request.getUrl();
            if (!"https".equals(u.getScheme()) || !APP_HOST.equals(u.getHost())) return null;
            String path = u.getPath();
            if (path == null || path.length() <= 1) path = "/index.html";
            path = path.substring(1);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cross-Origin-Opener-Policy", "same-origin");
            headers.put("Cross-Origin-Embedder-Policy", "require-corp");
            headers.put("Cross-Origin-Resource-Policy", "same-origin");
            headers.put("Cache-Control", "no-cache");
            String mime = mimeOf(path);
            String charset = mime.startsWith("text/") || mime.endsWith("json") ? "utf-8" : null;
            try {
                return new WebResourceResponse(mime, charset, 200, "OK", headers, getAssets().open(path));
            } catch (IOException e) {
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers, new ByteArrayInputStream(new byte[0]));
            }
        }
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".mp4")) return "video/mp4";
        if (p.endsWith(".webm")) return "video/webm";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".ogg") || p.endsWith(".opus")) return "audio/ogg";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".ttf")) return "font/ttf";
        return "application/octet-stream";
    }

    /** Lets the page open the camera and the microphone, asking Android for the permission the first time. */
    private class CameraChromeClient extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage m) {
            ConsoleMessage.MessageLevel l = m.messageLevel();
            int prio = l == ConsoleMessage.MessageLevel.ERROR ? Log.ERROR : l == ConsoleMessage.MessageLevel.WARNING ? Log.WARN : Log.INFO;
            Log.println(prio, "hanzimaze-web", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
            return true;
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    List<String> res = Arrays.asList(request.getResources());
                    List<String> missing = new ArrayList<>();
                    boolean wanted = false;
                    if (res.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        wanted = true;
                        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.CAMERA);
                    }
                    if (res.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        wanted = true;
                        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) missing.add(Manifest.permission.RECORD_AUDIO);
                    }
                    if (!wanted) {
                        request.deny();
                    } else if (missing.isEmpty()) {
                        grantMedia(request);
                    } else {
                        if (pendingCamera != null) pendingCamera.deny();
                        pendingCamera = request;
                        requestPermissions(missing.toArray(new String[0]), CAMERA_REQUEST);
                    }
                }
            });
        }

        @Override
        public void onPermissionRequestCanceled(PermissionRequest request) {
            if (pendingCamera == request) pendingCamera = null;
        }

        /** <input type="file"> in the page (e.g. picking a recorded video): opens Android's file picker. */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                startActivityForResult(params.createIntent(), FILE_REQUEST);
            } catch (Exception e) {
                fileCallback = null;
                callback.onReceiveValue(null);
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code == FILE_REQUEST && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(code, result, data);
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        if (code == MIC_REQUEST && stt != null) { stt.permissionResult(granted); return; }
        if (code != CAMERA_REQUEST || pendingCamera == null) return;
        grantMedia(pendingCamera);
        pendingCamera = null;
    }

    /** Grants the camera and/or microphone the page asked for, as far as Android has allowed them; denies the rest. */
    private void grantMedia(PermissionRequest request) {
        List<String> ok = new ArrayList<>();
        for (String r : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) && checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) ok.add(r);
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r) && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) ok.add(r);
        }
        if (ok.isEmpty()) request.deny(); else request.grant(ok.toArray(new String[0]));
    }

    /** Use the default engine for Finnish when it can; otherwise try every other installed engine, Google's first. */
    private void setUpFinnish(boolean defaultOk) {
        String def = String.valueOf(tts.getDefaultEngine());
        if (defaultOk && canSpeak(tts, FINNISH)) { ttsFi = tts; fiEngine = def; fiReady = true; return; }
        List<String> others = new ArrayList<>();
        for (TextToSpeech.EngineInfo e : tts.getEngines()) {
            if (e.name.equals(def)) continue;
            if (GOOGLE_TTS.equals(e.name)) others.add(0, e.name); else others.add(e.name);
        }
        tryFinnish(others, 0);
    }

    private void tryFinnish(final List<String> engines, final int i) {
        if (i >= engines.size() || isFinishing()) return;
        final String name = engines.get(i);
        final TextToSpeech[] made = new TextToSpeech[1];
        made[0] = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(final int status) {
                // onInit may come before the constructor has returned, so look at the engine on the next loop turn.
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                        TextToSpeech t = made[0];
                        if (t == null) return;
                        if (status == TextToSpeech.SUCCESS && canSpeak(t, FINNISH)) {
                            t.setLanguage(FINNISH);
                            t.setOnUtteranceProgressListener(doneListener);
                            ttsFi = t;
                            fiEngine = name;
                            fiReady = true;
                        } else {
                            t.shutdown();
                            tryFinnish(engines, i + 1);
                        }
                    }
                });
            }
        }, name);
    }

    private static boolean canSpeak(TextToSpeech t, Locale l) {
        return t.isLanguageAvailable(l) >= TextToSpeech.LANG_AVAILABLE;
    }

    /** Picks the engine for a language and switches the shared engine's language when needed. */
    private synchronized TextToSpeech engineFor(String lang) {
        if ("fi".equals(lang)) {
            if (!fiReady || ttsFi == null) return null;
            if (ttsFi == tts && !"fi".equals(ttsLang)) { tts.setLanguage(FINNISH); ttsLang = "fi"; }
            ttsFi.setSpeechRate(fiRate);
            return ttsFi;
        }
        if (!ttsReady || tts == null) return null;
        if (!"zh".equals(ttsLang)) { tts.setLanguage(Locale.SIMPLIFIED_CHINESE); ttsLang = "zh"; }
        tts.setSpeechRate(zhRate);
        return tts;
    }

    /** Tells the page when an utterance from speakIn() has finished, so it can queue the next language. */
    private final UtteranceProgressListener doneListener = new UtteranceProgressListener() {
        @Override public void onStart(String id) {}
        @Override public void onDone(String id) { tellDone(id); }
        @SuppressWarnings("deprecation")
        @Override public void onError(String id) { tellDone(id); }
        @Override public void onError(String id, int code) { tellDone(id); }
        @Override public void onStop(String id, boolean interrupted) { tellDone(id); }
    };

    private void tellDone(final String id) {
        if (id == null || !id.startsWith("u")) return; // "hanzi" ids from speak() need no reply
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript("window.__ttsDone&&__ttsDone(" + JSONObject.quote(id) + ")", null);
            }
        });
    }

    private SharedPreferences shellPrefs() { return getSharedPreferences("hanzimaze.shell", MODE_PRIVATE); }

    /** Writes an uncaught Java exception to last-crash.txt, then lets Android handle the crash as usual. */
    private void recordCrashes() {
        if (crashHookSet) return;
        crashHookSet = true;
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        final File out = new File(getFilesDir(), "last-crash.txt");
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread t, Throwable e) {
                try {
                    StringWriter sw = new StringWriter();
                    e.printStackTrace(new PrintWriter(sw));
                    FileOutputStream f = new FileOutputStream(out);
                    f.write(("thread " + t.getName() + "\n" + sw).getBytes("UTF-8"));
                    f.close();
                } catch (Throwable ignored) {}
                if (prev != null) prev.uncaughtException(t, e);
            }
        });
    }

    /** JSON about the last time this app died (empty when it ended normally or was already reported). */
    private String buildExitReport() {
        SharedPreferences p = shellPrefs();
        JSONObject o = new JSONObject();
        try {
            String stage = p.getString("stage", "");
            if (Build.VERSION.SDK_INT >= 30) {
                ActivityManager am = (ActivityManager) getSystemService(ACTIVITY_SERVICE);
                // newest first; the list also holds the WebView's helper processes, so look for the app's own
                ApplicationExitInfo x = null;
                for (ApplicationExitInfo e : am.getHistoricalProcessExitReasons(getPackageName(), 0, 16)) {
                    if (getPackageName().equals(e.getProcessName())) { x = e; break; }
                }
                if (x != null) {
                    int r = x.getReason();
                    String why = String.valueOf(x.getDescription());
                    boolean fresh = x.getTimestamp() > p.getLong("exitSeen", 0);
                    if (fresh && !isRealFailure(r, x.getImportance(), why)) {
                        Log.i("hanzimaze", "last exit not reported: " + reasonName(r) + ", " + why
                                + ", importance " + x.getImportance());
                    } else if (fresh) {
                        o.put("reason", reasonName(r));
                        o.put("description", why);
                        o.put("importance", x.getImportance());
                        o.put("status", x.getStatus());
                        o.put("time", x.getTimestamp());
                        o.put("pssMB", x.getPss() / 1024);
                        o.put("rssMB", x.getRss() / 1024);
                        String trace = readTrace(x, r == ApplicationExitInfo.REASON_CRASH_NATIVE);
                        if (trace.length() > 0) o.put("trace", trace);
                    }
                    p.edit().putLong("exitSeen", x.getTimestamp()).apply();
                }
            }
            File f = new File(getFilesDir(), "last-crash.txt");
            if (f.exists()) {
                String java = readAll(new FileInputStream(f));
                if (java.length() > 4000) java = java.substring(0, 4000);
                o.put("java", java);
                f.delete();
            }
            if (o.length() > 0) {
                o.put("stage", stage);
                o.put("device", Build.MANUFACTURER + " " + Build.MODEL + ", Android " + Build.VERSION.RELEASE);
                o.put("webview", webViewVersion());
                Log.w("hanzimaze", "last exit: " + o);
            }
        } catch (Throwable e) {
            Log.w("hanzimaze", "exit report failed", e);
        }
        p.edit().putString("stage", "launch").commit();
        return o.length() > 0 ? o.toString() : "";
    }

    /** Did the app really fail? Android and the phone maker also end apps on purpose to free memory, and that is
     *  normal: HyperOS does it whenever the camera opens (reason OTHER, "camera boost"). Such a system kill only
     *  counts when the app was on screen at that moment, so the player actually saw it vanish. */
    private static boolean isRealFailure(int reason, int importance, String description) {
        switch (reason) {
            case ApplicationExitInfo.REASON_CRASH:
            case ApplicationExitInfo.REASON_CRASH_NATIVE:
            case ApplicationExitInfo.REASON_ANR:
            case ApplicationExitInfo.REASON_INITIALIZATION_FAILURE:
                return true;
            case ApplicationExitInfo.REASON_SIGNALED:
            case ApplicationExitInfo.REASON_LOW_MEMORY:
            case ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE:
            case ApplicationExitInfo.REASON_OTHER:
                return importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE
                        && !description.toLowerCase().contains("boost");
            default:
                return false;
        }
    }

    /** A plain Android dialog with the crash report; "复制" copies the full report for pasting into a chat. */
    private void showExitReport(final Runnable then) {
        String text;
        try {
            JSONObject o = new JSONObject(exitReport);
            StringBuilder sb = new StringBuilder("请截图，或点「复制」发给开发的人。\n\n");
            sb.append("原因 reason: ").append(o.optString("reason")).append('\n');
            sb.append("当时 stage: ").append(o.optString("stage")).append('\n');
            sb.append("说明: ").append(o.optString("description")).append('\n');
            sb.append(o.optString("device")).append('\n');
            sb.append("WebView: ").append(o.optString("webview")).append('\n');
            sb.append("内存 PSS: ").append(o.optString("pssMB")).append(" MB\n");
            String java = o.optString("java");
            if (java.length() > 0) {
                String[] lines = java.split("\n");
                sb.append('\n');
                for (int i = 0; i < Math.min(18, lines.length); i++) sb.append(lines[i]).append('\n');
            }
            String trace = o.optString("trace");
            if (trace.length() > 0) {
                sb.append('\n');
                int n = 0;
                for (String l : trace.split("\n")) {
                    if (!l.matches(".*(signal|Signal|SIG|abort|Abort|fault|Fatal|Exception|\\.so|backtrace).*")) continue;
                    sb.append(l).append('\n');
                    if (++n >= 30) break;
                }
            }
            text = sb.toString();
        } catch (Exception e) {
            text = exitReport;
        }
        AlertDialog d = new AlertDialog.Builder(this)
                .setTitle("上次闪退了 · It crashed last time")
                .setMessage(text)
                .setCancelable(false)
                .setPositiveButton("继续 Continue", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) { then.run(); }
                })
                .setNeutralButton("复制 Copy", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                        if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("crash report", exitReport));
                        then.run();
                    }
                })
                .create();
        d.show();
        TextView m = (TextView) d.findViewById(android.R.id.message);
        if (m != null) { m.setTextIsSelectable(true); m.setTextSize(12); }
    }

    private static String reasonName(int r) {
        switch (r) {
            case ApplicationExitInfo.REASON_CRASH: return "crash (Java)";
            case ApplicationExitInfo.REASON_CRASH_NATIVE: return "crash (native)";
            case ApplicationExitInfo.REASON_ANR: return "not responding (ANR)";
            case ApplicationExitInfo.REASON_SIGNALED: return "killed by a signal";
            case ApplicationExitInfo.REASON_LOW_MEMORY: return "low memory";
            case ApplicationExitInfo.REASON_INITIALIZATION_FAILURE: return "start-up failure";
            case ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE: return "too much CPU or memory";
            default: return "other (" + r + ")";
        }
    }

    /** ANR traces are text; a native crash comes as a binary tombstone, so keep only its readable strings
     *  (signal, abort message, library and function names). */
    private static String readTrace(ApplicationExitInfo x, boolean binary) {
        try {
            InputStream in = x.getTraceInputStream();
            if (in == null) return "";
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0 && buf.size() < 400000) buf.write(b, 0, n);
            in.close();
            byte[] all = buf.toByteArray();
            if (!binary) return new String(all, 0, Math.min(all.length, 6000), "UTF-8");
            StringBuilder sb = new StringBuilder(), run = new StringBuilder();
            for (byte v : all) {
                if (v >= 32 && v < 127) { run.append((char) v); continue; }
                if (run.length() >= 6) sb.append(run).append('\n');
                run.setLength(0);
                if (sb.length() > 6000) break;
            }
            return sb.toString();
        } catch (Throwable e) {
            return "trace unreadable: " + e;
        }
    }

    private static String webViewVersion() {
        try {
            android.content.pm.PackageInfo pi = WebView.getCurrentWebViewPackage();
            return pi == null ? "" : pi.packageName + " " + pi.versionName;
        } catch (Throwable e) {
            return "";
        }
    }

    /** What the page is doing (written to disk at once, so it survives a crash) and the report about the last crash. */
    private class ShellBridge {
        @JavascriptInterface
        public void mark(String stage) {
            shellPrefs().edit().putString("stage", stage).commit();
        }

        @JavascriptInterface
        public String lastExit() { return exitReport == null ? "" : exitReport; }

        @JavascriptInterface
        public void reported() { exitReport = ""; }
    }

    private class TtsBridge {
        @JavascriptInterface
        public boolean speak(String text) {
            TextToSpeech t = engineFor("zh");
            if (t == null) return false;
            t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hanzi");
            return true;
        }

        /** Page's parent setting for reading speed (1.0 = normal). */
        @JavascriptInterface
        public void rate(float r) {
            zhRate = Math.max(0.3f, Math.min(2f, r));
            if (tts != null) tts.setSpeechRate(zhRate);
        }

        /** Like speakIn(), at a given speed (1.0 = normal): slow, normal and spoken-speed Finnish. */
        @JavascriptInterface
        public boolean speakAt(String text, String lang, float rate, String id) {
            TextToSpeech t = engineFor(lang);
            if (t == null) return false;
            t.setSpeechRate(Math.max(0.3f, Math.min(2.5f, rate)));
            return t.speak(text, TextToSpeech.QUEUE_FLUSH, null, id) == TextToSpeech.SUCCESS;
        }

        /** Speaks in "zh" or "fi"; the page gets __ttsDone(id) when it ends. */
        @JavascriptInterface
        public boolean speakIn(String text, String lang, String id) {
            TextToSpeech t = engineFor(lang);
            return t != null && t.speak(text, TextToSpeech.QUEUE_FLUSH, null, id) == TextToSpeech.SUCCESS;
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) tts.stop();
            if (ttsFi != null && ttsFi != tts) ttsFi.stop();
        }

        @JavascriptInterface
        public boolean has(String lang) {
            return "fi".equals(lang) ? fiReady : ttsReady;
        }

        /** Engine names for the page's voice note. */
        @JavascriptInterface
        public String engines() {
            String zh = tts != null ? tts.getDefaultEngine() : "";
            String fi = fiReady && ttsFi != null ? fiEngine : "";
            return zh + "," + fi;
        }
    }

    /** Gravity for tilt steering and a compass heading, polled by the page with read(). */
    private class SensorBridge implements SensorEventListener {
        private final SensorManager sm = (SensorManager) getSystemService(SENSOR_SERVICE);
        private final float[] rot = new float[9];
        private volatile float heading = Float.NaN, spread = -1f, gx, gy, gz;
        private volatile int accuracy = -1;
        private volatile boolean wanted;
        private boolean listening;

        private Sensor rotation() {
            return sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        }

        private Sensor gravity() {
            if (sm == null) return null;
            Sensor g = sm.getDefaultSensor(Sensor.TYPE_GRAVITY);
            return g != null ? g : sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }

        @JavascriptInterface
        public String caps() {
            return (rotation() != null ? "compass" : "") + "," + (gravity() != null ? "tilt" : "");
        }

        @JavascriptInterface
        public String start() {
            wanted = true;
            post(true);
            return caps();
        }

        @JavascriptInterface
        public void stop() {
            wanted = false;
            post(false);
        }

        /** heading in degrees (NaN until known), heading accuracy in degrees (-1 unknown), accuracy status, gravity x,y,z in m/s² */
        @JavascriptInterface
        public String read() {
            return heading + "," + spread + "," + accuracy + "," + gx + "," + gy + "," + gz;
        }

        void pause() { post(false); }

        void resume() { if (wanted) post(true); }

        private void post(final boolean on) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { listen(on); }
            });
        }

        private void listen(boolean on) {
            if (sm == null || on == listening) return;
            listening = on;
            if (!on) { sm.unregisterListener(this); return; }
            Sensor r = rotation(), g = gravity();
            if (r != null) sm.registerListener(this, r, SensorManager.SENSOR_DELAY_GAME);
            if (g != null) sm.registerListener(this, g, SensorManager.SENSOR_DELAY_GAME);
        }

        @Override
        public void onSensorChanged(SensorEvent e) {
            int type = e.sensor.getType();
            if (type == Sensor.TYPE_ROTATION_VECTOR) {
                // Some phones send 5 values, which older Android versions reject here.
                SensorManager.getRotationMatrixFromVector(rot, e.values.length > 4 ? Arrays.copyOf(e.values, 4) : e.values);
                // The way the phone faces: its top edge when lying flat, its back camera when held upright.
                // Adding both horizontal parts keeps the heading steady at every angle in between.
                double east = rot[1] - rot[2], north = rot[4] - rot[5];
                if (east * east + north * north > 1e-4) heading = (float) ((Math.toDegrees(Math.atan2(east, north)) + 360) % 360);
                if (e.values.length > 4 && e.values[4] >= 0) spread = (float) Math.toDegrees(e.values[4]);
            } else if (type == Sensor.TYPE_GRAVITY) {
                gx = e.values[0]; gy = e.values[1]; gz = e.values[2];
            } else if (type == Sensor.TYPE_ACCELEROMETER) {
                gx += (e.values[0] - gx) * 0.2f; gy += (e.values[1] - gy) * 0.2f; gz += (e.values[2] - gz) * 0.2f;
            }
        }

        @Override
        public void onAccuracyChanged(Sensor s, int a) {
            if (s.getType() == Sensor.TYPE_ROTATION_VECTOR) accuracy = a;
        }
    }

    /** POSTs over HTTPS off the UI thread and answers window.__netDone(id, status, body); used for the Claude API. */
    private class NetBridge {
        @JavascriptInterface
        public void post(final String id, final String url, final String headers, final String body) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    int status = 0;
                    String text;
                    HttpURLConnection c = null;
                    try {
                        URL u = new URL(url);
                        if (!"https".equals(u.getProtocol())) throw new IOException("https only");
                        c = (HttpURLConnection) u.openConnection();
                        c.setRequestMethod("POST");
                        c.setDoOutput(true);
                        c.setConnectTimeout(20000);
                        c.setReadTimeout(180000);
                        JSONObject h = new JSONObject(headers);
                        Iterator<String> keys = h.keys();
                        while (keys.hasNext()) { String k = keys.next(); c.setRequestProperty(k, h.getString(k)); }
                        byte[] b = body.getBytes("UTF-8");
                        c.setFixedLengthStreamingMode(b.length);
                        OutputStream os = c.getOutputStream();
                        os.write(b);
                        os.close();
                        status = c.getResponseCode();
                        InputStream is = status >= 400 ? c.getErrorStream() : c.getInputStream();
                        text = is == null ? "" : readAll(is);
                    } catch (Exception e) {
                        status = 0;
                        text = String.valueOf(e.getMessage());
                    } finally {
                        if (c != null) c.disconnect();
                    }
                    final String js = "window.__netDone&&__netDone(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + ")";
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() { if (web != null) web.evaluateJavascript(js, null); }
                    });
                }
            }).start();
        }
    }

    private static String readAll(InputStream is) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) > 0) out.write(buf, 0, n);
        is.close();
        return out.toString("UTF-8");
    }

    /** hanzimaze.bridges=asr: an offline recognizer compiled in only for the app that ships one
     *  (读字过桥: android/readbridge/java/OfflineStt.java + sherpa-onnx). Null when this APK has none. */
    private SpeechEngine offlineStt() {
        try {
            Class<?> c = Class.forName("com.hanzimaze.game.OfflineStt");
            java.lang.reflect.Constructor<?> k = c.getDeclaredConstructor(Activity.class, WebView.class);
            k.setAccessible(true);
            return (SpeechEngine) k.newInstance(this, web);
        } catch (Throwable t) {
            Log.w("hanzimaze", "no offline recognizer", t);
            return null;
        }
    }

    /** Android speech recognition for answering out loud. Events go to window.__sttEvent(id, type, payload):
     *  ready, partial, end, final (alternatives joined by newlines) and error (SpeechRecognizer code or "permission"). */
    private class SttBridge implements RecognitionListener, SpeechEngine {
        private SpeechRecognizer rec;
        private String id, lang;

        @JavascriptInterface
        public boolean available() { return SpeechRecognizer.isRecognitionAvailable(MainActivity.this); }

        @JavascriptInterface
        public void listen(final String language, final String reqId) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { start(language, reqId); }
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { if (rec != null) rec.stopListening(); }
            });
        }

        // 读字过桥: opt-in loudness events ("rms", dB as text, at most ~12 per second). Other pages never call this.
        private volatile boolean levels;
        private long lastRms;
        @JavascriptInterface
        public void levels(boolean on) { levels = on; }

        void start(String language, String reqId) {
            id = reqId;
            lang = language;
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_REQUEST);
                return;
            }
            release();
            rec = SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
            rec.setRecognitionListener(this);
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
            rec.startListening(i);
        }

        @Override public void permissionResult(boolean granted) {
            if (granted && id != null) start(lang, id);
            else send("error", "permission");
        }

        @Override public void release() {
            if (rec != null) { rec.destroy(); rec = null; }
        }

        private void send(String type, String payload) {
            final String js = "window.__sttEvent&&__sttEvent(" + JSONObject.quote(id == null ? "" : id) + "," + JSONObject.quote(type) + "," + JSONObject.quote(payload) + ")";
            runOnUiThread(new Runnable() {
                @Override
                public void run() { if (web != null) web.evaluateJavascript(js, null); }
            });
        }

        private String join(Bundle b) {
            ArrayList<String> r = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (r == null) return "";
            StringBuilder sb = new StringBuilder();
            for (String s : r) { if (sb.length() > 0) sb.append('\n'); sb.append(s); }
            return sb.toString();
        }

        @Override public void onReadyForSpeech(Bundle p) { send("ready", ""); }
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float v) {
            if (!levels) return;
            long now = System.currentTimeMillis();
            if (now - lastRms < 80) return;
            lastRms = now;
            send("rms", String.valueOf(Math.round(v * 10) / 10f));
        }
        @Override public void onBufferReceived(byte[] b) {}
        @Override public void onEndOfSpeech() { send("end", ""); }
        @Override public void onError(int code) { send("error", String.valueOf(code)); }
        @Override public void onResults(Bundle b) { send("final", join(b)); }
        @Override public void onPartialResults(Bundle b) { String s = join(b); if (s.length() > 0) send("partial", s); }
        @Override public void onEvent(int t, Bundle p) {}
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersive) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        // Let the game decide: play -> pause, pause -> resume, results -> menu, menu -> exit.
        if (web == null || webGone) { finish(); return; }
        web.evaluateJavascript("window.hanziApp ? hanziApp.back() : false", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String handled) {
                if (!"true".equals(handled)) finish();
            }
        });
    }

    @Override
    protected void onPause() {
        boolean live = web != null && !webGone;
        if (live) web.evaluateJavascript("window.hanziApp && hanziApp.pause()", null);
        if (tts != null) tts.stop();
        if (ttsFi != null && ttsFi != tts) ttsFi.stop();
        if (sensors != null) sensors.pause();
        if (stt != null) stt.release();
        if (live) web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        boolean live = web != null && !webGone;
        if (live) web.onResume();
        if (sensors != null) sensors.resume();
        if (immersive) hideSystemBars();
        if (live) web.evaluateJavascript("window.hanziApp && hanziApp.resume && hanziApp.resume()", null);
    }

    @Override
    protected void onDestroy() {
        if (sensors != null) sensors.stop();
        if (stt != null) stt.release();
        if (tts != null) tts.shutdown();
        if (ttsFi != null && ttsFi != tts) ttsFi.shutdown();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
