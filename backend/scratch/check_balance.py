
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Very simple check for common tags
    for tag in ['<div', '</div>', '<motion.div', '</motion.div>', '<ScrollArea', '</ScrollArea>', '<Dialog', '</Dialog>', '<Tabs', '</Tabs>', '<TabsContent', '</TabsContent>', '{', '}']:
        if tag in line:
            if tag.startswith('</') or tag == '}':
                if stack:
                    top = stack.pop()
                    # print(f"L{i+1}: Closing {tag} matches {top}")
                else:
                    print(f"L{i+1}: UNBALANCED CLOSING TAG: {tag}")
            elif not line.strip().endswith('/>'):
                stack.append(tag)
                # print(f"L{i+1}: Opening {tag}")

if stack:
    print(f"UNCLOSED TAGS: {stack}")
else:
    print("ALL BALANCED (roughly)")
