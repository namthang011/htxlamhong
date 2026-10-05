import os
import glob

for f in glob.glob('*.html'):
    if f in ('404.html', '500.html'):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace('href="css/style.css"', 'href="css/style.min.css"')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("CSS references updated.")
