"""
Backs up everything visitors can see from the current Supabase project:
  - backup/data.json          all rows (categories, occasions, products, images, faqs, settings)
  - backup/restore.sql         the same rows as SQL, ready for the new project's SQL Editor
  - backup/media/<path>        every uploaded image

Run:  python tools/backup.py
(Hidden products/categories are not visible with the public key, so they can't be backed up this way.)
"""
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
cfg = (ROOT / 'js' / 'config.js').read_text(encoding='utf-8')
URL = re.search(r"SUPABASE_URL = '([^']+)'", cfg).group(1)
KEY = re.search(r"SUPABASE_KEY = '([^']+)'", cfg).group(1)
OUT = ROOT / 'backup'

# order matters for restoring (parents first)
TABLES = ['settings', 'categories', 'occasions', 'faqs', 'products', 'product_images', 'product_occasions']


def get(path, raw=False, timeout=120):
    req = urllib.request.Request(path if path.startswith('http') else f'{URL}/rest/v1/{path}', headers={'apikey': KEY})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = r.read()
    return data if raw else json.loads(data)


def sql_value(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    OUT.mkdir(exist_ok=True)
    data = {}
    for t in TABLES:
        try:
            data[t] = get(f'{t}?select=*')
            print(f'{t}: {len(data[t])} rows')
        except Exception as e:  # table may not exist yet (e.g. faqs before migration-01)
            print(f'{t}: skipped ({e})')
            data[t] = []
    (OUT / 'data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

    lines = ['-- Marlen Sweets data restore. Run AFTER schema.sql, migration-01.sql and migration-02.sql.', 'begin;']
    for t in TABLES:
        rows = data[t]
        if not rows:
            continue
        if t == 'settings':
            # the settings row already exists in a fresh project → overwrite its values
            for r in rows:
                sets = ', '.join(f'{k} = {sql_value(v)}' for k, v in r.items() if k not in ('id', 'updated_at'))
                lines.append(f'update public.settings set {sets} where id = 1;')
            continue
        cols = list(rows[0].keys())
        lines.append(f'insert into public.{t} ({", ".join(cols)}) values')
        lines.append(',\n'.join('  (' + ', '.join(sql_value(r.get(c)) for c in cols) + ')' for r in rows))
        lines.append('on conflict do nothing;')
    lines.append('commit;')
    (OUT / 'restore.sql').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('wrote backup/restore.sql')

    # images
    paths = {r['path'] for r in data['product_images']}
    paths |= {r.get('image_path') for t in ('categories', 'occasions') for r in data[t]}
    paths |= {r.get('hero_image_path') for r in data['settings']}
    paths = sorted(p for p in paths if p)
    for p in paths:
        dest = OUT / 'media' / p
        if dest.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        src = f'{URL}/storage/v1/object/public/media/' + '/'.join(urllib.parse.quote(s) for s in p.split('/'))
        try:
            dest.write_bytes(get(src, raw=True, timeout=300))
            print('image ok', p)
        except Exception as e:
            print('image FAILED', p, e)
    print(f'done: {len(paths)} images')


if __name__ == '__main__':
    main()
