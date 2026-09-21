
import re

# Fix index.html
path = r"d:\Study\HTX\src\main\resources\static\index.html"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = content.replace("<a href=\"tin-tuc.html\">Xem thêm ?</a>", "<a href=\"chi-tiet-tin-tuc.html?id=${item.id}\">Xem thêm ?</a>")
with open(path, "w", encoding="utf-8") as f: f.write(content)

# Fix tin-tuc.html
path2 = r"d:\Study\HTX\src\main\resources\static\tin-tuc.html"
with open(path2, "r", encoding="utf-8") as f: content2 = f.read()
content2 = content2.replace("<a href=\"#\" class=\"btn-detail\">Ð?c ti?p</a>", "<a href=\"chi-tiet-tin-tuc.html?id=${item.id}\" class=\"btn-detail\">Ð?c ti?p</a>")
with open(path2, "w", encoding="utf-8") as f: f.write(content2)

print("Links fixed!")

