import os

filepath = 'app/(app)/doctor/docking/page.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Fix Local search
old_local = """                                              <button
                                               key={idx}
                                                 const metadata = res.metadata as any;"""
new_local = """                                              <button
                                               key={idx}
                                               onClick={() => {
                                                 const metadata = res.metadata as any;"""

# Fix Online search
old_online = """                                              <button
                                               key={idx}
                                               onClick={() => {
                                                const metadata = res.metadata as any;"""
# Wait, I might have messed up Online too.

# Let's just look for the buttons and check if onClick is missing.
import re

def fix_button(match):
    button_part = match.group(0)
    if "onClick" not in button_part:
        return button_part.replace("key={idx}", "key={idx}\n                                              onClick={() => {")
    return button_part

# This regex finds the button and the first line inside it.
content = re.sub(r'<button\s+key=\{idx\}\s+const metadata = res\.metadata as any;', 
                 r'<button\n                                              key={idx}\n                                              onClick={() => {\n                                                const metadata = res.metadata as any;', 
                 content)

with open(filepath, 'w') as f:
    f.write(content)
