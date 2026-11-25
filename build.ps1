# 黄花的生活：打包安卓 APK —— 不用 Gradle，直接用本机的 Android SDK（build-tools + platforms\android-34）和 JDK
#
#   powershell -ExecutionPolicy Bypass -File build.ps1
#
# 输出：release\HuanghuaLife.apk（release\ 不进 git）。
# 手机上已经装了旧版本的话，先把 android\AndroidManifest.xml 里的 versionCode 加 1。
#
# 签名：android\signing.local.ps1（不进 git）里写两行
#     $KeyStore  = '...\hanzimaze.keystore'
#     $StorePass = '...'
# 没有这个文件，就在 android\ 里新建一把本地钥匙（也不进 git），并写好 signing.local.ps1。
# 同一个包名的更新必须用同一把钥匙签名；换了钥匙，要先在手机上卸载旧版本。
param(
  [string]$Apk = 'release\HuanghuaLife.apk'
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$bt = Get-ChildItem "$sdk\build-tools" | Sort-Object { [version]$_.Name } | Select-Object -Last 1 -ExpandProperty FullName
$jar = "$sdk\platforms\android-34\android.jar"
if (-not $env:JAVA_HOME) { $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr' }
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
if (-not (Test-Path $jar)) { throw "Android SDK not found: $jar (set ANDROID_HOME)" }

function Run($exe) {
  & $exe @args
  if ($LASTEXITCODE -ne 0) { throw "$([IO.Path]::GetFileName($exe)) failed ($LASTEXITCODE)" }
}

# ---------- 签名钥匙 ----------
$KeyStore = $null; $StorePass = $null
$local = Join-Path $here 'android\signing.local.ps1'
if (Test-Path -LiteralPath $local) { . $local }
if (-not $KeyStore) {
  $KeyStore = Join-Path $here 'android\local.keystore'
  $StorePass = -join ((48..57) + (97..122) | Get-Random -Count 20 | ForEach-Object { [char]$_ })
  Run keytool -genkeypair -keystore $KeyStore -alias huanghua -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $StorePass -keypass $StorePass -dname 'CN=Huanghua Life' | Out-Null
  [IO.File]::WriteAllText($local, "`$KeyStore = '$KeyStore'`r`n`$StorePass = '$StorePass'`r`n", (New-Object Text.UTF8Encoding $true))
  Write-Host "new signing key: $KeyStore (settings in android\signing.local.ps1)"
}
if (-not (Test-Path -LiteralPath $KeyStore)) { throw "keystore not found: $KeyStore" }

# ---------- 在一个纯英文路径的临时文件夹里打包（Windows 上 aapt2 对中文路径不放心） ----------
$work = Join-Path $env:TEMP 'huanghua-apk-build'   # 打包用的临时文件夹
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force "$work\flat", "$work\classes", "$work\dex", "$work\assets", "$work\extra\assets", "$work\in" | Out-Null
Copy-Item -LiteralPath (Join-Path $here 'android\AndroidManifest.xml') "$work\in\AndroidManifest.xml"
Copy-Item -Recurse -LiteralPath (Join-Path $here 'android\res') "$work\in\res"
Copy-Item -Recurse -LiteralPath (Join-Path $here 'android\src') "$work\in\src"
# 页面 → assets/index.html；游戏文件夹 → assets/huanghua/（第 4 步加进 APK，路径统一用 "/"）
Copy-Item -LiteralPath (Join-Path $here 'huanghua.html') "$work\assets\index.html"
Copy-Item -Recurse -LiteralPath (Join-Path $here 'huanghua') "$work\extra\assets\huanghua"

Write-Host '1/5 resources'
Run "$bt\aapt2.exe" compile --dir "$work\in\res" -o "$work\flat"
$flats = Get-ChildItem "$work\flat\*.flat" | ForEach-Object FullName
Run "$bt\aapt2.exe" link -o "$work\unsigned.apk" -I $jar --manifest "$work\in\AndroidManifest.xml" `
  --min-sdk-version 24 --target-sdk-version 34 -A "$work\assets" --java "$work\gen" @flats

Write-Host '2/5 compile'
$srcs = @(Get-ChildItem -Recurse "$work\in\src\*.java" | ForEach-Object FullName) + @(Get-ChildItem -Recurse "$work\gen\*.java" | ForEach-Object FullName)
Run javac -encoding UTF-8 -source 8 -target 8 '-Xlint:-options' -nowarn -bootclasspath $jar -d "$work\classes" @srcs

Write-Host '3/5 dex'
$classes = Get-ChildItem -Recurse "$work\classes\*.class" | ForEach-Object FullName
Run "$bt\d8.bat" --release --min-api 24 --lib $jar --output "$work\dex" @classes

Write-Host '4/5 package'
Push-Location "$work\dex"
try { Run "$bt\aapt.exe" add "$work\unsigned.apk" classes.dex | Out-Null } finally { Pop-Location }
$extra = @(Get-ChildItem -Recurse -File "$work\extra" | ForEach-Object { $_.FullName.Substring("$work\extra\".Length).Replace('\', '/') })
Push-Location "$work\extra"
try {
  for ($i = 0; $i -lt $extra.Count; $i += 200) {
    $batch = @($extra[$i..([Math]::Min($i + 199, $extra.Count - 1))])
    Run "$bt\aapt.exe" add "$work\unsigned.apk" @batch | Out-Null
  }
} finally { Pop-Location }
$listing = & "$bt\aapt.exe" list "$work\unsigned.apk"
if ($listing -match '\\') { throw 'an APK entry still has a backslash in its name' }
Run "$bt\zipalign.exe" -p -f 4 "$work\unsigned.apk" "$work\aligned.apk"

Write-Host '5/5 sign'
Run "$bt\apksigner.bat" sign --ks $KeyStore --ks-pass "pass:$StorePass" --out "$work\signed.apk" "$work\aligned.apk"
Run "$bt\apksigner.bat" verify "$work\signed.apk"

$dst = Join-Path $here $Apk
New-Item -ItemType Directory -Force (Split-Path -Parent $dst) | Out-Null
Copy-Item -Force "$work\signed.apk" -Destination $dst
Remove-Item -Recurse -Force $work
Write-Host ("Done: {0} ({1:N0} KB)" -f $dst, ((Get-Item -LiteralPath $dst).Length / 1KB))
