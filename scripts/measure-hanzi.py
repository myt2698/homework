"""Measure packaged lookup resources; does not build an Android application."""
import io
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1] / 'web' / 'hanzi'
files = sorted(path for path in root.rglob('*') if path.is_file())
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.writestr('assets/' + path.relative_to(root).as_posix(), path.read_bytes())
raw = sum(path.stat().st_size for path in files)
compressed = len(buffer.getvalue())
print(json.dumps({
    'resourceFiles': len(files), 'rawBytes': raw, 'zipDeflateBytes': compressed,
    'rawMB': round(raw / 1_000_000, 2), 'compressedMB': round(compressed / 1_000_000, 2),
    'note': 'Resource-only ZIP estimate; no APK has been built.'
}, ensure_ascii=False, indent=2))
