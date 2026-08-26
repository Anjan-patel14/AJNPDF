from __future__ import annotations
import argparse
import json
import secrets
from app.api_access import hash_api_key

def main() -> None:
    parser = argparse.ArgumentParser(description='Generate an AJN PDF public API key locally.')
    parser.add_argument('--id', default='developer', help='Human-readable key id stored in configuration.')
    parser.add_argument('--scopes', default='read,convert,recognized_text', help='Comma-separated scopes: read,convert,recognized_text,sign')
    parser.add_argument('--rate', type=int, default=30, help='Per-minute request limit for this key.')
    args = parser.parse_args()
    scopes = sorted({value.strip().lower() for value in args.scopes.split(',') if value.strip()})
    allowed = {'read', 'convert', 'recognized_text', 'sign'}
    invalid = sorted(set(scopes).difference(allowed))
    if invalid:
        raise SystemExit(f"Unsupported scope(s):{','.join(invalid)}")
    secret = f'ajn_live_{secrets.token_urlsafe(32)}'
    record = {'id': args.id.strip() or 'developer', 'secret_sha256': hash_api_key(secret), 'scopes': scopes, 'rate_per_minute': max(1, min(600, args.rate))}
    print('AJN PDF API KEY — COPY THE SECRET NOW. IT IS NOT RECOVERABLE FROM THE HASH.')
    print()
    print(f'Secret:{secret}')
    print()
    print('Configuration record (safe to place in AJN_PUBLIC_API_KEYS_JSON):')
    print(json.dumps([record], separators=(',', ':')))
if __name__ == '__main__':
    main()
