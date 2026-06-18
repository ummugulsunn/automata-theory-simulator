/**
 * Test: Kıyıda Kalan FSM Spesifik Örnekler
 * 1. NFA: İlk ve Son Harfi Aynı — 0(0∪1)*0 ∪ 1(0∪1)*1
 * 2. NFA: İçinde "abb" Geçenler
 * 3. NFA: "ba" ile başla, "aab" ile bit
 */

function simulateNfa(m, str) {
  function epsClosure(states) {
    const closure = new Set(states);
    const stack = [...states];
    while (stack.length > 0) {
      const s = stack.pop();
      for (const t of m.transitions)
        if (t.state === s && t.input === 'ε' && !closure.has(t.next))
          { closure.add(t.next); stack.push(t.next); }
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

// ═══ 1. İlk ve Son Harfi Aynı ═══
console.log('\n═══ 1. NFA: İlk ve Son Harfi Aynı ═══');
const nfaFL = {
  startState: 'q0', acceptStates: ['q3', 'q6'],
  transitions: [
    {state:'q0',input:'ε',next:'q1'}, {state:'q0',input:'ε',next:'q4'},
    {state:'q1',input:'0',next:'q2'}, {state:'q1',input:'0',next:'q3'},
    {state:'q2',input:'0',next:'q2'}, {state:'q2',input:'1',next:'q2'},
    {state:'q2',input:'0',next:'q3'},
    {state:'q4',input:'1',next:'q5'}, {state:'q4',input:'1',next:'q6'},
    {state:'q5',input:'0',next:'q5'}, {state:'q5',input:'1',next:'q5'},
    {state:'q5',input:'1',next:'q6'}
  ]
};
// Starts & ends with 0
assert(simulateNfa(nfaFL, '0') === true, '"0" → ✓ (tek karakter, ilk=son=0)');
assert(simulateNfa(nfaFL, '00') === true, '"00" → ✓');
assert(simulateNfa(nfaFL, '010') === true, '"010" → ✓');
assert(simulateNfa(nfaFL, '01010') === true, '"01010" → ✓');
assert(simulateNfa(nfaFL, '000') === true, '"000" → ✓');
// Starts & ends with 1
assert(simulateNfa(nfaFL, '1') === true, '"1" → ✓ (tek karakter, ilk=son=1)');
assert(simulateNfa(nfaFL, '11') === true, '"11" → ✓');
assert(simulateNfa(nfaFL, '101') === true, '"101" → ✓');
assert(simulateNfa(nfaFL, '10101') === true, '"10101" → ✓');
assert(simulateNfa(nfaFL, '111') === true, '"111" → ✓');
// Ilk ≠ Son → REJECT
assert(simulateNfa(nfaFL, '01') === false, '"01" → ✗ (ilk=0, son=1)');
assert(simulateNfa(nfaFL, '10') === false, '"10" → ✗ (ilk=1, son=0)');
assert(simulateNfa(nfaFL, '011') === false, '"011" → ✗');
assert(simulateNfa(nfaFL, '100') === false, '"100" → ✗');
assert(simulateNfa(nfaFL, '0101') === false, '"0101" → ✗');
assert(simulateNfa(nfaFL, '1010') === false, '"1010" → ✗');
// Empty string
assert(simulateNfa(nfaFL, '') === false, '"ε" → ✗ (boş katar)');

// ═══ 2. İçinde "abb" Geçenler ═══
console.log('\n═══ 2. NFA: İçinde "abb" Geçenler ═══');
const nfaAbb = {
  startState: 'q0', acceptStates: ['q3'],
  transitions: [
    {state:'q0',input:'a',next:'q0'}, {state:'q0',input:'b',next:'q0'},
    {state:'q0',input:'a',next:'q1'},
    {state:'q1',input:'b',next:'q2'},
    {state:'q2',input:'b',next:'q3'},
    {state:'q3',input:'a',next:'q3'}, {state:'q3',input:'b',next:'q3'}
  ]
};
// Contains "abb"
assert(simulateNfa(nfaAbb, 'abb') === true, '"abb" → ✓');
assert(simulateNfa(nfaAbb, 'aabb') === true, '"aabb" → ✓');
assert(simulateNfa(nfaAbb, 'babb') === true, '"babb" → ✓');
assert(simulateNfa(nfaAbb, 'abba') === true, '"abba" → ✓');
assert(simulateNfa(nfaAbb, 'aabba') === true, '"aabba" → ✓');
assert(simulateNfa(nfaAbb, 'abbb') === true, '"abbb" → ✓');
assert(simulateNfa(nfaAbb, 'bbaabb') === true, '"bbaabb" → ✓');
// Doesn't contain "abb"
assert(simulateNfa(nfaAbb, '') === false, '"ε" → ✗');
assert(simulateNfa(nfaAbb, 'a') === false, '"a" → ✗');
assert(simulateNfa(nfaAbb, 'b') === false, '"b" → ✗');
assert(simulateNfa(nfaAbb, 'ab') === false, '"ab" → ✗');
assert(simulateNfa(nfaAbb, 'ba') === false, '"ba" → ✗');
assert(simulateNfa(nfaAbb, 'aab') === false, '"aab" → ✗');
assert(simulateNfa(nfaAbb, 'bba') === false, '"bba" → ✗');
assert(simulateNfa(nfaAbb, 'bab') === false, '"bab" → ✗');
assert(simulateNfa(nfaAbb, 'aaba') === false, '"aaba" → ✗ (ab var ama abb yok)');
assert(simulateNfa(nfaAbb, 'bbbb') === false, '"bbbb" → ✗');

// ═══ 3. "ba" ile başla, "aab" ile bit ═══
console.log('\n═══ 3. NFA: "ba" ile başla, "aab" ile bit ═══');
const nfaBA = {
  startState: 'q0', acceptStates: ['qf'],
  transitions: [
    {state:'q0',input:'b',next:'q1'},
    {state:'q1',input:'a',next:'q2'}, {state:'q1',input:'a',next:'q3'},
    {state:'q2',input:'a',next:'q2'}, {state:'q2',input:'b',next:'q2'},
    {state:'q2',input:'a',next:'q3'},
    {state:'q3',input:'a',next:'q4'},
    {state:'q4',input:'b',next:'qf'}
  ]
};
// Valid: starts with "ba", ends with "aab"
assert(simulateNfa(nfaBA, 'baab') === true, '"baab" → ✓ (ba + aab overlap)');
assert(simulateNfa(nfaBA, 'baaab') === true, '"baaab" → ✓');
assert(simulateNfa(nfaBA, 'babaaab') === true, '"babaaab" → ✓');
assert(simulateNfa(nfaBA, 'bababaab') === true, '"bababaab" → ✓');
assert(simulateNfa(nfaBA, 'baaaaaab') === true, '"baaaaaab" → ✓');
assert(simulateNfa(nfaBA, 'babaab') === true, '"babaab" → ✓');
// Invalid
assert(simulateNfa(nfaBA, '') === false, '"ε" → ✗');
assert(simulateNfa(nfaBA, 'ba') === false, '"ba" → ✗ (aab ile bitmiyor)');
assert(simulateNfa(nfaBA, 'aab') === false, '"aab" → ✗ (ba ile başlamıyor)');
assert(simulateNfa(nfaBA, 'bab') === false, '"bab" → ✗');
assert(simulateNfa(nfaBA, 'baabb') === false, '"baabb" → ✗ (aab ile bitmiyor, aabb)');
assert(simulateNfa(nfaBA, 'abaab') === false, '"abaab" → ✗ (ba ile başlamıyor)');
assert(simulateNfa(nfaBA, 'bba') === false, '"bba" → ✗');
assert(simulateNfa(nfaBA, 'babb') === false, '"babb" → ✗ (abb ile bitiyor ama aab değil)');

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
