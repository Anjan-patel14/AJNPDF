from __future__ import annotations
import asyncio
import json
import logging
import os
import secrets
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import uuid
from collections import defaultdict, deque
from pathlib import Path
from typing import Annotated, Callable
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.background import BackgroundTask
from .conversion_engine import SPECS, list_backend_tools, list_tools, tool_available, validate_input_file, validate_input_files, validate_output_file
from .public_media import MEDIA_DB, MEDIA_ROOT, init_media_store, router as public_media_router
from .platform_routes import router as platform_router
VERSION = '3.1.0'
MAX_FILE_BYTES = int(os.getenv('AJN_MAX_FILE_MB', '30')) * 1024 * 1024
MAX_TOTAL_BYTES = int(os.getenv('AJN_MAX_TOTAL_MB', '30')) * 1024 * 1024
MAX_UPLOAD_FILES = max(1, int(os.getenv('AJN_MAX_UPLOAD_FILES', '50')))
RATE_LIMIT_PER_MINUTE = max(1, int(os.getenv('AJN_RATE_LIMIT_PER_MINUTE', '30')))
ANALYTICS_RATE_LIMIT_PER_MINUTE = max(RATE_LIMIT_PER_MINUTE, int(os.getenv('AJN_ANALYTICS_RATE_LIMIT_PER_MINUTE', '120')))
ADMIN_RATE_LIMIT_PER_MINUTE = max(1, int(os.getenv('AJN_ADMIN_RATE_LIMIT_PER_MINUTE', '10')))
TRUST_PROXY_HEADERS = os.getenv('AJN_TRUST_PROXY_HEADERS', 'false').lower() in {'1', 'true', 'yes'}
TRUSTED_PROXY_IPS = {value.strip() for value in os.getenv('AJN_TRUSTED_PROXY_IPS', '127.0.0.1,::1').split(',') if value.strip()}
MAX_CONCURRENT_JOBS = max(1, int(os.getenv('AJN_MAX_CONCURRENT_JOBS', '4')))
PROCESSING_TIMEOUT_SECONDS = max(15, int(os.getenv('AJN_PROCESSING_TIMEOUT_SECONDS', '300')))
MIN_FREE_DISK_MB = max(64, int(os.getenv('AJN_MIN_FREE_DISK_MB', '512')))
ANALYTICS_ENABLED = os.getenv('AJN_ANALYTICS_ENABLED', 'true').lower() in {'1', 'true', 'yes'}
ANALYTICS_RETENTION_DAYS = max(7, min(730, int(os.getenv('AJN_ANALYTICS_RETENTION_DAYS', '90'))))
ADMIN_TOKEN = os.getenv('AJN_ADMIN_TOKEN', '').strip()
ANALYTICS_ADMIN_TOKEN = os.getenv('AJN_ANALYTICS_ADMIN_TOKEN', ADMIN_TOKEN).strip()
ANALYTICS_DB = Path(os.getenv('AJN_ANALYTICS_DB', str(Path(__file__).resolve().parents[1] / 'ajn_analytics.sqlite3')))
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv('AJN_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:9002,https://www.ajnpdf.com,https://ajnpdf.com').split(',') if origin.strip()]
logging.basicConfig(level=os.getenv('AJN_LOG_LEVEL', 'INFO').upper(), format='%(asctime)s %(levelname)s %(name)s %(message)s')
logger = logging.getLogger('ajn_pdf_api')
app = FastAPI(title='AJN PDF Conversion API', version=VERSION, description='Temporary PDF, image and document conversion service with automatic cleanup.')
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=False, allow_methods=['GET', 'POST', 'PATCH', 'DELETE'], allow_headers=['Content-Type', 'X-Request-ID', 'X-AJN-Admin-Token', 'X-AJN-Confirm-Title', 'X-AJN-API-Key'], expose_headers=['X-Request-ID', 'X-AJN-Temporary-Processing', 'X-AJN-Tool-ID', 'X-AJN-Worker-Isolation'])
app.include_router(public_media_router)
app.include_router(platform_router)
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount('/media', StaticFiles(directory=str(MEDIA_ROOT)), name='public-media')
_REQUESTS: dict[str, deque[float]] = defaultdict(deque)
_RATE_LOCK = asyncio.Lock()
_PROCESSING_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_JOBS)
_ANALYTICS_LOCK = asyncio.Lock()

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    max_file_mb: int
    max_total_mb: int
    max_concurrent_jobs: int
    processing_timeout_seconds: int
    conversion_tools: int
    available_conversion_tools: int
    analytics_enabled: bool

class ReadyResponse(HealthResponse):
    checks: dict[str, bool]
    free_disk_mb: int

class AnalyticsEvent(BaseModel):
    event_name: str
    path: str
    tool_id: str | None = None
    metric_name: str | None = None
    metric_value: float | None = None
    metric_rating: str | None = None
    element_id: str | None = None
    category: str | None = None
    query_length_bucket: str | None = None
    referrer_group: str | None = None
    device_type: str | None = None
    viewport_bucket: str | None = None
    connection_type: str | None = None
    theme: str | None = None

