from __future__ import annotations

import json
import mimetypes
import os
import tempfile
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import pikepdf

BASE_URL = os.getenv('AJN_BACKEND_TEST_URL', 'http://127.0.0.1:8000').rstrip('/')


def multipart(fields: dict[str, str], file_path: Path | None = None) -> tuple[bytes, str]:
    boundary = f'----AJNPDF{uuid.uuid4().hex}'
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend([
            f'--{boundary}\r\n'.encode(),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode(),
            str(value).encode(),
            b'\r\n',
        ])
    if file_path is not None:
        content_type = mimetypes.guess_type(file_path.name)[0] or 'application/pdf'
        chunks.extend([
            f'--{boundary}\r\n'.encode(),
            f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'.encode(),
            f'Content-Type: {content_type}\r\n\r\n'.encode(),
            file_path.read_bytes(),
            b'\r\n',
        ])
    chunks.append(f'--{boundary}--\r\n'.encode())
    return b''.join(chunks), boundary


def post(path: str, fields: dict[str, str], source: Path, expected_status: int = 200) -> bytes:
    body, boundary = multipart(fields, source)
    request = urllib.request.Request(
        f'{BASE_URL}{path}',
        data=body,
        method='POST',
        headers={
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'X-Request-ID': 'public-backend-acceptance',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            status = response.status
            data = response.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        data = exc.read()
    if status != expected_status:
        raise RuntimeError(f'{path} returned {status}, expected {expected_status}: {data[:500]!r}')
    return data


def main() -> None:
    with urllib.request.urlopen(f'{BASE_URL}/ready', timeout=10) as response:
        ready = json.loads(response.read())
    assert ready.get('ready') is True or ready.get('status') in {'ok', 'ready'}

    with tempfile.TemporaryDirectory(prefix='ajn-public-backend-') as directory:
        root = Path(directory)
        source = root / 'source.pdf'
        protected = root / 'protected.pdf'
        unlocked = root / 'unlocked.pdf'

        with pikepdf.new() as pdf:
            pdf.add_blank_page(page_size=(595, 842))
            pdf.docinfo['/Title'] = 'AJN PDF public backend acceptance'
            pdf.save(source)

        protected.write_bytes(post(
            '/api/pdf/protect',
            {
                'user_password': 'AJN-Test-2026',
                'owner_password': 'AJN-Owner-2026',
                'allow_printing': 'true',
                'allow_copying': 'false',
                'allow_editing': 'false',
                'allow_annotations': 'false',
                'allow_form_filling': 'true',
                'output_name': 'protected',
            },
            source,
        ))
        assert protected.read_bytes().startswith(b'%PDF-')
        try:
            pikepdf.open(protected)
            raise AssertionError('Protected PDF opened without a password.')
        except pikepdf.PasswordError:
            pass

        post(
            '/api/pdf/unlock',
            {'password': 'wrong-password', 'authorized': 'true', 'output_name': 'wrong'},
            protected,
            expected_status=401,
        )

        unlocked.write_bytes(post(
            '/api/pdf/unlock',
            {'password': 'AJN-Test-2026', 'authorized': 'true', 'output_name': 'unlocked'},
            protected,
        ))
        with pikepdf.open(unlocked) as pdf:
            assert len(pdf.pages) == 1

        repaired = post('/api/pdf/repair', {'output_name': 'repaired'}, source)
        assert repaired.startswith(b'%PDF-')
        repaired_path = root / 'repaired.pdf'
        repaired_path.write_bytes(repaired)
        with pikepdf.open(repaired_path) as pdf:
            assert len(pdf.pages) == 1

    print('PASS: public backend Protect PDF, Unlock PDF and Repair PDF acceptance')


if __name__ == '__main__':
    main()
