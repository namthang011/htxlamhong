"""Validate local asset references in the static frontend."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1] / "src" / "main" / "resources" / "static"
REFERENCE = re.compile(r"(?:src|href)=[\"']([^\"'#?]+)|url\([\"']?([^\"')]+)")
IGNORED_PREFIXES = ("http:", "https:", "tel:", "mailto:", "data:", "/api/")


def main() -> None:
    missing: list[tuple[str, str]] = []
    sources = [*ROOT.rglob("*.html"), *ROOT.rglob("*.css")]

    for source in sources:
        for match in REFERENCE.finditer(source.read_text(encoding="utf-8")):
            reference = match.group(1) or match.group(2)
            if reference.startswith(IGNORED_PREFIXES) or "${" in reference:
                continue
            target = ROOT / reference.lstrip("/") if reference.startswith("/") else source.parent / reference
            route_target = target.with_suffix(".html") if not target.suffix else target
            if not target.resolve().exists() and not route_target.resolve().exists():
                missing.append((str(source.relative_to(ROOT)), reference))

    if missing:
        for source, reference in missing:
            print(f"{source}: missing {reference}")
        raise SystemExit(1)

    print(f"Validated {len(sources)} frontend files; all local references exist.")


if __name__ == "__main__":
    main()
