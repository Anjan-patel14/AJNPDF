$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

$Target = Join-Path $Root "backend\app\conversion_engine.py"
if (-not (Test-Path -LiteralPath $Target)) {
    throw "backend\app\conversion_engine.py was not found."
}

$Text = Get-Content -LiteralPath $Target -Raw

# -------------------------------------------------------------------
# 1. Add a shared EPUB -> PDF helper before _ebook_external.
# -------------------------------------------------------------------

$Helper = @'
def _epub_to_pdf(source: Path, output: Path) -> None:
    """Render EPUB content with AJN's text-safe ReportLab pipeline.

    This deliberately avoids Calibre's PDF output plugin/Qt WebEngine.
    """
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message=r"In the future version we will turn default option ignore_ncx to True\.",
            category=UserWarning,
            module=r"ebooklib\.epub",
        )
        warnings.filterwarnings(
            "ignore",
            message=r"This search incorrectly ignores the root element, and will be fixed in a future version\..*",
            category=FutureWarning,
            module=r"ebooklib\.epub",
        )
        book = epub.read_epub(str(source), options={"ignore_ncx": True})

    sections: list[str] = []
    for item in book.get_items():
        if item.get_type() == 9:  # ebooklib.ITEM_DOCUMENT
            sections.append(
                _html_to_text(
                    item.get_content().decode("utf-8", errors="replace")
                )
            )

    text = "\n\n".join(section for section in sections if section).strip()
    if not text:
        raise ValueError("The eBook did not contain readable document content.")

    _write_pdf_text(
        [{"page": 1, "text": text, "lines": text.splitlines()}],
        output,
        source.stem,
    )


'@

if (-not $Text.Contains("def _epub_to_pdf(source: Path, output: Path) -> None:")) {
    $Anchor = "def _ebook_external(source: Path, output: Path) -> None:"
    $Index = $Text.IndexOf($Anchor)
    if ($Index -lt 0) {
        throw "_ebook_external helper anchor was not found."
    }
    $Text = $Text.Insert($Index, $Helper)
}

# -------------------------------------------------------------------
# 2. Replace the old inline EPUB -> PDF implementation with helper.
# -------------------------------------------------------------------

$OldEpubBlock = @'
    elif processor == "ebook_to_pdf":
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message=r"In the future version we will turn default option ignore_ncx to True\.",
                category=UserWarning,
                module=r"ebooklib\.epub",
            )
            warnings.filterwarnings(
                "ignore",
                message=r"This search incorrectly ignores the root element, and will be fixed in a future version\..*",
                category=FutureWarning,
                module=r"ebooklib\.epub",
            )
            book = epub.read_epub(str(source), options={"ignore_ncx": True})
        sections = []
        for item in book.get_items():
            if item.get_type() == 9:  # ebooklib.ITEM_DOCUMENT
                sections.append(_html_to_text(item.get_content().decode("utf-8", errors="replace")))
        text = "\n\n".join(section for section in sections if section)
        _write_pdf_text([{"page": 1, "text": text, "lines": text.splitlines()}], output, source.stem)
    elif processor == "ebook_external_to_pdf":
        _ebook_external(source, output)
'@

$NewEpubBlock = @'
    elif processor == "ebook_to_pdf":
        _epub_to_pdf(source, output)
    elif processor == "ebook_external_to_pdf":
        # MOBI/AZW3 -> EPUB via Calibre, then use AJN's own PDF renderer.
        # Direct Calibre -> PDF invokes Qt WebEngine/Chromium and is not
        # reliable in headless/root container build environments.
        intermediate_epub = workdir / f"{source.stem}.intermediate.epub"
        intermediate_epub.unlink(missing_ok=True)
        _ebook_external(source, intermediate_epub)
        if not intermediate_epub.exists() or intermediate_epub.stat().st_size <= 32:
            raise RuntimeError("Calibre did not create a valid intermediate EPUB.")
        _epub_to_pdf(intermediate_epub, output)
'@

if ($Text.Contains($OldEpubBlock)) {
    $Text = $Text.Replace($OldEpubBlock, $NewEpubBlock)
}
elseif (
    $Text.Contains('elif processor == "ebook_external_to_pdf":') -and
    $Text.Contains('intermediate_epub = workdir / f"{source.stem}.intermediate.epub"')
) {
    Write-Host "R3.2 eBook workflow fix is already applied." -ForegroundColor Yellow
}
else {
    throw "Expected EPUB/eBook processing block was not found. Refusing unsafe partial replacement."
}

[System.IO.File]::WriteAllText(
    $Target,
    $Text,
    (New-Object System.Text.UTF8Encoding($false))
)

# -------------------------------------------------------------------
# 3. Local syntax/source verification only.
# Backend dependencies remain Docker-owned.
# -------------------------------------------------------------------

python -m py_compile $Target
if ($LASTEXITCODE -ne 0) {
    throw "conversion_engine.py syntax compilation failed."
}

$Updated = Get-Content -LiteralPath $Target -Raw

if (-not $Updated.Contains("def _epub_to_pdf(source: Path, output: Path) -> None:")) {
    throw "Shared EPUB -> PDF helper is missing."
}
if (-not $Updated.Contains('intermediate_epub = workdir / f"{source.stem}.intermediate.epub"')) {
    throw "Two-stage MOBI/AZW3 -> EPUB -> PDF workflow is missing."
}
if ($Updated.Contains('elif processor == "ebook_external_to_pdf":' + [Environment]::NewLine + '        _ebook_external(source, output)')) {
    throw "Direct external eBook -> PDF workflow still exists."
}

Write-Host "PASS: EPUB -> PDF uses AJN renderer." -ForegroundColor Green
Write-Host "PASS: MOBI/AZW3 -> PDF now uses Calibre -> EPUB -> AJN PDF." -ForegroundColor Green
Write-Host "PASS: Direct Calibre Qt WebEngine PDF rendering removed from these workflows." -ForegroundColor Green

if (Test-Path ".\scripts\verify-conversions.mjs") {
    node .\scripts\verify-conversions.mjs
    if ($LASTEXITCODE -ne 0) {
        throw "Conversion registry verification failed."
    }
}

if (Test-Path ".\scripts\verify-backend-workflow.mjs") {
    node .\scripts\verify-backend-workflow.mjs
    if ($LASTEXITCODE -ne 0) {
        throw "Backend workflow verification failed."
    }
}

Write-Host ""
Write-Host "AJN PDF EBOOK CLOUD RUN FIX R3.2 PASSED" -ForegroundColor Green
