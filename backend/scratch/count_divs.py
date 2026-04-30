
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

opens = len(re.findall(r'<div', content))
closes = len(re.findall(r'</div', content))
print(f"div: {opens}, /div: {closes}")