def _http_error_code(status_code: int, detail: str) -> str:
    text = detail.lower()
    if status_code == 413 or 'too large' in text or 'too many pages' in text or ('too many image' in text):
        return 'FILE_TOO_LARGE'
    if status_code == 415:
        return 'UNSUPPORTED_FORMAT'
    if 'password' in text:
        return 'WRONG_PASSWORD'
    if 'corrupt' in text or 'damaged' in text:
        return 'CORRUPT_FILE'
    if status_code == 429:
        return 'RATE_LIMITED'
    if status_code == 504:
        return 'TIMEOUT'
    if status_code == 503:
        return 'SERVICE_UNAVAILABLE'
    if status_code == 400:
        return 'INVALID_REQUEST'
    if status_code == 422:
        return 'PROCESSING_FAILED'
    return 'PROCESSING_FAILED' if status_code >= 500 else 'REQUEST_FAILED'

def _safe_request_id(value: str | None) -> str:
    raw = (value or '').strip()[:64]
    cleaned = ''.join((character for character in raw if character.isalnum() or character in '._-'))
    return cleaned or uuid.uuid4().hex[:16]

def _client_key(request: Request) -> str:
    direct_client = request.client.host if request.client else 'unknown'
    if TRUST_PROXY_HEADERS and ('*' in TRUSTED_PROXY_IPS or direct_client in TRUSTED_PROXY_IPS):
        forwarded = request.headers.get('x-forwarded-for', '').split(',')[0].strip()
        if forwarded:
            return forwarded
    return direct_client

def _rate_scope(request: Request) -> tuple[str, int]:
    path = request.url.path
    if path.startswith('/api/admin/'):
        return ('admin', ADMIN_RATE_LIMIT_PER_MINUTE)
    if path == '/api/analytics/event':
        return ('analytics', ANALYTICS_RATE_LIMIT_PER_MINUTE)
    return ('processing', RATE_LIMIT_PER_MINUTE)

