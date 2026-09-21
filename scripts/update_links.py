import re

# Update dich-vu.html
path1 = r"d:\Study\HTX\src\main\resources\static\dich-vu.html"
with open(path1, "r", encoding="utf-8") as f:
    c1 = f.read()

c1 = re.sub(
    r'<a href="#" class="btn btn-primary"[^>]*>Xem chi ti[^<]*</a>',
    r'<a href="chi-tiet-dich-vu.html?id=${item.id}" class="btn btn-primary">Xem chi tiết</a>',
    c1
)

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)

# Update index.html
path2 = r"d:\Study\HTX\src\main\resources\static\index.html"
with open(path2, "r", encoding="utf-8") as f:
    c2 = f.read()

c2 = re.sub(
    r'<a href="dich-vu.html">([^<]*)<span[^>]*>[^<]*</span></a>',
    r'<a href="chi-tiet-dich-vu.html?id=${item.id}">\1 <span>&rarr;</span></a>',
    c2
)

c2 = re.sub(
    r'<a href="tin-tuc.html" class="btn btn-primary">([^<]+)</a>',
    r'<a href="chi-tiet-tin-tuc.html?id=${post.id}" class="btn btn-primary">\1</a>',
    c2
)

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)

print("Updated links!")
