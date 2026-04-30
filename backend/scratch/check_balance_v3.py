
import os
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define tags that are always self-closing or used as such in this file
SELF_CLOSING = {'ShieldCheck', 'ChevronRight', 'X', 'Zap', 'br', 'Dna', 'Cpu', 'Activity', 'FlaskConical', 'RefreshCw', 'Maximize2', 'ExternalLink', 'Info', 'Terminal', 'Microscope', 'Database', 'Search', 'Box', 'Input', 'Label', 'input', 'Plot', 'Molecule3DViewer', 'DecisionMatrixChart'}

tokens = re.findall(r'<(/?)(\w+)|(\{|\})', content)

stack = []
for t in tokens:
    is_closing, tag, brace = t[0] == '/', t[1], t[2]
    
    if brace == '{': stack.append('{')
    elif brace == '}':
        if not stack: print("UNBALANCED }")
        else: stack.pop()
    elif tag:
        if tag in SELF_CLOSING:
            continue
        if is_closing:
            if not stack: print(f"UNBALANCED </{tag}>")
            else:
                top = stack.pop()
                if top != tag:
                    print(f"MISMATCH: </{tag}> closed <{top}>")
        else:
            # Check for <Tag /> style
            # This is hard without full context, but let's assume if it's on a line ending with /> it's self-closing
            stack.append(tag)

print(f"STILL OPEN: {stack}")
