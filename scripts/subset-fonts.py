"""Bundle the game's fonts so the app and the offline PWA never need Google Fonts.

Downloads the TTFs from Google Fonts and keeps only the glyphs index.html uses
(plus printable ASCII), writing small WOFF2 files to fonts/. Rerun after adding
new text to the game:  pip install fonttools brotli && python3 scripts/subset-fonts.py
"""
import io, pathlib, re, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = ('https://fonts.googleapis.com/css2?family=Dela+Gothic+One'
       '&family=IBM+Plex+Mono:wght@500;600&family=M+PLUS+Rounded+1c:wght@500;800')
FILES = {('Dela Gothic One', '400'): 'dela-gothic-one.woff2',
         ('IBM Plex Mono', '500'): 'ibm-plex-mono-500.woff2',
         ('IBM Plex Mono', '600'): 'ibm-plex-mono-600.woff2',
         ('M PLUS Rounded 1c', '500'): 'm-plus-rounded-1c-500.woff2',
         ('M PLUS Rounded 1c', '800'): 'm-plus-rounded-1c-800.woff2'}

def get(url):
    # an old user agent makes Google Fonts answer with one whole TTF per face
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/4.0'})).read()

text = (ROOT / 'index.html').read_text(encoding='utf-8')
chars = {c for c in text if ord(c) > 0x7e} | {chr(c) for c in range(0x20, 0x7f)}
chars |= set('０１２３４５６７８９')
out = ROOT / 'fonts'
out.mkdir(exist_ok=True)
for block in re.findall(r'@font-face\s*{(.*?)}', get(CSS).decode(), re.S):
    family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    weight = re.search(r'font-weight:\s*(\d+)', block).group(1)
    font = TTFont(io.BytesIO(get(re.search(r'url\((.*?)\)', block).group(1))))
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']
    sub = subset.Subsetter(opts); sub.populate(text=''.join(sorted(chars))); sub.subset(font)
    path = out / FILES[(family, weight)]
    font.flavor = 'woff2'; font.save(path)
    print(f'{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB')
