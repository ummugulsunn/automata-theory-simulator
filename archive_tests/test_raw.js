const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

// Extract the presets
const match = html.match(/const PRESETS = (\{[\s\S]*?\n\});/);
let PRESETS;
eval("PRESETS = " + match[1]);

for(let id in PRESETS) {
  let p = PRESETS[id];
  console.log(id, p.testString);
}
