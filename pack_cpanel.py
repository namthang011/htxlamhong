import os
import zipfile
import glob

zip_filename = 'lamhong_frontend_cpanel.zip'
target_dir = r"d:\Study\HTX"

# Items to include in the zip
includes = [
    'css',
    'js',
    'static',
    'config.js',
    '.htaccess',
    'robots.txt',
    'sitemap.xml'
]

# also include all .html files
html_files = glob.glob(os.path.join(target_dir, '*.html'))

with zipfile.ZipFile(os.path.join(target_dir, zip_filename), 'w', zipfile.ZIP_DEFLATED) as zipf:
    # Add files
    for item in includes:
        path = os.path.join(target_dir, item)
        if os.path.exists(path):
            if os.path.isdir(path):
                for root, dirs, files in os.walk(path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, target_dir)
                        zipf.write(file_path, arcname)
            else:
                zipf.write(path, item)
                
    # Add html files
    for html_file in html_files:
        zipf.write(html_file, os.path.basename(html_file))

print(f"Successfully created {zip_filename}")