async def _enforce_rate_limit(request: Request) -> None:
    if request.url.path in {'/', '/health', '/ready', '/docs', '/openapi.json', '/api/tools'} or request.url.path.startswith('/media/') or (request.method == 'GET' and request.url.path.startswith('/api/public/posts')):
        return
    scope, limit = _rate_scope(request)
    key = f'{scope}:{_client_key(request)}'
    now = time.monotonic()
    cutoff = now - 60
    async with _RATE_LOCK:
        bucket = _REQUESTS[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = max(1, int(60 - (now - bucket[0]))) if bucket else 60
            raise HTTPException(status_code=429, detail='Too many requests. Wait briefly and try again.', headers={'Retry-After': str(retry_after)})
        bucket.append(now)
        if len(_REQUESTS) > 5000:
            expired = [item for item, values in _REQUESTS.items() if not values or values[-1] < cutoff]
            for item in expired[:1000]:
                _REQUESTS.pop(item, None)

@app.middleware('http')
async def production_middleware(request: Request, call_next: Callable):
    request_id = _safe_request_id(request.headers.get('x-request-id'))
    request.state.request_id = request_id
    started = time.perf_counter()
    try:
        content_length = request.headers.get('content-length')
        if content_length and request.method in {'POST', 'PATCH', 'PUT'}:
            try:
                declared_size = int(content_length)
            except ValueError:
                declared_size = 0
            max_request_bytes = MAX_TOTAL_BYTES + 2 * 1024 * 1024
            if declared_size > max_request_bytes:
                raise HTTPException(status_code=413, detail='The request body exceeds the configured upload limit.')
        await _enforce_rate_limit(request)
        response = await call_next(request)
    except HTTPException as exc:
        response = JSONResponse(status_code=exc.status_code, content={'error': exc.detail, 'code': _http_error_code(exc.status_code, str(exc.detail)), 'request_id': request_id}, headers=exc.headers)
    except Exception:
        logger.exception('request_failed request_id=%s path=%s', request_id, request.url.path)
        response = JSONResponse(status_code=500, content={'error': 'The processing service encountered an unexpected error.', 'code': 'PROCESSING_FAILED', 'request_id': request_id})
    response.headers['X-Request-ID'] = request_id
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    if request.url.path.startswith('/media/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    elif request.method == 'GET' and request.url.path.startswith('/api/public/posts'):
        response.headers['Cache-Control'] = 'public, max-age=60, stale-while-revalidate=300'
    else:
        response.headers['Cache-Control'] = 'no-store'
    duration_ms = round((time.perf_counter() - started) * 1000)
    logger.info('request_complete request_id=%s method=%s path=%s status=%s duration_ms=%s', request_id, request.method, request.url.path, response.status_code, duration_ms)
    return response

def _safe_stem(name: str | None, fallback: str) -> str:
    raw = Path(name or fallback).name
    stem = Path(raw).stem
    cleaned = ''.join((character if character.isalnum() or character in '._-' else '_' for character in stem)).strip()
    return (cleaned[:100] or fallback).rstrip('.')

def _safe_output_name(name: str | None, fallback_stem: str, extension: str) -> str:
    return f'{_safe_stem(name, fallback_stem)}{extension}'

async def _save_upload(upload: UploadFile, target: Path, max_bytes: int=MAX_FILE_BYTES, limit_detail: str='A file exceeds the configured file-size limit.') -> int:
    """Stream an upload to disk while enforcing the per-file limit. UploadFile may already spool large request bodies to disk; copying in bounded chunks avoids materialising a second full-size bytes object in application memory."""
    total = 0
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        with target.open('wb') as handle:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(status_code=413, detail=limit_detail)
                handle.write(chunk)
    finally:
        await upload.close()
    if total <= 0:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail='An uploaded file is empty.')
    return total

async def _save_pdf_upload(upload: UploadFile, target: Path, strict: bool=True, allow_encrypted: bool=False) -> int:
    size = await _save_upload(upload, target)
    probe = target.read_bytes()[:5]
    if not probe.startswith(b'%PDF-'):
        raise HTTPException(status_code=415, detail='The uploaded file is not a PDF.')
    if strict:
        try:
            validate_input_file(target, allow_encrypted_pdf=allow_encrypted)
        except ValueError as exc:
            raise HTTPException(status_code=415, detail=str(exc)) from exc
    return size

class WorkerJobError(RuntimeError):

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.message = message

def _terminate_worker(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    if os.name == 'nt':
        try:
            subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15, check=False)
            return
        except Exception:
            pass
    try:
        process.kill()
    except Exception:
        pass

def _run_worker_job(payload: dict[str, object], timeout_seconds: int=PROCESSING_TIMEOUT_SECONDS) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    creationflags = getattr(subprocess, 'CREATE_NEW_PROCESS_GROUP', 0) if os.name == 'nt' else 0
    process = subprocess.Popen([sys.executable, '-m', 'app.job_worker'], cwd=str(backend_root), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=creationflags)
    request_bytes = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    try:
        stdout, stderr = process.communicate(input=request_bytes, timeout=max(1, int(timeout_seconds)))
    except subprocess.TimeoutExpired as exc:
        _terminate_worker(process)
        try:
            process.communicate(timeout=10)
        except Exception:
            pass
        raise TimeoutError('The processing job exceeded its time limit and was stopped.') from exc
    response: dict[str, object] = {}
    if stdout:
        try:
            parsed = json.loads(stdout.decode('utf-8', errors='replace'))
            if isinstance(parsed, dict):
                response = parsed
        except Exception:
            response = {}
    if process.returncode != 0 or response.get('ok') is not True:
        detail = str(response.get('message') or '').strip()
        if not detail:
            detail = stderr.decode('utf-8', errors='replace')[-800:].strip() or 'The processing worker failed.'
        raise WorkerJobError(str(response.get('type') or 'WorkerError'), detail)

def _ensure_job_disk(input_bytes: int) -> None:
    try:
        free_bytes = shutil.disk_usage(tempfile.gettempdir()).free
    except Exception as exc:
        raise HTTPException(status_code=503, detail='Processing storage could not be checked safely.') from exc
    reserve_bytes = MIN_FREE_DISK_MB * 1024 * 1024
    working_bytes = min(max(64 * 1024 * 1024, input_bytes * 2), 1024 * 1024 * 1024)
    if free_bytes < reserve_bytes + working_bytes:
        raise HTTPException(status_code=503, detail='Processing storage is temporarily low. Try a smaller file or try again later.')

def _worker_http_error(exc: WorkerJobError) -> HTTPException:
    text = exc.message.lower()
    if exc.kind in {'ValueError', 'UnicodeError', 'JSONDecodeError'}:
        status = 415 if any((word in text for word in ('file type', 'valid pdf', 'damaged', 'unreadable', 'does not match'))) else 400
        return HTTPException(status_code=status, detail=exc.message)
    if exc.kind == 'PasswordError':
        return HTTPException(status_code=401, detail='The PDF password is incorrect.')
    if exc.kind in {'FileNotFoundError', 'PermissionError'} or any((word in text for word in ('not installed', 'is required', 'unavailable on the processing server', 'no space left', 'disk full', 'temporarily unavailable'))):
        return HTTPException(status_code=503, detail='A required processing resource is temporarily unavailable. Try again shortly.')
    return HTTPException(status_code=422, detail='The file could not be processed safely with the selected tool.')

def _file_response(tmp: tempfile.TemporaryDirectory[str], path: Path, download_name: str, media_type: str, tool_id: str) -> FileResponse:
    return FileResponse(path, media_type=media_type, filename=download_name, background=BackgroundTask(tmp.cleanup), headers={'X-AJN-Temporary-Processing': 'true', 'X-AJN-Tool-ID': tool_id, 'X-AJN-Worker-Isolation': 'process'})

def _init_analytics() -> None:
    if not ANALYTICS_ENABLED:
        return
    ANALYTICS_DB.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(ANALYTICS_DB) as db:
        db.execute('CREATE TABLE IF NOT EXISTS conversion_events ( id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, tool_id TEXT NOT NULL, status TEXT NOT NULL, duration_ms INTEGER NOT NULL, input_bytes INTEGER NOT NULL DEFAULT 0, output_bytes INTEGER NOT NULL DEFAULT 0 )')
        db.execute('CREATE INDEX IF NOT EXISTS idx_conversion_tool_created ON conversion_events(tool_id, created_at)')
        db.execute('CREATE TABLE IF NOT EXISTS site_events ( id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, event_name TEXT NOT NULL, path TEXT NOT NULL, tool_id TEXT, metric_name TEXT, metric_value REAL, metric_rating TEXT, element_id TEXT, category TEXT, query_length_bucket TEXT, referrer_group TEXT, device_type TEXT, viewport_bucket TEXT, connection_type TEXT, theme TEXT )')
        existing = {row[1] for row in db.execute('PRAGMA table_info(site_events)').fetchall()}
        migrations = {'element_id': 'TEXT', 'category': 'TEXT', 'query_length_bucket': 'TEXT', 'referrer_group': 'TEXT', 'device_type': 'TEXT', 'viewport_bucket': 'TEXT', 'connection_type': 'TEXT', 'theme': 'TEXT'}
        for column, column_type in migrations.items():
            if column not in existing:
                db.execute(f'ALTER TABLE site_events ADD COLUMN {column} {column_type}')
        db.execute('CREATE INDEX IF NOT EXISTS idx_site_event_created ON site_events(event_name, created_at)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_site_path_created ON site_events(path, created_at)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_site_tool_created ON site_events(tool_id, created_at)')
        retention = f'-{ANALYTICS_RETENTION_DAYS} days'
        db.execute("DELETE FROM site_events WHERE created_at < datetime('now', ?)", (retention,))
        db.execute("DELETE FROM conversion_events WHERE created_at < datetime('now', ?)", (retention,))
        db.commit()

def _record_event_sync(tool_id: str, status: str, duration_ms: int, input_bytes: int, output_bytes: int) -> None:
    if not ANALYTICS_ENABLED:
        return
    with sqlite3.connect(ANALYTICS_DB, timeout=10) as db:
        db.execute('INSERT INTO conversion_events(tool_id, status, duration_ms, input_bytes, output_bytes) VALUES (?, ?, ?, ?, ?)', (tool_id, status, duration_ms, input_bytes, output_bytes))
        db.commit()

async def _record_event(tool_id: str, status: str, duration_ms: int, input_bytes: int, output_bytes: int) -> None:
    if not ANALYTICS_ENABLED:
        return
    try:
        async with _ANALYTICS_LOCK:
            await asyncio.to_thread(_record_event_sync, tool_id, status, duration_ms, input_bytes, output_bytes)
    except Exception as exc:
        logger.warning('conversion_analytics_write_failed tool_id=%s detail=%s', tool_id, type(exc).__name__)

def _record_site_event_sync(event: AnalyticsEvent) -> None:
    if not ANALYTICS_ENABLED:
        return
    with sqlite3.connect(ANALYTICS_DB, timeout=10) as db:
        db.execute('INSERT INTO site_events( event_name, path, tool_id, metric_name, metric_value, metric_rating, element_id, category, query_length_bucket, referrer_group, device_type, viewport_bucket, connection_type, theme ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (event.event_name[:64], event.path[:300], (event.tool_id or '')[:120] or None, (event.metric_name or '')[:40] or None, event.metric_value, (event.metric_rating or '')[:20] or None, (event.element_id or '')[:100] or None, (event.category or '')[:40] or None, (event.query_length_bucket or '')[:30] or None, (event.referrer_group or '')[:30] or None, (event.device_type or '')[:20] or None, (event.viewport_bucket or '')[:20] or None, (event.connection_type or '')[:20] or None, (event.theme or '')[:12] or None))
        db.commit()

async def _record_site_event(event: AnalyticsEvent) -> None:
    if not ANALYTICS_ENABLED:
        return
    async with _ANALYTICS_LOCK:
        await asyncio.to_thread(_record_site_event_sync, event)

@app.on_event('startup')
def startup() -> None:
    _init_analytics()
    init_media_store()

@app.get('/')
def root():
    return {'service': 'AJN PDF Conversion API', 'status': 'ok', 'version': VERSION, 'docs': '/docs'}

def _health() -> HealthResponse:
    availability = sum((1 for spec in SPECS.values() if tool_available(spec)[0]))
    return HealthResponse(status='ok', service='ajn-pdf-conversion', version=VERSION, max_file_mb=MAX_FILE_BYTES // 1024 // 1024, max_total_mb=MAX_TOTAL_BYTES // 1024 // 1024, max_concurrent_jobs=MAX_CONCURRENT_JOBS, processing_timeout_seconds=PROCESSING_TIMEOUT_SECONDS, conversion_tools=len(SPECS), available_conversion_tools=availability, analytics_enabled=ANALYTICS_ENABLED)

def _sqlite_ready(path: Path) -> bool:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(path, timeout=2) as db:
            result = db.execute('PRAGMA quick_check').fetchone()
            return bool(result and result[0] == 'ok')
    except Exception:
        logger.exception('readiness_sqlite_failed path=%s', path)
        return False

def _ready() -> ReadyResponse:
    base = _health()
    checks: dict[str, bool] = {}
    checks['analytics_db'] = not ANALYTICS_ENABLED or _sqlite_ready(ANALYTICS_DB)
    checks['media_db'] = _sqlite_ready(MEDIA_DB)
    try:
        MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
        probe = MEDIA_ROOT / f'.ajn-ready-{secrets.token_hex(4)}'
        probe.write_bytes(b'ok')
        probe.unlink(missing_ok=True)
        checks['media_storage'] = True
    except Exception:
        logger.exception('readiness_media_storage_failed')
        checks['media_storage'] = False
    try:
        with tempfile.NamedTemporaryFile(prefix='ajn-ready-', delete=True) as probe:
            probe.write(b'ok')
            probe.flush()
        checks['temp_storage'] = True
    except Exception:
        logger.exception('readiness_temp_storage_failed')
        checks['temp_storage'] = False
    try:
        free_disk_mb = shutil.disk_usage(tempfile.gettempdir()).free // 1024 // 1024
    except Exception:
        free_disk_mb = 0
    checks['disk_space'] = free_disk_mb >= MIN_FREE_DISK_MB
    checks['conversion_registry'] = base.conversion_tools >= 1 and base.available_conversion_tools >= 1
    status = 'ok' if all(checks.values()) else 'not_ready'
    return ReadyResponse(**{**base.model_dump(), 'status': status}, checks=checks, free_disk_mb=free_disk_mb)

@app.get('/ready', response_model=ReadyResponse)
def ready() -> ReadyResponse:
    response = _ready()
    if response.status != 'ok':
        raise HTTPException(status_code=503, detail='The processing service is not ready.')
    return response

@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return _health()

@app.get('/api/tools')
def conversion_tools():
    return {'version': VERSION, 'tools': list_backend_tools()}

@app.post('/api/analytics/event', status_code=204)
async def analytics_event(event: AnalyticsEvent):
    if not ANALYTICS_ENABLED:
        return None
    allowed_events = {'page_view', 'tool_open', 'tool_start', 'tool_complete', 'tool_error', 'download', 'web_vital', 'interaction', 'search', 'category_filter', 'theme_change', 'consent_update', 'outbound_click', 'tool_reset', 'tool_retry', 'upload_selected', 'media_view', 'media_open', 'admin_media_publish', 'admin_media_delete'}
    if event.event_name not in allowed_events:
        raise HTTPException(status_code=400, detail='Unsupported analytics event.')
    if not event.path.startswith('/'):
        raise HTTPException(status_code=400, detail='Invalid analytics path.')
    await _record_site_event(event)
    return None

@app.get('/api/admin/analytics')
def admin_analytics(x_ajn_admin_token: Annotated[str | None, Header()]=None, window_days: Annotated[int, Query(ge=1, le=365)]=30):
    if not ANALYTICS_ENABLED:
        raise HTTPException(status_code=404, detail='Anonymous analytics are disabled.')
    if not ANALYTICS_ADMIN_TOKEN or not secrets.compare_digest(x_ajn_admin_token or '', ANALYTICS_ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail='A valid admin token is required.')
    modifier = f'-{window_days} days'
    with sqlite3.connect(ANALYTICS_DB) as db:
        db.row_factory = sqlite3.Row
        summary = db.execute("SELECT COUNT(*) AS total, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed, AVG(duration_ms) AS avg_duration_ms, SUM(input_bytes) AS input_bytes, SUM(output_bytes) AS output_bytes FROM conversion_events WHERE created_at >= datetime('now', ?)", (modifier,)).fetchone()
        tools = db.execute("SELECT tool_id, COUNT(*) AS runs, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed, AVG(duration_ms) AS avg_duration_ms, SUM(input_bytes) AS input_bytes, SUM(output_bytes) AS output_bytes FROM conversion_events WHERE created_at >= datetime('now', ?) GROUP BY tool_id ORDER BY runs DESC LIMIT 100", (modifier,)).fetchall()
        daily = db.execute("SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS runs, SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS success, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed FROM conversion_events WHERE created_at >= datetime('now', ?) GROUP BY day ORDER BY day ASC", (modifier,)).fetchall()
        site_summary = db.execute("SELECT COUNT(*) AS events, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS page_views, SUM(CASE WHEN event_name='tool_open' THEN 1 ELSE 0 END) AS tool_opens, SUM(CASE WHEN event_name='tool_start' THEN 1 ELSE 0 END) AS tool_starts, SUM(CASE WHEN event_name='tool_complete' THEN 1 ELSE 0 END) AS tool_completes, SUM(CASE WHEN event_name='tool_error' THEN 1 ELSE 0 END) AS tool_errors, SUM(CASE WHEN event_name='download' THEN 1 ELSE 0 END) AS downloads, SUM(CASE WHEN event_name='search' THEN 1 ELSE 0 END) AS searches, SUM(CASE WHEN event_name='interaction' THEN 1 ELSE 0 END) AS interactions, SUM(CASE WHEN event_name='media_view' THEN 1 ELSE 0 END) AS media_views, SUM(CASE WHEN event_name='media_open' THEN 1 ELSE 0 END) AS media_opens FROM site_events WHERE created_at >= datetime('now', ?)", (modifier,)).fetchone()
        pages = db.execute("SELECT path, COUNT(*) AS views FROM site_events WHERE event_name='page_view' AND created_at >= datetime('now', ?) GROUP BY path ORDER BY views DESC LIMIT 100", (modifier,)).fetchall()
        events = db.execute("SELECT event_name, COUNT(*) AS total FROM site_events WHERE created_at >= datetime('now', ?) GROUP BY event_name ORDER BY total DESC", (modifier,)).fetchall()
        vitals = db.execute("SELECT metric_name, COUNT(*) AS samples, AVG(metric_value) AS average, SUM(CASE WHEN metric_rating='good' THEN 1 ELSE 0 END) AS good, SUM(CASE WHEN metric_rating='needs-improvement' THEN 1 ELSE 0 END) AS needs_improvement, SUM(CASE WHEN metric_rating='poor' THEN 1 ELSE 0 END) AS poor FROM site_events WHERE event_name='web_vital' AND created_at >= datetime('now', ?) GROUP BY metric_name ORDER BY metric_name", (modifier,)).fetchall()
        categories = db.execute("SELECT category, COUNT(*) AS total FROM site_events WHERE category IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY category ORDER BY total DESC", (modifier,)).fetchall()
        devices = db.execute("SELECT device_type, viewport_bucket, COUNT(*) AS total FROM site_events WHERE device_type IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY device_type, viewport_bucket ORDER BY total DESC", (modifier,)).fetchall()
        referrers = db.execute("SELECT referrer_group, COUNT(*) AS total FROM site_events WHERE referrer_group IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY referrer_group ORDER BY total DESC", (modifier,)).fetchall()
        themes = db.execute("SELECT theme, COUNT(*) AS total FROM site_events WHERE theme IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY theme ORDER BY total DESC", (modifier,)).fetchall()
        connections = db.execute("SELECT connection_type, COUNT(*) AS total FROM site_events WHERE connection_type IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY connection_type ORDER BY total DESC", (modifier,)).fetchall()
        interactions = db.execute("SELECT element_id, COUNT(*) AS total FROM site_events WHERE event_name IN ('interaction','outbound_click') AND element_id IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY element_id ORDER BY total DESC LIMIT 50", (modifier,)).fetchall()
        search_buckets = db.execute("SELECT query_length_bucket, COUNT(*) AS total FROM site_events WHERE event_name='search' AND query_length_bucket IS NOT NULL AND created_at >= datetime('now', ?) GROUP BY query_length_bucket ORDER BY total DESC", (modifier,)).fetchall()
        site_daily = db.execute("SELECT substr(created_at, 1, 10) AS day, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS page_views, SUM(CASE WHEN event_name='tool_start' THEN 1 ELSE 0 END) AS starts, SUM(CASE WHEN event_name='tool_complete' THEN 1 ELSE 0 END) AS completes, SUM(CASE WHEN event_name='download' THEN 1 ELSE 0 END) AS downloads FROM site_events WHERE created_at >= datetime('now', ?) GROUP BY day ORDER BY day ASC", (modifier,)).fetchall()
        realtime = db.execute("SELECT substr(created_at, 1, 13) || ':00' AS hour, COUNT(*) AS events, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) AS page_views, SUM(CASE WHEN event_name='tool_complete' THEN 1 ELSE 0 END) AS completes FROM site_events WHERE created_at >= datetime('now', '-24 hours') GROUP BY hour ORDER BY hour ASC").fetchall()
    media_summary = {'published_posts': 0, 'latest_published_at': None}
    if MEDIA_DB.exists():
        with sqlite3.connect(MEDIA_DB) as media_db:
            media_db.row_factory = sqlite3.Row
            media_row = media_db.execute('SELECT COUNT(*) AS published_posts, MAX(published_at) AS latest_published_at FROM public_posts WHERE published=1').fetchone()
            if media_row:
                media_summary = dict(media_row)
    site = dict(site_summary)
    starts = int(site.get('tool_starts') or 0)
    completes = int(site.get('tool_completes') or 0)
    downloads = int(site.get('downloads') or 0)
    errors = int(site.get('tool_errors') or 0)
    funnel = {'start_to_complete_rate': round(completes / starts * 100, 2) if starts else 0, 'complete_to_download_rate': round(downloads / completes * 100, 2) if completes else 0, 'tool_error_rate': round(errors / starts * 100, 2) if starts else 0}
    return {'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'window_days': window_days, 'retention_days': ANALYTICS_RETENTION_DAYS, 'privacy': {'document_contents_stored': False, 'filenames_stored': False, 'account_details_stored': False, 'ip_addresses_stored': False, 'raw_ip_addresses_persisted': False}, 'summary': dict(summary), 'site_summary': site, 'media_summary': media_summary, 'funnel': funnel, 'tools': [dict(row) for row in tools], 'daily': [dict(row) for row in daily], 'site_daily': [dict(row) for row in site_daily], 'pages': [dict(row) for row in pages], 'events': [dict(row) for row in events], 'vitals': [dict(row) for row in vitals], 'categories': [dict(row) for row in categories], 'devices': [dict(row) for row in devices], 'referrers': [dict(row) for row in referrers], 'themes': [dict(row) for row in themes], 'connections': [dict(row) for row in connections], 'interactions': [dict(row) for row in interactions], 'search_buckets': [dict(row) for row in search_buckets], 'realtime': [dict(row) for row in realtime]}

@app.post('/api/convert/{tool_id}')
async def convert_file(tool_id: str, files: Annotated[list[UploadFile] | None, File()]=None, options_json: Annotated[str, Form(max_length=20000)]='{}', output_name: Annotated[str, Form(max_length=120)]='', source_url: Annotated[str, Form(max_length=2048)]=''):
    spec = SPECS.get(tool_id)
    if not spec:
        raise HTTPException(status_code=404, detail='This conversion tool is not registered.')
    available, unavailable_reason = tool_available(spec)
    if not available:
        raise HTTPException(status_code=503, detail=unavailable_reason or 'This conversion is unavailable on the processing server.')
    try:
        options = json.loads(options_json or '{}')
        if not isinstance(options, dict):
            raise ValueError
    except Exception as exc:
        raise HTTPException(status_code=400, detail='Conversion options must be a JSON object.') from exc
    uploads = files or []
    if not uploads and spec.processor != 'url_to_pdf':
        raise HTTPException(status_code=400, detail='Choose at least one source file.')
    if not spec.multi_file and len(uploads) > 1:
        raise HTTPException(status_code=400, detail='This conversion accepts one source file at a time.')
    if len(uploads) > MAX_UPLOAD_FILES:
        raise HTTPException(status_code=400, detail=f'Too many source files. Maximum:{MAX_UPLOAD_FILES}files per job.')
    tmp = tempfile.TemporaryDirectory(prefix=f'ajn-{tool_id[:24]}-')
    workdir = Path(tmp.name)
    input_paths: list[Path] = []
    total_bytes = 0
    try:
        for index, upload in enumerate(uploads, start=1):
            suffix = Path(upload.filename or 'input.bin').suffix.lower()
            source = workdir / f'input-{index:03d}{suffix}'
            remaining_total = MAX_TOTAL_BYTES - total_bytes
            if remaining_total <= 0:
                raise HTTPException(status_code=413, detail='The combined upload size exceeds the configured limit.')
            per_upload_limit = min(MAX_FILE_BYTES, remaining_total)
            limit_detail = 'A file exceeds the configured file-size limit.' if per_upload_limit == MAX_FILE_BYTES else 'The combined upload size exceeds the configured limit.'
            size = await _save_upload(upload, source, per_upload_limit, limit_detail)
            total_bytes += size
            input_paths.append(source)
        try:
            validate_input_files(spec, input_paths)
        except ValueError as exc:
            text = str(exc).lower()
            status_code = 415 if any((word in text for word in ('not supported', 'file type', 'valid pdf', 'damaged', 'unreadable', 'does not match'))) else 400
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc
        _ensure_job_disk(total_bytes)
        output_filename = _safe_output_name(output_name, spec.tool_id, spec.output_extension)
        target = workdir / output_filename
        started = time.perf_counter()
        try:
            async with _PROCESSING_SEMAPHORE:
                await asyncio.to_thread(_run_worker_job, {'operation': 'conversion', 'tool_id': tool_id, 'files': [str(path) for path in input_paths], 'output': str(target), 'workdir': str(workdir), 'options': options, 'source_url': source_url or None}, PROCESSING_TIMEOUT_SECONDS)
            validate_output_file(target, spec.output_extension)
        except TimeoutError as exc:
            duration_ms = round((time.perf_counter() - started) * 1000)
            await _record_event(tool_id, 'failed', duration_ms, total_bytes, 0)
            raise HTTPException(status_code=504, detail='The conversion timed out and the processing job was stopped. Try a smaller or simpler source file.') from exc
        except WorkerJobError as exc:
            duration_ms = round((time.perf_counter() - started) * 1000)
            await _record_event(tool_id, 'failed', duration_ms, total_bytes, 0)
            raise _worker_http_error(exc) from exc
        except RuntimeError as exc:
            duration_ms = round((time.perf_counter() - started) * 1000)
            await _record_event(tool_id, 'failed', duration_ms, total_bytes, 0)
            logger.warning('conversion_output_invalid tool_id=%s detail=%s', tool_id, exc)
            raise HTTPException(status_code=422, detail=str(exc) or 'The converter returned an invalid output file.') from exc
        duration_ms = round((time.perf_counter() - started) * 1000)
        output_bytes = target.stat().st_size
        await _record_event(tool_id, 'success', duration_ms, total_bytes, output_bytes)
        return _file_response(tmp, target, output_filename, spec.output_mime, tool_id)
    except HTTPException:
        tmp.cleanup()
        raise
    except Exception as exc:
        tmp.cleanup()
        logger.exception('conversion_request_failed tool_id=%s', tool_id)
        raise HTTPException(status_code=422, detail='The file could not be processed safely with the selected tool.') from exc

@app.post('/api/pdf/protect')
async def protect_pdf(file: Annotated[UploadFile, File(...)], user_password: Annotated[str, Form(min_length=4, max_length=128)], owner_password: Annotated[str, Form(max_length=128)]='', allow_printing: Annotated[bool, Form()]=True, allow_copying: Annotated[bool, Form()]=False, allow_editing: Annotated[bool, Form()]=False, allow_annotations: Annotated[bool, Form()]=False, allow_form_filling: Annotated[bool, Form()]=True, output_name: Annotated[str, Form(max_length=120)]='protected'):
    tmp = tempfile.TemporaryDirectory(prefix='ajn-protect-')
    source, target = (Path(tmp.name) / 'input.pdf', Path(tmp.name) / 'output.pdf')
    try:
        input_bytes = await _save_pdf_upload(file, source)
        _ensure_job_disk(input_bytes)
        payload = {'operation': 'protect', 'source': str(source), 'target': str(target), 'user_password': user_password, 'owner_password': owner_password or secrets.token_urlsafe(32), 'permissions': {'accessibility': True, 'extract': allow_copying, 'modify_annotation': allow_annotations, 'modify_assembly': allow_editing, 'modify_form': allow_form_filling, 'modify_other': allow_editing, 'print_lowres': allow_printing, 'print_highres': allow_printing}}
        async with _PROCESSING_SEMAPHORE:
            await asyncio.to_thread(_run_worker_job, payload, min(PROCESSING_TIMEOUT_SECONDS, 180))
        validate_output_file(target, '.pdf', allow_encrypted_pdf=True)
        return _file_response(tmp, target, _safe_output_name(output_name, 'protected', '.pdf'), 'application/pdf', 'protect-pdf')
    except TimeoutError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=504, detail='PDF protection timed out and the processing job was stopped.') from exc
    except WorkerJobError as exc:
        tmp.cleanup()
        if exc.kind == 'PasswordError':
            raise HTTPException(status_code=409, detail='The source PDF is already encrypted or requires a password.') from exc
        raise HTTPException(status_code=422, detail='The PDF could not be encrypted safely.') from exc
    except HTTPException:
        tmp.cleanup()
        raise
    except Exception as exc:
        tmp.cleanup()
        logger.exception('protect_pdf_failed')
        raise HTTPException(status_code=422, detail='The PDF could not be encrypted safely.') from exc

@app.post('/api/pdf/unlock')
async def unlock_pdf(file: Annotated[UploadFile, File(...)], password: Annotated[str, Form(max_length=128)], authorized: Annotated[bool, Form()], output_name: Annotated[str, Form(max_length=120)]='unlocked'):
    if not authorized:
        raise HTTPException(status_code=400, detail='Document authorization must be confirmed.')
    tmp = tempfile.TemporaryDirectory(prefix='ajn-unlock-')
    source, target = (Path(tmp.name) / 'input.pdf', Path(tmp.name) / 'output.pdf')
    try:
        input_bytes = await _save_pdf_upload(file, source, allow_encrypted=True)
        _ensure_job_disk(input_bytes)
        async with _PROCESSING_SEMAPHORE:
            await asyncio.to_thread(_run_worker_job, {'operation': 'unlock', 'source': str(source), 'target': str(target), 'password': password}, min(PROCESSING_TIMEOUT_SECONDS, 180))
        validate_output_file(target, '.pdf')
        return _file_response(tmp, target, _safe_output_name(output_name, 'unlocked', '.pdf'), 'application/pdf', 'unlock-pdf')
    except TimeoutError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=504, detail='PDF unlocking timed out and the processing job was stopped.') from exc
    except WorkerJobError as exc:
        tmp.cleanup()
        if exc.kind == 'PasswordError':
            raise HTTPException(status_code=401, detail='The PDF password is incorrect.') from exc
        raise HTTPException(status_code=422, detail='The PDF could not be unlocked safely.') from exc
    except HTTPException:
        tmp.cleanup()
        raise
    except Exception as exc:
        tmp.cleanup()
        logger.exception('unlock_pdf_failed')
        raise HTTPException(status_code=422, detail='The PDF could not be unlocked safely.') from exc

@app.post('/api/pdf/repair')
async def repair_pdf(file: Annotated[UploadFile, File(...)], output_name: Annotated[str, Form(max_length=120)]='repaired'):
    tmp = tempfile.TemporaryDirectory(prefix='ajn-repair-')
    source, target = (Path(tmp.name) / 'input.pdf', Path(tmp.name) / 'output.pdf')
    try:
        input_bytes = await _save_pdf_upload(file, source, strict=False)
        _ensure_job_disk(input_bytes)
        async with _PROCESSING_SEMAPHORE:
            await asyncio.to_thread(_run_worker_job, {'operation': 'repair', 'source': str(source), 'target': str(target)}, min(PROCESSING_TIMEOUT_SECONDS, 180))
        validate_output_file(target, '.pdf')
        return _file_response(tmp, target, _safe_output_name(output_name, 'repaired', '.pdf'), 'application/pdf', 'repair-pdf')
    except TimeoutError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=504, detail='PDF repair timed out and the processing job was stopped.') from exc
    except WorkerJobError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=422, detail='The PDF is too damaged to repair safely.') from exc
    except HTTPException:
        tmp.cleanup()
        raise
    except Exception as exc:
        tmp.cleanup()
        logger.exception('repair_pdf_failed')
        raise HTTPException(status_code=422, detail='The PDF is too damaged to repair safely.') from exc

