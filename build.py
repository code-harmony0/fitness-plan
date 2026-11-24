#!/usr/bin/env python3
"""Inline style.css and the two woff2 fonts into src/index.template.html -> index.html (single offline file)."""
import base64, pathlib
root = pathlib.Path(__file__).parent
css = (root / "src/style.css").read_text()
for token, f in (("@@BUNGEE@@", "Bungee.woff2"), ("@@JBMONO@@", "JetBrainsMono.woff2")):
    css = css.replace(token, base64.b64encode((root / "src/fonts" / f).read_bytes()).decode())
t = (root / "src/index.template.html").read_text().replace("@@STYLE@@", css)
(root / "index.html").write_text(t)
print("index.html", round(len(t) / 1024), "KB")
