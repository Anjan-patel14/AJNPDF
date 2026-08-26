from __future__ import annotations
import tempfile
import zipfile
from pathlib import Path
import fitz
from PIL import Image
from app.conversion_engine import SPECS, tool_available, validate_output_file
from app.processing_quality import run_conversion
XPS_CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"> <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/> <Default Extension="fdseq" ContentType="application/vnd.ms-package.xps-fixeddocumentsequence+xml"/> <Default Extension="fdoc" ContentType="application/vnd.ms-package.xps-fixeddocument+xml"/> <Default Extension="fpage" ContentType="application/vnd.ms-package.xps-fixedpage+xml"/>\n</Types>'
XPS_ROOT_RELS = '<?xml version="1.0" encoding="UTF-8"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"> <Relationship Id="R1" Type="http://schemas.microsoft.com/xps/2005/06/fixedrepresentation" Target="/FixedDocSeq.fdseq"/>\n</Relationships>'
XPS_SEQUENCE = '<?xml version="1.0" encoding="UTF-8"?>\n<FixedDocumentSequence xmlns="http://schemas.microsoft.com/xps/2005/06"> <DocumentReference Source="Documents/1/FixedDoc.fdoc"/>\n</FixedDocumentSequence>'
XPS_DOCUMENT = '<?xml version="1.0" encoding="UTF-8"?>\n<FixedDocument xmlns="http://schemas.microsoft.com/xps/2005/06"> <PageContent Source="Pages/1.fpage" Width="816" Height="1056"/>\n</FixedDocument>'
XPS_PAGE = '<?xml version="1.0" encoding="UTF-8"?>\n<FixedPage xmlns="http://schemas.microsoft.com/xps/2005/06" Width="816" Height="1056" xml:lang="en-US"> <Path Fill="#FFFFFFFF" Data="M 0,0 L 816,0 816,1056 0,1056 Z"/> <Path Fill="#FF2563EB" Data="M 90,100 L 650,100 650,260 90,260 Z"/> <Path Fill="#FF10B981" Data="M 90,320 L 470,320 470,500 90,500 Z"/>\n</FixedPage>'

def _make_xps(path: Path) -> None:
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml', XPS_CONTENT_TYPES)
        archive.writestr('_rels/.rels', XPS_ROOT_RELS)
        archive.writestr('FixedDocSeq.fdseq', XPS_SEQUENCE)
        archive.writestr('Documents/1/FixedDoc.fdoc', XPS_DOCUMENT)
        archive.writestr('Documents/1/Pages/1.fpage', XPS_PAGE)

def _make_pdf(path: Path) -> None:
    document = fitz.open()
    try:
        page = document.new_page(width=595, height=842)
        page.draw_rect(fitz.Rect(60, 60, 520, 230), color=(0.15, 0.39, 0.92), fill=(0.15, 0.39, 0.92))
        page.draw_rect(fitz.Rect(60, 280, 380, 470), color=(0.06, 0.72, 0.51), fill=(0.06, 0.72, 0.51))
        page.insert_text((70, 540), 'AJN PDF HARD FORMAT ACCEPTANCE', fontsize=18)
        document.save(path)
    finally:
        document.close()

def _run_image_codec(tool_id: str, source: Path, root: Path, expected_suffix: str, expected_formats: set[str]) -> None:
    spec = SPECS[tool_id]
    available, reason = tool_available(spec)
    if not available:
        print(f'SKIP:{tool_id}—{reason}')
        return
    workdir = root / tool_id
    workdir.mkdir()
    output = workdir / f'result{spec.output_extension}'
    run_conversion(spec, [source], output, {'dpi': 100, 'quality': 80, 'pages': '1'}, workdir, None)
    validate_output_file(output, spec.output_extension)
    if not zipfile.is_zipfile(output):
        raise AssertionError(f'{tool_id}did not return the expected ZIP container')
    extract_dir = workdir / 'decoded'
    extract_dir.mkdir()
    with zipfile.ZipFile(output) as archive:
        names = archive.namelist()
        if not names or any((not name.lower().endswith(expected_suffix) for name in names)):
            raise AssertionError(f'{tool_id}returned wrong member names:{names!r}')
        archive.extractall(extract_dir)
    for name in names:
        path = extract_dir / name
        with Image.open(path) as image:
            image.load()
            actual = str(image.format or '').upper()
            if actual not in expected_formats:
                raise AssertionError(f'{tool_id}member{name}decoded as{actual}, expected{sorted(expected_formats)}')
            if image.width < 1 or image.height < 1:
                raise AssertionError(f'{tool_id}member{name}has invalid dimensions')
    print(f"PASS:{tool_id}real codec output —{','.join(names)}")

def main() -> None:
    with tempfile.TemporaryDirectory(prefix='ajn-hard-format-') as temporary:
        root = Path(temporary)
        source_pdf = root / 'sample.pdf'
        _make_pdf(source_pdf)
        _run_image_codec('pdf-to-avif', source_pdf, root, '.avif', {'AVIF'})
        _run_image_codec('pdf-to-heic', source_pdf, root, '.heic', {'HEIF', 'HEIC'})
        xps_spec = SPECS['xps-to-pdf']
        available, reason = tool_available(xps_spec)
        if not available:
            print(f'SKIP: xps-to-pdf —{reason}')
        else:
            xps = root / 'sample.xps'
            _make_xps(xps)
            workdir = root / 'xps'
            workdir.mkdir()
            output = workdir / 'result.pdf'
            run_conversion(xps_spec, [xps], output, {}, workdir, None)
            validate_output_file(output, '.pdf')
            with fitz.open(output) as document:
                if document.page_count != 1:
                    raise AssertionError(f'XPS conversion returned{document.page_count}pages, expected 1')
                pixmap = document[0].get_pixmap(matrix=fitz.Matrix(0.5, 0.5), alpha=False)
                if pixmap.width < 100 or pixmap.height < 100:
                    raise AssertionError('XPS conversion produced an invalid rendered page')
            print('PASS: xps-to-pdf real generated XPS package -> valid PDF')
    print('PASS: AJN PDF hard-format acceptance completed')
if __name__ == '__main__':
    main()
