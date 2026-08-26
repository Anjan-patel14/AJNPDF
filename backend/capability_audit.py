from __future__ import annotations
import json
import os
import urllib.request
BASE_URL = os.getenv('AJN_BACKEND_TEST_URL', 'http://127.0.0.1:8000').rstrip('/')

def _get_json(path: str) -> dict:
    with urllib.request.urlopen(f'{BASE_URL}{path}', timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f'{path}returned HTTP{response.status}.')
        return json.loads(response.read())

def main() -> None:
    health = _get_json('/health')
    ready = _get_json('/ready')
    if health.get('status') != 'ok':
        raise RuntimeError('Backend /health is not OK.')
    if ready.get('status') != 'ok':
        raise RuntimeError('Backend /ready is not OK.')
    payload = _get_json('/api/tools')
    tools = payload.get('tools', [])
    if len(tools) < 78:
        raise RuntimeError(f'Expected at least 78 backend workflows, received{len(tools)}.')
    ids = [tool.get('id') for tool in tools]
    if len(ids) != len(set(ids)):
        raise RuntimeError('Duplicate backend tool IDs were found.')
    invalid = []
    for tool in tools:
        required = ('id', 'name', 'category', 'inputExtensions', 'outputExtension', 'available', 'multiFile', 'processingMode')
        if any((key not in tool for key in required)):
            invalid.append(tool.get('id', 'unknown'))
        if not tool.get('available') and (not tool.get('unavailableReason')):
            invalid.append(f"{tool.get('id')}:missing-unavailable-reason")
    if invalid:
        raise RuntimeError(f"Invalid capability records:{','.join(invalid[:20])}")
    required_ids = {'protect-pdf', 'unlock-pdf', 'repair-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'pdf-to-docx', 'docx-to-pdf', 'pdf-to-xlsx', 'xlsx-to-pdf', 'pdf-to-pptx', 'pptx-to-pdf', 'pdf-to-epub', 'epub-to-pdf'}
    missing = sorted(required_ids.difference(ids))
    if missing:
        raise RuntimeError(f"Required capabilities are missing:{','.join(missing)}")
    available = sum((1 for tool in tools if tool.get('available')))
    unavailable = len(tools) - available
    print(f'PASS:{len(tools)}backend capabilities audited;{available}available and{unavailable}dependency-aware unavailable')
if __name__ == '__main__':
    main()
