/**
 * Test script for Automata Conversion Tools
 * Tests: NFA→DFA, DFA Minimization, Regex→NFA
 */

// ═══════════════════════════════════════════════════════════════
// EXTRACTED ALGORITHMS (from index.html)
// ═══════════════════════════════════════════════════════════════

function computeEpsClosure(startStates, transitions) {
  const closure = new Set(startStates);
  const stack = [...startStates];
  while (stack.length > 0) {
    const s = stack.pop();
    for (const t of transitions) {
      if (t.state === s && (t.input === 'ε' || t.input === 'Λ') && !closure.has(t.next)) {
        closure.add(t.next);
        stack.push(t.next);
      }
    }
  }
  return closure;
}

function stateSetKey(set) {
  return '{' + [...set].sort().join(',') + '}';
}

function convertNfaToDfa(m) {
  const alphabet = m.alphabet.filter(a => a !== 'ε' && a !== 'Λ');
  const startClosure = computeEpsClosure([m.startState], m.transitions);
  const startKey = stateSetKey(startClosure);
  const dfaStatesMap = new Map();
  dfaStatesMap.set(startKey, startClosure);
  const queue = [startClosure];
  const dfaTransitions = [];
  const steps = [];
  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = stateSetKey(current);
    for (const sym of alphabet) {
      const moveSet = new Set();
      for (const s of current) {
        for (const t of m.transitions) {
          if (t.state === s && t.input === sym) moveSet.add(t.next);
        }
      }
      if (moveSet.size === 0) continue;
      const closureSet = computeEpsClosure([...moveSet], m.transitions);
      const closureKey = stateSetKey(closureSet);
      if (!dfaStatesMap.has(closureKey)) {
        dfaStatesMap.set(closureKey, closureSet);
        queue.push(closureSet);
      }
      dfaTransitions.push({ state: currentKey, input: sym, next: closureKey });
      steps.push({ from: currentKey, symbol: sym, moveTo: stateSetKey(moveSet), closure: closureKey });
    }
  }
  const nameMap = new Map();
  let idx = 0;
  for (const key of dfaStatesMap.keys()) nameMap.set(key, `D${idx++}`);
  const dfaAccept = [];
  for (const [key, stateSet] of dfaStatesMap) {
    for (const s of stateSet) {
      if (m.acceptStates.includes(s)) { dfaAccept.push(nameMap.get(key)); break; }
    }
  }
  return {
    machine: {
      type: 'DFA', states: [...nameMap.values()], alphabet,
      gamma: [], startState: nameMap.get(startKey), acceptStates: dfaAccept,
      transitions: dfaTransitions.map(t => ({ state: nameMap.get(t.state), input: t.input, next: nameMap.get(t.next) })),
      testString: m.testString || ''
    },
    steps, nameMap, dfaStatesMap
  };
}

