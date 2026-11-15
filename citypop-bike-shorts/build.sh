#!/bin/bash
# build.sh <a|b> [並列数] : 全1800フレームを分割レンダリング→結合→フィルム/VHS調の後処理→BGM合成
set -e
w=$1; N=${2:-4}; T=1800; per=$((T/N)); mkdir -p out/chunks
pids=()
if [ "$3" != post ]; then
for i in $(seq 0 $((N-1))); do s=$((i*per)); e=$(( i==N-1 ? T : s+per )); node render.js $w chunk $s $e out/chunks/${w}_$i.mp4 > out/chunks/${w}_$i.log 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait $p; done
fi
: > out/chunks/${w}_list.txt; for i in $(seq 0 $((N-1))); do echo "file '${w}_$i.mp4'" >> out/chunks/${w}_list.txt; done
if [ "$w" = a ]; then
  # VHS調: 色ずれ・クロマにじみ・粒状ノイズ
  VF="rgbashift=rh=-3:bh=3,format=yuv444p,split[m][c];[c]gblur=sigma=5:steps=1[cb];[m][cb]mergeplanes=0x001112:yuv444p,noise=alls=7:allf=t,eq=saturation=1.12:contrast=1.04,format=yuv420p"
  NAME=midnight_cruise
else
  # 8mmフィルム調: 暖色・粒子・周辺減光
  VF="curves=r='0/0.03 0.5/0.54 1/1':b='0/0.06 0.5/0.47 1/0.93',noise=alls=8:allf=t,gblur=sigma=0.6,vignette=PI/5,format=yuv420p"
  NAME=yunagi_highway
fi
ffmpeg -y -loglevel error -f concat -safe 0 -i out/chunks/${w}_list.txt -i audio/track_$w.wav -filter_complex "[0:v]$VF[v]" -map "[v]" -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 9M -bufsize 18M -profile:v high -level 4.2 -r 30 -movflags +faststart -c:a aac -b:a 256k -ar 44100 -t 60 out/${NAME}.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,nb_frames -of default=nw=1 out/${NAME}.mp4
