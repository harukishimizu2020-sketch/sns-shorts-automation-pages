#!/bin/bash
# sheet.sh <a|b> <名前> t1 t2 t3 t4 ... : 静止画を4枚ずつ並べた確認用シートを作る
w=$1; name=$2; shift 2
node render.js $w still $(IFS=,; echo "$*") || exit 1
ins=(); for t in "$@"; do ins+=(-i out/still_${w}_$(printf "%5s" $t | tr ' ' 0).jpg); done
n=$#
ffmpeg -y -loglevel error "${ins[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf "[$i:v]scale=540:960[v$i];"; done)$(for i in $(seq 0 $((n-1))); do printf "[v$i]"; done)hstack=inputs=$n" -q:v 3 out/sheet_${name}.jpg
