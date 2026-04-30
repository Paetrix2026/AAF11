
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

count = 0
for i, c in enumerate(content):
    if c == '[': count += 1
    elif c == ']': count -= 1
    if count < 0:
        print(f"UNBALANCED ] at pos {i}")
        break

print(f"Final balance: {count}")
