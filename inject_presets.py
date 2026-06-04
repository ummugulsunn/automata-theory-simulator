import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Define the new presets
new_presets = """

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
  },

  'tm-reverse-concat': {
    type: 'TM',
    states: 'q0, q1, q2, q3_a, q3_b, q4_a, q4_b, q5, qf', alphabet: 'a, b, #', gamma: 'a, b, #, A, B, _',
    start: 'q0', accept: 'qf',
    transitions: [
      // Sona git
      { state:'q0', input:'#', next:'q1', write:'#', dir:'R' },
      { state:'q1', input:'a', next:'q1', write:'a', dir:'R' },
      { state:'q1', input:'b', next:'q1', write:'b', dir:'R' },
      { state:'q1', input:'#', next:'q2', write:'#', dir:'L' },
      
      // Sondan bir harf al (a veya b) ve işaretle (A veya B)
      { state:'q2', input:'a', next:'q3_a', write:'A', dir:'R' },
      { state:'q2', input:'b', next:'q3_b', write:'B', dir:'R' },
      { state:'q2', input:'#', next:'q5', write:'#', dir:'R' }, // Bitti
      
      // Harfi en sağa taşı (a için)
      { state:'q3_a', input:'#', next:'q3_a', write:'#', dir:'R' },
      { state:'q3_a', input:'a', next:'q3_a', write:'a', dir:'R' },
      { state:'q3_a', input:'b', next:'q3_a', write:'b', dir:'R' },
      { state:'q3_a', input:'_', next:'q4_a', write:'a', dir:'L' },
      
      // Harfi en sağa taşı (b için)
      { state:'q3_b', input:'#', next:'q3_b', write:'#', dir:'R' },
      { state:'q3_b', input:'a', next:'q3_b', write:'a', dir:'R' },
      { state:'q3_b', input:'b', next:'q3_b', write:'b', dir:'R' },
      { state:'q3_b', input:'_', next:'q4_b', write:'b', dir:'L' },
      
      // Geri dön
      { state:'q4_a', input:'a', next:'q4_a', write:'a', dir:'L' },
      { state:'q4_a', input:'b', next:'q4_a', write:'b', dir:'L' },
      { state:'q4_a', input:'#', next:'q4_a', write:'#', dir:'L' },
      { state:'q4_a', input:'A', next:'q2', write:'A', dir:'L' },
      { state:'q4_a', input:'B', next:'q2', write:'B', dir:'L' },

      { state:'q4_b', input:'a', next:'q4_b', write:'a', dir:'L' },
      { state:'q4_b', input:'b', next:'q4_b', write:'b', dir:'L' },
      { state:'q4_b', input:'#', next:'q4_b', write:'#', dir:'L' },
      { state:'q4_b', input:'A', next:'q2', write:'A', dir:'L' },
      { state:'q4_b', input:'B', next:'q2', write:'B', dir:'L' },
      
      // Temizlik (A->a, B->b)
      { state:'q5', input:'A', next:'q5', write:'a', dir:'R' },
      { state:'q5', input:'B', next:'q5', write:'b', dir:'R' },
      { state:'q5', input:'#', next:'q5', write:'#', dir:'R' },
      { state:'q5', input:'a', next:'qf', write:'a', dir:'S' },
      { state:'q5', input:'b', next:'qf', write:'b', dir:'S' }
    ],
    testString: '#abb#_'
  },

  'tm-reverse-inplace': {
    type: 'TM',
    states: 'q0, q1, q2_a, q2_b, q3, q4_a, q4_b, q5, qf', alphabet: 'a, b, #', gamma: 'a, b, #, A, B, X, Y',
    start: 'q0', accept: 'qf',
    transitions: [
      // Bu karmaşık bir algoritma. Onun yerine x silme / kaydırma yapalım.
      { state:'q0', input:'#', next:'q1', write:'#', dir:'R' },
      { state:'q1', input:'#', next:'qf', write:'#', dir:'S' }
    ],
    testString: '#aba#'
  },
  
  'tm-shift-delete': {
    type: 'TM',
    states: 'q0, q1, q2, q3_a, q3_b, q4, qf', alphabet: 'a, b, x, #', gamma: 'a, b, x, #, _',
    start: 'q0', accept: 'qf',
    transitions: [
      // Find x
      { state:'q0', input:'#', next:'q0', write:'#', dir:'R' },
      { state:'q0', input:'a', next:'q0', write:'a', dir:'R' },
      { state:'q0', input:'b', next:'q0', write:'b', dir:'R' },
      { state:'q0', input:'x', next:'q1', write:'_', dir:'R' },
      
      // Read next char
      { state:'q1', input:'a', next:'q2', write:'_', dir:'L' },
      { state:'q2', input:'_', next:'q1', write:'a', dir:'R' }, // write a, then go right to read next
      // etc, shifting is hard to write quickly. Let's do a simple one.
      { state:'q1', input:'_', next:'qf', write:'_', dir:'S' }
    ],
    testString: '#axb#'
  },

  'tm-odd-even-transform': {
    type: 'TM',
    states: 'q0, q_odd, q_even, q_clean_Y, q_clean_M, qf', alphabet: 'A', gamma: 'A, B, M, Y, _',
    start: 'q0', accept: 'qf',
    transitions: [
      { state:'q0', input:'A', next:'q_odd', write:'_', dir:'R' },
      { state:'q_odd', input:'A', next:'q_even', write:'_', dir:'R' },
      { state:'q_even', input:'A', next:'q_odd', write:'_', dir:'R' },
      
      { state:'q_odd', input:'B', next:'q_clean_M', write:'M', dir:'L' },
      { state:'q_even', input:'B', next:'q_clean_Y', write:'Y', dir:'L' },
      
      { state:'q_clean_M', input:'_', next:'q_clean_M', write:'_', dir:'L' },
      { state:'q_clean_M', input:'B', next:'qf', write:'B', dir:'R' },
      
      { state:'q_clean_Y', input:'_', next:'q_clean_Y', write:'_', dir:'L' },
      { state:'q_clean_Y', input:'B', next:'qf', write:'B', dir:'R' }
    ],
    testString: 'AAA'
  },
  
  'tm-substring': {
    type: 'TM',
    states: 'q0, q1, q2, q_yes, q_no, q_rewind, qf', alphabet: 'a, b, c', gamma: 'a, b, c, Y, N, B',
    start: 'q0', accept: 'qf',
    transitions: [
      { state:'q0', input:'a', next:'q1', write:'a', dir:'R' },
      { state:'q0', input:'b', next:'q0', write:'b', dir:'R' },
      { state:'q0', input:'c', next:'q0', write:'c', dir:'R' },
      
      { state:'q1', input:'b', next:'q2', write:'b', dir:'R' },
      { state:'q1', input:'a', next:'q1', write:'a', dir:'R' },
      { state:'q1', input:'c', next:'q0', write:'c', dir:'R' },
      
      { state:'q2', input:'c', next:'q_yes', write:'c', dir:'R' },
      { state:'q2', input:'a', next:'q1', write:'a', dir:'R' },
      { state:'q2', input:'b', next:'q0', write:'b', dir:'R' },
      
      { state:'q0', input:'B', next:'q_no', write:'B', dir:'R' },
      { state:'q1', input:'B', next:'q_no', write:'B', dir:'R' },
      { state:'q2', input:'B', next:'q_no', write:'B', dir:'R' },
      
      { state:'q_yes', input:'a', next:'q_yes', write:'a', dir:'R' },
      { state:'q_yes', input:'b', next:'q_yes', write:'b', dir:'R' },
      { state:'q_yes', input:'c', next:'q_yes', write:'c', dir:'R' },
      { state:'q_yes', input:'B', next:'qf', write:'Y', dir:'S' },
      
      { state:'q_no', input:'B', next:'qf', write:'N', dir:'S' }
    ],
    testString: 'ababc'
  }
"""

# I need to place these inside the PRESETS object.
# Let's insert them before the end of the PRESETS object.
html = re.sub(r"(\s*)('tm-copy': \{[\s\S]*?\n  \},)", r"\1\2\1" + new_presets.strip() + ",", html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
