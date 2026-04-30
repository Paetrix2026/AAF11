
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Filter out comments and strings to be more accurate
# (Skip for now, just do raw count)

braces = []
for i, c in enumerate(content):
    if c == '{': braces.append(('{', i))
    elif c == '}':
        if not braces:
            print(f"STRAY }} at pos {i}")
            # Context
            print(content[max(0, i-20):min(len(content), i+20)])
        else:
            braces.pop()

if braces:
    for b, pos in braces:
        print(f"UNCLOSED {{ at pos {pos}")
        print(content[max(0, pos-20):min(len(content), pos+20)])
else:
    print("Braces are balanced")
