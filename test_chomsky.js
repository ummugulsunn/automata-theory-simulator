/**
 * Test: Eksik Chomsky (Tip 3) FSM Örnekleri (8 adet)
 */

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

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

// ═══ 1. DFA: "101" İçermeyen ═══
console.log('\n═══ 1. DFA: "101" İçermeyen ═══');
const dfaNo101 = {
  startState: 'q0', acceptStates: ['q0', 'q1', 'q10'],
  transitions: [
    {state:'q0',input:'0',next:'q0'}, {state:'q0',input:'1',next:'q1'},
    {state:'q1',input:'1',next:'q1'}, {state:'q1',input:'0',next:'q10'},
    {state:'q10',input:'0',next:'q0'}, {state:'q10',input:'1',next:'q_dead'},
    {state:'q_dead',input:'0',next:'q_dead'}, {state:'q_dead',input:'1',next:'q_dead'}
  ]
};
assert(simulateDfa(dfaNo101, '000') === true, '"000" ✓');
assert(simulateDfa(dfaNo101, '111') === true, '"111" ✓');
assert(simulateDfa(dfaNo101, '1100') === true, '"1100" ✓');
assert(simulateDfa(dfaNo101, '01100') === true, '"01100" ✓');
assert(simulateDfa(dfaNo101, '101') === false, '"101" ✗ (kuyu)');
assert(simulateDfa(dfaNo101, '01010') === false, '"01010" ✗ (kuyu)');
assert(simulateDfa(dfaNo101, '11101') === false, '"11101" ✗ (kuyu)');

// ═══ 2. DFA: Max 3 tane 'a' ═══
console.log('\n═══ 2. DFA: Max 3 tane "a" ═══');
const dfaMax3a = {
  startState: 'q0', acceptStates: ['q0', 'q1', 'q2', 'q3'],
  transitions: [
    {state:'q0',input:'b',next:'q0'}, {state:'q0',input:'a',next:'q1'},
    {state:'q1',input:'b',next:'q1'}, {state:'q1',input:'a',next:'q2'},
    {state:'q2',input:'b',next:'q2'}, {state:'q2',input:'a',next:'q3'},
    {state:'q3',input:'b',next:'q3'}, {state:'q3',input:'a',next:'q_dead'},
    {state:'q_dead',input:'a',next:'q_dead'}, {state:'q_dead',input:'b',next:'q_dead'}
  ]
};
assert(simulateDfa(dfaMax3a, 'bbbb') === true, '"bbbb" (0 a) ✓');
assert(simulateDfa(dfaMax3a, 'baba') === true, '"baba" (2 a) ✓');
assert(simulateDfa(dfaMax3a, 'aaab') === true, '"aaab" (3 a) ✓');
assert(simulateDfa(dfaMax3a, 'baabaa') === false, '"baabaa" (4 a) ✗ (kuyu)');
assert(simulateDfa(dfaMax3a, 'aaaa') === false, '"aaaa" (4 a) ✗ (kuyu)');

// ═══ 3. DFA: Sadece 1 tane 'a' ═══
console.log('\n═══ 3. DFA: Sadece 1 tane "a" ═══');
const dfaOneA = {
  startState: 'q0', acceptStates: ['q1'],
  transitions: [
    {state:'q0',input:'b',next:'q0'}, {state:'q0',input:'a',next:'q1'},
    {state:'q1',input:'b',next:'q1'}, {state:'q1',input:'a',next:'q_dead'},
    {state:'q_dead',input:'a',next:'q_dead'}, {state:'q_dead',input:'b',next:'q_dead'}
  ]
};
assert(simulateDfa(dfaOneA, 'b') === false, '"b" (0 a) ✗');
assert(simulateDfa(dfaOneA, 'a') === true, '"a" (1 a) ✓');
assert(simulateDfa(dfaOneA, 'bbabb') === true, '"bbabb" (1 a) ✓');
assert(simulateDfa(dfaOneA, 'aa') === false, '"aa" (2 a) ✗ (kuyu)');
assert(simulateDfa(dfaOneA, 'babab') === false, '"babab" (2 a) ✗ (kuyu)');

// ═══ 4. DFA: En az bir 'a' VE 'b' ═══
console.log('\n═══ 4. DFA: En az bir "a" VE "b" ═══');
const dfaAtLeastAB = {
  startState: 'q0', acceptStates: ['q_ab'],
  transitions: [
    {state:'q0',input:'a',next:'q_a'}, {state:'q0',input:'b',next:'q_b'},
    {state:'q_a',input:'a',next:'q_a'}, {state:'q_a',input:'b',next:'q_ab'},
    {state:'q_b',input:'b',next:'q_b'}, {state:'q_b',input:'a',next:'q_ab'},
    {state:'q_ab',input:'a',next:'q_ab'}, {state:'q_ab',input:'b',next:'q_ab'}
  ]
};
assert(simulateDfa(dfaAtLeastAB, 'a') === false, '"a" ✗');
assert(simulateDfa(dfaAtLeastAB, 'b') === false, '"b" ✗');
assert(simulateDfa(dfaAtLeastAB, 'ab') === true, '"ab" ✓');
assert(simulateDfa(dfaAtLeastAB, 'ba') === true, '"ba" ✓');
assert(simulateDfa(dfaAtLeastAB, 'aaaab') === true, '"aaaab" ✓');
assert(simulateDfa(dfaAtLeastAB, 'bbba') === true, '"bbba" ✓');

