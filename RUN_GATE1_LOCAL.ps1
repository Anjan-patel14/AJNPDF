[CmdletBinding()]
param([switch]$VerifyOnly)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$runner = Join-Path $PSScriptRoot 'RUN_EDIT_PDF_LOCAL.ps1'
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) { throw "RUN_EDIT_PDF_LOCAL.ps1 is missing: $runner" }
if ($VerifyOnly) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner -VerifyOnly
} else {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner
}
if ($LASTEXITCODE -ne 0) { throw "AJN PDF Gate 1 local runner failed with exit code $LASTEXITCODE" }
