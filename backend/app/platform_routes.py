from __future__ import annotations
import asyncio
import json
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Annotated, Any
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.background import BackgroundTask
from .api_access import APIAccessError, APIPrincipal, APIRateState, authenticate_api_key, configuration_status, enforce_api_rate_limit, require_api_scope
from .conversion_engine import SPECS, list_backend_tools, validate_input_file, validate_output_file
router = APIRouter()
_recognition_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.gif', '.heic', '.heif'}

def _api_error(exc: APIAccessError) -> HTTPException:
    headers = {'X-AJN-API-Error-Code': exc.code}
    if exc.status_code == 401:
        headers['WWW-Authenticate'] = 'ApiKey realm="AJN PDF API"'
    return HTTPException(status_code=exc.status_code, detail=exc.message, headers=headers)

async def _guard_scopes(raw_key: str | None, scopes: tuple[str, ...]) -> tuple[APIPrincipal, APIRateState]:
    primary_scope = scopes[0] if scopes else ''
    try:
        principal = authenticate_api_key(raw_key, primary_scope)
        for scope in scopes[1:]:
            require_api_scope(principal, scope)
        state = await enforce_api_rate_limit(principal)
        return (principal, state)
    except APIAccessError as exc:
        raise _api_error(exc) from exc

async def _guard(raw_key: str | None, scope: str) -> tuple[APIPrincipal, APIRateState]:
    return await _guard_scopes(raw_key, (scope,))

def _conversion_required_scopes(tool_id: str) -> tuple[str, ...]:
    spec = SPECS.get(tool_id)
    if spec is None:
        return ('convert',)
    return ('convert',)

def _api_headers(principal: APIPrincipal, rate: APIRateState) -> dict[str, str]:
    return {'X-AJN-API-Key-ID': principal.key_id, 'X-RateLimit-Limit': str(rate.limit), 'X-RateLimit-Remaining': str(rate.remaining), 'X-RateLimit-Reset': str(rate.reset_seconds), 'Cache-Control': 'no-store'}

def _apply_api_headers(response: Response, principal: APIPrincipal, rate: APIRateState) -> Response:
    for name, value in _api_headers(principal, rate).items():
        response.headers[name] = value
    return response

def _parse_options(raw: str) -> dict[str, Any]:
    try:
        value = json.loads(raw or '{}')
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail='Options must be valid JSON.') from exc
    if not isinstance(value, dict):
        raise HTTPException(status_code=400, detail='Options must be a JSON object.')
    return value