function minimizeDfa(m) {
  const reachable = new Set();
  const rQueue = [m.startState];
  reachable.add(m.startState);
  while (rQueue.length > 0) {
    const s = rQueue.shift();
    for (const t of m.transitions) {
      if (t.state === s && !reachable.has(t.next)) { reachable.add(t.next); rQueue.push(t.next); }
    }
  }
  const rStates = m.states.filter(s => reachable.has(s));
  const removedStates = m.states.filter(s => !reachable.has(s));
  const rTrans = m.transitions.filter(t => reachable.has(t.state));
  const n = rStates.length;
  const dist = Array.from({length: n}, () => Array(n).fill(false));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (m.acceptStates.includes(rStates[i]) !== m.acceptStates.includes(rStates[j])) {
        dist[i][j] = dist[j][i] = true;
      }
    }
  }
  const getTgt = (st, sym) => { const t = rTrans.find(x => x.state === st && x.input === sym); return t ? t.next : null; };
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (dist[i][j]) continue;
        for (const sym of m.alphabet) {
          const ti = getTgt(rStates[i], sym), tj = getTgt(rStates[j], sym);
          if (ti === tj) continue;
          if (!ti || !tj) { dist[i][j] = dist[j][i] = true; changed = true; break; }
          const ni = rStates.indexOf(ti), nj = rStates.indexOf(tj);
          if (ni !== nj && dist[ni][nj]) { dist[i][j] = dist[j][i] = true; changed = true; break; }
        }
      }
    }
  }
  const groups = []; const assigned = new Set();
  for (let i = 0; i < n; i++) {
    if (assigned.has(i)) continue;
    const group = [rStates[i]]; assigned.add(i);
    for (let j = i + 1; j < n; j++) {
      if (!assigned.has(j) && !dist[i][j]) { group.push(rStates[j]); assigned.add(j); }
    }
    groups.push(group);
  }
  const gNames = groups.map((_, i) => `M${i}`);
  const findG = s => groups.findIndex(g => g.includes(s));
  const minTrans = []; const seen = new Set();
  for (const t of rTrans) {
    const fg = findG(t.state), tg = findG(t.next);
    if (fg < 0 || tg < 0) continue;
    const key = `${fg}-${t.input}-${tg}`;
    if (!seen.has(key)) { seen.add(key); minTrans.push({ state: gNames[fg], input: t.input, next: gNames[tg] }); }
  }
  return {
    machine: {
      type: 'DFA', states: gNames, alphabet: m.alphabet, gamma: [],
      startState: gNames[findG(m.startState)],
      acceptStates: [...new Set(m.acceptStates.filter(s => reachable.has(s)).map(s => gNames[findG(s)]))],
      transitions: minTrans, testString: m.testString || ''
    },
    groups, gNames, removedStates, originalCount: m.states.length, minimizedCount: gNames.length
  };
}

