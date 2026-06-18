/**
 * Test: 5 Haziran Final Provası Presetleri
 * 1. TM: c→d Harf Dönüştürme
 * 2. TM: 0-Sayısı Çift/Tek Kontrolü
 * 3. PDA: aⁿbᵏcᵏdⁿee İçiçe Eşleştirme
 * 4. NFA: Sonu 00 veya 11 ile biten
 */

// ═══════════════════════════════════════════════════════════════
// SIMULATION ENGINES (extracted from index.html)
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

function normalizeEpsilon(s) {
  const v = s.trim();
  if (v === '' || v === 'ε' || v === 'Λ' || v === 'λ' || v.toLowerCase() === 'eps') return 'ε';
  return v;
}

function simulateNfa(m, str) {
  // ε-closure
  function epsClosure(states) {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
      const s = stack.pop();
      for (const t of m.transitions) {
        if (t.state === s && (t.input === 'ε' || t.input === 'Λ') && !closure.has(t.next)) {
          closure.add(t.next);
          stack.push(t.next);
        }
      }
    }
    return closure;
  }

  let current = epsClosure(new Set([m.startState]));
  for (const sym of str) {
    const next = new Set();
    for (const s of current) {
      for (const t of m.transitions) {
        if (t.state === s && t.input === sym) next.add(t.next);
      }
    }
    current = epsClosure(next);
    if (current.size === 0) return false;
  }
  return [...current].some(s => m.acceptStates.includes(s));
}

