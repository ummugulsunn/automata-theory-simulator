/**
 * Test: Son Eklenen ve Test Edilmeyen 3 Preset
 * 1. PDA: Parantez Dengelemesi (pda-balanced)
 * 2. TM: "aba" İçermeyen / Kuyu (tm-reject-aba)
 * 3. TM: A'ları Sayıp Ekleme (tm-count-a)
 */

// ═══ PDA BFS Simülatörü (index.html ile birebir aynı mantık) ═══
function normalizeEpsilon(s) {
  const v = s.trim();
  if (v === '' || v === 'ε' || v === 'Λ' || v === 'λ' || v.toLowerCase() === 'eps') return 'ε';
  return v;
}

function simulatePda(preset, inputStr) {
  const transitions = preset.transitions.map(t => ({
    state: t.state,
    input: normalizeEpsilon(t.input || ''),
    pop: normalizeEpsilon(t.pop || ''),
    next: t.next,
    push: normalizeEpsilon(t.push || '')
  }));
  const acceptStates = preset.accept.split(',').map(s => s.trim());
  const startState = preset.start.trim();

  // BFS with cycle detection, max 5000 iterations
  let configs = [{ state: startState, pos: 0, stack: [] }];
  const inputArr = inputStr.split('');

  for (let iter = 0; iter < 5000; iter++) {
    const newConfigs = [];
    let anyProgress = false;

    for (const config of configs) {
      const { state, pos, stack } = config;
      let moved = false;

      for (const t of transitions) {
        if (t.state !== state) continue;
        const inputOk = t.input === 'ε' || (pos < inputArr.length && t.input === inputArr[pos]);
        if (!inputOk) continue;
        const top = stack.length ? stack[stack.length - 1] : null;
        const popOk = t.pop === 'ε' || (top !== null && t.pop === top);
        if (!popOk) continue;

        const ns = [...stack];
        if (t.pop !== 'ε') ns.pop();
        if (t.push !== 'ε') { for (const ch of t.push) ns.push(ch); }
        const np = t.input === 'ε' ? pos : pos + 1;
        newConfigs.push({ state: t.next, pos: np, stack: ns });
        moved = true; anyProgress = true;
      }
      if (!moved && pos >= inputArr.length) newConfigs.push(config);
    }

    if (!anyProgress) {
      return configs.some(c => c.pos >= inputArr.length && acceptStates.includes(c.state));
    }

    // Deduplicate
    const seen = new Set();
    const deduped = [];
    for (const c of newConfigs) {
      const key = c.state + '|' + c.pos + '|' + c.stack.join(',');
      if (!seen.has(key)) { seen.add(key); deduped.push(c); }
    }
    configs = deduped;
  }
  return false; // timeout
}

