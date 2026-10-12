"""Busca y baja fotos libres de Wikimedia Commons para la app.

  python fotos.py buscar   -> hojas de contacto numeradas en candidatas/ (para elegir)
  python fotos.py bajar    -> baja las elegidas (elegidas.json) a img/fotos/ y escribe los créditos

Solo acepta licencias libres (dominio público, CC0, CC BY y CC BY-SA).
"""
import io, json, os, re, sys, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
API = 'https://commons.wikimedia.org/w/api.php'
UA = {'User-Agent': 'GenomaLAB/1.0 (feria de ciencias; https://github.com/daniechev/Genoma-LAB-)'}
LIBRE = re.compile(r'^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)', re.I)


def pedir(params):
    url = API + '?' + urllib.parse.urlencode({**params, 'format': 'json'})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def bajar_bytes(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


def texto(html):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html or '')).strip()


def info(titulos=None, busqueda=None, ancho=1600):
    params = {
        'action': 'query',
        'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size|mime',
        'iiurlwidth': ancho,
    }
    if titulos:
        params['titles'] = '|'.join(titulos)
    else:
        params.update(
            generator='search',
            gsrsearch=busqueda + ' filetype:bitmap',
            gsrnamespace=6,
            gsrlimit=40,
        )
    paginas = pedir(params).get('query', {}).get('pages', {}).values()
    salida = []
    for p in sorted(paginas, key=lambda p: p.get('index', 0)):
        ii = (p.get('imageinfo') or [{}])[0]
        meta = ii.get('extmetadata', {})
        licencia = texto(meta.get('LicenseShortName', {}).get('value'))
        if not LIBRE.match(licencia) or ii.get('mime') not in ('image/jpeg', 'image/png'):
            continue
        if min(ii.get('width', 0), ii.get('height', 0)) < 700:
            continue
        salida.append(
            {
                'titulo': p['title'],
                'url': ii.get('thumburl') or ii['url'],
                'pagina': ii.get('descriptionurl'),
                'licencia': licencia,
                'autor': texto(meta.get('Artist', {}).get('value'))[:120],
            }
        )
    return salida


def buscar():
    temas = json.load(open(os.path.join(AQUI, 'buscar.json')))
    carpeta = os.path.join(AQUI, 'candidatas')
    os.makedirs(carpeta, exist_ok=True)
    todo = {}
    for tema, busqueda in temas.items():
        fotos = info(busqueda=busqueda, ancho=400)[:12]
        todo[tema] = fotos
        hoja = Image.new('RGB', (4 * 300, 3 * 230), '#111')
        dibujo = ImageDraw.Draw(hoja)
        for i, f in enumerate(fotos):
            try:
                im = Image.open(io.BytesIO(bajar_bytes(f['url']))).convert('RGB')
            except Exception as e:  # una foto que no baja no frena las demás
                print('no se pudo bajar', f['titulo'], e)
                continue
            im.thumbnail((290, 200))
            x, y = (i % 4) * 300 + 5, (i // 4) * 230 + 5
            hoja.paste(im, (x, y))
            dibujo.rectangle([x, y, x + 34, y + 26], fill='#ffd447')
            dibujo.text((x + 8, y + 5), str(i + 1), fill='#000', font=ImageFont.load_default(18))
            dibujo.text((x, y + 204), f['licencia'][:40], fill='#ccc', font=ImageFont.load_default(13))
        hoja.save(os.path.join(carpeta, f'{tema}.jpg'), quality=78)
        print(tema, len(fotos))
    json.dump(todo, open(os.path.join(carpeta, 'candidatas.json'), 'w'), ensure_ascii=False, indent=1)


def bajar():
    elegidas = json.load(open(os.path.join(AQUI, 'elegidas.json')))
    destino = os.path.join(RAIZ, 'img', 'fotos')
    os.makedirs(destino, exist_ok=True)
    creditos = {}
    for nombre, titulo in elegidas.items():
        datos = info(titulos=[titulo], ancho=1600)
        if not datos:
            sys.exit(f'{titulo}: no se encontró o no tiene licencia libre')
        f = datos[0]
        im = Image.open(io.BytesIO(bajar_bytes(f['url']))).convert('RGB')
        im.thumbnail((1400, 1400))
        im.save(os.path.join(destino, f'{nombre}.webp'), quality=72, method=6)
        creditos[nombre] = {k: f[k] for k in ('titulo', 'pagina', 'licencia', 'autor')}
        print(nombre, im.size, f['licencia'])
    json.dump(creditos, open(os.path.join(destino, 'creditos.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    {'buscar': buscar, 'bajar': bajar}[sys.argv[1]]()
