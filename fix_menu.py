import os
import re

target_dir = r"d:\Study\HTX"
static_dir = r"d:\Study\HTX\src\main\resources\static"

for f in os.listdir(target_dir):
    if not f.endswith('.html'):
        continue
    if f in ('404.html', '500.html', 'admin.html'):
        continue
        
    filepath = os.path.join(target_dir, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove old inline scripts for menuToggle just in case
    # because they might conflict with main.js or be wrong (using 'active' instead of 'open')
    inline_script_pattern = r"<script>\s*document\.getElementById\('menuToggle'\)\.addEventListener\('click', function\(\) \{\s*document\.getElementById\('mainNav'\)\.classList\.toggle\('active'\);\s*\}\);\s*</script>"
    content = re.sub(inline_script_pattern, '', content)

    # Check if js/main.js is included
    if 'js/main.js' not in content:
        # Check if 'js/main.js' was missing and add it right before </body>
        content = content.replace('</body>', '    <script src="js/main.js"></script>\n</body>')
        
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Fixed {f}")
        
    # Copy to static dir
    static_path = os.path.join(static_dir, f)
    if os.path.exists(static_dir):
        with open(static_path, 'w', encoding='utf-8') as static_file:
            static_file.write(content)

print("Menu fix complete.")
