
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove comments
content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
content = re.sub(r'//.*', '', content)

# Find tags
# This regex matches <Tag or </Tag>
tags = re.findall(r'<(/?)(\w+[\.\w]*)', content)

stack = []
# Components that are often self-closing in this file
SELF_CLOSING = {'ShieldCheck', 'ChevronRight', 'X', 'Zap', 'br', 'Dna', 'Cpu', 'Activity', 'FlaskConical', 'RefreshCw', 'Maximize2', 'ExternalLink', 'Info', 'Terminal', 'Microscope', 'Database', 'Search', 'Box', 'Input', 'Label', 'input', 'Plot', 'Molecule3DViewer', 'DecisionMatrixChart', 'Button'}

for is_closing, tag in tags:
    if is_closing == '/':
        if not stack:
            print(f"UNBALANCED CLOSING TAG: </{tag}>")
        else:
            top = stack.pop()
            if top != tag:
                print(f"MISMATCH: </{tag}> closed <{top}>")
    else:
        # Check if it's self-closing (approximate)
        # We search for the next > and see if it's />
        # This is hard without position.
        stack.append(tag)

# Filter stack by removing things we know are self-closing
stack = [t for t in stack if t not in SELF_CLOSING]
print(f"STILL OPEN: {stack}")
