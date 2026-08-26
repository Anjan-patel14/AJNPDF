from __future__ import annotations
import json
import mimetypes
import os
import tempfile
import time
import warnings
from pathlib import Path
import pikepdf
import requests
from app.conversion_engine import SPECS, tool_available
from full_acceptance_test import fixtures, validate_output
BASE_URL = os.getenv('AJN_BACKEND_TEST_URL', 'http://127.0.0.1:8000').rstrip('/')
REQUEST_TIMEOUT = int(os.getenv('AJN_HTTP_ACCEPTANCE_TIMEOUT', '330'))

def _request_id(tool_id: str) -> str:
    cleaned = ''.join((ch if ch.isalnum() else '-' for ch in tool_id))[:40]
    return f'http-accept-{cleaned}'

def _post_with_retry(session: requests.Session, path: str, *, data: dict[str, str], sources: list[Path] | None=None, field_name: str='files', expected_status: int=200, request_id: str) -> requests.Response:
    last_response: requests.Response | None = None
    for _ in range(5):
        multipart = []
        for source in sources or []:
            multipart.append((field_name, (source.name, source.read_bytes(), mimetypes.guess_type(source.name)[0] or 'application/octet-stream')))
        response = session.post(f'{BASE_URL}{path}', data=data, files=multipart or None, headers={'X-Request-ID': request_id}, timeout=REQUEST_TIMEOUT)
        last_response = response
        if response.status_code != 429:
            break
        retry_after = max(1, min(65, int(response.headers.get('Retry-After', '2') or '2')))
        time.sleep(retry_after + 1)
    assert last_response is not None
    if last_response.status_code != expected_status:
        detail = last_response.text[:1000]
        raise RuntimeError(f'{path}returned HTTP{last_response.status_code}, expected{expected_status}:{detail}')
    return last_response

def _validate_processing_response(response: requests.Response, tool_id: str, expected_extension: str, target: Path) -> None:
    if response.headers.get('X-AJN-Tool-ID') != tool_id:
        raise RuntimeError(f'{tool_id}: response is missing the expected tool header.')
    if response.headers.get('X-AJN-Temporary-Processing') != 'true':
        raise RuntimeError(f'{tool_id}: temporary-processing header is missing.')
    if response.headers.get('X-AJN-Worker-Isolation') != 'process':
        raise RuntimeError(f'{tool_id}: worker-process isolation header is missing.')
    if not response.headers.get('X-Request-ID'):
        raise RuntimeError(f'{tool_id}: request reference header is missing.')
    disposition = response.headers.get('Content-Disposition', '')
    if expected_extension.lower() not in disposition.lower():
        raise RuntimeError(f'{tool_id}: content-disposition does not contain{expected_extension}.')
    target.write_bytes(response.content)
    validate_output(target, expected_extension)

def _negative_tests(session: requests.Session, root: Path, samples: dict[str, Path]) -> None:
    response = _post_with_retry(session, '/api/convert/not-a-real-tool', data={'options_json': '{}', 'output_name': 'bad'}, sources=[samples['.txt']], expected_status=404, request_id='http-accept-unknown-tool')
    payload = response.json()
    if not payload.get('code') or not payload.get('request_id'):
        raise RuntimeError('Unknown-tool errors must include a stable code and request reference.')
    response = _post_with_retry(session, '/api/convert/txt-to-pdf', data={'options_json': '[]', 'output_name': 'bad-options'}, sources=[samples['.txt']], expected_status=400, request_id='http-accept-options')
    if response.json().get('code') != 'INVALID_REQUEST':
        raise RuntimeError('Invalid options did not return INVALID_REQUEST.')
    empty = root / 'empty.txt'
    empty.write_bytes(b'')
    _post_with_retry(session, '/api/convert/txt-to-pdf', data={'options_json': '{}', 'output_name': 'empty'}, sources=[empty], expected_status=400, request_id='http-accept-empty')
    fake_pdf = root / 'fake.pdf'
    fake_pdf.write_text('not really a pdf', encoding='utf-8')
    response = _post_with_retry(session, '/api/convert/pdf-to-txt', data={'options_json': '{}', 'output_name': 'fake'}, sources=[fake_pdf], expected_status=415, request_id='http-accept-fake-pdf')
    if response.json().get('code') != 'UNSUPPORTED_FORMAT':
        raise RuntimeError('Invalid PDF content did not return UNSUPPORTED_FORMAT.')
    _post_with_retry(session, '/api/convert/pdf-to-txt', data={'options_json': '{}', 'output_name': 'too-many'}, sources=[samples['.pdf'], samples['.pdf']], expected_status=400, request_id='http-accept-too-many')
    _post_with_retry(session, '/api/convert/image-to-pdf', data={'options_json': '{}', 'output_name': 'too-many-images'}, sources=[samples['.png']] * 51, expected_status=400, request_id='http-accept-file-count')

