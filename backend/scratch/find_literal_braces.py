
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find occurrences of } that are NOT preceded by { in the same line (approximate)
# Or just look for } in text nodes.
# This is hard.

# Let's try to find if there's any } that is NOT followed by a newline, space, or comma/semicolon/brace
# And check its context.

pattern = re.compile(r'[^\{]\s*\}\s*[^;,\]\}\)\r\n\s]')
matches = pattern.finditer(content)
for m in matches:
    print(f"Potential literal }} at {m.start()}:")
    print(content[m.start()-10:m.end()+10])
