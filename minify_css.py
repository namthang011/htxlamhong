import os
import re

css_dir = r"d:\Study\HTX\css"

for f in os.listdir(css_dir):
    if f.endswith('.css') and not f.endswith('.min.css'):
        filepath = os.path.join(css_dir, f)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Simple CSS minify
        # Remove comments
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        # Remove whitespace
        content = re.sub(r'\s+', ' ', content)
        content = re.sub(r'\s*([\{\}\:\;\,\>])\s*', r'\1', content)
        
        min_filepath = os.path.join(css_dir, f.replace('.css', '.min.css'))
        with open(min_filepath, 'w', encoding='utf-8') as min_file:
            min_file.write(content.strip())

print("CSS Minification complete.")
