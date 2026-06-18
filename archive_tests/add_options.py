import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add PDA option
html = html.replace(
    '<option value="pda-abcd">PDA: (ab)*(cd)* (Düzenli)</option>',
    '<option value="pda-abcd">PDA: (ab)*(cd)* (Düzenli)</option>\n          <option value="pda-multi-sep">PDA: Çoklu Ayırıcı (aa w bb wR cc)</option>'
)

# Add TM options
html = html.replace(
    '<option value="tm-copy">TM: Katar Kopyalama (w -> ww)</option>',
    '<option value="tm-copy">TM: Katar Kopyalama (w -> ww)</option>\n          <option value="tm-reverse-concat">TM: Tersini Birleştir (wwR)</option>\n          <option value="tm-reverse-inplace">TM: Tersine Çevirme</option>\n          <option value="tm-shift-delete">TM: Kaydırma ve Silme</option>\n          <option value="tm-odd-even-transform">TM: Tek/Çift Dönüşümü</option>\n          <option value="tm-substring">TM: Alt Katar Arama</option>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
