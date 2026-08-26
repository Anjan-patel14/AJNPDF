$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

$Target = Join-Path $Root "backend\app\conversion_engine.py"
if (-not (Test-Path -LiteralPath $Target)) {
    throw "backend\app\conversion_engine.py was not found."
}

$Text = Get-Content -LiteralPath $Target -Raw

$Old = @'
    windows_candidates = {
        "calibre": [Path(r"C:\Program Files\Calibre2\ebook-convert.exe")],
        "": [Path(r"C:\Program Files\-\.exe")],
        "mutool": [Path(r"C:\Program Files\MuPDF\mutool.exe")],
    }.get(name, [])
    if name == "mutool":
        windows_candidates.extend(sorted(Path(r"C:\Program Files\gs").glob(r"gs*\bin\gswin64c.exe"), reverse=True))
        windows_candidates.extend(sorted(Path(r"C:\Program Files\Artifex Software").glob(r"**\mutool.exe"), reverse=True))
    for candidate in windows_candidates:
        if candidate.exists():
            return str(candidate)
    return None
'@

$New = @'
    # Windows-only fallback search. On Linux/Cloud Run, never interpret
    # Windows drive paths or Windows glob patterns. If shutil.which() above
    # did not find the dependency, return unavailable cleanly.
    if os.name == "nt":
        windows_candidates = {
            "calibre": [Path(r"C:\Program Files\Calibre2\ebook-convert.exe")],
            "": [Path(r"C:\Program Files\-\.exe")],
            "mutool": [Path(r"C:\Program Files\MuPDF\mutool.exe")],
        }.get(name, [])

        if name == "mutool":
            windows_candidates.extend(
                sorted(
                    Path(r"C:\Program Files\gs").glob("gs*/bin/gswin64c.exe"),
                    reverse=True,
                )
            )
            windows_candidates.extend(
                sorted(
                    Path(r"C:\Program Files\Artifex Software").rglob("mutool.exe"),
                    reverse=True,
                )
            )

        for candidate in windows_candidates:
            if candidate.exists():
                return str(candidate)

    return None
'@

if ($Text.Contains($Old)) {
    $Text = $Text.Replace($Old, $New)
    [System.IO.File]::WriteAllText(
        $Target,
        $Text,
        (New-Object System.Text.UTF8Encoding($false))
    )
}
elseif ($Text.Contains('if os.name == "nt":') -and
        $Text.Contains('Path(r"C:\Program Files\Artifex Software").rglob("mutool.exe")')) {
    Write-Host "Platform fix already applied." -ForegroundColor Yellow
}
else {
    throw "Expected command_path block was not found."
}

# Local verification must NOT import conversion_engine because the Windows
# frontend workstation does not need all backend Python dependencies installed.
# Docker/Cloud Build owns the real import + dependency + conversion acceptance.
python -m py_compile $Target
if ($LASTEXITCODE -ne 0) {
    throw "conversion_engine.py syntax compilation failed."
}

$Updated = Get-Content -LiteralPath $Target -Raw
if (-not $Updated.Contains('if os.name == "nt":')) {
    throw "Windows platform guard is missing."
}
if ($Updated.Contains('glob(r"**\mutool.exe")')) {
    throw "Invalid POSIX-breaking mutool glob is still present."
}
if (-not $Updated.Contains('.rglob("mutool.exe")')) {
    throw "Safe Windows recursive mutool lookup is missing."
}

Write-Host "PASS: source syntax verified without importing backend-only dependencies." -ForegroundColor Green
Write-Host "PASS: Windows fallback is platform-gated." -ForegroundColor Green
Write-Host "PASS: Linux will return unavailable cleanly when mutool is absent." -ForegroundColor Green

if (Test-Path ".\scripts\verify-conversions.mjs") {
    node .\scripts\verify-conversions.mjs
    if ($LASTEXITCODE -ne 0) {
        throw "Conversion registry verification failed."
    }
}

Write-Host "AJN PDF R3.1.1 LOCAL VERIFY FIX PASSED" -ForegroundColor Green
