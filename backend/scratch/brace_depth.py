
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    ln = i + 1
    for char in line:
        if char == '{': depth += 1
        elif char == '}': depth -= 1
        if depth < 0:
            print(f"L{ln}: Unbalanced }} (depth below 0)")
            depth = 0 # reset for analysis
print(f"Final depth: {depth}")
