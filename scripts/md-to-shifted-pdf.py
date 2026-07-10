"""Convert ShiftED markdown docs to branded PDFs (repo theme colors)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

SHIFTED_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

@page {
  size: A4;
  margin: 22mm 18mm 24mm 18mm;
  @bottom-center {
    content: "ShiftED AI";
    font-family: 'Public Sans', Inter, sans-serif;
    font-size: 9px;
    color: #a16ae8;
  }
}

* { box-sizing: border-box; }

body {
  font-family: 'Public Sans', 'Inter', system-ui, sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #2a2438;
  background: #f8f6f6;
  margin: 0;
  padding: 0;
}

.header-bar {
  background: linear-gradient(135deg, #7c6cf3 0%, #a16ae8 50%, #c770d6 100%);
  color: #fff;
  padding: 28px 32px 24px;
  margin: -22mm -18mm 24px -18mm;
  width: calc(100% + 36mm);
}

.header-bar h1.doc-title {
  margin: 0;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #fff;
  border: none;
  padding: 0;
}

.header-bar .meta {
  margin-top: 10px;
  font-size: 9.5pt;
  opacity: 0.92;
  font-weight: 400;
}

.content {
  padding: 0 4px;
}

h1, h2, h3, h4 {
  font-family: 'Public Sans', Inter, sans-serif;
  color: #3d2f5c;
  font-weight: 600;
  letter-spacing: -0.01em;
}

h1 {
  font-size: 18pt;
  margin-top: 1.4em;
  padding-bottom: 6px;
  border-bottom: 2px solid #e8dff5;
}

h2 {
  font-size: 13.5pt;
  margin-top: 1.3em;
  color: #5c3d8f;
  border-left: 4px solid #a16ae8;
  padding-left: 10px;
}

h3 {
  font-size: 11.5pt;
  margin-top: 1.1em;
  color: #6b4fa8;
}

h4 { font-size: 10.5pt; color: #7c6cf3; }

p { margin: 0.65em 0; }

a {
  color: #7c6cf3;
  text-decoration: none;
  border-bottom: 1px solid #d4c4f0;
}

ul, ol {
  margin: 0.5em 0;
  padding-left: 1.4em;
}

li { margin: 0.25em 0; }

li::marker { color: #a16ae8; }

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 9.5pt;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgb(124 108 243 / 0.08);
}

thead {
  background: linear-gradient(135deg, #7c6cf3 0%, #a16ae8 100%);
  color: #fff;
}

th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  border: none;
}

td {
  padding: 8px 12px;
  border-bottom: 1px solid #ebe6f2;
  vertical-align: top;
}

tr:nth-child(even) td { background: #faf8fc; }

code {
  font-family: 'Consolas', 'Cascadia Code', monospace;
  font-size: 9pt;
  background: #f0eaf8;
  color: #5c3d8f;
  padding: 2px 6px;
  border-radius: 4px;
}

pre {
  background: #2a2438;
  color: #f0eaf8;
  padding: 14px 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 8.5pt;
  line-height: 1.45;
  border-left: 4px solid #a16ae8;
}

pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

blockquote {
  margin: 1em 0;
  padding: 12px 16px;
  background: #f0eaf8;
  border-left: 4px solid #c770d6;
  border-radius: 0 8px 8px 0;
  color: #4a3d62;
}

hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d4c4f0, transparent);
  margin: 1.5em 0;
}

strong { color: #3d2f5c; font-weight: 600; }

/* Status emoji in tables — keep readable */
td:first-child { white-space: nowrap; }
"""

HTML_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>{title}</title>
  <style>{css}</style>
</head>
<body>
  <div class="header-bar">
    <h1 class="doc-title">{title}</h1>
    <div class="meta">ShiftED AI · Empathy training for managers · {filename}</div>
  </div>
  <div class="content">
    {body}
  </div>
</body>
</html>
"""


def extract_title(md_text: str, fallback: str) -> str:
    for line in md_text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def md_to_html(md_text: str) -> str:
    return markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )


def convert_file(md_path: Path, out_dir: Path) -> Path:
    md_text = md_path.read_text(encoding="utf-8")
    title = extract_title(md_text, md_path.stem.replace("-", " ").title())
    body = md_to_html(md_text)
    html = HTML_SHELL.format(
        title=title,
        filename=md_path.name,
        css=SHIFTED_CSS,
        body=body,
    )
    pdf_path = out_dir / f"{md_path.stem}.pdf"
    html_path = out_dir / f"{md_path.stem}.html"

    html_path.write_text(html, encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(html_path.as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        browser.close()

    html_path.unlink(missing_ok=True)
    return pdf_path


def main() -> int:
    if len(sys.argv) > 1:
        files = [Path(f) for f in sys.argv[1:]]
    else:
        files = [
            DOCS / "KNOWLEDGE-BASE-PROTOCOL.md",
            DOCS / "SUPER-PROMPT-GOAL-ESTABLISHMENT.md",
            DOCS / "SUPER-PROMPT-MIRRORING-AND-TONALITY.md",
            DOCS / "FEATURE-BACKLOG-AND-TIMELINE.md",
        ]

    out_dir = DOCS
    for md_path in files:
        if not md_path.exists():
            print(f"SKIP (missing): {md_path}")
            continue
        pdf = convert_file(md_path, out_dir)
        print(f"OK: {pdf}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
