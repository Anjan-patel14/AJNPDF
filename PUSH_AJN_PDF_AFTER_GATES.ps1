param(
    [string]$Message = 'Production gates 2-15: SEO, reliability and release hardening'
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path '.git')) {
    throw 'This folder is not a Git clone. Copy/sync these updated files into your Anjan-patel14/AJNPDF clone first, then run this script there.'
}

$ReportPath = Join-Path $PSScriptRoot 'reports\AJN_GATES_2_15_REPORT.json'
if (-not (Test-Path $ReportPath)) {
    throw 'Gate report missing. Run .\RUN_AJN_PDF_GATES_2_15.ps1 first.'
}
$Report = Get-Content $ReportPath -Raw | ConvertFrom-Json
if (-not $Report.pass -or $Report.mode -ne 'full') {
    throw 'Full Gates 2-15 are not PASS. Push is blocked.'
}

$KEY = "$env:USERPROFILE\.ssh\id_ed25519_ajnpdf"
if (-not (Test-Path $KEY)) { throw "SSH key not found: $KEY" }
$env:GIT_SSH_COMMAND = "ssh -i `"$KEY`" -o IdentitiesOnly=yes"
$REMOTE_URL = 'git@github.com:Anjan-patel14/AJNPDF.git'

Write-Host "`n=== VERIFY SSH ===" -ForegroundColor Cyan
& ssh -i $KEY -o IdentitiesOnly=yes -T git@github.com
if ($LASTEXITCODE -notin @(0,1)) { throw 'GitHub SSH authentication failed.' }

Write-Host "`n=== SET PRODUCTION REMOTE ===" -ForegroundColor Cyan
$remotes = @(& git remote)
if ($remotes -contains 'production') { & git remote set-url production $REMOTE_URL }
else { & git remote add production $REMOTE_URL }
& git remote -v

Write-Host "`n=== STAGE VERIFIED SOURCE ===" -ForegroundColor Cyan
& git add -A
& git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'git diff --check failed.' }

& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    & git commit -m $Message
    if ($LASTEXITCODE -ne 0) { throw 'Commit failed.' }
} else {
    Write-Host 'No new source changes to commit.' -ForegroundColor Yellow
}

Write-Host "`n=== PUSH WITHOUT FORCE ===" -ForegroundColor Cyan
& git push production HEAD:main
if ($LASTEXITCODE -ne 0) { throw 'Push rejected/failed. Do not force-push; inspect the remote changes first.' }

$LOCAL = (& git rev-parse HEAD).Trim()
$LIVE = ((& git ls-remote production refs/heads/main) -split "`t")[0].Trim()
Write-Host "Local       : $LOCAL"
Write-Host "GitHub LIVE : $LIVE"
if ($LOCAL -ne $LIVE) { throw 'GitHub hash mismatch after push.' }

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host ' AJN PDF PRODUCTION SOURCE PUSH VERIFIED' -ForegroundColor Green
Write-Host ' Repository: Anjan-patel14/AJNPDF' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host "After Vercel finishes deploying this commit, run:" -ForegroundColor Yellow
Write-Host '  .\RUN_AJN_PDF_GATES_2_15.ps1 -SkipInstall -SkipPlaywright -Live' -ForegroundColor Yellow
