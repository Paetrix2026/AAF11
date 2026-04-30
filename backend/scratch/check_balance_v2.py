
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all opening and closing tags/braces
# This is a bit complex for regex but let's try
tokens = re.findall(r'<(\w+)|</(\w+)>|\{|\}', content)

stack = []
for t in tokens:
    opening, closing, brace_open, brace_close = "", "", "", ""
    if t == '{': stack.append('{')
    elif t == '}':
        if not stack: print("UNBALANCED }")
        else: stack.pop()
    elif t[0]: # Opening tag
        tag = t[0]
        # Ignore self-closing (approximate)
        # This is hard with regex...
        stack.append(tag)
    elif t[1]: # Closing tag
        tag = t[1]
        if not stack: print(f"UNBALANCED </{tag}>")
        else:
            top = stack.pop()
            if top != tag:
                print(f"MISMATCH: </{tag}> closed <{top}>")

print(f"STILL OPEN: {stack}")
