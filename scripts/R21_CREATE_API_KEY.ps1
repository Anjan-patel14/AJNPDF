param(
  [string]$Id = 'developer',
  [string]$Scopes = 'read,convert,sign',
  [ValidateRange(1,600)][int]$Rate = 30
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  throw 'Python is required to generate an AJN API key.'
}

Push-Location $Backend
try {
  Write-Host 'Generating AJN PDF API key...' -ForegroundColor Cyan
  python .\generate_api_key.py --id $Id --scopes $Scopes --rate $Rate
  if ($LASTEXITCODE -ne 0) { throw 'API key generation failed.' }
  Write-Host ''
  Write-Host 'Put only the generated JSON record in AJN_PUBLIC_API_KEYS_JSON on the backend.' -ForegroundColor Yellow
  Write-Host 'Set AJN_PUBLIC_API_ENABLED=true only when you are ready to expose API v1.' -ForegroundColor Yellow
} finally {
  Pop-Location
}
