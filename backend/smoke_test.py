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
from PIL import Image
BASE_URL = os.getenv('AJN_BACKEND_TEST_URL', 'http://127.0.0.1:8000').rstrip('/')

def multipart(fields: dict[str, str], file_field: str | None=None, file_path: Path | None=None) -> tuple[bytes, str]:
    boundary = f'----AJNPDF{uuid.uuid4().hex}'
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.extend([f'--{boundary}'.encode(), f'Content-Disposition: form-data; name="{name}"'.encode(), str(value).encode(), b'\r\n'])
    if file_field and file_path:
        content_type = mimetypes.guess_type(file_path.name)[0] or 'application/octet-stream'
        chunks.extend([f'--{boundary}'.encode(), f'Content-Disposition: form-data; name="{file_field}"; filename="{file_path.name}"'.encode(), f'Content-Type:{content_type}'.encode(), file_path.read_bytes(), b'\r\n'])
    chunks.append(f'--{boundary}--'.encode())
    return (b''.join(chunks), boundary)

def post(path: str, fields: dict[str, str], source: Path | None=None, expected_status: int=200, field_name: str='file', extra_headers: dict[str, str] | None=None) -> bytes:
    body, boundary = multipart(fields, field_name if source else None, source)
    request = urllib.request.Request(f'{BASE_URL}{path}', data=body, method='POST', headers={'Content-Type': f'multipart/form-data; boundary={boundary}', 'X-Request-ID': 'smoke-test', **(extra_headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            status = response.status
            data = response.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        data = exc.read()
    if status != expected_status:
        raise RuntimeError(f'{path}returned{status}, expected{expected_status}:{data[:500]!r}')
    return data

def delete(path: str, extra_headers: dict[str, str], expected_status: int=200) -> bytes:
    request = urllib.request.Request(f'{BASE_URL}{path}', method='DELETE', headers=extra_headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.status
            data = response.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        data = exc.read()
    if status != expected_status:
        raise RuntimeError(f'{path}returned{status}, expected{expected_status}:{data[:500]!r}')
    return data

def post_json(path: str, payload: dict[str, object], expected_status: int=204) -> bytes:
    request = urllib.request.Request(f'{BASE_URL}{path}', data=json.dumps(payload).encode('utf-8'), method='POST', headers={'Content-Type': 'application/json', 'X-Request-ID': 'analytics-smoke-test'})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.status
            data = response.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        data = exc.read()
    if status != expected_status:
        raise RuntimeError(f'{path}returned{status}, expected{expected_status}:{data[:500]!r}')
    return data

def _token(variable: str) -> str:
    configured = os.getenv(variable, '').strip()
    if configured:
        return configured
    env_file = Path(__file__).resolve().parent / '.env.local'
    if env_file.exists():
        prefix = f'{variable}='
        for line in env_file.read_text(encoding='utf-8-sig').splitlines():
            if line.startswith(prefix):
                return line.split('=', 1)[1].strip()
    raise RuntimeError(f'{variable}was not available for the backend smoke test.')

def analytics_token() -> str:
    return _token('AJN_ANALYTICS_ADMIN_TOKEN')

def media_token() -> str:
    return _token('AJN_MEDIA_ADMIN_TOKEN')

def main() -> None:
    with urllib.request.urlopen(f'{BASE_URL}/health', timeout=5) as response:
        health = json.loads(response.read())
    assert health['status'] == 'ok'
    assert health['conversion_tools'] >= 60
    with urllib.request.urlopen(f'{BASE_URL}/api/tools', timeout=5) as response:
        tools = json.loads(response.read())['tools']
    assert any((tool['id'] == '' for tool in tools))
    assert any((tool['id'] == 'docx-to-pdf' for tool in tools))
    for event_name in ('page_view', 'tool_open', 'tool_start', 'tool_complete', 'download'):
        post_json('/api/analytics/event', {'event_name': event_name, 'path': '/tools/smoke-test', 'tool_id': 'smoke-test', 'category': 'pdf', 'device_type': 'desktop', 'viewport_bucket': 'lg', 'referrer_group': 'direct', 'connection_type': 'unknown', 'theme': 'dark', 'element_id': 'smoke-test-control'})
    post_json('/api/analytics/event', {'event_name': 'web_vital', 'path': '/tools/smoke-test', 'tool_id': 'smoke-test', 'metric_name': 'LCP', 'metric_value': 1200.0, 'metric_rating': 'good', 'device_type': 'desktop', 'theme': 'dark'})
    analytics_request = urllib.request.Request(f'{BASE_URL}/api/admin/analytics?window_days=30', headers={'X-AJN-Admin-Token': analytics_token()})
    with urllib.request.urlopen(analytics_request, timeout=20) as response:
        analytics = json.loads(response.read())
    assert analytics['privacy']['document_contents_stored'] is False
    assert analytics['privacy']['ip_addresses_stored'] is False
    assert 'start_to_complete_rate' in analytics['funnel']
    assert any((row.get('theme') == 'dark' for row in analytics['themes']))
    assert 'media_summary' in analytics
    with tempfile.TemporaryDirectory(prefix='ajn-smoke-') as directory:
        root = Path(directory)
        source = root / 'source.pdf'
        protected = root / 'protected.pdf'
        unlocked = root / 'unlocked.pdf'
        image = root / 'sample.png'
        text_file = root / 'sample.txt'
        with pikepdf.new() as pdf:
            pdf.add_blank_page(page_size=(595, 842))
            pdf.docinfo['/Title'] = 'AJN PDF smoke test'
            pdf.save(source)
        protected.write_bytes(post('/api/pdf/protect', {'user_password': 'AJN-Test-2026', 'owner_password': 'AJN-Owner-2026', 'allow_printing': 'true', 'allow_copying': 'false', 'allow_editing': 'false', 'allow_annotations': 'false', 'allow_form_filling': 'true', 'output_name': 'protected'}, source))
        try:
            pikepdf.open(protected)
            raise AssertionError('Protected PDF opened without a password')
        except pikepdf.PasswordError:
            pass
        post('/api/pdf/unlock', {'password': 'wrong-password', 'authorized': 'true', 'output_name': 'wrong'}, protected, expected_status=401)
        unlocked.write_bytes(post('/api/pdf/unlock', {'password': 'AJN-Test-2026', 'authorized': 'true', 'output_name': 'unlocked'}, protected))
        with pikepdf.open(unlocked) as pdf:
            assert len(pdf.pages) == 1
        repaired = post('/api/pdf/repair', {'output_name': 'repaired'}, source)
        compressed = post('/api/pdf/compress', {'output_name': 'compressed'}, source)
        assert repaired.startswith(b'%PDF-') and compressed.startswith(b'%PDF-')
        Image.new('RGB', (320, 180), 'white').save(image)
        media_payload = json.loads(post('/api/admin/posts', {'title': 'AJN PDF public media smoke test', 'caption': 'This original AJN PDF test image verifies public publishing, optimized media delivery, descriptive content and protected admin deletion.', 'alt_text': 'White AJN PDF smoke test image used during automated media publishing verification', 'tags': 'AJN PDF, smoke test, public media', 'published': 'true', 'rights_confirmed': 'true'}, image, expected_status=201, field_name='image', extra_headers={'X-AJN-Admin-Token': media_token()}))
        assert media_payload['slug']
        with urllib.request.urlopen(f"{BASE_URL}/api/public/posts/{media_payload['slug']}", timeout=20) as response:
            public_post = json.loads(response.read())
        assert public_post['title'] == 'AJN PDF public media smoke test'
        deleted = json.loads(delete(f"/api/admin/posts/{media_payload['id']}", {'X-AJN-Admin-Token': media_token(), 'X-AJN-Confirm-Title': 'AJN PDF public media smoke test'}))
        assert deleted['deleted'] is True
        image_pdf = post('/api/convert/png-to-pdf', {'options_json': '{}', 'output_name': 'image-result'}, image, field_name='files')
        assert image_pdf.startswith(b'%PDF-')
        text_file.write_text('AJN PDF conversion smoke test\nSecond line', encoding='utf-8')
        text_pdf = post('/api/convert/txt-to-pdf', {'options_json': '{}', 'output_name': 'text-result'}, text_file, field_name='files')
        assert text_pdf.startswith(b'%PDF-')
        pdf_text = post('/api/convert/pdf-to-txt', {'options_json': '{}', 'output_name': 'pdf-text'}, source, field_name='files')
        assert b'Page 1' in pdf_text
        png_zip = post('/api/convert/pdf-to-png', {'options_json': '{"dpi":96}', 'output_name': 'pages'}, source, field_name='files')
        assert png_zip.startswith(b'PK')
    print('PASS: backend security, analytics privacy, CRO funnel, public media, registry and core conversion smoke tests')
if __name__ == '__main__':
    main()
