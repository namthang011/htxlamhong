"""Package local uploaded images separately; never include private config files."""
from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]

def main():
    source = ROOT / 'data' / 'uploads'
    images = sorted(p for p in source.glob('*') if p.is_file() and re.fullmatch(r'[a-f0-9]{64}\.(png|jpg|webp)', p.name))
    output = ROOT / 'dist' / 'htxlamhong-existing-uploads.zip'
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        archive.write(ROOT / 'deploy/cpanel/uploads/.htaccess', 'uploads/.htaccess')
        for image in images:
            archive.write(image, 'uploads/' + image.name)
    print(f'Packaged {len(images)} local images: {output}')

if __name__ == '__main__':
    main()
