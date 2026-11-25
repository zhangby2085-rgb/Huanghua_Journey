"""把下载文件夹里最新的 Gemini 图复制到 黄花的生活/gemini/<名字>.png

  .devenv\\Scripts\\python.exe -I dev/fetch_gemini.py 物品 贴纸
      （下载文件夹里文件名含"贴纸"的最新一张 → gemini/物品.png）
"""
import os
import shutil
import sys

DL = os.path.join(os.path.expanduser('~'), 'Downloads')
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'art', 'gemini')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    name, key = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ''
    fs = [os.path.join(DL, f) for f in os.listdir(DL)
          if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) and key in f]
    f = max(fs, key=os.path.getmtime)
    ext = os.path.splitext(f)[1].lower()
    os.makedirs(DST, exist_ok=True)
    shutil.copy(f, os.path.join(DST, name + ext))
    print(os.path.basename(f), '→', name + ext)
