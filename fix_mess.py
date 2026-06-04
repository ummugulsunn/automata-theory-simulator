import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# I see a broken block starting from:
#   'pda-multi-sep': {
#     type: 'PDA',
#     states: 'q0, q1, q2, q3, q4, qf', alphabet: 'a, b, c, x, y', gamma: 'x, y,  {
# to the next 'pda-multi-sep': {

start_idx = html.find("  'pda-multi-sep': {")
end_idx = html.rfind("  'pda-multi-sep': {")

if start_idx != -1 and end_idx != -1 and start_idx != end_idx:
    html = html[:start_idx] + html[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
