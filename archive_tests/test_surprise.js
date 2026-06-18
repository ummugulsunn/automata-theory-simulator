/**
 * Test: Kıyıda Kalan Sürpriz Soruları (7 yeni preset)
 */

// ── Simulation Engines ──
function normalizeEpsilon(s) {
  const v = s.trim();
  if (v === '' || v === 'ε' || v === 'Λ' || v === 'λ' || v.toLowerCase() === 'eps') return 'ε';
  return v;
}

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
  function epsClosure(states) {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
      const s = stack.pop();
      for (const t of m.transitions) {
        if (t.state === s && (t.input === 'ε' || t.input === 'Λ') && !closure.has(t.next)) {
          closure.add(t.next); stack.push(t.next);
        }
      }
    }
    return closure;
  }
  let current = epsClosure(new Set([m.startState]));
  for (const sym of str) {
    const next = new Set();
    for (const s of current)
      for (const t of m.transitions)
        if (t.state === s && t.input === sym) next.add(t.next);
    current = epsClosure(next);
    if (current.size === 0) return false;
  }
  return [...current].some(s => m.acceptStates.includes(s));
}

function simulatePda(m, str) {
  const configs = [{ state: m.startState, pos: 0, stack: ['$'] }];
  const visited = new Set();
  let steps = 0;
  while (configs.length > 0 && steps < 5000) {
    const { state, pos, stack } = configs.shift();
    steps++;
    const key = `${state}|${pos}|${stack.join(',')}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (pos >= str.length && m.acceptStates.includes(state)) return true;
    for (const t of m.transitions) {
      if (t.state !== state) continue;
      const tInput = normalizeEpsilon(t.input);
      const tPop = normalizeEpsilon(t.pop);
      const tPush = normalizeEpsilon(t.push);
      let newPos = pos;
      if (tInput !== 'ε') { if (pos >= str.length || str[pos] !== tInput) continue; newPos = pos + 1; }
      const newStack = [...stack];
      if (tPop !== 'ε') { if (newStack.length === 0 || newStack[newStack.length - 1] !== tPop) continue; newStack.pop(); }
      if (tPush !== 'ε') { for (let i = 0; i < tPush.length; i++) newStack.push(tPush[i]); }
      configs.push({ state: t.next, pos: newPos, stack: newStack });
    }
  }
  return false;
}

function simulateTm(m, str) {
  const tape = str.split('');
  for (let i = 0; i < 5; i++) { tape.unshift('B'); tape.push('B'); }
  let head = 5;
  let state = m.startState;
  for (let step = 0; step < 10000; step++) {
    if (m.acceptStates.includes(state)) return { accepted: true, tape: tape.join('').replace(/^B+|B+$/g, ''), state };
    if (head < 0) { tape.unshift('B'); head = 0; }
    if (head >= tape.length) tape.push('B');
    const sym = tape[head];
    const t = m.transitions.find(tr => tr.state === state && tr.input === sym);
    if (!t) return { accepted: false, tape: tape.join('').replace(/^B+|B+$/g, ''), state };
    tape[head] = t.write; state = t.next;
    if (t.dir === 'R') head++; else if (t.dir === 'L') head--;
  }
  return { accepted: false, tape: tape.join(''), state, timeout: true };
}

// ── Test Framework ──
let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

// ═══ 1. TM: a↔b Karşılıklı Dönüştürme ═══
console.log('\n═══ 1. TM: a↔b Swap ═══');
const tmSwap = {
  startState: 'q0', acceptStates: ['qf'],
  transitions: [
    {state:'q0',input:'a',next:'q0',write:'b',dir:'R'},
    {state:'q0',input:'b',next:'q0',write:'a',dir:'R'},
    {state:'q0',input:'B',next:'qf',write:'B',dir:'S'}
  ]
};
let r = simulateTm(tmSwap, 'abba');
assert(r.accepted && r.tape === 'baab', `"abba" → "${r.tape}" = "baab"`);
r = simulateTm(tmSwap, 'aaa');
assert(r.accepted && r.tape === 'bbb', `"aaa" → "${r.tape}" = "bbb"`);
r = simulateTm(tmSwap, '');
assert(r.accepted, `"ε" → accepted`);
r = simulateTm(tmSwap, 'ababab');
assert(r.accepted && r.tape === 'bababa', `"ababab" → "${r.tape}" = "bababa"`);

// ═══ 2. TM: Tamamen Silici ═══
console.log('\n═══ 2. TM: Tamamen Silici ═══');
const tmErase = {
  startState: 'q0', acceptStates: ['qf'],
  transitions: [
    {state:'q0',input:'a',next:'q0',write:'B',dir:'R'},
    {state:'q0',input:'b',next:'q0',write:'B',dir:'R'},
    {state:'q0',input:'c',next:'q0',write:'B',dir:'R'},
    {state:'q0',input:'B',next:'qf',write:'B',dir:'S'}
  ]
};
r = simulateTm(tmErase, 'abcba');
assert(r.accepted && r.tape === '', `"abcba" → tape empty`);
r = simulateTm(tmErase, 'aaa');
assert(r.accepted && r.tape === '', `"aaa" → tape empty`);
r = simulateTm(tmErase, '');
assert(r.accepted, `"ε" → accepted`);

// ═══ 3. TM: Sola # Arama ═══
console.log('\n═══ 3. TM: Sola # Arama ═══');
const tmSearch = {
  startState: 'q_right', acceptStates: ['qf'],
  transitions: [
    {state:'q_right',input:'a',next:'q_right',write:'a',dir:'R'},
    {state:'q_right',input:'#',next:'q_right',write:'#',dir:'R'},
    {state:'q_right',input:'B',next:'q_search',write:'B',dir:'L'},
    {state:'q_search',input:'a',next:'q_search',write:'a',dir:'L'},
    {state:'q_search',input:'#',next:'qf',write:'#',dir:'S'}
  ]
};
r = simulateTm(tmSearch, 'aa#aaa');
assert(r.accepted, `"aa#aaa" → found # → accepted`);
r = simulateTm(tmSearch, '#aaa');
assert(r.accepted, `"#aaa" → found # → accepted`);
r = simulateTm(tmSearch, 'aaa#');
assert(r.accepted, `"aaa#" → found # → accepted`);

// ═══ 4. PDA: aⁱbⁱ⁺ʲaʲ Kombine Eşleştirme ═══
console.log('\n═══ 4. PDA: aⁱbⁱ⁺ʲaʲ Kombine Eşleştirme ═══');
const pdaCombine = {
  startState: 'q0', acceptStates: ['qf'],
  transitions: [
    {state:'q0',input:'ε',pop:'ε',next:'q_a',push:'$'},
    {state:'q_a',input:'a',pop:'ε',next:'q_a',push:'a'},
    {state:'q_a',input:'ε',pop:'$',next:'qf',push:'ε'},
    {state:'q_a',input:'b',pop:'a',next:'q_pop',push:'ε'},
    {state:'q_a',input:'b',pop:'$',next:'q_push',push:'$b'},
    {state:'q_pop',input:'b',pop:'a',next:'q_pop',push:'ε'},
    {state:'q_pop',input:'ε',pop:'$',next:'qf',push:'ε'},
    {state:'q_pop',input:'b',pop:'$',next:'q_push',push:'$b'},
    {state:'q_push',input:'b',pop:'ε',next:'q_push',push:'b'},
    {state:'q_push',input:'a',pop:'b',next:'q_match',push:'ε'},
    {state:'q_match',input:'a',pop:'b',next:'q_match',push:'ε'},
    {state:'q_match',input:'ε',pop:'$',next:'qf',push:'ε'}
  ]
};
// Valid: a^i b^(i+j) a^j
assert(simulatePda(pdaCombine, 'aabbba') === true, '"aabbba" (i=2,j=1 → a²b³a¹) ✓');
assert(simulatePda(pdaCombine, 'abba') === true, '"abba" (i=1,j=1 → a¹b²a¹) ✓');
assert(simulatePda(pdaCombine, 'aabb') === true, '"aabb" (i=2,j=0 → a²b²) ✓');
assert(simulatePda(pdaCombine, 'bbaa') === true, '"bbaa" (i=0,j=2 → b²a²) ✓');
assert(simulatePda(pdaCombine, '') === true, '"ε" (i=0,j=0) ✓');
assert(simulatePda(pdaCombine, 'ba') === true, '"ba" (i=0,j=1 → b¹a¹) ✓');
assert(simulatePda(pdaCombine, 'ab') === true, '"ab" (i=1,j=0 → a¹b¹) ✓');
assert(simulatePda(pdaCombine, 'aaabbbbbaa') === true, '"aaabbbbbaa" (i=3,j=2 → a³b⁵a²) ✓');
// Invalid
assert(simulatePda(pdaCombine, 'aab') === false, '"aab" (2a, 1b → i=2 needs 2+j b\'s) ✗');
assert(simulatePda(pdaCombine, 'bba') === false, '"bba" (2b, 1a → j=1 needs 1 a but 2 b\'s unmatched) ✗');
assert(simulatePda(pdaCombine, 'a') === false, '"a" ✗');
assert(simulatePda(pdaCombine, 'b') === false, '"b" ✗');

// ═══ 5. DFA: 0*1* (İçinde "10" yok) ═══
console.log('\n═══ 5. DFA: 0*1* (İçinde "10" yok) ═══');
const dfa0s1s = {
  startState: 'q0', acceptStates: ['q0', 'q1'],
  transitions: [
    {state:'q0',input:'0',next:'q0'}, {state:'q0',input:'1',next:'q1'},
    {state:'q1',input:'1',next:'q1'}, {state:'q1',input:'0',next:'q_dead'},
    {state:'q_dead',input:'0',next:'q_dead'}, {state:'q_dead',input:'1',next:'q_dead'}
  ]
};
assert(simulateDfa(dfa0s1s, '') === true, '"ε" ∈ 0*1* ✓');
assert(simulateDfa(dfa0s1s, '0') === true, '"0" ✓');
assert(simulateDfa(dfa0s1s, '1') === true, '"1" ✓');
assert(simulateDfa(dfa0s1s, '000') === true, '"000" ✓');
assert(simulateDfa(dfa0s1s, '111') === true, '"111" ✓');
assert(simulateDfa(dfa0s1s, '0011') === true, '"0011" ✓');
assert(simulateDfa(dfa0s1s, '00111') === true, '"00111" ✓');
assert(simulateDfa(dfa0s1s, '10') === false, '"10" ∉ 0*1* ✗');
assert(simulateDfa(dfa0s1s, '010') === false, '"010" ✗');
assert(simulateDfa(dfa0s1s, '110') === false, '"110" ✗');
assert(simulateDfa(dfa0s1s, '0110') === false, '"0110" ✗');

// ═══ 6. DFA: 0*10* (Sadece bir 1) ═══
console.log('\n═══ 6. DFA: 0*10* (Sadece bir 1) ═══');
const dfaSingle1 = {
  startState: 'q0', acceptStates: ['q1'],
  transitions: [
    {state:'q0',input:'0',next:'q0'}, {state:'q0',input:'1',next:'q1'},
    {state:'q1',input:'0',next:'q1'}, {state:'q1',input:'1',next:'q_dead'},
    {state:'q_dead',input:'0',next:'q_dead'}, {state:'q_dead',input:'1',next:'q_dead'}
  ]
};
assert(simulateDfa(dfaSingle1, '1') === true, '"1" ✓');
assert(simulateDfa(dfaSingle1, '01') === true, '"01" ✓');
assert(simulateDfa(dfaSingle1, '10') === true, '"10" ✓');
assert(simulateDfa(dfaSingle1, '00100') === true, '"00100" ✓');
assert(simulateDfa(dfaSingle1, '010') === true, '"010" ✓');
assert(simulateDfa(dfaSingle1, '') === false, '"ε" ✗ (no 1)');
assert(simulateDfa(dfaSingle1, '000') === false, '"000" ✗ (no 1)');
assert(simulateDfa(dfaSingle1, '11') === false, '"11" ✗ (two 1s)');
assert(simulateDfa(dfaSingle1, '0110') === false, '"0110" ✗');
assert(simulateDfa(dfaSingle1, '101') === false, '"101" ✗');

// ═══ 7. NFA: ab*a ∪ ba*b (Dönüşüm Pratiği) ═══
console.log('\n═══ 7. NFA: ab*a ∪ ba*b ═══');
const nfaUnion = {
  startState: 'q0', acceptStates: ['q3', 'q6'],
  transitions: [
    {state:'q0',input:'ε',next:'q1'}, {state:'q0',input:'ε',next:'q4'},
    {state:'q1',input:'a',next:'q2'}, {state:'q2',input:'b',next:'q2'},
    {state:'q2',input:'a',next:'q3'},
    {state:'q4',input:'b',next:'q5'}, {state:'q5',input:'a',next:'q5'},
    {state:'q5',input:'b',next:'q6'}
  ]
};
// ab*a branch
assert(simulateNfa(nfaUnion, 'aa') === true, '"aa" = ab⁰a ✓');
assert(simulateNfa(nfaUnion, 'aba') === true, '"aba" = ab¹a ✓');
assert(simulateNfa(nfaUnion, 'abba') === true, '"abba" = ab²a ✓');
assert(simulateNfa(nfaUnion, 'abbba') === true, '"abbba" = ab³a ✓');
// ba*b branch
assert(simulateNfa(nfaUnion, 'bb') === true, '"bb" = ba⁰b ✓');
assert(simulateNfa(nfaUnion, 'bab') === true, '"bab" = ba¹b ✓');
assert(simulateNfa(nfaUnion, 'baab') === true, '"baab" = ba²b ✓');
// Rejects
assert(simulateNfa(nfaUnion, '') === false, '"ε" ✗');
assert(simulateNfa(nfaUnion, 'a') === false, '"a" ✗');
assert(simulateNfa(nfaUnion, 'b') === false, '"b" ✗');
assert(simulateNfa(nfaUnion, 'ab') === false, '"ab" ✗');
assert(simulateNfa(nfaUnion, 'ba') === false, '"ba" ✗');
assert(simulateNfa(nfaUnion, 'aab') === false, '"aab" ✗');

// ═══ SUMMARY ═══
console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
