
import re
path = r"d:\Study\HTX\src\main\resources\static\admin.html"
with open(path, "r", encoding="utf-8") as f: content = f.read()
content = content.replace("S-a", "S?a")
content = content.replace("XA3a", "Xóa")
content = content.replace("LiAn h", "Liên h?")
content = content.replace("ThAm D<ch V \nM>i", "Thêm D?ch V? M?i")
content = content.replace("ThAm D<ch V M>i", "Thêm D?ch V? M?i")
content = content.replace("Qun lA D<ch v", "Qu?n lý D?ch v?")
content = content.replace("TAn d<ch v", "Tên d?ch v?")
content = content.replace("GiA", "Giá")
content = content.replace("Trng thAi", "Tr?ng thái")
content = content.replace("HAnh `Tng", "Hành d?ng")
content = content.replace("nh", "?nh")
with open(path, "w", encoding="utf-8") as f: f.write(content)

