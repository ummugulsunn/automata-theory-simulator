const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
  const window = dom.window;
  const PRESETS = window.PRESETS;
  
  // Override UI functions
  window.renderTape = () => {};
  window.renderStack = () => {};
  window.highlightStates = () => {};
  window.addTraceRow = () => {};
  window.setStatus = () => {};
  window.showError = (msg) => {};
  window.hideError = () => {};
  window.buildGraph = () => {};
  
  for (const id in PRESETS) {
    if (PRESETS[id].type !== 'TM') continue;
    
    window.loadPreset(id);
    window.machine = window.parseMachineDefinition();
    window.initSimulation();
    
    // We will run step by step instead of runToEnd to count exactly
    let n = 0;
    while (!window.simState.done && n < 15000) {
      window.doStep();
      n++;
    }
    console.log(`${id}: finished in ${n} steps. Result: ${window.simState.result}`);
  }
}, 500);
