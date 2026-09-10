"""Vendor pinned, integrity-checked Hanzi Writer resources; no npm/build needed."""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'web' / 'hanzi'
PACKAGES = {
    'writer': ('hanzi-writer', '3.7.3', 'fdOFrb1cXWL/pV/oplJkcdziCvjJzhhf+qoIBm5IpVGxPBZEu4eLB6ZG5RJDbKXyNbNlyx8oIpa3XrcUBcSXpg=='),
    'data': ('hanzi-writer-data', '2.0.1', 'nbQwM+MaryGoq7pBMIZLCd3lFq03nXuJuwku1+6UbjL58uU+9OULVcMkoNvNuJSoIV7f1bbPRfD4D/LQa5S7qg=='),
}


def archive(key, cache):
    name, version, integrity = PACKAGES[key]
    cached = cache / (key + '.tgz') if cache else None
    url = f'https://registry.npmjs.org/{name}/-/{name}-{version}.tgz'
    raw = cached.read_bytes() if cached and cached.exists() else urllib.request.urlopen(url, timeout=60).read()
    if base64.b64encode(hashlib.sha512(raw).digest()).decode() != integrity:
        raise ValueError(f'Integrity check failed: {name}')
    return tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz')


def write(relative, data):
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data if isinstance(data, bytes) else data.encode('utf-8'))


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, help='Optional directory with writer.tgz and data.tgz')
    args = parser.parse_args()
    with archive('writer', args.cache) as bundle:
        write('vendor/hanzi-writer.min.js', bundle.extractfile('package/dist/hanzi-writer.min.js').read())
        write('licenses/HANZI-WRITER-LICENSE.txt', bundle.extractfile('package/LICENSE').read())
        write('licenses/HANZI-WRITER-COPYING.md', bundle.extractfile('package/COPYING.md').read())
    buckets = {}
    with archive('data', args.cache) as bundle:
        write('licenses/ARPHICPL.TXT', bundle.extractfile('package/ARPHICPL.TXT').read())
        for member in bundle.getmembers():
            name = Path(member.name)
            if not member.isfile() or name.parent.as_posix() != 'package' or name.suffix != '.json' or len(name.stem) != 1:
                continue
            char = name.stem
            data = json.load(bundle.extractfile(member))
            if len(data['strokes']) != len(data['medians']) or not data['strokes']:
                raise ValueError(f'Invalid stroke data: {char}')
            bucket = format(ord(char) >> 8, 'x')
            buckets.setdefault(bucket, {})[char] = data
    chars = []
    for bucket, data in sorted(buckets.items()):
        data = dict(sorted(data.items()))
        chars.extend(data)
        # Keep local file:// loading possible without fetching JSON across opaque origins.
        # The converted data remains under APL, with a modification notice in every file.
        notice = '// Copyright (C) 1999 Arphic Technology Co., Ltd. ARPHIC PUBLIC LICENSE; see ../licenses/ARPHICPL.TXT.\n'
        notice += '// Converted from hanzi-writer-data 2.0.1 JSON to grouped JavaScript on 2026-09-10; stroke geometry unchanged.\n'
        write(f'data/{bucket}.js', notice + 'Object.assign(window.HanziStrokeData,' + compact(data) + ');\n')
    catalog = {'version': PACKAGES['data'][1], 'count': len(chars), 'characters': ''.join(sorted(chars))}
    write('catalog.js', 'window.HanziCatalog=' + compact(catalog) + ';\n')
    provenance = {key: {'name': name, 'version': version, 'integrity': 'sha512-' + integrity}
                  for key, (name, version, integrity) in PACKAGES.items()}
    provenance.update(characterCount=len(chars), shardCount=len(buckets), convertedOn='2026-09-10')
    write('provenance.json', json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(f'Vendored {len(chars)} characters in {len(buckets)} local shards.')
    print(f'Bytes: {sum(p.stat().st_size for p in DEST.rglob("*") if p.is_file()):,}')


if __name__ == '__main__':
    main()
