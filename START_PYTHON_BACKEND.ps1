$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location -LiteralPath (Join-Path $Root "backend")

$py = Get-Command py.exe -ErrorAction SilentlyContinue
if (-not $py) { throw "Python launcher was not found. Install Python 3.12 and enable the py launcher." }

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  & py -3.12 -m venv .venv
  if ($LASTEXITCODE -ne 0) { throw "Unable to create the Python virtual environment." }
}

& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Python pip upgrade failed." }
& ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw "Python backend dependency installation failed." }

$Arguments = @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000')
if (Test-Path -LiteralPath '.env.local') { $Arguments += @('--env-file','.env.local') }
Write-Host "AJN PDF conversion service: http://127.0.0.1:8000" -ForegroundColor Cyan
& ".\.venv\Scripts\python.exe" @Arguments
