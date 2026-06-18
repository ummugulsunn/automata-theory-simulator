const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
  const window = dom.window;
  const document = dom.window.document;
  
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
  let allPass = true;
  
  for (const id in PRESETS) {
    const p = PRESETS[id];
    console.log(`Testing preset via UI parser: ${id} (${p.type})`);
    
    // Call loadPreset
    window.loadPreset(id);
    
    // Parse it back exactly as the Run button does
    window.machine = window.parseMachineDefinition();
    
    if (!window.machine) {
      console.log(`  [FAIL] ${id} failed to parse.`);
      allPass = false;
      continue;
    }
    
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
