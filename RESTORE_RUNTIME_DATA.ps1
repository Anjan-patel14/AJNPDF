param([Parameter(Mandatory=$true)][string]$Archive)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
if (-not (Test-Path -LiteralPath $Archive)) { throw "Backup ZIP was not found: $Archive" }
$Target = Join-Path $Root 'backend'
if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) { throw 'Stop the AJN PDF backend before restoring runtime data.' }
$Stage = Join-Path $env:TEMP ('ajn-pdf-restore-' + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Path $Stage -Force | Out-Null
try {
  Expand-Archive -LiteralPath $Archive -DestinationPath $Stage -Force
  $manifest = Join-Path $Stage 'backup-manifest.json'
  if (-not (Test-Path -LiteralPath $manifest)) { throw 'This archive does not contain an AJN PDF backup manifest.' }
  $meta = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
  if ($meta.product -ne 'AJN PDF') { throw 'Backup manifest does not identify AJN PDF.' }

  foreach ($dbName in @('ajn_analytics.sqlite3','ajn_public_media.sqlite3')) {
    $source = Join-Path $Stage $dbName
    if (Test-Path -LiteralPath $source) {
      $venvPython = Join-Path $Root 'backend\.venv\Scripts\python.exe'
      $pyLauncher = Get-Command py.exe -ErrorAction SilentlyContinue
      if (Test-Path -LiteralPath $venvPython) {
        & $venvPython -c "import sqlite3; c=sqlite3.connect(r'''$source'''); r=c.execute('PRAGMA integrity_check').fetchone()[0]; c.close(); assert r == 'ok', r" | Out-Null
      } elseif ($pyLauncher) {
        & py.exe -3.12 -c "import sqlite3; c=sqlite3.connect(r'''$source'''); r=c.execute('PRAGMA integrity_check').fetchone()[0]; c.close(); assert r == 'ok', r" | Out-Null
      } else {
        throw 'Python is required to validate SQLite backup files before restore.'
      }
      if ($LASTEXITCODE -ne 0) { throw "SQLite integrity validation failed for $dbName." }
    }
  }

  foreach ($name in @('ajn_analytics.sqlite3','ajn_public_media.sqlite3','public_media')) {
    $source = Join-Path $Stage $name
    if (Test-Path -LiteralPath $source) {
      $destination = Join-Path $Target $name
      Remove-Item -LiteralPath $destination -Recurse -Force -ErrorAction SilentlyContinue
      Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
    }
  }
} finally {
  Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host 'AJN PDF runtime data restored and validated. Restart the Python backend.' -ForegroundColor Green
