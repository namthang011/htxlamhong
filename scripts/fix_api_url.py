import os
import re

base_dir = r"d:\Study\HTX\src\main\resources\static"
html_files = [f for f in os.listdir(base_dir) if f.endswith(".html")]

config_content = "const API_BASE_URL = \"\"; // De trong khi chay Local, doi thanh https://domain-backend.com khi dua len mang\n"
with open(os.path.join(base_dir, "config.js"), "w", encoding="utf-8") as f:
    f.write(config_content)

for file in html_files:
    path = os.path.join(base_dir, file)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "config.js" not in content:
        # Just insert it right before the closing body tag
        content = content.replace("</body>", '    <script src="config.js"></script>\n</body>')

    # Replace fetch("/api/...) with fetch(API_BASE_URL + "/api/...)
    content = re.sub(r'fetch\(\s*[\'"]/api/([^\'"]+)[\'"]', r'fetch(API_BASE_URL + "/api/\1"', content)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated API URLs!")
