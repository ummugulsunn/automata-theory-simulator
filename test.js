const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
  const window = dom.window;
  const PRESETS = window.PRESETS;
  
  // Override UI functions to avoid errors
  window.renderTape = () => {};
  window.renderStack = () => {};
  window.highlightStates = () => {};
  window.addTraceRow = () => {};
  window.setStatus = () => {};
  window.showError = (msg) => { console.error("Error:", msg); };
  window.hideError = () => {};
  window.buildGraph = () => {};
  
  let allPass = true;
  
  for (const id in PRESETS) {
    const p = PRESETS[id];
    console.log(`Testing preset: ${id} (${p.type})`);
    
    // Setup machine directly
    window.machine = {
      type: p.type,
      states: p.states.split(',').map(s=>s.trim()),
      alphabet: p.alphabet.split(',').map(s=>s.trim()),
      gamma: p.gamma ? p.gamma.split(',').map(s=>s.trim()) : [],
      startState: p.start,
      acceptStates: p.accept.split(',').map(s=>s.trim()),
      transitions: p.transitions
    };
    
    // Set input
    window.inputString.value = p.testString;
    window.initSimulation();
    
    window.runToEnd();
    
    if (window.simState.result === 'accepted') {
       console.log(`  [PASS] ${id} accepted '${p.testString}'`);
    } else {
       console.log(`  [FAIL] ${id} rejected '${p.testString}'`);
       allPass = false;
    }
  }
  
  if (!allPass) {
    console.log("\nSome tests failed.");
    process.exit(1);
  } else {
    console.log("\nAll tests passed!");
    process.exit(0);
  }
}, 500);