def _security_endpoints(session: requests.Session, root: Path, source_pdf: Path) -> list[str]:
    passed: list[str] = []
    protected_response = _post_with_retry(session, '/api/pdf/protect', data={'user_password': 'AJN-HTTP-2026', 'owner_password': 'AJN-HTTP-OWNER-2026', 'allow_printing': 'true', 'allow_copying': 'false', 'allow_editing': 'false', 'allow_annotations': 'false', 'allow_form_filling': 'true', 'output_name': 'http-protected'}, sources=[source_pdf], field_name='file', request_id='http-accept-protect')
    protected = root / 'http-protected.pdf'
    _validate_processing_response(protected_response, 'protect-pdf', '.pdf', protected)
    try:
        pikepdf.open(protected)
        raise RuntimeError('Protected PDF opened without a password.')
    except pikepdf.PasswordError:
        pass
    passed.append('protect-pdf')
    wrong = _post_with_retry(session, '/api/pdf/unlock', data={'password': 'wrong', 'authorized': 'true', 'output_name': 'wrong'}, sources=[protected], field_name='file', expected_status=401, request_id='http-accept-wrong-password')
    if wrong.json().get('code') != 'WRONG_PASSWORD':
        raise RuntimeError('Wrong-password response did not return WRONG_PASSWORD.')
    unlocked_response = _post_with_retry(session, '/api/pdf/unlock', data={'password': 'AJN-HTTP-2026', 'authorized': 'true', 'output_name': 'http-unlocked'}, sources=[protected], field_name='file', request_id='http-accept-unlock')
    unlocked = root / 'http-unlocked.pdf'
    _validate_processing_response(unlocked_response, 'unlock-pdf', '.pdf', unlocked)
    with pikepdf.open(unlocked) as pdf:
        if len(pdf.pages) < 1:
            raise RuntimeError('Unlocked PDF has no pages.')
    passed.append('unlock-pdf')
    repaired_response = _post_with_retry(session, '/api/pdf/repair', data={'output_name': 'http-repaired'}, sources=[source_pdf], field_name='file', request_id='http-accept-repair')
    repaired = root / 'http-repaired.pdf'
    _validate_processing_response(repaired_response, 'repair-pdf', '.pdf', repaired)
    passed.append('repair-pdf')
    compressed_response = _post_with_retry(session, '/api/pdf/compress', data={'output_name': 'http-compressed'}, sources=[source_pdf], field_name='file', request_id='http-accept-compress')
    compressed = root / 'http-compressed.pdf'
    _validate_processing_response(compressed_response, 'compress-pdf', '.pdf', compressed)
    passed.append('compress-pdf')
    return passed

def main() -> None:
    with warnings.catch_warnings():
        warnings.filterwarnings('ignore', message='In the future version we will turn default option ignore_ncx to True\\.')
        warnings.filterwarnings('ignore', message='This search incorrectly ignores the root element.*')
        with tempfile.TemporaryDirectory(prefix='ajn-http-acceptance-') as directory:
            root = Path(directory)
            samples = fixtures(root)
            passed: list[str] = []
            skipped: list[dict[str, str]] = []
            failed: list[dict[str, str]] = []
            session = requests.Session()
            ready = session.get(f'{BASE_URL}/ready', timeout=20)
            if ready.status_code != 200 or ready.json().get('status') != 'ok':
                raise RuntimeError(f'Backend /ready failed before HTTP acceptance:{ready.text[:500]}')
            for tool_id, spec in sorted(SPECS.items()):
                available, reason = tool_available(spec)
                if not available:
                    skipped.append({'id': tool_id, 'reason': reason or 'Required dependency is unavailable.'})
                    continue
                if spec.processor == 'url_to_pdf':
                    skipped.append({'id': tool_id, 'reason': 'Public-network URL behavior remains a post-deployment acceptance test.'})
                    continue
                source: Path | None = None
                for extension in spec.input_extensions:
                    source = samples.get(extension)
                    if source:
                        break
                if source is None:
                    if tool_id in {'msg-to-pdf', 'xps-to-pdf'}:
                        skipped.append({'id': tool_id, 'reason': 'A genuine binary fixture is required for this format.'})
                        continue
                    failed.append({'id': tool_id, 'reason': f'No generated fixture for{spec.input_extensions[:1]}.'})
                    continue
                sources = [source, source] if spec.multi_file else [source]
                try:
                    response = _post_with_retry(session, f'/api/convert/{tool_id}', data={'options_json': json.dumps({'language': 'eng', 'dpi': 96, 'quality': 70, 'grayscale': False}), 'output_name': f'http-{tool_id}', 'source_url': ''}, sources=sources, request_id=_request_id(tool_id))
                    target = root / f'http-result-{tool_id}{spec.output_extension}'
                    _validate_processing_response(response, tool_id, spec.output_extension, target)
                    passed.append(tool_id)
                except Exception as exc:
                    failed.append({'id': tool_id, 'reason': f'{type(exc).__name__}:{exc}'})
            _negative_tests(session, root, samples)
            security_passed = _security_endpoints(session, root, samples['.pdf'])
            report = {'version': '3.1.0', 'generic_endpoint_passed': passed, 'security_endpoint_passed': security_passed, 'skipped': skipped, 'failed': failed}
            report_path = Path(__file__).resolve().parent / 'HTTP_ACCEPTANCE_RESULTS.json'
            report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
            if failed:
                summary = ','.join((f"{item['id']}:{item['reason']}" for item in failed[:12]))
                raise RuntimeError(f'HTTP acceptance failures:{summary}')
            print(f'PASS: live HTTP acceptance verified{len(passed)}generic conversion endpoints +{len(security_passed)}PDF service endpoints;{len(skipped)}dependency/deployment fixture cases documented.')
if __name__ == '__main__':
    main()
