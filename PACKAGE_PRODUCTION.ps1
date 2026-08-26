$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
Set-Location -LiteralPath $Root

if (-not (Test-Path -LiteralPath 'package.json')) { throw 'Run this script from the AJN PDF project root.' }
& node.exe 'scripts\verify-capability-manifest.mjs'
if ($LASTEXITCODE -ne 0) { throw 'Production capability manifest is missing or stale. Run SETUP_FULL_PRODUCTION.ps1 first.' }
$PreviousRuntimeArtifactFlag = $env:AJN_ALLOW_RUNTIME_ARTIFACTS
$env:AJN_ALLOW_RUNTIME_ARTIFACTS = '1'
try {
  & node.exe 'scripts\secret-scan.mjs'
  if ($LASTEXITCODE -ne 0) { throw 'Source secret scan failed.' }
} finally {
  if ($null -eq $PreviousRuntimeArtifactFlag) { Remove-Item Env:AJN_ALLOW_RUNTIME_ARTIFACTS -ErrorAction SilentlyContinue } else { $env:AJN_ALLOW_RUNTIME_ARTIFACTS = $PreviousRuntimeArtifactFlag }
}

$Version = (Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json).version
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Stage = Join-Path $env:TEMP "AJN-PDF-$Version-PRODUCTION-$Stamp"
$Archive = Join-Path $env:USERPROFILE "Downloads\AJN-PDF-$Version-PRODUCTION-CLEAN-$Stamp.zip"
Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $Stage -Force | Out-Null

$ExcludeDirs = @('node_modules','.next','.git','.venv','.venv-test','__pycache__','.vercel','coverage','out','build')
$ExcludeFiles = @('.env.local','*.sqlite3','*.sqlite3-*','*.log','*.tmp','*.pyc','*.zip','FULL_ACCEPTANCE_RESULTS.json','HTTP_ACCEPTANCE_RESULTS.json','npm-debug.log*','yarn-error.log*')
$RoboArgs = @($Root,$Stage,'/E','/R:2','/W:1','/NFL','/NDL','/NJH','/NJS','/NP')
foreach ($dir in $ExcludeDirs) { $RoboArgs += @('/XD',(Join-Path $Root $dir),(Join-Path $Root "backend\$dir")) }
foreach ($file in $ExcludeFiles) { $RoboArgs += @('/XF',$file) }
& robocopy.exe @RoboArgs | Out-Null
if ($LASTEXITCODE -gt 7) { throw "Robocopy failed with exit code $LASTEXITCODE." }

Remove-Item -LiteralPath (Join-Path $Stage 'backend\public_media') -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path (Join-Path $Stage 'backend\public_media') -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $Stage 'backend\public_media\.gitkeep') -Force | Out-Null

Push-Location -LiteralPath $Stage
try {
  & node.exe (Join-Path $Root 'scripts\secret-scan.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Staged production package secret/runtime artifact scan failed.' }
} finally { Pop-Location }

Compress-Archive -Path (Join-Path $Stage '*') -DestinationPath $Archive -CompressionLevel Optimal -Force
Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
if (-not (Test-Path -LiteralPath $Archive) -or (Get-Item -LiteralPath $Archive).Length -lt 100000) { throw 'Production ZIP validation failed.' }
Write-Host "AJN PDF clean production package created: $Archive" -ForegroundColor Green
