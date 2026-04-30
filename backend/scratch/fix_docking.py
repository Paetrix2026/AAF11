import sys

filepath = 'app/(app)/doctor/docking/page.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Local search fix
    if "key={idx}" in line and i + 1 < len(lines) and "const metadata = res.metadata as any;" in lines[i+1] and "onClick" not in lines[i+1]:
        new_lines.append(line)
        indent = " " * (line.find("key={idx}"))
        new_lines.append(f"{indent}  onClick={() => {{\n")
        continue
    
    # Online search fix
    if "key={idx}" in line and i + 1 < len(lines) and "const diseaseName = metadata?.disease || res.name.split" in lines[i+2] and "onClick" not in lines[i+1]:
        # Wait, online search is also missing the line.
        # Actually, let's just look for the pattern.
        pass

    new_lines.append(line)

# Let's try a simpler replacement since the file is now broken
content = "".join(lines)

# Fix Local
old_local = """                                              <button
                                                key={idx}
                                                  const metadata = res.metadata as any;"""
new_local = """                                              <button
                                                key={idx}
                                                onClick={() => {
                                                  const metadata = res.metadata as any;"""

# Fix Online
old_online = """                                              <button
                                                key={idx}
                                                  const metadata = res.metadata as any;"""
# Wait, Online might have same pattern.

content = content.replace(old_local, new_local)

# Just in case, try with different space counts if it fails.
# But let's try this first.

with open(filepath, 'w') as f:
    f.write(content)
