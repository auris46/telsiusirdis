#!/usr/bin/env python3
"""Sujungia „Apsaugą“ į vieną HTML failą (peržiūrai, dalinimuisi ar Artifact puslapiui).

Naudojimas:  python3 apsauga/tools/build-single.py [išvesties_failas] [--demo] [--fragment]
  --demo      atidarius iškart parodomas pavyzdinis rezultatas
  --fragment  be <!doctype>/<html>/<head>/<body> (kai talpinimo sistema prideda juos pati)
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
demo = '--demo' in sys.argv
fragment = '--fragment' in sys.argv
out = pathlib.Path(args[0]) if args else ROOT / 'dist' / 'apsauga.html'

html = (ROOT / 'index.html').read_text(encoding='utf-8')


def js(path):
    code = (ROOT / path).read_text(encoding='utf-8')
    if '</script' in code.lower():
        code = re.sub(r'</script', r'<\\/script', code, flags=re.I)
    return code


def inline(match):
    src = match.group(1)
    return '<script>\n' + js(src) + '\n</script>'


# Programėlės failai įterpiami tiesiai; QR biblioteka – prieš app.js, kad nereikėtų jos krauti atskirai
html = html.replace('<script src="app.js"></script>',
                    '<script src="vendor/jsQR.js"></script>\n' +
                    ('<script>window.APSAUGA_DEMO = true;</script>\n' if demo else '') +
                    '<script src="app.js"></script>')
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)

# Vieno failo versijai nereikalingi: PWA manifestas, ikonų failai, CSP (taiko talpinimo sistema)
html = re.sub(r'\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>', '', html)
html = re.sub(r'\s*<meta http-equiv="Content-Security-Policy"[^>]*>', '', html)

if fragment:
    html = re.sub(r'<!DOCTYPE html>\s*', '', html, flags=re.I)
    html = re.sub(r'<html[^>]*>\s*', '', html)
    html = re.sub(r'</?head>\s*', '', html)
    html = re.sub(r'<meta charset="utf-8">\s*', '', html)
    html = re.sub(r'<meta name="viewport"[^>]*>\s*', '', html)
    html = html.replace('<body>', '').replace('</body>', '').replace('</html>', '')
    html = re.sub(r'<title>[^<]*</title>', '<meta name="claude:viewport-fit-sides" content="cover">\n<title>Apsauga</title>', html, count=1)

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out} ({len(html) // 1024} KB)')
