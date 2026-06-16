/**
 * Test: PDA (ab)*(cd)* — Hocanın Tahtadaki Kuralları
 * δ = {
 *   (s0, Λ, Λ) → (s0, X)     — Push bottom marker
 *   (s0, a, Λ) → (s1, a)     — Read 'a', push 'a'
 *   (s1, b, a) → (s0, Λ)     — Read 'b', pop 'a'
 *   (s0, Λ, X) → (q0, X)     — Switch to cd phase
 *   (q0, c, Λ) → (q1, c)     — Read 'c', push 'c'
 *   (q1, d, c) → (q0, Λ)     — Read 'd', pop 'c'
 *   (q0, Λ, X) → (h, Λ)      — Pop X, accept
 * }
 */

function normalizeEpsilon(s) {
  const v = s.trim();
  if (v === '' || v === 'ε' || v === 'Λ' || v === 'λ') return 'ε';
  return v;
}

function simulatePda(m, str) {
  const configs = [{ state: m.startState, pos: 0, stack: [] }];
  const visited = new Set();
  let steps = 0;
  while (configs.length > 0 && steps < 10000) {
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

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

const pda = {
  startState: 's0', acceptStates: ['h'],
  transitions: [
    {state:'s0', input:'ε', pop:'ε', next:'s0', push:'X'},
    {state:'s0', input:'a', pop:'ε', next:'s1', push:'a'},
    {state:'s1', input:'b', pop:'a', next:'s0', push:'ε'},
    {state:'s0', input:'ε', pop:'X', next:'q0', push:'X'},
    {state:'q0', input:'c', pop:'ε', next:'q1', push:'c'},
    {state:'q1', input:'d', pop:'c', next:'q0', push:'ε'},
    {state:'q0', input:'ε', pop:'X', next:'h', push:'ε'}
  ]
};

console.log('\n═══ PDA: (ab)*(cd)* — Hocanın Tahtadaki Tasarımı ═══');

// Valid strings
assert(simulatePda(pda, '') === true, '"ε" → ✓ (0 ab, 0 cd)');
assert(simulatePda(pda, 'ab') === true, '"ab" → ✓ (1 ab)');
assert(simulatePda(pda, 'abab') === true, '"abab" → ✓ (2 ab)');
assert(simulatePda(pda, 'ababab') === true, '"ababab" → ✓ (3 ab)');
assert(simulatePda(pda, 'cd') === true, '"cd" → ✓ (1 cd)');
assert(simulatePda(pda, 'cdcd') === true, '"cdcd" → ✓ (2 cd)');
assert(simulatePda(pda, 'cdcdcd') === true, '"cdcdcd" → ✓ (3 cd)');
assert(simulatePda(pda, 'abcd') === true, '"abcd" → ✓ (1 ab + 1 cd)');
assert(simulatePda(pda, 'ababcdcd') === true, '"ababcdcd" → ✓ (2 ab + 2 cd)');
assert(simulatePda(pda, 'abababcdcdcd') === true, '"abababcdcdcd" → ✓ (3 ab + 3 cd)');
assert(simulatePda(pda, 'abcdcd') === true, '"abcdcd" → ✓ (1 ab + 2 cd)');
assert(simulatePda(pda, 'ababcd') === true, '"ababcd" → ✓ (2 ab + 1 cd)');

// Invalid strings
assert(simulatePda(pda, 'a') === false, '"a" → ✗');
assert(simulatePda(pda, 'b') === false, '"b" → ✗');
assert(simulatePda(pda, 'c') === false, '"c" → ✗');
assert(simulatePda(pda, 'd') === false, '"d" → ✗');
assert(simulatePda(pda, 'ba') === false, '"ba" → ✗ (ters sıra)');
assert(simulatePda(pda, 'dc') === false, '"dc" → ✗ (ters sıra)');
assert(simulatePda(pda, 'cdab') === false, '"cdab" → ✗ (cd önce, ab sonra)');
assert(simulatePda(pda, 'abc') === false, '"abc" → ✗ (eksik d)');
assert(simulatePda(pda, 'abd') === false, '"abd" → ✗');
assert(simulatePda(pda, 'ac') === false, '"ac" → ✗');
assert(simulatePda(pda, 'abcda') === false, '"abcda" → ✗ (fazladan a)');
assert(simulatePda(pda, 'aabb') === false, '"aabb" → ✗ (a^2 b^2 değil (ab)^2)');

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══`);
if (failed > 0) process.exit(1);
