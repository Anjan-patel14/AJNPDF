from __future__ import annotations
import asyncio
import hashlib
import hmac
import json
import os
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

class APIAccessError(RuntimeError):

    def __init__(self, status_code: int, message: str, code: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code

@dataclass(frozen=True)
class APIPrincipal:
    key_id: str
    scopes: frozenset[str]
    rate_per_minute: int

@dataclass(frozen=True)
class APIRateState:
    limit: int
    remaining: int
    reset_seconds: int
_API_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
_API_RATE_LOCK = asyncio.Lock()

def hash_api_key(secret: str) -> str:
    return hashlib.sha256(secret.encode('utf-8')).hexdigest()

def _enabled() -> bool:
    return os.getenv('AJN_PUBLIC_API_ENABLED', 'false').strip().lower() in {'1', 'true', 'yes', 'on'}

@lru_cache(maxsize=1)
def _records() -> tuple[dict[str, Any], ...]:
    raw = os.getenv('AJN_PUBLIC_API_KEYS_JSON', '').strip()
    if not raw:
        return tuple()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError('AJN_PUBLIC_API_KEYS_JSON is not valid JSON.') from exc
    if not isinstance(payload, list):
        raise RuntimeError('AJN_PUBLIC_API_KEYS_JSON must be a JSON array.')
    records: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for index, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            raise RuntimeError(f'API key record{index}must be an object.')
        if any((name in item for name in ('secret', 'api_key', 'key'))):
            raise RuntimeError('Plaintext API secrets are not allowed in AJN_PUBLIC_API_KEYS_JSON. Store only secret_sha256.')
        key_id = str(item.get('id') or '').strip()
        digest = str(item.get('secret_sha256') or '').strip().lower()
        if not key_id or len(key_id) > 80:
            raise RuntimeError(f'API key record{index}has an invalid id.')
        if key_id in seen_ids:
            raise RuntimeError(f'Duplicate API key id:{key_id}')
        seen_ids.add(key_id)
        if len(digest) != 64 or any((character not in '0123456789abcdef' for character in digest)):
            raise RuntimeError(f'API key record{key_id}must contain a SHA-256 hex digest.')
        raw_scopes = item.get('scopes') or []
        if not isinstance(raw_scopes, list):
            raise RuntimeError(f'API key record{key_id}scopes must be an array.')
        scopes = sorted({str(scope).strip().lower() for scope in raw_scopes if str(scope).strip()})
        allowed_scopes = {'read', 'convert', 'recognized_text', 'sign'}
        unknown = sorted(set(scopes).difference(allowed_scopes))
        if unknown:
            raise RuntimeError(f"API key record{key_id}contains unsupported scopes:{','.join(unknown)}")
        rate = max(1, min(600, int(item.get('rate_per_minute') or os.getenv('AJN_PUBLIC_API_RATE_PER_MINUTE', '30'))))
        records.append({'id': key_id, 'secret_sha256': digest, 'scopes': scopes, 'rate_per_minute': rate})
    return tuple(records)

def clear_api_key_cache() -> None:
    _records.cache_clear()

def configuration_status() -> dict[str, Any]:
    try:
        records = _records()
        config_error = None
    except RuntimeError as exc:
        records = tuple()
        config_error = str(exc)
    return {'enabled': _enabled(), 'configured_keys': len(records), 'configuration_valid': config_error is None, 'configuration_error': config_error, 'authentication': 'x-ajn-api-key', 'secret_storage': 'sha256-only', 'supported_scopes': ['read', 'convert', 'recognized_text', 'sign']}

def require_api_scope(principal: APIPrincipal, required_scope: str) -> None:
    required = required_scope.strip().lower()
    if required and required not in principal.scopes:
        raise APIAccessError(403, f"This API key does not have the required '{required}' scope.", 'API_SCOPE_REQUIRED')

def authenticate_api_key(raw_secret: str | None, required_scope: str) -> APIPrincipal:
    if not _enabled():
        raise APIAccessError(503, 'The AJN PDF public API is not enabled on this deployment.', 'API_DISABLED')
    try:
        records = _records()
    except RuntimeError as exc:
        raise APIAccessError(503, 'The AJN PDF public API authentication configuration is invalid.', 'API_AUTH_CONFIG_INVALID') from exc
    if not records:
        raise APIAccessError(503, 'No AJN PDF public API keys are configured.', 'API_KEYS_NOT_CONFIGURED')
    supplied = str(raw_secret or '').strip()
    if len(supplied) < 24:
        raise APIAccessError(401, 'A valid X-AJN-API-Key header is required.', 'API_KEY_REQUIRED')
    supplied_digest = hash_api_key(supplied)
    matched: dict[str, Any] | None = None
    for record in records:
        if hmac.compare_digest(supplied_digest, str(record['secret_sha256'])):
            matched = record
            break
    if matched is None:
        raise APIAccessError(401, 'The AJN PDF API key is invalid.', 'API_KEY_INVALID')
    principal = APIPrincipal(key_id=str(matched['id']), scopes=frozenset((str(scope) for scope in matched['scopes'])), rate_per_minute=int(matched['rate_per_minute']))
    require_api_scope(principal, required_scope)
    return principal

async def enforce_api_rate_limit(principal: APIPrincipal) -> APIRateState:
    now = time.monotonic()
    cutoff = now - 60.0
    async with _API_RATE_LOCK:
        bucket = _API_BUCKETS[principal.key_id]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= principal.rate_per_minute:
            reset_seconds = max(1, int(60 - (now - bucket[0]))) if bucket else 60
            raise APIAccessError(429, 'This API key has reached its per-minute request limit.', 'API_RATE_LIMITED')
        bucket.append(now)
        remaining = max(0, principal.rate_per_minute - len(bucket))
        reset_seconds = max(1, int(60 - (now - bucket[0]))) if bucket else 60
        if len(_API_BUCKETS) > 5000:
            stale = [key for key, values in _API_BUCKETS.items() if not values or values[-1] < cutoff]
            for key in stale[:1000]:
                _API_BUCKETS.pop(key, None)
    return APIRateState(limit=principal.rate_per_minute, remaining=remaining, reset_seconds=reset_seconds)
