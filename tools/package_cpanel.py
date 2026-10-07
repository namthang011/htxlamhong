"""Build the standalone cPanel frontend from the canonical Spring static files."""

from pathlib import Path
from tempfile import TemporaryDirectory
import shutil
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
WEB_SOURCE = ROOT / "src" / "main" / "resources" / "static"
CPANEL_CONFIG = ROOT / "deploy" / "cpanel"
OUTPUT_DIR = ROOT / "dist"
ARCHIVE_BASE = OUTPUT_DIR / "htxlamhong-public-html"

REQUIRED_ROOT_FILES = {
    ".htaccess",
    "index.html",
    "dich-vu.html",
    "tin-tuc.html",
    "chi-tiet-dich-vu.html",
    "chi-tiet-tin-tuc.html",
    "admin.html",
    "config.js",
    "404.html",
    "500.html",
}


def validate_archive(archive_path: Path) -> None:
    """Ensure extraction places the website directly in cPanel's Document Root."""
    with ZipFile(archive_path) as archive:
        entries = {name.rstrip("/") for name in archive.namelist()}

    missing = sorted(REQUIRED_ROOT_FILES - entries)
    if missing:
        raise RuntimeError(f"Archive is missing root files: {', '.join(missing)}")

    nested_roots = ("site/", "static/", "public_html/", "deploy/")
    if any(name.startswith(nested_roots) for name in entries):
        raise RuntimeError("Archive contains an unwanted parent directory")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    ARCHIVE_BASE.with_suffix(".zip").unlink(missing_ok=True)

    with TemporaryDirectory() as temporary_directory:
        staging = Path(temporary_directory) / "site"
        shutil.copytree(WEB_SOURCE, staging)
        shutil.copy2(CPANEL_CONFIG / ".htaccess", staging / ".htaccess")
        shutil.copy2(CPANEL_CONFIG / "config.js", staging / "config.js")
        archive_path = Path(shutil.make_archive(str(ARCHIVE_BASE), "zip", staging))

    validate_archive(archive_path)

    print(f"Created cPanel-ready archive: {archive_path}")
    print("Upload it into the domain Document Root and extract it there.")


if __name__ == "__main__":
    main()
