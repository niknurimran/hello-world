#!/usr/bin/env bash
# Automated QA on a rendered MP4: format, frozen stretches (>1 s), black frames,
# white flashes (luma spikes), and stills on both sides of every slot cut.
# Usage: tools/qa.sh <video.mp4> <out_dir>
set -euo pipefail
V="$1"; OUT="$2"; mkdir -p "$OUT"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

echo "== format"
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=codec_name,profile,width,height,r_frame_rate,nb_read_frames,pix_fmt -of compact "$V"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of compact "$V"
ffprobe -v error -show_entries format=duration,size -of compact "$V"

echo "== frozen stretches >= 1 s (none expected)"
ffmpeg -hide_banner -nostats -i "$V" -vf "freezedetect=n=0.0015:d=1" -an -f null - 2>&1 | grep -E "freeze_(start|duration)" || echo "none"

echo "== black frames (none expected)"
ffmpeg -hide_banner -nostats -i "$V" -vf "blackdetect=d=0.03:pix_th=0.06:pic_th=0.98" -an -f null - 2>&1 | grep blackdetect || echo "none"

echo "== luma per frame: max, and any jump > 40 between frames (white flash)"
ffmpeg -hide_banner -nostats -i "$V" -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$OUT/yavg.txt" -an -f null - 2>/dev/null
awk '/pts_time/{split($3,a,":"); t=a[2]} /YAVG/{split($1,b,"="); y=b[2]; if (NR>2 && (y-p>40 || p-y>40)) printf "jump at %.3fs: %.1f -> %.1f\n", t, p, y; if (y>m){m=y; mt=t}; p=y} END{printf "max YAVG %.1f at %.3fs (255 = white)\n", m, mt}' "$OUT/yavg.txt"

echo "== stills either side of each slot cut"
CUTS=$(node -e '
  const vm=require("vm"),fs=require("fs");const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1]+"/config.js","utf8"),c);
  const g=c.window.GM_CONFIG,b=i=>Math.round(i*g.fps*60/g.bpm)/g.fps;
  console.log(Object.values(g.slots).map(s=>b(s[0])).filter(t=>t>0).join(" "))' "$HERE")
# One row per cut: 1 frame before, the cut frame, 3 frames after.
i=0
for t in $CUTS; do
  for d in -0.034 0.0 0.1; do
    ts=$(awk -v t="$t" -v d="$d" 'BEGIN{printf "%.3f", t+d}')
    ffmpeg -hide_banner -loglevel error -y -ss "$ts" -i "$V" -frames:v 1 \
      -vf "scale=270:480,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${ts}s':x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6" \
      "$OUT/cut_$(printf %03d $i).png"
    i=$((i+1))
  done
done
ffmpeg -hide_banner -loglevel error -y -pattern_type glob -i "$OUT/cut_*.png" -vf "tile=3x7:padding=4:color=0x202020" -frames:v 1 "$OUT/cuts_sheet.png"
echo "cuts sheet: $OUT/cuts_sheet.png"
