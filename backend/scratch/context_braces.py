
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all '}' and print context
import re
for m in re.finditer(r'\}', content):
    pos = m.start()
    print(f"Pos {pos}: ...{content[max(0, pos-20):pos]} }} {content[pos+1:min(len(content), pos+20)]}...")
