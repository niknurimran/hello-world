// Writes vo.json (voiceover lines and timing hints) from scenes.js for audio.py.
const fs = require('fs');
const path = require('path');
const { VIDEOS } = require('./scenes.js');

const out = VIDEOS.map(v => ({
  id: v.id,
  file: v.file,
  scenes: v.scenes.map(s => ({
    vo: s.vo,
    min: s.min,
    hold: s.hold || 0,
    sfx: s.sfx || '',
    slamWords: s.slam ? s.ost[0].replace(/<[^>]+>/g, '').split(/\s+/).length : 0
  }))
}));
fs.writeFileSync(path.join(__dirname, 'vo.json'), JSON.stringify(out, null, 1));
console.log('vo.json written:', out.map(v => `${v.id} (${v.scenes.length} scenes)`).join(', '));
