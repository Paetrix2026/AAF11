
import re

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Filter out comments
content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)

# Find all tags
stack = []
for m in re.finditer(r'<(/?)([\w\.]+)', content):
    tag = m.group(2)
    is_closing = m.group(1) == '/'
    
    # Check if self-closing
    end_pos = content.find('>', m.end())
    is_self_closing = content[end_pos-1] == '/'
    
    line_num = content.count('\n', 0, m.start()) + 1
    
    if is_self_closing:
        continue
    
    if is_closing:
        if not stack:
            print(f"L{line_num}: Unbalanced closing tag </{tag}>")
        else:
            top, top_ln = stack.pop()
            if top != tag:
                print(f"L{line_num}: Mismatch </{tag}> closes <{top}> from L{top_ln}")
    else:
        stack.append((tag, line_num))

for tag, ln in stack:
    print(f"UNCLOSED <{tag}> from L{ln}")
