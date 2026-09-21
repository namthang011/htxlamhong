import re

files = [
    r"d:\Study\HTX\src\main\resources\static\tin-tuc.html",
    r"d:\Study\HTX\src\main\resources\static\dich-vu.html"
]

for path in files:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove .btn-detail CSS
    content = re.sub(r'\.btn-detail\s*{[^}]+}', '', content)
    content = re.sub(r'\.btn-detail:hover\s*{[^}]+}', '', content)
    
    # Replace blue color with theme green
    content = content.replace("color: #0056b3;", "color: #0d5d42;")
    
    # Replace btn-detail class with btn btn-primary
    content = content.replace('class="btn-detail"', 'class="btn btn-primary"')
    
    # Also fix wrapping in CSS inline if it exists (but we added it to style.css earlier)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed colors and buttons!")
