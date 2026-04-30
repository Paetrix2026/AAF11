
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove comments
content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
content = re.sub(r'//.*', '', content)

# Find all tags, including self-closing ones
# Matches <Tag ... /> or <Tag ... > or </Tag>
pattern = re.compile(r'<(/?)([\w\.]+)([^>]*?)(/?)>')
tags = pattern.findall(content)

stack = []
for is_closing, tag, attrs, self_close in tags:
    if is_closing == '/':
        if not stack:
            print(f"UNBALANCED CLOSING TAG: </{tag}>")
        else:
            top = stack.pop()
            if top != tag:
                print(f"MISMATCH: </{tag}> closed <{top}>")
    elif self_close == '/':
        # print(f"Self-closing: <{tag}/>")
        pass
    else:
        # print(f"Opening: <{tag}>")
        stack.append(tag)

print(f"STILL OPEN: {stack}")
