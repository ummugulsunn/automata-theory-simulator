const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

// We need the TM step logic and PRESETS
const presetMatch = html.match(/const PRESETS = (\{[\s\S]*?\n\s*\});/);
let PRESETS;
eval("PRESETS = " + presetMatch[1]);

function stepTM(simState, machine) {
  if (simState.done) return;
  const readSym = simState.tape[simState.head] || 'B';
  const t = machine.transitions.find(tr => tr.state === simState.currentState && tr.input === readSym);
  
  if (!t) {
    const ok = machine.acceptStates.includes(simState.currentState);
    simState.done = true; 
    simState.result = ok ? 'accepted' : 'rejected'; 
    return;
  }
  
  simState.tape[simState.head] = t.write;
  if (t.dir === 'R') { 
    simState.head++; 
    if (simState.head >= simState.tape.length) simState.tape.push('B'); 
  } else if (t.dir === 'L') { 
    simState.head--; 
    if (simState.head < 0) { 
      simState.tape.unshift('B'); 
      simState.head = 0; 
    } 
  }
  simState.currentState = t.next;
}

for (let id in PRESETS) {
  let p = PRESETS[id];
  if (p.type !== 'TM') continue;
  
  let machine = {
    transitions: p.transitions,
    startState: p.start,
    acceptStates: p.accept.split(',').map(s=>s.trim())
  };
  
  let str = p.testString || '';
  let tapeArr = str.length ? str.split('') : ['B'];
  let tape = ['B', 'B', ...tapeArr, 'B', 'B'];
  
  let simState = {
    tape: tape,
    head: 2,
    currentState: machine.startState,
    done: false,
    result: null
  };
  
  let steps = 0;
  while (!simState.done && steps < 10000) {
    stepTM(simState, machine);
    steps++;
  }
  console.log(id, ":", steps, "steps, result:", simState.result, simState.done ? "DONE" : "LOOP", "State:", simState.currentState, "Tape:", simState.tape.join('').replace(/^B+|B+$/g, ''));
}
