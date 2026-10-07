"""Build the standalone cPanel frontend from the canonical Spring static files."""

from pathlib import Path
from tempfile import TemporaryDirectory
import shutil

ROOT = Path(__file__).resolve().parents[1]
WEB_SOURCE = ROOT / "src" / "main" / "resources" / "static"
CPANEL_CONFIG = ROOT / "deploy" / "cpanel"
OUTPUT_DIR = ROOT / "dist"
ARCHIVE_BASE = OUTPUT_DIR / "lamhong-frontend-cpanel"


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    ARCHIVE_BASE.with_suffix(".zip").unlink(missing_ok=True)

    with TemporaryDirectory() as temporary_directory:
        staging = Path(temporary_directory) / "site"
        shutil.copytree(WEB_SOURCE, staging)
        shutil.copy2(CPANEL_CONFIG / ".htaccess", staging / ".htaccess")
        shutil.copy2(CPANEL_CONFIG / "config.js", staging / "config.js")
        shutil.make_archive(str(ARCHIVE_BASE), "zip", staging)

    print(f"Created {ARCHIVE_BASE.with_suffix('.zip')}")


if __name__ == "__main__":
    main()