function simulatePda(m, str) {
  // BFS / nondeterministic PDA simulation
  const configs = [{ state: m.startState, pos: 0, stack: ['$'] }];
  const visited = new Set();
  const MAX = 5000;
  let steps = 0;

  while (configs.length > 0 && steps < MAX) {
    const { state, pos, stack } = configs.shift();
    steps++;

    // Key for cycle detection
    const key = `${state}|${pos}|${stack.join(',')}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // Check acceptance: at end of string, in accept state, stack empty or has only $
    if (pos >= str.length && m.acceptStates.includes(state)) {
      return true;
    }

    for (const t of m.transitions) {
      if (t.state !== state) continue;

      const tInput = normalizeEpsilon(t.input);
      const tPop = normalizeEpsilon(t.pop);
      const tPush = normalizeEpsilon(t.push);

      // Check input match
      let newPos = pos;
      if (tInput !== 'ε') {
        if (pos >= str.length || str[pos] !== tInput) continue;
        newPos = pos + 1;
      }

      // Check pop match
      const newStack = [...stack];
      if (tPop !== 'ε') {
        if (newStack.length === 0 || newStack[newStack.length - 1] !== tPop) continue;
        newStack.pop();
      }

      // Push
      if (tPush !== 'ε') {
        // Push string: rightmost char goes first (bottom), leftmost on top
        for (let i = 0; i < tPush.length; i++) {
          newStack.push(tPush[i]);
        }
      }

      configs.push({ state: t.next, pos: newPos, stack: newStack });
    }
  }
  return false;
}

function simulateTm(m, str) {
  const tape = str.split('');
  // Pad with blanks
  for (let i = 0; i < 5; i++) { tape.unshift('B'); tape.push('B'); }
  let head = 5; // points to first char
  let state = m.startState;
  const MAX = 10000;

  for (let step = 0; step < MAX; step++) {
    if (m.acceptStates.includes(state)) return { accepted: true, tape: tape.join('').replace(/^B+|B+$/g, ''), state };

    if (head < 0) { tape.unshift('B'); head = 0; }
    if (head >= tape.length) tape.push('B');

    const sym = tape[head];
    const t = m.transitions.find(tr => tr.state === state && tr.input === sym);
    if (!t) return { accepted: false, tape: tape.join('').replace(/^B+|B+$/g, ''), state };

    tape[head] = t.write;
    state = t.next;
    if (t.dir === 'R') head++;
    else if (t.dir === 'L') head--;
    // 'S' = stay
  }
  return { accepted: false, tape: tape.join('').replace(/^B+|B+$/g, ''), state, timeout: true };
}

// ═══════════════════════════════════════════════════════════════
// TEST FRAMEWORK
// ═══════════════════════════════════════════════════════════════
let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: TM — c→d Harf Dönüştürme
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 1: TM — c→d Harf Dönüştürme ═══');

const tmReplace = {
  type: 'TM',
  states: ['q0', 'q1', 'q_back', 'qf'],
  alphabet: ['a', 'b', 'c', '#'],
  startState: 'q0',
  acceptStates: ['qf'],
  transitions: [
    {state:'q0', input:'#', next:'q1', write:'#', dir:'R'},
    {state:'q1', input:'a', next:'q1', write:'a', dir:'R'},
    {state:'q1', input:'b', next:'q1', write:'b', dir:'R'},
    {state:'q1', input:'c', next:'q1', write:'d', dir:'R'},
    {state:'q1', input:'d', next:'q1', write:'d', dir:'R'},
    {state:'q1', input:'#', next:'q_back', write:'#', dir:'L'},
    {state:'q_back', input:'a', next:'q_back', write:'a', dir:'L'},
    {state:'q_back', input:'b', next:'q_back', write:'b', dir:'L'},
    {state:'q_back', input:'d', next:'q_back', write:'d', dir:'L'},
    {state:'q_back', input:'#', next:'qf', write:'#', dir:'S'},
    {state:'q1', input:'B', next:'qf', write:'B', dir:'S'}
  ]
};

// Test: #acbca# → #adbda#
let r1 = simulateTm(tmReplace, '#acbca#');
assert(r1.accepted === true, `"#acbca#" accepted`);
assert(r1.tape === '#adbda#', `Tape result: "${r1.tape}" === "#adbda#"`);

r1 = simulateTm(tmReplace, '#ccc#');
assert(r1.accepted === true, `"#ccc#" accepted`);
assert(r1.tape === '#ddd#', `Tape result: "${r1.tape}" === "#ddd#"`);

r1 = simulateTm(tmReplace, '#abc#');
assert(r1.accepted === true, `"#abc#" accepted`);
assert(r1.tape === '#abd#', `Tape result: "${r1.tape}" === "#abd#"`);

r1 = simulateTm(tmReplace, '#ab#');
assert(r1.accepted === true, `"#ab#" (no c's) accepted`);
assert(r1.tape === '#ab#', `Tape unchanged: "${r1.tape}" === "#ab#"`);

// ═══════════════════════════════════════════════════════════════
// TEST 2: TM — 0-Sayısı Çift/Tek Kontrolü
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 2: TM — 0-Sayısı Çift/Tek Kontrolü ═══');

const tmEvenZeros = {
  type: 'TM',
  states: ['q_even', 'q_odd', 'q_acc', 'q_rej'],
  alphabet: ['0', '1'],
  startState: 'q_even',
  acceptStates: ['q_acc'],
  transitions: [
    {state:'q_even', input:'0', next:'q_odd', write:'0', dir:'R'},
    {state:'q_even', input:'1', next:'q_even', write:'1', dir:'R'},
    {state:'q_even', input:'B', next:'q_acc', write:'B', dir:'S'},
    {state:'q_odd', input:'0', next:'q_even', write:'0', dir:'R'},
    {state:'q_odd', input:'1', next:'q_odd', write:'1', dir:'R'},
    {state:'q_odd', input:'B', next:'q_rej', write:'B', dir:'S'}
  ]
};

// 0 count tests (accepts when count of 0s is even)
assert(simulateTm(tmEvenZeros, '01001').accepted === false, '"01001" (3 zeros = odd) → REJECTED');
assert(simulateTm(tmEvenZeros, '111').accepted === true, '"111" (0 zeros = even) → ACCEPTED');
assert(simulateTm(tmEvenZeros, '').accepted === true, '"ε" (0 zeros = even) → ACCEPTED');
assert(simulateTm(tmEvenZeros, '00').accepted === true, '"00" (2 zeros = even) → ACCEPTED');
assert(simulateTm(tmEvenZeros, '0000').accepted === true, '"0000" (4 zeros = even) → ACCEPTED');
assert(simulateTm(tmEvenZeros, '0').accepted === false, '"0" (1 zero = odd) → REJECTED');
assert(simulateTm(tmEvenZeros, '01').accepted === false, '"01" (1 zero = odd) → REJECTED');
assert(simulateTm(tmEvenZeros, '000').accepted === false, '"000" (3 zeros = odd) → REJECTED');
assert(simulateTm(tmEvenZeros, '10101').accepted === true, '"10101" (2 zeros = even) → ACCEPTED');
assert(simulateTm(tmEvenZeros, '1010').accepted === true, '"1010" (2 zeros = even) → ACCEPTED');

// ═══════════════════════════════════════════════════════════════
// TEST 3: PDA — aⁿbᵏcᵏdⁿee İçiçe Eşleştirme
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 3: PDA — aⁿbᵏcᵏdⁿee İçiçe Eşleştirme ═══');

const pdaNested = {
  type: 'PDA',
  states: ['q0', 'q_a', 'q_b', 'q_c', 'q_d', 'q_e1', 'q_e2', 'qf'],
  alphabet: ['a', 'b', 'c', 'd', 'e'],
  startState: 'q0',
  acceptStates: ['qf'],
  transitions: [
    {state:'q0', input:'ε', pop:'ε', next:'q_a', push:'$'},
    {state:'q_a', input:'a', pop:'ε', next:'q_a', push:'a'},
    {state:'q_a', input:'b', pop:'ε', next:'q_b', push:'b'},
    {state:'q_b', input:'b', pop:'ε', next:'q_b', push:'b'},
    {state:'q_b', input:'c', pop:'b', next:'q_c', push:'ε'},
    {state:'q_c', input:'c', pop:'b', next:'q_c', push:'ε'},
    {state:'q_c', input:'d', pop:'a', next:'q_d', push:'ε'},
    {state:'q_d', input:'d', pop:'a', next:'q_d', push:'ε'},
    {state:'q_d', input:'e', pop:'$', next:'q_e1', push:'ε'},
    {state:'q_e1', input:'e', pop:'ε', next:'qf', push:'ε'}
  ]
};

// Valid: aⁿbᵏcᵏdⁿee
assert(simulatePda(pdaNested, 'aabbccddee') === true, '"aabbccddee" (n=2, k=2) → ACCEPTED');
assert(simulatePda(pdaNested, 'abcdee') === true, '"abcdee" (n=1, k=1) → ACCEPTED');
assert(simulatePda(pdaNested, 'aaabbbcccdddee') === true, '"aaabbbcccdddee" (n=3, k=3) → ACCEPTED');
assert(simulatePda(pdaNested, 'aabcddee') === true, '"aabcddee" (n=2, k=1) → ACCEPTED');
assert(simulatePda(pdaNested, 'abbbcccdee') === true, '"abbbcccdee" (n=1, k=3) → ACCEPTED');

// Invalid
assert(simulatePda(pdaNested, 'aabbccdee') === false, '"aabbccdee" (n=2, k=2 but only 1 d) → REJECTED');
assert(simulatePda(pdaNested, 'aabbccdde') === false, '"aabbccdde" (only 1 e) → REJECTED');
assert(simulatePda(pdaNested, 'aabbccdd') === false, '"aabbccdd" (no ee) → REJECTED');
assert(simulatePda(pdaNested, 'abcee') === false, '"abcee" (k=1 c but 0 b match) → REJECTED');
assert(simulatePda(pdaNested, 'aabbcddee') === false, '"aabbcddee" (k=2 b but 1 c) → REJECTED');
assert(simulatePda(pdaNested, '') === false, '"ε" → REJECTED');
assert(simulatePda(pdaNested, 'ee') === false, '"ee" (no a/b/c/d) → REJECTED');

// ═══════════════════════════════════════════════════════════════
// TEST 4: NFA — Sonu 00 veya 11 ile biten
// ═══════════════════════════════════════════════════════════════
console.log('\n═══ TEST 4: NFA — Sonu 00 veya 11 ile biten ═══');

const nfaEnds00or11 = {
  type: 'NFA',
  states: ['q0', 'q1', 'q2', 'q3', 'q4', 'qf'],
  alphabet: ['0', '1'],
  startState: 'q0',
  acceptStates: ['qf'],
  transitions: [
    {state:'q0', input:'0', next:'q0'},
    {state:'q0', input:'1', next:'q0'},
    {state:'q0', input:'ε', next:'q1'},
    {state:'q0', input:'ε', next:'q3'},
    {state:'q1', input:'0', next:'q2'},
    {state:'q2', input:'0', next:'qf'},
    {state:'q3', input:'1', next:'q4'},
    {state:'q4', input:'1', next:'qf'}
  ]
};

// Ending with 00
assert(simulateNfa(nfaEnds00or11, '00') === true, '"00" ends with 00 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '100') === true, '"100" ends with 00 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '10100') === true, '"10100" ends with 00 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '000') === true, '"000" ends with 00 → ACCEPTED');

// Ending with 11
assert(simulateNfa(nfaEnds00or11, '11') === true, '"11" ends with 11 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '011') === true, '"011" ends with 11 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '10111') === true, '"10111" ends with 11 → ACCEPTED');
assert(simulateNfa(nfaEnds00or11, '111') === true, '"111" ends with 11 → ACCEPTED');

// Should reject
assert(simulateNfa(nfaEnds00or11, '') === false, '"ε" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '0') === false, '"0" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '1') === false, '"1" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '01') === false, '"01" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '10') === false, '"10" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '010') === false, '"010" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '101') === false, '"101" → REJECTED');
assert(simulateNfa(nfaEnds00or11, '0110') === false, '"0110" ends 10 → REJECTED');
assert(simulateNfa(nfaEnds00or11, '1001') === false, '"1001" ends 01 → REJECTED');

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════
console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
