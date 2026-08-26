from __future__ import annotations
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from app.conversion_engine import list_backend_tools
from app.main import VERSION
ROOT = Path(__file__).resolve().parents[1]
TARGETS = [ROOT / 'src' / 'generated' / 'backend-capabilities.json', ROOT / 'public' / 'backend-capabilities.json']
SCHEMA_VERSION = 2

def _validate(tools: list[dict]) -> None:
    if len(tools) < 78:
        raise RuntimeError(f'Capability export is incomplete: expected at least 78 backend tools, received{len(tools)}.')
    ids = [str(tool.get('id') or '') for tool in tools]
    if any((not tool_id for tool_id in ids)):
        raise RuntimeError('Capability export contains a record without an id.')
    if len(ids) != len(set(ids)):
        raise RuntimeError('Capability export contains duplicate tool ids.')
    required = {'protect-pdf', 'unlock-pdf', 'repair-pdf', 'docx-to-pdf', 'pptx-to-pdf', 'pdf-to-docx'}
    missing = sorted(required.difference(ids))
    if missing:
        raise RuntimeError(f"Capability export is missing required backend tools:{','.join(missing)}")
    invalid: list[str] = []
    for tool in tools:
        tool_id = str(tool.get('id') or 'unknown')
        for key in ('name', 'category', 'inputExtensions', 'outputExtension', 'available', 'multiFile'):
            if key not in tool:
                invalid.append(f'{tool_id}:{key}')
        if tool.get('available') is False and (not str(tool.get('unavailableReason') or '').strip()):
            invalid.append(f'{tool_id}:unavailableReason')
    if invalid:
        raise RuntimeError(f"Capability export contains invalid records:{','.join(invalid[:20])}")

def _atomic_write(target: Path, payload: dict) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, indent=2, ensure_ascii=False) + ''
    temporary = target.with_suffix(target.suffix + '.tmp')
    temporary.write_text(serialized, encoding='utf-8')
    os.replace(temporary, target)

def main() -> None:
    tools = list_backend_tools()
    _validate(tools)
    stable_tools = sorted(tools, key=lambda tool: str(tool.get('id') or ''))
    fingerprint_source = json.dumps(stable_tools, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    fingerprint = hashlib.sha256(fingerprint_source.encode('utf-8')).hexdigest()
    available = sum((1 for tool in stable_tools if tool.get('available')))
    payload = {'schemaVersion': SCHEMA_VERSION, 'generatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'), 'backendVersion': VERSION, 'toolCount': len(stable_tools), 'availableCount': available, 'unavailableCount': len(stable_tools) - available, 'capabilityFingerprint': fingerprint, 'tools': stable_tools}
    for target in TARGETS:
        _atomic_write(target, payload)
    print(f'PASS: deployment capability manifest exported with{available}/{len(stable_tools)}available backend tools; fingerprint{fingerprint[:12]}')
if __name__ == '__main__':
    main()
