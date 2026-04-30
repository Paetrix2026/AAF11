
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Target line 1032 (0-indexed 1031)
# We want to insert tags before )}

# Find the line containing "              )}" near 1032
target_idx = -1
for i in range(1020, 1040):
    if i < len(lines) and '              )}' in lines[i]:
        target_idx = i
        break

if target_idx != -1:
    lines[target_idx] = '                  </ScrollArea>\n                </motion.div>\n              )}\n'
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("FIXED")
else:
    print("NOT FOUND")
