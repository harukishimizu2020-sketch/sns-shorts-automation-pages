# citypop-bike-shorts

シティポップ×昭和レトロの縦型ショート動画(1080×1920 / 30fps / 60秒)を2本、コードだけで生成する。

- A「真夜中クルーズ」: 夜のネオン街・横スクロール・VHS調 (`a.js`, BGM 112BPM)
- B「夕凪ハイウェイ」: 夕暮れの海沿い〜商店街・後方追従視点+逆光シルエット・8mmフィルム調 (`b.js`, BGM 96BPM)

## 再生成手順

必要なもの: Node.js + Playwright(Chromium)、ffmpeg、Python3(numpy, scipy)

```bash
./fetch_fonts.sh              # フォント取得
python3 audio/music.py        # BGM(audio/track_a.wav, track_b.wav)
./build.sh a 4                # out/midnight_cruise.mp4
./build.sh b 4                # out/yunagi_highway.mp4
./sheet.sh a check 3.5 12 30 38   # 任意の秒の静止画を並べて確認
```

注意: `build.sh` を実行中に止めて再実行する場合は、残った ffmpeg プロセスが終了してから行うこと(中間ファイルが壊れる)。

動画・音声・フォントは生成物/再取得可能な素材のためリポジトリには含めていない。
