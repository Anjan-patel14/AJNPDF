from __future__ import annotations
import hashlib
import json
import tempfile
from pathlib import Path
import fitz
import pikepdf
from PIL import Image, ImageDraw
from app.conversion_engine import validate_output_file
from app.e_signature_service import electronic_sign

def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ajn-sign-acceptance-') as temporary:
        root = Path(temporary)
        source = root / 'source.pdf'
        signature = root / 'signature.png'
        target = root / 'signed.pdf'
        evidence = root / 'evidence.json'
        document = fitz.open()
        try:
            page = document.new_page(width=595, height=842)
            page.insert_text((72, 120), 'AJN PDF ELECTRONIC SIGNATURE ACCEPTANCE', fontsize=18)
            document.save(source)
        finally:
            document.close()
        image = Image.new('RGBA', (700, 220), (255, 255, 255, 0))
        draw = ImageDraw.Draw(image)
        draw.line((40, 140, 200, 60, 360, 150, 620, 50), fill=(25, 35, 60, 255), width=12)
        image.save(signature, 'PNG')
        image.close()
        electronic_sign(source, signature, target, evidence, {'signer_name': 'AJN Acceptance Signer', 'signer_email': 'signer@example.com', 'reason': 'Acceptance test approval', 'consented': True, 'page': 1, 'x': 80, 'y': 220, 'width': 180, 'height': 70, 'original_filename': 'source.pdf', 'signature_source': 'upload'}, root)
        validate_output_file(target, '.pdf')
        payload = json.loads(evidence.read_text(encoding='utf-8'))
        assert payload['signature_type'] == 'electronic-signature'
        assert payload['certificate_signature'] is False
        assert payload['signer']['email'] == 'signer@example.com'
        assert payload['document']['original_sha256'] == _sha256(source)
        assert payload['document']['final_pdf_sha256'] == _sha256(target)
        assert payload['signature']['signature_image_sha256'] == _sha256(signature)
        assert payload['evidence_id']
        with pikepdf.open(target) as pdf:
            assert 'ajn-signature-evidence.json' in pdf.attachments
            embedded = pdf.attachments['ajn-signature-evidence.json'].get_file().read_bytes()
            embedded_payload = json.loads(embedded.decode('utf-8'))
            assert embedded_payload['evidence_id'] == payload['evidence_id']
            assert embedded_payload['document']['final_pdf_sha256'] is None
        with fitz.open(target) as signed:
            assert signed.page_count == 1
            rendered = signed[0].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            assert rendered.width > 100 and rendered.height > 100
            text = signed[0].get_text()
            assert 'Electronically signed by AJN Acceptance Signer' in text
        failed_without_consent = False
        try:
            electronic_sign(source, signature, root / 'should-not-exist.pdf', root / 'should-not-exist.json', {'signer_name': 'AJN Acceptance Signer', 'signer_email': 'signer@example.com', 'consented': False}, root)
        except ValueError as exc:
            failed_without_consent = 'consent' in str(exc).lower()
        assert failed_without_consent, 'Electronic signature accepted a request without explicit consent'
    print('PASS: AJN PDF electronic signature — visible mark, embedded evidence, hashes and consent gate')
if __name__ == '__main__':
    main()