// ═══ 5. DFA: Sadece 3 Uzunluklu ═══
console.log('\n═══ 5. DFA: Sadece 3 Uzunluklu ═══');
const dfaLen3 = {
  startState: 'q0', acceptStates: ['q3'],
  transitions: [
    {state:'q0',input:'a',next:'q1'}, {state:'q0',input:'b',next:'q1'},
    {state:'q1',input:'a',next:'q2'}, {state:'q1',input:'b',next:'q2'},
    {state:'q2',input:'a',next:'q3'}, {state:'q2',input:'b',next:'q3'},
    {state:'q3',input:'a',next:'q_dead'}, {state:'q3',input:'b',next:'q_dead'},
    {state:'q_dead',input:'a',next:'q_dead'}, {state:'q_dead',input:'b',next:'q_dead'}
  ]
};
assert(simulateDfa(dfaLen3, 'ab') === false, '"ab" (len 2) ✗');
assert(simulateDfa(dfaLen3, 'aba') === true, '"aba" (len 3) ✓');
assert(simulateDfa(dfaLen3, 'bbb') === true, '"bbb" (len 3) ✓');
assert(simulateDfa(dfaLen3, 'abba') === false, '"abba" (len 4) ✗ (kuyu)');

// ═══ 6. NFA: Sonu "b" veya "aa" ═══
console.log('\n═══ 6. NFA: Sonu "b" veya "aa" ═══');
const nfaEndsBOrAa = {
  startState: 'q0', acceptStates: ['q2', 'q4'],
  transitions: [
    {state:'q0',input:'a',next:'q0'}, {state:'q0',input:'b',next:'q0'},
    {state:'q0',input:'ε',next:'q1'}, {state:'q1',input:'b',next:'q2'},
    {state:'q0',input:'ε',next:'q3'}, {state:'q3',input:'a',next:'q_mid'},
    {state:'q_mid',input:'a',next:'q4'}
  ]
};
assert(simulateNfa(nfaEndsBOrAa, 'b') === true, '"b" ✓');
assert(simulateNfa(nfaEndsBOrAa, 'ab') === true, '"ab" ✓');
assert(simulateNfa(nfaEndsBOrAa, 'aa') === true, '"aa" ✓');
assert(simulateNfa(nfaEndsBOrAa, 'baa') === true, '"baa" ✓');
assert(simulateNfa(nfaEndsBOrAa, 'abaa') === true, '"abaa" ✓');
assert(simulateNfa(nfaEndsBOrAa, 'a') === false, '"a" ✗');
assert(simulateNfa(nfaEndsBOrAa, 'aba') === false, '"aba" ✗');
assert(simulateNfa(nfaEndsBOrAa, 'baab') === true, '"baab" ✓ (ends in b)');

// ═══ 7. NFA: İçinde "aab" Geçen ═══
console.log('\n═══ 7. NFA: İçinde "aab" Geçen ═══');
const nfaContainsAab = {
  startState: 'q0', acceptStates: ['q3'],
  transitions: [
    {state:'q0',input:'a',next:'q0'}, {state:'q0',input:'b',next:'q0'},
    {state:'q0',input:'a',next:'q1'}, {state:'q1',input:'a',next:'q2'},
    {state:'q2',input:'b',next:'q3'},
    {state:'q3',input:'a',next:'q3'}, {state:'q3',input:'b',next:'q3'}
  ]
};
assert(simulateNfa(nfaContainsAab, 'aab') === true, '"aab" ✓');
assert(simulateNfa(nfaContainsAab, 'baab') === true, '"baab" ✓');
assert(simulateNfa(nfaContainsAab, 'aaba') === true, '"aaba" ✓');
assert(simulateNfa(nfaContainsAab, 'bbaabb') === true, '"bbaabb" ✓');
assert(simulateNfa(nfaContainsAab, 'ab') === false, '"ab" ✗');
assert(simulateNfa(nfaContainsAab, 'aba') === false, '"aba" ✗');
assert(simulateNfa(nfaContainsAab, 'baa') === false, '"baa" ✗');

// ═══ 8. NFA: Sondan 2. veya 3. Harfi 1 ═══
console.log('\n═══ 8. NFA: Sondan 2. veya 3. Harfi 1 ═══');
const nfaLast1 = {
  startState: 'q0', acceptStates: ['q2', 'q3'],
  transitions: [
    {state:'q0',input:'0',next:'q0'}, {state:'q0',input:'1',next:'q0'},
    {state:'q0',input:'1',next:'q1'},
    {state:'q1',input:'0',next:'q2'}, {state:'q1',input:'1',next:'q2'},
    {state:'q2',input:'0',next:'q3'}, {state:'q2',input:'1',next:'q3'}
  ]
};
assert(simulateNfa(nfaLast1, '10') === true, '"10" (2nd from last is 1) ✓');
assert(simulateNfa(nfaLast1, '11') === true, '"11" (2nd from last is 1) ✓');
assert(simulateNfa(nfaLast1, '100') === true, '"100" (3rd from last is 1) ✓');
assert(simulateNfa(nfaLast1, '101') === true, '"101" (3rd from last is 1) ✓');
assert(simulateNfa(nfaLast1, '010100') === true, '"010100" (3rd from last is 1) ✓');
assert(simulateNfa(nfaLast1, '00') === false, '"00" ✗');
assert(simulateNfa(nfaLast1, '1') === false, '"1" ✗');
assert(simulateNfa(nfaLast1, '1000') === false, '"1000" (4th from last is 1) ✗');

// `011000` is 4th from last is 1. But wait, `011000` -> 1 is 4th and 5th from last. Neither 2nd nor 3rd from last is 1. So it should be rejected.
assert(simulateNfa(nfaLast1, '011000') === false, '"011000" ✗');

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
