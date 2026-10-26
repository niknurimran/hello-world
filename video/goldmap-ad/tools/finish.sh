#!/usr/bin/env bash
# Post-process a render: normalise loudness to -14 LUFS (audio only; video is
# stream-copied, not re-encoded) and build a 1-frame-per-second contact sheet.
# Usage: tools/finish.sh <raw.mp4> <final.mp4> <contact_sheet.jpg>
set -euo pipefail
RAW="$1"; OUT="$2"; SHEET="$3"
TARGET_I=-14; TARGET_TP=-1.5; TARGET_LRA=11

# Pass 1: measure.
STATS=$(ffmpeg -hide_banner -nostats -i "$RAW" -vn \
  -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json" -f null - 2>&1 |
  sed -n '/^{/,/^}/p')
get() { echo "$STATS" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }

# Pass 2: apply with the measured values (linear mode), re-mux, copy video.
mkdir -p "$(dirname "$OUT")"
ffmpeg -hide_banner -loglevel error -y -i "$RAW" -c:v copy \
  -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"

# Contact sheet: one frame per second (t = 0, 1, …), timestamped, 9 x 4 grid.
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
ffmpeg -hide_banner -loglevel error -y -i "$OUT" \
  -vf "fps=1:round=down,scale=270:480,drawtext=fontfile=${FONT}:text='%{eif\:t\:d}s':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6,tile=9x4:padding=6:color=0x202020" \
  -frames:v 1 -q:v 3 "$SHEET"

echo "--- $OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size -of compact "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
