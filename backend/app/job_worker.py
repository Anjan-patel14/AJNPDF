from __future__ import annotations
import json
import sys
import traceback
from pathlib import Path
import pikepdf
from .conversion_engine import SPECS, convert as legacy_convert, validate_input_files, validate_output_file
from .e_signature_service import electronic_sign
from .image_pdf_quality import images_to_pdf
from .processing_quality import run_conversion

def _write(payload: dict[str, object]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()

def main() -> int:
    try:
        payload = json.load(sys.stdin)
        operation = str(payload.get('operation', 'conversion'))
        if operation == 'conversion':
            tool_id = str(payload['tool_id'])
            spec = SPECS.get(tool_id)
            if spec is None:
                raise ValueError('This conversion tool is not registered.')
            files = [Path(value) for value in payload.get('files', [])]
            output = Path(str(payload['output']))
            workdir = Path(str(payload['workdir']))
            options = payload.get('options') or {}
            if not isinstance(options, dict):
                raise ValueError('Conversion options must be a JSON object.')
            source_url = payload.get('source_url')
            resolved_url = str(source_url) if source_url else None
            if spec.processor in {'images_to_pdf', 'scan_images_pdf'}:
                if any((path.suffix.lower() == '.svg' for path in files)):
                    legacy_convert(spec, files, output, options, workdir, resolved_url)
                else:
                    validate_input_files(spec, files)
                    images_to_pdf(files, output, options, scan=spec.processor == 'scan_images_pdf')
                    validate_output_file(output, spec.output_extension)
            else:
                run_conversion(spec, files, output, options, workdir, resolved_url)
        elif operation == 'electronic_sign':
            source = Path(str(payload['source']))
            signature = Path(str(payload['signature']))
            target = Path(str(payload['target']))
            evidence_output = Path(str(payload['evidence_output']))
            workdir = Path(str(payload['workdir']))
            options = payload.get('options') or {}
            if not isinstance(options, dict):
                raise ValueError('Electronic-signature options must be a JSON object.')
            electronic_sign(source, signature, target, evidence_output, options, workdir)
        elif operation == 'protect':
            source = Path(str(payload['source']))
            target = Path(str(payload['target']))
            permissions = pikepdf.Permissions(**dict(payload.get('permissions') or {}))
            with pikepdf.open(source) as pdf:
                pdf.save(target, encryption=pikepdf.Encryption(user=str(payload.get('user_password', '')), owner=str(payload.get('owner_password', '')), R=6, aes=True, allow=permissions))
        elif operation == 'unlock':
            source = Path(str(payload['source']))
            target = Path(str(payload['target']))
            with pikepdf.open(source, password=str(payload.get('password', ''))) as pdf:
                pdf.save(target)
        elif operation == 'repair':
            source = Path(str(payload['source']))
            target = Path(str(payload['target']))
            with pikepdf.open(source, attempt_recovery=True) as pdf:
                pdf.save(target, object_stream_mode=pikepdf.ObjectStreamMode.generate)
        elif operation == 'compress':
            source = Path(str(payload['source']))
            target = Path(str(payload['target']))
            with pikepdf.open(source) as pdf:
                pdf.remove_unreferenced_resources()
                pdf.save(target, object_stream_mode=pikepdf.ObjectStreamMode.generate, compress_streams=True, recompress_flate=True)
        else:
            raise ValueError('Unknown processing operation.')
        _write({'ok': True})
        return 0
    except Exception as exc:
        _write({'ok': False, 'type': type(exc).__name__, 'message': str(exc) or 'Processing failed.', 'trace': traceback.format_exc(limit=4)})
        return 2
if __name__ == '__main__':
    raise SystemExit(main())
