const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');
const jsdom = require('jsdom');
const dom = new jsdom.JSDOM(html, { runScripts: "dangerously" });
setTimeout(() => {
  const PRESETS = dom.window.PRESETS;
  for (const id in PRESETS) {
    console.log(id, ':', PRESETS[id].testString);
  }
}, 500);