@app.post('/api/pdf/compress')
async def compress_pdf(file: Annotated[UploadFile, File(...)], output_name: Annotated[str, Form(max_length=120)]='compressed'):
    tmp = tempfile.TemporaryDirectory(prefix='ajn-compress-')
    source, target = (Path(tmp.name) / 'input.pdf', Path(tmp.name) / 'output.pdf')
    try:
        input_bytes = await _save_pdf_upload(file, source)
        _ensure_job_disk(input_bytes)
        async with _PROCESSING_SEMAPHORE:
            await asyncio.to_thread(_run_worker_job, {'operation': 'compress', 'source': str(source), 'target': str(target)}, min(PROCESSING_TIMEOUT_SECONDS, 180))
        validate_output_file(target, '.pdf')
        return _file_response(tmp, target, _safe_output_name(output_name, 'compressed', '.pdf'), 'application/pdf', 'compress-pdf')
    except TimeoutError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=504, detail='PDF optimization timed out and the processing job was stopped.') from exc
    except WorkerJobError as exc:
        tmp.cleanup()
        raise HTTPException(status_code=422, detail='The PDF could not be optimized safely.') from exc
    except HTTPException:
        tmp.cleanup()
        raise
    except Exception as exc:
        tmp.cleanup()
        logger.exception('compress_pdf_failed')
        raise HTTPException(status_code=422, detail='The PDF could not be optimized safely.') from exc

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, 'request_id', None)
    return JSONResponse(status_code=exc.status_code, content={'error': exc.detail, 'code': _http_error_code(exc.status_code, str(exc.detail)), 'request_id': request_id}, headers=exc.headers)
