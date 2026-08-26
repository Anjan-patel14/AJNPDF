from __future__ import annotations
import hashlib
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import fitz
import pikepdf
from PIL import Image, UnidentifiedImageError
MAX_SIGNATURE_PIXELS = 20000000
MAX_SIGNATURE_BYTES = 8 * 1024 * 1024
CONSENT_TEXT = 'I intend to sign this document electronically and agree that my electronic signature is associated with this document.'

def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def _clean(value: object, maximum: int) -> str:
    return re.sub('\\s+', '', str(value or '').replace('\x00', '')).strip()[:maximum]

def _validate_signature(path: Path) -> None:
    if not path.exists() or path.stat().st_size <= 0:
        raise ValueError('The signature image is empty.')
    if path.stat().st_size > MAX_SIGNATURE_BYTES:
        raise ValueError('The signature image is larger than 8 MB.')
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            if image.format not in {'PNG', 'JPEG'}:
                raise ValueError('The signature image must be PNG or JPG.')
            if image.width * image.height > MAX_SIGNATURE_PIXELS:
                raise ValueError('The signature image dimensions are too large.')
    except ValueError:
        raise
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError('The signature image is not readable.') from exc

def electronic_sign(source: Path, signature: Path, target: Path, evidence_output: Path, options: dict[str, Any], workdir: Path) -> None:
    signer_name = _clean(options.get('signer_name'), 120)
    signer_email = _clean(options.get('signer_email'), 180)
    reason = _clean(options.get('reason'), 300) or 'I approve and sign this document.'
    consented = bool(options.get('consented', False))
    if not signer_name:
        raise ValueError('Signer name is required.')
    if not re.fullmatch('[^\\s@]+@[^\\s@]+\\.[^\\s@]+', signer_email):
        raise ValueError('A valid signer email address is required.')
    if not consented:
        raise ValueError('Electronic-signature consent must be confirmed.')
    _validate_signature(signature)
    original_sha256 = _sha256(source)
    signature_sha256 = _sha256(signature)
    evidence_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    interim = workdir / 'signed-content.pdf'
    with fitz.open(source) as document:
        if document.page_count < 1:
            raise ValueError('The PDF contains no pages.')
        if document.needs_pass:
            raise ValueError('Unlock the PDF before electronic signing.')
        requested_page = int(options.get('page', 1) or 1)
        if requested_page < 1 or requested_page > document.page_count:
            raise ValueError(f'Signature page must be between 1 and{document.page_count}.')
        page = document[requested_page - 1]
        page_width = float(page.rect.width)
        page_height = float(page.rect.height)
        width = max(30.0, min(page_width, float(options.get('width', 165) or 165)))
        height = max(18.0, min(page_height, float(options.get('height', 78) or 78)))
        x = max(0.0, min(page_width - width, float(options.get('x', 72) or 0)))
        y = max(0.0, min(page_height - height, float(options.get('y', 72) or 0)))
        rect = fitz.Rect(x, y, x + width, y + height)
        page.insert_image(rect, filename=str(signature), keep_proportion=True, overlay=True)
        caption = f'Electronically signed by{signer_name}•{created_at[:10]}UTC'
        caption_y = min(page_height - 4, y + height + 9)
        page.insert_text((x, caption_y), caption[:160], fontsize=6.5, color=(0.2, 0.24, 0.31), overlay=True)
        metadata = document.metadata or {}
        metadata['producer'] = 'AJN PDF'
        metadata['creator'] = 'AJN PDF Electronic Signature API'
        metadata['subject'] = f'Electronic signature evidence{evidence_id}'
        metadata['keywords'] = f'AJN PDF,electronic signature,evidence,{evidence_id}'
        document.set_metadata(metadata)
        document.save(interim, garbage=4, deflate=True, clean=True)
    signed_content_sha256 = _sha256(interim)
    embedded_evidence = {'version': '1.0', 'evidence_id': evidence_id, 'created_at_utc': created_at, 'product': 'AJN PDF', 'signature_type': 'electronic-signature', 'certificate_signature': False, 'signer': {'name': signer_name, 'email': signer_email}, 'intent': {'consented': True, 'consent_text': CONSENT_TEXT, 'reason': reason}, 'document': {'original_filename': _clean(options.get('original_filename') or source.name, 200), 'original_sha256': original_sha256, 'signed_content_sha256': signed_content_sha256, 'final_pdf_sha256': None, 'final_hash_note': 'The companion evidence JSON contains the hash of the final PDF after this evidence file is embedded.'}, 'signature': {'source': _clean(options.get('signature_source') or 'upload', 20), 'signature_image_sha256': signature_sha256, 'coordinate_system': 'PDF page points, top-left origin', 'page': requested_page, 'x': x, 'y': y, 'width': width, 'height': height}, 'notice': 'This is an AJN PDF evidence-backed electronic signature, not a certificate-backed PAdES digital signature.'}
    evidence_bytes = json.dumps(embedded_evidence, ensure_ascii=False, indent=2).encode('utf-8')
    with pikepdf.open(interim) as pdf:
        pdf.attachments['ajn-signature-evidence.json'] = pikepdf.AttachedFileSpec(pdf, evidence_bytes, description='AJN PDF electronic signature evidence manifest', filename='ajn-signature-evidence.json', mime_type='application/json')
        pdf.save(target)
    final_sha256 = _sha256(target)
    companion = json.loads(json.dumps(embedded_evidence))
    companion['document']['final_pdf_sha256'] = final_sha256
    companion['document'].pop('final_hash_note', None)
    evidence_output.write_text(json.dumps(companion, ensure_ascii=False, indent=2), encoding='utf-8')
    interim.unlink(missing_ok=True)
