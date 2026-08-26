from __future__ import annotations
import asyncio
import json
import os
from app.api_access import APIAccessError, authenticate_api_key, clear_api_key_cache, enforce_api_rate_limit, hash_api_key, require_api_scope

def main() -> None:
    secret = 'ajn_live_' + 'A' * 48
    convert_only_secret = 'ajn_live_' + 'C' * 48
    sign_secret = 'ajn_live_' + 'S' * 48
    os.environ['AJN_PUBLIC_API_ENABLED'] = 'true'
    os.environ['AJN_PUBLIC_API_KEYS_JSON'] = json.dumps([{'id': 'acceptance', 'secret_sha256': hash_api_key(secret), 'scopes': ['read', 'convert', 'recognized_text'], 'rate_per_minute': 2}, {'id': 'convert-only', 'secret_sha256': hash_api_key(convert_only_secret), 'scopes': ['read', 'convert'], 'rate_per_minute': 5}, {'id': 'signer', 'secret_sha256': hash_api_key(sign_secret), 'scopes': ['read', 'sign'], 'rate_per_minute': 5}])
    clear_api_key_cache()
    principal = authenticate_api_key(secret, 'recognized_text')
    assert principal.key_id == 'acceptance'
    assert 'convert' in principal.scopes
    assert principal.rate_per_minute == 2
    convert_only = authenticate_api_key(convert_only_secret, 'convert')
    assert convert_only.key_id == 'convert-only'
    signer = authenticate_api_key(sign_secret, 'sign')
    assert signer.key_id == 'signer'
    assert 'sign' in signer.scopes
    try:
        authenticate_api_key('wrong-secret-that-is-long-enough-for-validation', 'read')
    except APIAccessError as exc:
        assert exc.status_code == 401
        assert exc.code == 'API_KEY_INVALID'
    else:
        raise AssertionError('Invalid API key was accepted')
    try:
        authenticate_api_key(secret, 'sign')
    except APIAccessError as exc:
        assert exc.status_code == 403
        assert exc.code == 'API_SCOPE_REQUIRED'
    else:
        raise AssertionError('Missing API scope was accepted')
    try:
        require_api_scope(convert_only, 'recognized_text')
    except APIAccessError as exc:
        assert exc.status_code == 403
        assert exc.code == 'API_SCOPE_REQUIRED'
    else:
        raise AssertionError('Convert-only API key was incorrectly allowed to use')
    from app.platform_routes import _conversion_required_scopes
    assert _conversion_required_scopes('txt-to-pdf') == ('convert',)
    assert _conversion_required_scopes('') == ('convert', 'recognized_text')
    assert _conversion_required_scopes('') == ('convert', 'recognized_text')
    assert _conversion_required_scopes('') == ('convert',)

    async def rate_test() -> None:
        first = await enforce_api_rate_limit(principal)
        second = await enforce_api_rate_limit(principal)
        assert first.limit == 2
        assert second.remaining == 0
        try:
            await enforce_api_rate_limit(principal)
        except APIAccessError as exc:
            assert exc.status_code == 429
            assert exc.code == 'API_RATE_LIMITED'
        else:
            raise AssertionError('API rate limit did not trigger')
    asyncio.run(rate_test())
    from app.main import app
    paths = {route.path for route in app.routes}
    required = {'/api/v1/status', '/api/v1/account', '/api/v1/capabilities', '/api/v1/convert/{tool_id}', '/api/v1/recognized_text/analyze', '/api/v1/recognized_text/text', '/api/v1/recognized_text/searchable-pdf', '/api/v1/sign/electronic', '/api/recognized_text/analyze'}
    missing = sorted(required.difference(paths))
    if missing:
        raise AssertionError(f'API v1 routes are missing:{missing}')
    print('PASS: AJN PDF API v1 hashed-key, compound-scope, rate-limit and route contracts')
if __name__ == '__main__':
    main()
