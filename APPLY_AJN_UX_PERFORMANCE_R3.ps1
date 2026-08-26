$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

Write-Host "====================================================" -ForegroundColor DarkCyan
Write-Host " AJN PDF UX + PERFORMANCE + WORKFLOW R3" -ForegroundColor Cyan
Write-Host " Skeleton loading / processing feedback / build fix" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor DarkCyan

$LayoutPath = Join-Path $Root "src\app\layout.tsx"
$DockerPath = Join-Path $Root "backend\Dockerfile"

if (-not (Test-Path -LiteralPath $LayoutPath)) {
    throw "src\app\layout.tsx was not found."
}
if (-not (Test-Path -LiteralPath $DockerPath)) {
    throw "backend\Dockerfile was not found."
}

# ----------------------------
# Mount the global processing UI
# ----------------------------
$Layout = Get-Content -LiteralPath $LayoutPath -Raw

$Import = 'import { ProcessingActivityProvider } from "@/components/ajnpdf/processing-activity-provider";'

if (-not $Layout.Contains("ProcessingActivityProvider")) {
    # Prepending a server-safe import does not turn the root layout into a Client Component.
    $Layout = $Import + [Environment]::NewLine + $Layout
}

if (-not $Layout.Contains("<ProcessingActivityProvider")) {
    $BodyRegex = [regex]::new('<body\b[^>]*>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $Match = $BodyRegex.Match($Layout)
    if (-not $Match.Success) {
        throw "Could not locate the <body> tag in src\app\layout.tsx."
    }

    $Injection = $Match.Value + [Environment]::NewLine + "        <ProcessingActivityProvider />"
    $Layout = $Layout.Substring(0, $Match.Index) + $Injection + $Layout.Substring($Match.Index + $Match.Length)
}

[System.IO.File]::WriteAllText(
    $LayoutPath,
    $Layout,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PASS: ProcessingActivityProvider mounted in root layout." -ForegroundColor Green

# ----------------------------
# Correct Docker build/runtime verification boundary
# ----------------------------
$Docker = Get-Content -LiteralPath $DockerPath -Raw

# HTTP tests require a running Uvicorn service. Remove them only from Docker build RUN chains.
$Docker = [regex]::Replace(
    $Docker,
    '(?m)^\s*&&\s*python\s+smoke_test\.py\s*\\\s*$\r?\n?',
    ''
)
$Docker = [regex]::Replace(
    $Docker,
    '(?m)^\s*&&\s*python\s+capability_audit\.py\s*\\\s*$\r?\n?',
    ''
)

# Handle older single-line variants defensively.
$Docker = $Docker.Replace('python smoke_test.py     && ', '')
$Docker = $Docker.Replace('python capability_audit.py     && ', '')

# Ensure compile/import/direct-acceptance checks remain at build time.
if ($Docker -notmatch 'python\s+-m\s+compileall\s+-q\s+app') {
    $Anchor = 'RUN python -c "from app.main import app;'
    $Index = $Docker.IndexOf($Anchor)
    if ($Index -ge 0) {
        $Docker = $Docker.Insert($Index, "RUN python -m compileall -q app`n`n")
    }
}

if ($Docker -notmatch 'python\s+full_acceptance_test\.py') {
    throw "full_acceptance_test.py was not found in backend\Dockerfile. Refusing to weaken the backend build gate."
}

[System.IO.File]::WriteAllText(
    $DockerPath,
    $Docker,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PASS: Docker build now keeps HTTP tests for runtime/post-deploy only." -ForegroundColor Green

# ----------------------------
# Source verification
# ----------------------------
node .\scripts\verify-ux-performance-r3.mjs
if ($LASTEXITCODE -ne 0) {
    throw "R3 UX/performance verification failed."
}

if (Test-Path ".\scripts\verify-backend-workflow.mjs") {
    node .\scripts\verify-backend-workflow.mjs
    if ($LASTEXITCODE -ne 0) { throw "Backend workflow verification failed." }
}

if (Test-Path ".\scripts\verify-conversions.mjs") {
    node .\scripts\verify-conversions.mjs
    if ($LASTEXITCODE -ne 0) { throw "Conversion verification failed." }
}

if (Test-Path ".\scripts\verify-code-quality.mjs") {
    node .\scripts\verify-code-quality.mjs
    if ($LASTEXITCODE -ne 0) { throw "Code quality verification failed." }
}

Write-Host ""
Write-Host "R3 source update applied successfully." -ForegroundColor Green
Write-Host "Next recommended local gates:" -ForegroundColor Yellow
Write-Host "  npm run lint"
Write-Host "  npm run typecheck"
Write-Host "  npm run build"
