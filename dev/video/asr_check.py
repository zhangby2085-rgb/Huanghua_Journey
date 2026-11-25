r"""用本机离线中文识别（sherpa-onnx，read-bridge-asr/big）把每句解说听一遍，看有没有读错、吞字。

  python dev/video/asr_check.py
"""
import json
import os
import subprocess
import sys

import numpy as np
import sherpa_onnx as so

HERE = os.path.dirname(os.path.abspath(__file__))
# 离线识别模型（sherpa-onnx 流式 zipformer，不在仓库里）：环境变量 HH_ASR，或者和仓库放在同一层的 read-bridge-asr/big
M = os.environ.get('HH_ASR') or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(HERE))), 'read-bridge-asr', 'big')
rec = so.OnlineRecognizer.from_transducer(tokens=os.path.join(M, 'tokens.txt'), encoder=os.path.join(M, 'encoder.int8.onnx'),
                                          decoder=os.path.join(M, 'decoder.onnx'), joiner=os.path.join(M, 'joiner.int8.onnx'),
                                          num_threads=4, sample_rate=16000, feature_dim=80, decoding_method='greedy_search')


def heard(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    a = np.concatenate([np.zeros(8000, np.float32), a, np.zeros(32000, np.float32)])   # 前后补静音，不然句尾会丢
    s = rec.create_stream()
    for i in range(0, len(a), 1600):
        s.accept_waveform(16000, a[i:i + 1600])
        while rec.is_ready(s):
            rec.decode_stream(s)
    s.input_finished()
    while rec.is_ready(s):
        rec.decode_stream(s)
    return rec.get_result(s)


sys.stdout.reconfigure(encoding='utf-8')
info = json.load(open(os.path.join(HERE, 'narr', 'narr.json'), encoding='utf-8'))
for k, v in info.items():
    print(k, v['text'])
    print('   ', heard(os.path.join(HERE, 'narr', v['file'])))