async def _run_electronic_signature_package(pdf: UploadFile, signature: UploadFile, signer_name: str, signer_email: str, reason: str, consented: bool, page: int, x: float, y: float, width: float, height: float, output_name: str, principal: APIPrincipal, rate: APIRateState) -> FileResponse:
    from . import main as main_api
    temporary = tempfile.TemporaryDirectory(prefix='ajn-api-sign-')
    workdir = Path(temporary.name)
    source = workdir / 'input.pdf'
    signature_suffix = Path(signature.filename or 'signature.png').suffix.lower()
    if signature_suffix not in {'.png', '.jpg', '.jpeg'}:
        temporary.cleanup()
        await pdf.close()
        await signature.close()
        raise HTTPException(status_code=415, detail='Signature image must be PNG or JPG.')
    signature_path = workdir / f'signature{signature_suffix}'
    target = workdir / 'signed.pdf'
    evidence = workdir / 'signature-evidence.json'
    package = workdir / 'signed-package.zip'
    try:
        original_filename = Path(pdf.filename or 'document.pdf').name
        pdf_bytes = await main_api._save_pdf_upload(pdf, source)
        signature_bytes = await main_api._save_upload(signature, signature_path, max_bytes=8 * 1024 * 1024, limit_detail='The signature image is larger than 8 MB.')
        main_api._ensure_job_disk(pdf_bytes + signature_bytes)
        options = {'signer_name': signer_name, 'signer_email': signer_email, 'reason': reason, 'consented': consented, 'page': page, 'x': x, 'y': y, 'width': width, 'height': height, 'original_filename': original_filename, 'signature_source': 'upload'}
        async with main_api._PROCESSING_SEMAPHORE:
            await asyncio.to_thread(main_api._run_worker_job, {'operation': 'electronic_sign', 'source': str(source), 'signature': str(signature_path), 'target': str(target), 'evidence_output': str(evidence), 'workdir': str(workdir), 'options': options}, min(main_api.PROCESSING_TIMEOUT_SECONDS, 180))
        validate_output_file(target, '.pdf')
        if not evidence.exists() or evidence.stat().st_size <= 10:
            raise HTTPException(status_code=422, detail='Electronic signature evidence was not created correctly.')
        evidence_payload = json.loads(evidence.read_text(encoding='utf-8'))
        final_name = main_api._safe_output_name(output_name, 'signed', '.pdf')
        evidence_name = f'{Path(final_name).stem}-evidence.json'
        with zipfile.ZipFile(package, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            archive.write(target, arcname=final_name)
            archive.write(evidence, arcname=evidence_name)
        if not zipfile.is_zipfile(package):
            raise HTTPException(status_code=422, detail='Electronic signature package could not be created.')
        headers = _api_headers(principal, rate)
        headers.update({'X-AJN-Evidence-ID': str(evidence_payload.get('evidence_id') or ''), 'X-AJN-Signature-Type': 'electronic-signature', 'X-AJN-Certificate-Signature': 'false', 'X-AJN-Temporary-Processing': 'true'})
        return FileResponse(package, filename=f'{Path(final_name).stem}-package.zip', media_type='application/zip', headers=headers, background=BackgroundTask(temporary.cleanup))
    except TimeoutError as exc:
        temporary.cleanup()
        raise HTTPException(status_code=504, detail='Electronic signing timed out.') from exc
    except main_api.WorkerJobError as exc:
        temporary.cleanup()
        raise main_api._worker_http_error(exc) from exc
    except HTTPException:
        temporary.cleanup()
        raise
    except Exception as exc:
        temporary.cleanup()
        raise HTTPException(status_code=422, detail='The electronic signature package could not be created safely.') from exc

@router.get('/api/v1/status')
def api_v1_status():
    status = configuration_status()
    return {'service': 'AJN PDF Public API', 'version': 'v1', 'enabled': status['enabled'], 'configured_keys': status['configured_keys'], 'configuration_valid': status['configuration_valid'], 'authentication': status['authentication'], 'supported_scopes': status['supported_scopes']}

@router.get('/api/v1/account')
async def api_v1_account(x_ajn_api_key: Annotated[str | None, Header(alias='X-AJN-API-Key')]=None):
    principal, rate = await _guard(x_ajn_api_key, 'read')
    return JSONResponse({'key_id': principal.key_id, 'scopes': sorted(principal.scopes), 'rate_per_minute': principal.rate_per_minute, 'remaining_this_window': rate.remaining}, headers=_api_headers(principal, rate))

@router.get('/api/v1/capabilities')
async def api_v1_capabilities(x_ajn_api_key: Annotated[str | None, Header(alias='X-AJN-API-Key')]=None):
    principal, rate = await _guard(x_ajn_api_key, 'read')
    tools: list[dict[str, Any]] = []
    for raw_tool in list_backend_tools():
        tool = dict(raw_tool)
        tool_id = str(tool.get('id') or '')
        generic_convertible = tool_id in SPECS
        tool['api_v1_convertible'] = generic_convertible
        tool['api_v1_route'] = f'/api/v1/convert/{tool_id}' if generic_convertible else None
        tool['api_v1_required_scopes'] = list(_conversion_required_scopes(tool_id)) if generic_convertible else []
        tools.append(tool)
    return JSONResponse({'version': 'v1', 'tools': tools, 'available_conversion_tools': sum((1 for tool in tools if tool['api_v1_convertible'] and bool(tool.get('available')))), 'total_conversion_tools': sum((1 for tool in tools if tool['api_v1_convertible'])), 'website_only_capabilities': [tool['id'] for tool in tools if not tool['api_v1_convertible']], 'electronic_signature': {'route': '/api/v1/sign/electronic', 'scope': 'sign', 'evidence_package': True, 'embedded_evidence': True, 'sha256_evidence': True, 'certificate_backed_pades': False}}, headers=_api_headers(principal, rate))

@router.post('/api/v1/convert/{tool_id}')
async def api_v1_convert(tool_id: str, files: Annotated[list[UploadFile] | None, File()]=None, options_json: Annotated[str, Form(max_length=20000)]='{}', output_name: Annotated[str, Form(max_length=120)]='', source_url: Annotated[str, Form(max_length=2048)]='', x_ajn_api_key: Annotated[str | None, Header(alias='X-AJN-API-Key')]=None):
    principal, rate = await _guard_scopes(x_ajn_api_key, _conversion_required_scopes(tool_id))
    from .main import convert_file
    response = await convert_file(tool_id, files, options_json, output_name, source_url)
    return _apply_api_headers(response, principal, rate)

@router.post('/api/v1/sign/electronic')
async def api_v1_sign_electronic(pdf: Annotated[UploadFile, File(...)], signature: Annotated[UploadFile, File(...)], signer_name: Annotated[str, Form(min_length=1, max_length=120)], signer_email: Annotated[str, Form(min_length=3, max_length=180)], reason: Annotated[str, Form(max_length=300)]='I approve and sign this document.', consented: Annotated[bool, Form()]=False, page: Annotated[int, Form(ge=1)]=1, x: Annotated[float, Form(ge=0)]=72, y: Annotated[float, Form(ge=0)]=72, width: Annotated[float, Form(gt=0)]=165, height: Annotated[float, Form(gt=0)]=78, output_name: Annotated[str, Form(max_length=120)]='signed', x_ajn_api_key: Annotated[str | None, Header(alias='X-AJN-API-Key')]=None):
    principal, rate = await _guard(x_ajn_api_key, 'sign')
    return await _run_electronic_signature_package(pdf, signature, signer_name, signer_email, reason, consented, page, x, y, width, height, output_name, principal, rate)
