import re
path = r"d:\Study\HTX\src\main\resources\static\admin.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the inputs
content = re.sub(r'<input type="text" id="srv-img" class="form-control" [^>]*>', 
"""<input type="file" id="srv-img-file" class="form-control" accept="image/*" onchange="encodeImageFileAsURL(this, 'srv-img', 'srv-img-preview')">
<input type="hidden" id="srv-img">
<img id="srv-img-preview" src="" style="max-height: 100px; margin-top: 10px; display: none;">""", content)

content = re.sub(r'<input type="text" id="post-img" class="form-control" [^>]*>', 
"""<input type="file" id="post-img-file" class="form-control" accept="image/*" onchange="encodeImageFileAsURL(this, 'post-img', 'post-img-preview')">
<input type="hidden" id="post-img">
<img id="post-img-preview" src="" style="max-height: 100px; margin-top: 10px; display: none;">""", content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed inputs!")
