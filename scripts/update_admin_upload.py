path = r"d:\Study\HTX\src\main\resources\static\admin.html"
with open(path, "r", encoding="utf-8") as f: content = f.read()

srv_img_regex = r'<input type="text" id="srv-img" class="form-control">'
srv_img_new = """<input type="file" id="srv-img-file" class="form-control" accept="image/*" onchange="encodeImageFileAsURL(this, 'srv-img', 'srv-img-preview')">
<input type="hidden" id="srv-img">
<img id="srv-img-preview" src="" style="max-height: 100px; margin-top: 10px; display: none;">"""
content = content.replace(srv_img_regex, srv_img_new)

post_img_regex = r'<input type="text" id="post-img" class="form-control">'
post_img_new = """<input type="file" id="post-img-file" class="form-control" accept="image/*" onchange="encodeImageFileAsURL(this, 'post-img', 'post-img-preview')">
<input type="hidden" id="post-img">
<img id="post-img-preview" src="" style="max-height: 100px; margin-top: 10px; display: none;">"""
content = content.replace(post_img_regex, post_img_new)

js_func = """function encodeImageFileAsURL(element, hiddenId, previewId) {
    let file = element.files[0];
    let reader = new FileReader();
    reader.onloadend = function() {
        document.getElementById(hiddenId).value = reader.result;
        let preview = document.getElementById(previewId);
        preview.src = reader.result;
        preview.style.display = 'block';
    }
    if (file) { reader.readAsDataURL(file); }
}
"""
content = content.replace("function generateSlug", js_func + "\n        function generateSlug")

content = content.replace('document.getElementById("srv-img").value = "static/logo.png";', 'document.getElementById("srv-img").value = "static/logo.png"; document.getElementById("srv-img-preview").style.display = "none"; document.getElementById("srv-img-file").value = "";')
content = content.replace('document.getElementById("srv-img").value = s.imageUrl || "";', 'document.getElementById("srv-img").value = s.imageUrl || ""; document.getElementById("srv-img-preview").src = s.imageUrl || ""; document.getElementById("srv-img-preview").style.display = "block";')

content = content.replace('document.getElementById("post-img").value = "static/logo.png";', 'document.getElementById("post-img").value = "static/logo.png"; document.getElementById("post-img-preview").style.display = "none"; document.getElementById("post-img-file").value = "";')
content = content.replace('document.getElementById("post-img").value = p.thumbnailUrl || "";', 'document.getElementById("post-img").value = p.thumbnailUrl || ""; document.getElementById("post-img-preview").src = p.thumbnailUrl || ""; document.getElementById("post-img-preview").style.display = "block";')

with open(path, "w", encoding="utf-8") as f: f.write(content)
print("Updated admin.html for image uploads!")
