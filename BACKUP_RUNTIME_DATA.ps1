param([ValidateRange(1,3650)][int]$RetentionDays = 30)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$DataRoot = Join-Path $Root 'backend'
$DestinationRoot = Join-Path $env:USERPROFILE 'Downloads\AJN-PDF-RUNTIME-BACKUPS'
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Stage = Join-Path $env:TEMP "ajn-pdf-runtime-$Stamp"
$Archive = Join-Path $DestinationRoot "AJN-PDF-RUNTIME-$Stamp.zip"
New-Item -ItemType Directory -Path $Stage,$DestinationRoot -Force | Out-Null

$Python = Join-Path $Root 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $Python)) {
  $Py = Get-Command py.exe -ErrorAction SilentlyContinue
  if (-not $Py) { throw 'Python is required for a consistent SQLite backup.' }
  $Python = 'py.exe'
}

foreach ($dbName in @('ajn_analytics.sqlite3','ajn_public_media.sqlite3')) {
  $source = Join-Path $DataRoot $dbName
  if (Test-Path -LiteralPath $source) {
    $destination = Join-Path $Stage $dbName
    $script = "import sqlite3; src=sqlite3.connect(r'''$source'''); dst=sqlite3.connect(r'''$destination'''); src.backup(dst); dst.close(); src.close()"
    if ($Python -eq 'py.exe') { & $Python -3.12 -c $script } else { & $Python -c $script }
    if ($LASTEXITCODE -ne 0) { throw "SQLite backup failed for $dbName." }
  }
}
$MediaSource = Join-Path $DataRoot 'public_media'
if (Test-Path -LiteralPath $MediaSource) { Copy-Item -LiteralPath $MediaSource -Destination (Join-Path $Stage 'public_media') -Recurse -Force }
if (-not (Get-ChildItem -LiteralPath $Stage -Force -ErrorAction SilentlyContinue)) { throw 'No runtime analytics or public-media data was found to back up.' }

@{
  product = 'AJN PDF'
  createdAt = (Get-Date).ToUniversalTime().ToString('o')
  version = '3.1.0-R11'
} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Stage 'backup-manifest.json') -Encoding UTF8

Compress-Archive -Path (Join-Path $Stage '*') -DestinationPath $Archive -Force
if (-not (Test-Path -LiteralPath $Archive) -or (Get-Item -LiteralPath $Archive).Length -lt 100) { throw 'Backup archive validation failed.' }
Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $DestinationRoot -Filter 'AJN-PDF-RUNTIME-*.zip' -File -ErrorAction SilentlyContinue |
  Where-Object { $_.LastWriteTime -lt $Cutoff } |
  Remove-Item -Force -ErrorAction SilentlyContinue
Write-Host "AJN PDF runtime backup created and validated: $Archive" -ForegroundColor Green
Write-Host "Backup retention: $RetentionDays days" -ForegroundColor DarkGreen
