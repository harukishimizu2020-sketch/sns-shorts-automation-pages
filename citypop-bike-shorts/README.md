# citypop-bike-shorts

シティポップ×昭和レトロの縦型ショート動画(1080×1920 / 30fps / 60秒)を2本、コードだけで生成する。

- A「真夜中クルーズ」: 夜のネオン街・横スクロール・VHS調 (`a.js`, BGM 112BPM)
- B「夕凪ハイウェイ」: 夕暮れの海沿い〜商店街・後方追従視点+逆光シルエット・8mmフィルム調 (`b.js`, BGM 96BPM)

静かな長回しの3本(第2弾):

- ①「海沿いの道」: カラー漫画風のコマ割りページ (`c1.js`, BGM 84BPM)
- ②「雨の踏切」: 新版画(木版画)風 (`c2.js`, BGM 72BPM、踏切・電車・雨の音入り)
- ③「朝凪」: 夜明けの干潟を渡るミニマルな長回し (`c3.js`, BGM 80BPM)

## 再生成手順

必要なもの: Node.js + Playwright(Chromium)、ffmpeg、Python3(numpy, scipy)

```bash
./fetch_fonts.sh              # フォント取得
python3 audio/music.py        # BGM(audio/track_a.wav, track_b.wav)
./build.sh a 4                # out/midnight_cruise.mp4
./build.sh b 4                # out/yunagi_highway.mp4
python3 audio/music2.py       # 第2弾のBGM(track_c1〜c3.wav)
./build.sh c1 4               # out/manga_coast_road.mp4
./build.sh c2 4               # out/crossing_in_the_rain.mp4
./build.sh c3 4               # out/morning_calm.mp4
./sheet.sh a check 3.5 12 30 38   # 任意の秒の静止画を並べて確認
```

注意: `build.sh` を実行中に止めて再実行する場合は、残った ffmpeg プロセスが終了してから行うこと(中間ファイルが壊れる)。

動画・音声・フォントは生成物/再取得可能な素材のためリポジトリには含めていない。
