
import os

path = r'c:\Projects\AAF11\app\(app)\doctor\docking\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Very basic tag counting
tags = ['<div', '</div>', '<motion.div', '</motion.div>', '<ScrollArea', '</ScrollArea>', '<Dialog', '</Dialog>', '<Tabs', '</Tabs>', '<TabsContent', '</TabsContent>', '{', '}']

for t in tags:
    print(f"{t}: {content.count(t)}")
