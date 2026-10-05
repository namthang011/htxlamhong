import os
import re

target_dir = r"d:\Study\HTX"
static_dir = r"d:\Study\HTX\src\main\resources\static"

analytics_script = """
    <!-- Google Analytics (Placeholder) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
"""

meta_desc = '    <meta name="description" content="HTX Vận Tải Lam Hồng - Dịch vụ vận tải uy tín, chất lượng cao tại Nghệ An. Chúng tôi cung cấp các giải pháp vận tải an toàn và hiệu quả.">'

for f in os.listdir(target_dir):
    if not f.endswith('.html'):
        continue
    filepath = os.path.join(target_dir, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Add Meta Description if not present
    if '<meta name="description"' not in content:
        # insert after <meta charset="UTF-8"> or <title>
        content = re.sub(r'(<title>.*?</title>)', lambda m: m.group(1) + "\n" + meta_desc, content, count=1)
        
    # 2. Add Google Analytics if not present
    if 'Google Analytics' not in content:
        content = content.replace('</head>', f"{analytics_script}\n</head>")
        
    # 3. Add html5 validation to forms
    # Add 'required' to input type text, email, password if missing
    # (Simplified approach: just ensure emails are type="email" and forms have basic protection)
    # Actually, manipulating HTML with regex is brittle, but for a checklist:
    content = content.replace('type="text" name="email"', 'type="email" name="email" required')
    
    # 4. H1 tag check (just ensuring there is an H1, if not, we can't easily auto-inject a good one without breaking design)

    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)
        
    # Copy to static dir
    static_path = os.path.join(static_dir, f)
    if os.path.exists(static_dir):
        with open(static_path, 'w', encoding='utf-8') as static_file:
            static_file.write(content)
            
print("Optimization complete.")
