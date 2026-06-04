const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// We need to add the new presets and fix tm-subtract
const subtractReplacement = `'tm-subtract': {
    type: 'TM',
    states: 'q0, q1, q2, q3, q4, q5, q6, qf', alphabet: '1, -', gamma: '1, -, X, B',
    start: 'q0', accept: 'qf',
    transitions: [
      { state:'q0', input:'1', next:'q0', write:'1', dir:'R' },
      { state:'q0', input:'X', next:'q0', write:'X', dir:'R' },
      { state:'q0', input:'-', next:'q1', write:'-', dir:'R' },
      { state:'q1', input:'1', next:'q1', write:'1', dir:'R' },
      { state:'q1', input:'B', next:'q2', write:'B', dir:'L' },
      { state:'q2', input:'1', next:'q3', write:'B', dir:'L' },
      { state:'q3', input:'1', next:'q3', write:'1', dir:'L' },
      { state:'q3', input:'-', next:'q4', write:'-', dir:'L' },
      { state:'q4', input:'1', next:'q4', write:'1', dir:'L' },
      { state:'q4', input:'X', next:'q5', write:'X', dir:'R' },
      { state:'q4', input:'B', next:'q5', write:'B', dir:'R' },
      { state:'q5', input:'1', next:'q0', write:'X', dir:'R' },
      // q2 reads '-' means right side is empty.
      { state:'q2', input:'-', next:'q6', write:'B', dir:'L' },
      { state:'q6', input:'X', next:'q6', write:'1', dir:'L' },
      { state:'q6', input:'1', next:'q6', write:'1', dir:'L' },
      { state:'q6', input:'B', next:'qf', write:'B', dir:'R' },
      // q5 reads '-' means left side is empty.
      { state:'q5', input:'-', next:'q6', write:'B', dir:'L' }
    ],
    testString: '111-11'
  },`;

html = html.replace(/'tm-subtract': \{[\s\S]*?testString: '111-11'\n\s*\},/, subtractReplacement);

// Let's add the missing TMs and PDAs.
// PDA: aaw1 bbw1R cc (Çoklu Ayırıcı)
const newPDA = `
  'pda-multi-sep': {
    type: 'PDA',
    states: 'q0, q1, q2, q3, q4, qf', alphabet: 'a, b, c, x, y', gamma: 'x, y, $',
    start: 'q0', accept: 'qf',
    transitions: [
      { state:'q0', input:'a', pop:'ε', next:'q0', push:'ε' },
      { state:'q0', input:'x', pop:'ε', next:'q1', push:'x' },
      { state:'q0', input:'y', pop:'ε', next:'q1', push:'y' },
      { state:'q1', input:'x', pop:'ε', next:'q1', push:'x' },
      { state:'q1', input:'y', pop:'ε', next:'q1', push:'y' },
      { state:'q1', input:'b', pop:'ε', next:'q2', push:'ε' },
      { state:'q2', input:'b', pop:'ε', next:'q3', push:'ε' },
      { state:'q3', input:'x', pop:'x', next:'q3', push:'ε' },
      { state:'q3', input:'y', pop:'y', next:'q3', push:'ε' },
      { state:'q3', input:'c', pop:'ε', next:'q4', push:'ε' },
      { state:'q4', input:'c', pop:'ε', next:'qf', push:'ε' }
    ],
    testString: 'aaxybbxycc'
  },`;

// We'll append it before 'pda-abcd' or 'tm-anbn'
html = html.replace(/'tm-anbn':/, newPDA + "\n  'tm-anbn':");

// Now TM missing ones
const newTMs = `
  'tm-reverse-concat': {
    type: 'TM',
    states: 'q0, q1, q2, q3, q4, q5, qf', alphabet: 'a, b, #', gamma: 'a, b, #, A, B, _',
    start: 'q0', accept: 'qf',
    transitions: [
      { state:'q0', input:'#', next:'q1', write:'#', dir:'R' },
      { state:'q1', input:'a', next:'q1', write:'a', dir:'R' },
      { state:'q1', input:'b', next:'q1', write:'b', dir:'R' },
      { state:'q1', input:'#', next:'q2', write:'#', dir:'L' },
      
      { state:'q2', input:'a', next:'q3', write:'A', dir:'R' },
      { state:'q2', input:'b', next:'q4', write:'B', dir:'R' },
      { state:'q2', input:'#', next:'q5', write:'#', dir:'L' }, // Done
      
      { state:'q3', input:'#', next:'q3', write:'#', dir:'R' },
      { state:'q3', input:'a', next:'q3', write:'a', dir:'R' },
      { state:'q3', input:'b', next:'q3', write:'b', dir:'R' },
      { state:'q3', input:'_', next:'q3', write:'_', dir:'R' },
      { state:'q3', input:'B', next:'q3', write:'B', dir:'R' },
      { state:'q3', input:'A', next:'q3', write:'A', dir:'R' },
      { state:'q3', input:'X', next:'q3', write:'X', dir:'R' }, // Blank marker for end
      // wait, let's keep it simple.
    ],
    testString: '#abb#'
  },
`;

// It's better to implement them properly instead of writing them inline. Let's write a script to insert them carefully.
fs.writeFileSync('index.html', html);
