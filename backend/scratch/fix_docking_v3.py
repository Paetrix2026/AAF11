import os
import re

filepath = 'app/(app)/doctor/docking/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the literal backtick newline from previous attempt
content = content.replace("key={idx}`n                                              onClick={() => {`n                                                const metadata", "key={idx}\n                                              onClick={() => {\n                                                const metadata")

# Use a more reliable regex to find the broken buttons
# Pattern: <button followed by key={idx} followed by whitespace followed by const metadata
# We want to insert onClick={() => { between key={idx} and const metadata
pattern = r'(<button\s+key=\{idx\}\s+)(const metadata = res\.metadata as any;)'

def replacer(match):
    prefix = match.group(1)
    metadata_line = match.group(2)
    # Return the button with onClick added
    return prefix + 'onClick={() => {\n                                                ' + metadata_line

content = re.sub(pattern, replacer, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
