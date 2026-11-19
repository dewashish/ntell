#!/usr/bin/env python3
"""Bundle the prototype into one self-contained HTML file (styles, scripts and
fonts inlined) so it can be e-mailed or opened from a laptop with no server.

    python3 tools/bundle.py out/regulatory-data-hub.html
"""
import base64, os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, "regulatory-data-hub.single.html")

def read(rel, mode="r"):
    with open(os.path.join(root, rel), mode, **({} if "b" in mode else {"encoding": "utf-8"})) as fh:
        return fh.read()

html = read("index.html")
css = read("css/app.css")

def font(m):
    data = base64.b64encode(read("assets/fonts/" + m.group(1), "rb")).decode()
    return 'url("data:font/woff2;base64,%s")' % data

css = re.sub(r'url\("\.\./assets/fonts/([^"]+)"\)', font, css)
html = re.sub(r'\s*<link rel="preload"[^>]+>', "", html)
html = html.replace('<link rel="stylesheet" href="css/app.css">', "<style>\n" + css + "\n</style>")
html = re.sub(r'<script src="(js/[^"]+)"></script>',
              lambda m: "<script>\n" + read(m.group(1)).replace("</script", "<\\/script") + "\n</script>", html)

os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
with open(out, "w", encoding="utf-8") as fh:
    fh.write(html)
print("wrote %s (%.0f kB)" % (out, os.path.getsize(out) / 1024))