function regexToNfa(regex) {
  let counter = 0;
  const ns = () => `s${counter++}`;
  function tokenize(str) {
    const toks = []; let i = 0;
    while (i < str.length) {
      const c = str[i];
      if ('()|*+?'.includes(c)) { toks.push({type: c}); i++; }
      else if (c === '\\' && i + 1 < str.length) { toks.push({type:'char', value:str[i+1]}); i+=2; }
      else { toks.push({type:'char', value:c}); i++; }
    }
    return toks;
  }
  let tokens, pos;
  function parseExpr() {
    let left = parseConcat();
    while (pos < tokens.length && tokens[pos].type === '|') { pos++; left = {type:'union', left, right:parseConcat()}; }
    return left;
  }
  function parseConcat() {
    let left = parseUnary();
    if (!left) return left;
    while (pos < tokens.length && tokens[pos].type !== ')' && tokens[pos].type !== '|') {
      const right = parseUnary(); if (!right) break;
      left = {type:'concat', left, right};
    }
    return left;
  }
  function parseUnary() {
    let node = parseAtom(); if (!node) return node;
    while (pos < tokens.length && '*+?'.includes(tokens[pos].type)) {
      node = {type: tokens[pos].type, child: node}; pos++;
    }
    return node;
  }
  function parseAtom() {
    if (pos >= tokens.length) return null;
    const tok = tokens[pos];
    if (tok.type === '(') { pos++; const n = parseExpr(); if (pos < tokens.length && tokens[pos].type === ')') pos++; return n; }
    if (tok.type === 'char') { pos++; return {type:'char', value:tok.value}; }
    return null;
  }
  function build(ast) {
    if (!ast) { const s = ns(), e = ns(); return {start:s, accept:e, trans:[{state:s,input:'ε',next:e}]}; }
    switch(ast.type) {
      case 'char': { const s=ns(),e=ns(); return {start:s,accept:e,trans:[{state:s,input:ast.value,next:e}]}; }
      case 'concat': { const l=build(ast.left),r=build(ast.right); return {start:l.start,accept:r.accept,trans:[...l.trans,{state:l.accept,input:'ε',next:r.start},...r.trans]}; }
      case 'union': {
        const s=ns(),e=ns(),l=build(ast.left),r=build(ast.right);
        return {start:s,accept:e,trans:[{state:s,input:'ε',next:l.start},{state:s,input:'ε',next:r.start},...l.trans,...r.trans,{state:l.accept,input:'ε',next:e},{state:r.accept,input:'ε',next:e}]};
      }
      case '*': {
        const s=ns(),e=ns(),inner=build(ast.child);
        return {start:s,accept:e,trans:[{state:s,input:'ε',next:inner.start},{state:s,input:'ε',next:e},...inner.trans,{state:inner.accept,input:'ε',next:inner.start},{state:inner.accept,input:'ε',next:e}]};
      }
      case '+': {
        const s=ns(),e=ns(),inner=build(ast.child);
        return {start:s,accept:e,trans:[{state:s,input:'ε',next:inner.start},...inner.trans,{state:inner.accept,input:'ε',next:inner.start},{state:inner.accept,input:'ε',next:e}]};
      }
      case '?': {
        const s=ns(),e=ns(),inner=build(ast.child);
        return {start:s,accept:e,trans:[{state:s,input:'ε',next:inner.start},{state:s,input:'ε',next:e},...inner.trans,{state:inner.accept,input:'ε',next:e}]};
      }
    }
  }
  tokens = tokenize(regex); pos = 0;
  const ast = parseExpr();
  const nfa = build(ast);
  const allStates = new Set(); const alphaSet = new Set();
  for (const t of nfa.trans) { allStates.add(t.state); allStates.add(t.next); if (t.input !== 'ε') alphaSet.add(t.input); }
  return {
    type: 'NFA', states: [...allStates].sort((a,b) => parseInt(a.slice(1)) - parseInt(b.slice(1))),
    alphabet: [...alphaSet].sort(), gamma: [],
    startState: nfa.start, acceptStates: [nfa.accept],
    transitions: nfa.trans, testString: ''
  };
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION HELPERS (for testing acceptance)
// ═══════════════════════════════════════════════════════════════

function simulateDfa(m, str) {
  let state = m.startState;
  for (const sym of str) {
    const t = m.transitions.find(tr => tr.state === state && tr.input === sym);
    if (!t) return false;
    state = t.next;
  }
  return m.acceptStates.includes(state);
}

function simulateNfa(m, str) {
  let current = computeEpsClosure([m.startState], m.transitions);
  for (const sym of str) {
    const next = new Set();
    for (const s of current) {
      for (const t of m.transitions) {
        if (t.state === s && t.input === sym) next.add(t.next);
      }
    }
    current = computeEpsClosure([...next], m.transitions);
    if (current.size === 0) return false;
  }
  return [...current].some(s => m.acceptStates.includes(s));
}

// ═══════════════════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════════════════

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

// ──────────────────────────────────────────
// TEST 1: NFA → DFA Conversion
// ──────────────────────────────────────────
console.log('\n═══ TEST 1: NFA → DFA Conversion ═══');

// NFA that accepts strings ending with "ab"
const nfaEndsAb = {
  type: 'NFA',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  startState: 'q0',
  acceptStates: ['q2'],
  transitions: [
    {state:'q0', input:'a', next:'q0'}, {state:'q0', input:'b', next:'q0'},
    {state:'q0', input:'a', next:'q1'}, {state:'q1', input:'b', next:'q2'}
  ]
};

const result1 = convertNfaToDfa(nfaEndsAb);
const dfa1 = result1.machine;

console.log(`  DFA states: ${dfa1.states.join(', ')}`);
console.log(`  DFA accept: ${dfa1.acceptStates.join(', ')}`);
console.log(`  DFA transitions: ${dfa1.transitions.length}`);

// Test that DFA accepts same strings as NFA
const testStrings1 = ['ab', 'aab', 'bab', 'abb', 'aabb', 'abab', '', 'a', 'b', 'ba', 'aa', 'bb', 'abba', 'bba'];
for (const s of testStrings1) {
  const nfaResult = simulateNfa(nfaEndsAb, s);
  const dfaResult = simulateDfa(dfa1, s);
  assert(nfaResult === dfaResult, `"${s || 'ε'}": NFA=${nfaResult}, DFA=${dfaResult}`);
}

// ──────────────────────────────────────────
// TEST 2: NFA with ε-transitions → DFA
// ──────────────────────────────────────────
console.log('\n═══ TEST 2: NFA with ε-transitions → DFA ═══');

const nfaEpsilon = {
  type: 'NFA',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b', 'ε'],
  startState: 'q0',
  acceptStates: ['q2'],
  transitions: [
    {state:'q0', input:'a', next:'q0'}, {state:'q0', input:'ε', next:'q1'},
    {state:'q1', input:'b', next:'q1'}, {state:'q1', input:'ε', next:'q2'},
    {state:'q2', input:'a', next:'q2'}
  ]
};

const result2 = convertNfaToDfa(nfaEpsilon);
const dfa2 = result2.machine;

console.log(`  DFA states: ${dfa2.states.join(', ')}`);
console.log(`  DFA accept: ${dfa2.acceptStates.join(', ')}`);

const testStrings2 = ['', 'a', 'b', 'ab', 'aab', 'abb', 'aabb', 'ba', 'bba', 'abba', 'aabba', 'aba', 'abba'];
for (const s of testStrings2) {
  const nfaResult = simulateNfa(nfaEpsilon, s);
  const dfaResult = simulateDfa(dfa2, s);
  assert(nfaResult === dfaResult, `"${s || 'ε'}": NFA=${nfaResult}, DFA=${dfaResult}`);
}

// ──────────────────────────────────────────
// TEST 3: DFA Minimization
// ──────────────────────────────────────────
console.log('\n═══ TEST 3: DFA Minimization ═══');

// DFA with equivalent states (q1 and q3 are equivalent)
const dfaToMinimize = {
  type: 'DFA',
  states: ['q0', 'q1', 'q2', 'q3', 'q4'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q1', 'q3'],
  transitions: [
    {state:'q0', input:'0', next:'q1'}, {state:'q0', input:'1', next:'q2'},
    {state:'q1', input:'0', next:'q1'}, {state:'q1', input:'1', next:'q2'},
    {state:'q2', input:'0', next:'q3'}, {state:'q2', input:'1', next:'q2'},
    {state:'q3', input:'0', next:'q3'}, {state:'q3', input:'1', next:'q2'},
    {state:'q4', input:'0', next:'q4'}, {state:'q4', input:'1', next:'q4'}
  ]
};

const result3 = minimizeDfa(dfaToMinimize);
const minDfa = result3.machine;

console.log(`  Original: ${result3.originalCount} states, Minimized: ${result3.minimizedCount} states`);
console.log(`  Removed unreachable: [${result3.removedStates.join(', ')}]`);
console.log(`  Groups: ${result3.groups.map(g => '{' + g.join(',') + '}').join(', ')}`);

assert(result3.minimizedCount < result3.originalCount, `State count reduced: ${result3.originalCount} → ${result3.minimizedCount}`);
assert(result3.removedStates.includes('q4'), 'Unreachable state q4 removed');

// Test equivalence
const testStrings3 = ['', '0', '1', '00', '01', '10', '11', '010', '100', '111', '000', '0110'];
for (const s of testStrings3) {
  const origResult = simulateDfa(dfaToMinimize, s);
  const minResult = simulateDfa(minDfa, s);
  assert(origResult === minResult, `"${s || 'ε'}": Original=${origResult}, Minimized=${minResult}`);
}

// ──────────────────────────────────────────
// TEST 4: DFA Minimization — Already minimal
// ──────────────────────────────────────────
console.log('\n═══ TEST 4: DFA Minimization (already minimal) ═══');

const alreadyMinimal = {
  type: 'DFA',
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['q0'],
  transitions: [
    {state:'q0', input:'0', next:'q1'}, {state:'q0', input:'1', next:'q0'},
    {state:'q1', input:'0', next:'q0'}, {state:'q1', input:'1', next:'q1'}
  ]
};

const result4 = minimizeDfa(alreadyMinimal);
assert(result4.minimizedCount === 2, `Already minimal DFA stays at 2 states (got ${result4.minimizedCount})`);

// ──────────────────────────────────────────
// TEST 5: Regex → NFA — Simple patterns
// ──────────────────────────────────────────
console.log('\n═══ TEST 5: Regex → NFA ═══');

// Test: (a|b)*abb
const nfa5 = regexToNfa('(a|b)*abb');
console.log(`  Regex: (a|b)*abb → ${nfa5.states.length} states, ${nfa5.transitions.length} transitions`);
assert(nfa5.states.length > 0, 'NFA has states');
assert(nfa5.alphabet.includes('a') && nfa5.alphabet.includes('b'), 'Alphabet contains a, b');

const regexTests5 = [
  ['abb', true], ['aabb', true], ['babb', true], ['ababb', true],
  ['', false], ['a', false], ['ab', false], ['ba', false], ['abba', false],
  ['aababb', true], ['bbabb', true]
];
for (const [str, expected] of regexTests5) {
  const actual = simulateNfa(nfa5, str);
  assert(actual === expected, `/(a|b)*abb/ on "${str || 'ε'}": expected=${expected}, got=${actual}`);
}

// ──────────────────────────────────────────
// TEST 6: Regex → NFA — More patterns
// ──────────────────────────────────────────
console.log('\n═══ TEST 6: Regex → NFA (more patterns) ═══');

// a*
const nfa6a = regexToNfa('a*');
assert(simulateNfa(nfa6a, '') === true, 'a* accepts ε');
assert(simulateNfa(nfa6a, 'a') === true, 'a* accepts "a"');
assert(simulateNfa(nfa6a, 'aaa') === true, 'a* accepts "aaa"');
assert(simulateNfa(nfa6a, 'b') === false, 'a* rejects "b"');

// a+
const nfa6b = regexToNfa('a+');
assert(simulateNfa(nfa6b, '') === false, 'a+ rejects ε');
assert(simulateNfa(nfa6b, 'a') === true, 'a+ accepts "a"');
assert(simulateNfa(nfa6b, 'aaa') === true, 'a+ accepts "aaa"');

// a?b
const nfa6c = regexToNfa('a?b');
assert(simulateNfa(nfa6c, 'b') === true, 'a?b accepts "b"');
assert(simulateNfa(nfa6c, 'ab') === true, 'a?b accepts "ab"');
assert(simulateNfa(nfa6c, 'aab') === false, 'a?b rejects "aab"');
assert(simulateNfa(nfa6c, '') === false, 'a?b rejects ε');

// (ab|cd)
const nfa6d = regexToNfa('(ab|cd)');
assert(simulateNfa(nfa6d, 'ab') === true, '(ab|cd) accepts "ab"');
assert(simulateNfa(nfa6d, 'cd') === true, '(ab|cd) accepts "cd"');
assert(simulateNfa(nfa6d, 'ac') === false, '(ab|cd) rejects "ac"');
assert(simulateNfa(nfa6d, '') === false, '(ab|cd) rejects ε');

// ──────────────────────────────────────────
// TEST 7: Full pipeline — Regex → NFA → DFA → Minimize
// ──────────────────────────────────────────
console.log('\n═══ TEST 7: Full Pipeline (Regex → NFA → DFA → Minimize) ═══');

const nfa7 = regexToNfa('(a|b)*abb');
const dfa7 = convertNfaToDfa(nfa7).machine;
const minDfa7 = minimizeDfa(dfa7).machine;

console.log(`  Pipeline: regex → ${nfa7.states.length} NFA states → ${dfa7.states.length} DFA states → ${minDfa7.states.length} minimized states`);

const pipelineTests = [
  ['abb', true], ['aabb', true], ['babb', true], ['ababb', true],
  ['', false], ['a', false], ['ab', false], ['abba', false]
];

for (const [str, expected] of pipelineTests) {
  const nfaRes = simulateNfa(nfa7, str);
  const dfaRes = simulateDfa(dfa7, str);
  const minRes = simulateDfa(minDfa7, str);
  const allMatch = nfaRes === expected && dfaRes === expected && minRes === expected;
  assert(allMatch, `"${str || 'ε'}": NFA=${nfaRes}, DFA=${dfaRes}, MinDFA=${minRes}, expected=${expected}`);
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