// ═══ TM Simülatörü (index.html ile birebir aynı mantık) ═══
function simulateTm(preset, inputStr) {
  const transitions = preset.transitions;
  const acceptStates = preset.accept.split(',').map(s => s.trim());
  const startState = preset.start.trim();

  let tape = inputStr.length > 0 ? inputStr.split('') : ['B'];
  let head = 0;
  let state = startState;

  for (let step = 0; step < 10000; step++) {
    if (head < 0) { tape.unshift('B'); head = 0; }
    if (head >= tape.length) tape.push('B');

    const readSym = tape[head];
    const t = transitions.find(tr => tr.state === state && tr.input === readSym);

    if (!t) {
      return { accepted: acceptStates.includes(state), tape: tape.join(''), state };
    }

    tape[head] = t.write;
    state = t.next;
    if (t.dir === 'R') { head++; if (head >= tape.length) tape.push('B'); }
    else if (t.dir === 'L') { head--; if (head < 0) { tape.unshift('B'); head = 0; } }
    // 'S' = stay
  }
  return { accepted: false, tape: tape.join(''), state, timeout: true };
}

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ FAIL: ${msg}`); }
}

// ═══════════════════════════════════════════════════════════════
// 1. PDA: Parantez Dengelemesi
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════');
console.log('1. PDA: Parantez Dengelemesi');
console.log('══════════════════════════════════════════════════════');
console.log('Kurallar:');
console.log('  (q0, ε, ε) → (q1, Z)    — Yığına taban sembolü Z koy');
console.log('  (q1, "(", ε) → (q1, "(") — Sol parantez oku, yığına "(" at');
console.log('  (q1, ")", "(") → (q1, ε) — Sağ parantez oku, yığından "(" çek');
console.log('  (q1, ε, Z) → (qf, ε)    — Yığın taban sembolünü gör, kabul et');
console.log('');

const pdaBalanced = {
  start: "q0", accept: "qf",
  transitions: [
    {state: "q0", input: "ε", pop: "ε", next: "q1", push: "Z"},
    {state: "q1", input: "(", pop: "ε", next: "q1", push: "("},
    {state: "q1", input: ")", pop: "(", next: "q1", push: "ε"},
    {state: "q1", input: "ε", pop: "Z", next: "qf", push: "ε"}
  ]
};

// ─── Kabul Edilecekler ───
console.log('  --- Kabul Edilecekler ---');
assert(simulatePda(pdaBalanced, '') === true,
  '"" (boş katar, 0 parantez) → KABUL ✓');
assert(simulatePda(pdaBalanced, '()') === true,
  '"()" (tek çift) → KABUL ✓');
assert(simulatePda(pdaBalanced, '(())') === true,
  '"(())" (iç içe) → KABUL ✓');
assert(simulatePda(pdaBalanced, '()()') === true,
  '"()()" (yan yana) → KABUL ✓');
assert(simulatePda(pdaBalanced, '((()))') === true,
  '"((()))" (3 kat iç içe) → KABUL ✓');
assert(simulatePda(pdaBalanced, '()(())') === true,
  '"()(())" (karma) → KABUL ✓');
assert(simulatePda(pdaBalanced, '(()(()))') === true,
  '"(()(()))" (karmaşık iç içe) → KABUL ✓');
assert(simulatePda(pdaBalanced, '()()()') === true,
  '"()()()" (3 çift yan yana) → KABUL ✓');

// ─── Reddedilecekler ───
console.log('  --- Reddedilecekler ---');
assert(simulatePda(pdaBalanced, '(') === false,
  '"(" (açılmış kapanmamış) → RED ✗');
assert(simulatePda(pdaBalanced, ')') === false,
  '")" (önce kapanış) → RED ✗');
assert(simulatePda(pdaBalanced, '(()') === false,
  '"(()" (1 fazla açılış) → RED ✗');
assert(simulatePda(pdaBalanced, '())') === false,
  '"())" (1 fazla kapanış) → RED ✗');
assert(simulatePda(pdaBalanced, ')(') === false,
  '")(" (ters sıra) → RED ✗');
assert(simulatePda(pdaBalanced, '(()(') === false,
  '"(()(" (dengesiz) → RED ✗');
assert(simulatePda(pdaBalanced, '))((') === false,
  '"))((" (tamamen ters) → RED ✗');
assert(simulatePda(pdaBalanced, '(()))') === false,
  '"(()))" (1 fazla kapanış) → RED ✗');

// ═══════════════════════════════════════════════════════════════
// 2. TM: "aba" İçermeyen (Kuyu Durumlu)
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════');
console.log('2. TM: "aba" İçermeyen (Kuyu Durumlu)');
console.log('══════════════════════════════════════════════════════');
console.log('Mantık: q0→a→q1, q1→b→q2, q2→a→q_reject (kuyu!)');
console.log('  b görünce q0\'a dön, B (boşluk) görünce q_accept\'e git.');
console.log('');

const tmRejectAba = {
  start: "q0", accept: "q_accept",
  transitions: [
    {state: "q0", input: "a", next: "q1", write: "a", dir: "R"},
    {state: "q0", input: "b", next: "q0", write: "b", dir: "R"},
    {state: "q1", input: "a", next: "q1", write: "a", dir: "R"},
    {state: "q1", input: "b", next: "q2", write: "b", dir: "R"},
    {state: "q2", input: "a", next: "q_reject", write: "a", dir: "S"},
    {state: "q2", input: "b", next: "q0", write: "b", dir: "R"},
    {state: "q0", input: "B", next: "q_accept", write: "B", dir: "S"},
    {state: "q1", input: "B", next: "q_accept", write: "B", dir: "S"},
    {state: "q2", input: "B", next: "q_accept", write: "B", dir: "S"}
  ]
};

// ─── Kabul Edilecekler (aba İÇERMEYENLER) ───
console.log('  --- Kabul: "aba" içermeyen katarlar ---');
let r;
r = simulateTm(tmRejectAba, 'bbaab');
assert(r.accepted === true, '"bbaab" → KABUL ✓ (aba yok)');

r = simulateTm(tmRejectAba, 'bbb');
assert(r.accepted === true, '"bbb" → KABUL ✓ (hiç a yok)');

r = simulateTm(tmRejectAba, 'aaa');
assert(r.accepted === true, '"aaa" → KABUL ✓ (b yok, aba olmaz)');

r = simulateTm(tmRejectAba, 'bb');
assert(r.accepted === true, '"bb" → KABUL ✓');

r = simulateTm(tmRejectAba, 'ab');
assert(r.accepted === true, '"ab" → KABUL ✓ (kısa, aba olmaz)');

r = simulateTm(tmRejectAba, 'ba');
assert(r.accepted === true, '"ba" → KABUL ✓');

r = simulateTm(tmRejectAba, 'aab');
assert(r.accepted === true, '"aab" → KABUL ✓ (a-a-b, sonra boşluk)');

r = simulateTm(tmRejectAba, 'bba');
assert(r.accepted === true, '"bba" → KABUL ✓');

r = simulateTm(tmRejectAba, 'abbb');
assert(r.accepted === true, '"abbb" → KABUL ✓ (ab sonra bb → aba yok)');

r = simulateTm(tmRejectAba, '');
assert(r.accepted === true, '"" (boş katar) → KABUL ✓');

r = simulateTm(tmRejectAba, 'aabb');
assert(r.accepted === true, '"aabb" → KABUL ✓ (a-a-b-b → q1→q1→q2→q0→B=accept)');

// ─── Reddedilecekler (aba İÇERENLER) ───
console.log('  --- Red: "aba" içeren katarlar ---');
r = simulateTm(tmRejectAba, 'aba');
assert(r.accepted === false, '"aba" → RED ✗ (tam eşleşme!)');

r = simulateTm(tmRejectAba, 'baba');
assert(r.accepted === false, '"baba" → RED ✗ (ortada aba var)');

r = simulateTm(tmRejectAba, 'abab');
assert(r.accepted === false, '"abab" → RED ✗ (baştaki aba)');

r = simulateTm(tmRejectAba, 'aaba');
assert(r.accepted === false, '"aaba" → RED ✗ (aba 2. pozisyonda)');

r = simulateTm(tmRejectAba, 'babab');
assert(r.accepted === false, '"babab" → RED ✗ (birden fazla aba)');

r = simulateTm(tmRejectAba, 'bbababb');
assert(r.accepted === false, '"bbababb" → RED ✗ (ortada aba)');

// ─── Köşe Durumları ───
console.log('  --- Köşe durumları ---');
r = simulateTm(tmRejectAba, 'a');
assert(r.accepted === true, '"a" → KABUL ✓ (tek harf)');

r = simulateTm(tmRejectAba, 'b');
assert(r.accepted === true, '"b" → KABUL ✓ (tek harf)');

r = simulateTm(tmRejectAba, 'abba');
assert(r.accepted === true, '"abba" → KABUL ✓ (ab-b-a → a-b sonra bb hepsi aba değil)');
// abba: q0→a→q1, q1→b→q2, q2→b→q0, q0→a→q1, q1→B→accept ✓

// ═══════════════════════════════════════════════════════════════
// 3. TM: A'ları Sayıp Ekleme (Unary Count)
// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════');
console.log('3. TM: A\'ları Sayıp Ekleme (Unary Sayma)');
console.log('══════════════════════════════════════════════════════');
console.log('Mantık: Her A\'yı X ile işaretle → sona 1 yaz → geri dön');
console.log('  Tüm A\'lar X olunca cleanup: X\'leri tekrar A yap.');
console.log('  Sonuç: Orijinal katar + n tane 1 (n = A sayısı)');
console.log('');

const tmCountA = {
  start: "q_scan", accept: "q_accept",
  transitions: [
    {state: "q_scan", input: "b", next: "q_scan", write: "b", dir: "R"},
    {state: "q_scan", input: "1", next: "q_scan", write: "1", dir: "R"},
    {state: "q_scan", input: "A", next: "q_find_end", write: "X", dir: "R"},
    {state: "q_scan", input: "B", next: "q_cleanup", write: "B", dir: "L"},

    {state: "q_find_end", input: "A", next: "q_find_end", write: "A", dir: "R"},
    {state: "q_find_end", input: "b", next: "q_find_end", write: "b", dir: "R"},
    {state: "q_find_end", input: "1", next: "q_find_end", write: "1", dir: "R"},
    {state: "q_find_end", input: "B", next: "q_write_1", write: "1", dir: "S"},

    {state: "q_write_1", input: "1", next: "q_return", write: "1", dir: "L"},

    {state: "q_return", input: "A", next: "q_return", write: "A", dir: "L"},
    {state: "q_return", input: "b", next: "q_return", write: "b", dir: "L"},
    {state: "q_return", input: "1", next: "q_return", write: "1", dir: "L"},
    {state: "q_return", input: "X", next: "q_scan", write: "X", dir: "R"},

    {state: "q_cleanup", input: "X", next: "q_cleanup", write: "A", dir: "L"},
    {state: "q_cleanup", input: "b", next: "q_cleanup", write: "b", dir: "L"},
    {state: "q_cleanup", input: "1", next: "q_cleanup", write: "1", dir: "L"},
    {state: "q_cleanup", input: "B", next: "q_accept", write: "B", dir: "R"}
  ]
};

// Helper: sonuçtaki tape'i analiz et
function countTrailing1s(tape) {
  const clean = tape.replace(/B+$/g, '');
  let count = 0;
  for (let i = clean.length - 1; i >= 0; i--) {
    if (clean[i] === '1') count++;
    else break;
  }
  return count;
}

function getOriginalPart(tape) {
  const clean = tape.replace(/B+$/g, '');
  // Original part = remove trailing 1s
  let end = clean.length;
  while (end > 0 && clean[end - 1] === '1') end--;
  return clean.substring(0, end);
}

console.log('  --- A sayısı testi ---');

// "A" → 1 A, sonuç: A1
r = simulateTm(tmCountA, 'A');
assert(r.accepted === true, '"A" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 1, `"A" → sona 1 tane "1" eklendi (tape: ${r.tape})`);

// "AA" → 2 A, sonuç: AA11
r = simulateTm(tmCountA, 'AA');
assert(r.accepted === true, '"AA" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 2, `"AA" → sona 2 tane "1" eklendi (tape: ${r.tape})`);

// "AAA" → 3 A, sonuç: AAA111
r = simulateTm(tmCountA, 'AAA');
assert(r.accepted === true, '"AAA" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 3, `"AAA" → sona 3 tane "1" eklendi (tape: ${r.tape})`);

// "bAbAb" → 2 A, sonuç: bAbAb11
r = simulateTm(tmCountA, 'bAbAb');
assert(r.accepted === true, '"bAbAb" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 2, `"bAbAb" → sona 2 tane "1" eklendi (tape: ${r.tape})`);
let orig = getOriginalPart(r.tape).replace(/^B/, '');
assert(orig === 'bAbAb', `"bAbAb" → orijinal kısım korundu: "${orig}"`);

// "bbb" → 0 A, doğrudan cleanup
r = simulateTm(tmCountA, 'bbb');
assert(r.accepted === true, '"bbb" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 0, `"bbb" → sona 0 tane "1" eklendi (tape: ${r.tape})`);

// "AbAbA" → 3 A
r = simulateTm(tmCountA, 'AbAbA');
assert(r.accepted === true, '"AbAbA" → TM durdu ve kabul etti');
assert(countTrailing1s(r.tape) === 3, `"AbAbA" → sona 3 tane "1" eklendi (tape: ${r.tape})`);

console.log('  --- Orijinal katarın korunduğunu doğrulama ---');
// X'ler cleanup sonrası tekrar A'ya dönmeli
r = simulateTm(tmCountA, 'AbbA');
assert(r.accepted === true, '"AbbA" → kabul');
assert(countTrailing1s(r.tape) === 2, `"AbbA" → sona 2 tane "1" (tape: ${r.tape})`);
orig = getOriginalPart(r.tape).replace(/^B/, '');
assert(orig === 'AbbA', `"AbbA" → orijinal bozulmadı: "${orig}"`);

r = simulateTm(tmCountA, 'AAAA');
assert(r.accepted === true, '"AAAA" → kabul');
assert(countTrailing1s(r.tape) === 4, `"AAAA" → sona 4 tane "1" (tape: ${r.tape})`);

// Boş katar
r = simulateTm(tmCountA, '');
assert(r.accepted === true, '"" (boş) → kabul (hiç A yok, doğrudan cleanup)');
assert(countTrailing1s(r.tape) === 0, `"" → sona 0 tane "1" (tape: ${r.tape})`);

// ═══════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════');
console.log(`SONUÇ: ${passed} geçti, ${failed} başarısız`);
console.log('══════════════════════════════════════════════════════');
if (failed > 0) process.exit(1);
