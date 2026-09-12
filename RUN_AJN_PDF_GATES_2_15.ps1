param(
    [switch]$Live,
    [switch]$SkipInstall,
    [switch]$SkipPlaywright,
    [switch]$RequireDocker
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Reports = Join-Path $PSScriptRoot 'reports'
New-Item -ItemType Directory -Force -Path $Reports | Out-Null
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Transcript = Join-Path $Reports "AJN_GATES_2_15_$Stamp.log"
Start-Transcript -Path $Transcript -Force | Out-Null

try {
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ' AJN PDF :: PRODUCTION GATES 2-15' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js is not installed or not in PATH.'
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw 'npm is not installed or not in PATH.'
    }

    $NodeRaw = (& node -p "process.versions.node").Trim()
    $NodeVersion = [version]$NodeRaw
    Write-Host "Node: $NodeRaw"
    if ($NodeVersion.Major -lt 22 -or ($NodeVersion.Major -eq 22 -and $NodeVersion.Minor -lt 12) -or $NodeVersion.Major -ge 25) {
        throw "AJN PDF requires Node >=22.12.0 and <25. Found $NodeRaw"
    }

    $Listener = Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue
    if ($Listener) {
        throw 'Port 9002 is already in use. Close the existing AJN PDF/Next.js localhost process and run again.'
    }

    if (-not $SkipInstall) {
        Write-Host "`n=== CLEAN DEPENDENCY INSTALL ===" -ForegroundColor Cyan
        & npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm ci FAILED' }
    }

    if (-not $SkipPlaywright) {
        Write-Host "`n=== PLAYWRIGHT CHROMIUM ===" -ForegroundColor Cyan
        & npx playwright install chromium
        if ($LASTEXITCODE -ne 0) { throw 'Playwright Chromium install FAILED' }
    }

    Write-Host "`n=== FULL GATES 2-15 ===" -ForegroundColor Cyan
    & npm run verify:gates:full
    if ($LASTEXITCODE -ne 0) { throw 'AJN PDF GATES 2-15 FAILED. Fix the first reported gate before pushing.' }

    Write-Host "`n=== BACKEND PYTHON COMPILE ===" -ForegroundColor Cyan
    $Python = Get-Command python -ErrorAction SilentlyContinue
    if ($Python) {
        & python -c "from pathlib import Path; import py_compile; files=sorted(Path('backend').rglob('*.py')); [py_compile.compile(str(f), doraise=True) for f in files]; print(f'PASS: compiled {len(files)} backend Python files')"
        if ($LASTEXITCODE -ne 0) { throw 'Backend Python compile FAILED' }
    } else {
        Write-Host 'SKIP: python not found; backend Python compile was not run.' -ForegroundColor Yellow
    }

    Write-Host "`n=== BACKEND CONTAINER GATE ===" -ForegroundColor Cyan
    $Docker = Get-Command docker -ErrorAction SilentlyContinue
    $DockerReady = $false
    if ($Docker) {
        & docker info *> $null
        $DockerReady = ($LASTEXITCODE -eq 0)
    }
    if ($DockerReady) {
        & docker build --pull --progress=plain -t ajn-pdf-backend-gates ./backend
        if ($LASTEXITCODE -ne 0) { throw 'Backend Docker production gate FAILED' }
    } elseif ($RequireDocker) {
        throw 'Docker is required but Docker Desktop/daemon is not available.'
    } else {
        Write-Host 'SKIP: Docker daemon unavailable. GitHub Actions backend-container-gate must pass before release.' -ForegroundColor Yellow
    }

    if ($Live) {
        Write-Host "`n=== LIVE PRODUCTION GATES ===" -ForegroundColor Cyan
        & npm run verify:gates:live
        if ($LASTEXITCODE -ne 0) { throw 'LIVE PRODUCTION GATES FAILED' }
    } else {
        Write-Host "`nLIVE CHECK NOT RUN. After Vercel/production updates, run:" -ForegroundColor Yellow
        Write-Host '  .\RUN_AJN_PDF_GATES_2_15.ps1 -SkipInstall -SkipPlaywright -Live' -ForegroundColor Yellow
    }

    Write-Host "`n=== FINAL WORKTREE STATUS ===" -ForegroundColor Cyan
    if (Get-Command git -ErrorAction SilentlyContinue) {
        & git status --short 2>$null
    }

    Write-Host "`n============================================================" -ForegroundColor Green
    Write-Host ' AJN PDF GATES 2-15: PASS' -ForegroundColor Green
    Write-Host " Report: reports\AJN_GATES_2_15_REPORT.json" -ForegroundColor Green
    Write-Host " Log   : $Transcript" -ForegroundColor Green
    Write-Host '============================================================' -ForegroundColor Green
}
finally {
    Stop-Transcript -ErrorAction SilentlyContinue | Out-Null
}
