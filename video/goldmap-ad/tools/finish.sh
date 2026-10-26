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
# loudnorm flushes ~0.1 s of extra audio; trim it back to the video's length.
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$RAW")
mkdir -p "$(dirname "$OUT")"
ffmpeg -hide_banner -loglevel error -y -i "$RAW" -c:v copy \
  -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000,atrim=0:${DUR}" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"

# Contact sheet: one frame per second, taking the frame AT each whole second
# (frame 0, 30, 60 … at 30 fps; the fps filter would pick the last frame of each second).
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$OUT" | awk -F/ '{printf "%d", $1/$2}')
ffmpeg -hide_banner -loglevel error -y -i "$OUT" \
  -vf "select='not(mod(n\,${FPS}))',scale=270:480,drawtext=fontfile=${FONT}:text='%{eif\:n*1\:d}s':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6,tile=9x4:padding=6:color=0x202020" -fps_mode vfr \
  -frames:v 1 -q:v 3 "$SHEET"

echo "--- $OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size -of compact "$OUT"
ffmpeg -hide_banner -nostats -i "$OUT" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
