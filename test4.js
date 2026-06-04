const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const match = html.match(/const PRESETS = (\{[\s\S]*?\n\});/);
if (match) {
  let js = "global.PRESETS = " + match[1] + ";";
  eval(js);
  for (const id in global.PRESETS) {
    console.log(id, ':', global.PRESETS[id].testString);
  }
} else {
  console.log("Not found");
}
