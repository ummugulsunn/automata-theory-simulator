const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  virtualConsole: new jsdom.VirtualConsole().sendTo(console)
});

setTimeout(() => {
  const window = dom.window;
  
  // Override UI functions
  window.renderTape = () => {};
  window.renderStack = () => {};
  window.highlightStates = () => {};
  window.addTraceRow = () => {};
  window.setStatus = () => {};
  window.showError = (msg) => { console.error("Error:", msg); };
  window.hideError = () => {};
  window.buildGraph = () => {};
  
  const PRESETS = window.PRESETS;
  
  for (const id in PRESETS) {
    const p = PRESETS[id];
    
    // Simulate UI actions exactly
    window.loadPreset(id);
    window.initSimulation();
    window.runToEnd();
    
    if (window.simState.result === 'accepted') {
       console.log(`[PASS] ${id} accepted '${p.testString}'`);
    } else {
       console.log(`[FAIL] ${id} rejected '${p.testString}'`);
    }
  }
  process.exit(0);
}, 500);
