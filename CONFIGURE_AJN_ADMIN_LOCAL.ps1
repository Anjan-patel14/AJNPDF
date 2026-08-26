param(
  [string]$RepoPath = (Get-Location).Path,
  [ValidateSet('None','Analytics','Media')][string]$CopyToken = 'None'
)

$ErrorActionPreference = 'Stop'
$BackendDir = Join-Path $RepoPath 'backend'
$EnvFile = Join-Path $BackendDir '.env.local'
$ExampleFile = Join-Path $BackendDir '.env.example'

if (-not (Test-Path -LiteralPath $BackendDir -PathType Container)) { throw "backend directory was not found: $BackendDir" }

function New-AjnAdminToken {
  $Bytes = New-Object byte[] 32
  $Rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $Rng.GetBytes($Bytes) } finally { $Rng.Dispose() }
  return ([Convert]::ToBase64String($Bytes)).TrimEnd('=').Replace('+','-').Replace('/','_')
}

function Read-EnvMap([string]$Path) {
  $Map = [ordered]@{}
  if (Test-Path -LiteralPath $Path) {
    foreach ($Line in (Get-Content -LiteralPath $Path)) {
      if ($Line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($Line) -or $Line -notmatch '=') { continue }
      $Parts = $Line -split '=',2
      $Map[$Parts[0].Trim()] = $Parts[1]
    }
  }
  return $Map
}

function Is-UsableToken([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
  if ($Value -match 'replace-with|generate-a|change-me|your-token') { return $false }
  return $Value.Trim().Length -ge 32
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  if (Test-Path -LiteralPath $ExampleFile) { Copy-Item -LiteralPath $ExampleFile -Destination $EnvFile }
  else { New-Item -ItemType File -Path $EnvFile -Force | Out-Null }
}

$Map = Read-EnvMap $EnvFile
$Map['AJN_ANALYTICS_ENABLED'] = 'true'
if (-not $Map.Contains('AJN_ANALYTICS_RETENTION_DAYS')) { $Map['AJN_ANALYTICS_RETENTION_DAYS'] = '90' }

$AnalyticsToken = if (Is-UsableToken ([string]$Map['AJN_ANALYTICS_ADMIN_TOKEN'])) { ([string]$Map['AJN_ANALYTICS_ADMIN_TOKEN']).Trim() } else { New-AjnAdminToken }
$MediaToken = if (Is-UsableToken ([string]$Map['AJN_MEDIA_ADMIN_TOKEN'])) { ([string]$Map['AJN_MEDIA_ADMIN_TOKEN']).Trim() } else { New-AjnAdminToken }
if ($AnalyticsToken -eq $MediaToken) { $MediaToken = New-AjnAdminToken }

$Map['AJN_ANALYTICS_ADMIN_TOKEN'] = $AnalyticsToken
$Map['AJN_MEDIA_ADMIN_TOKEN'] = $MediaToken

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Lines = New-Object System.Collections.Generic.List[string]
foreach ($Entry in $Map.GetEnumerator()) { $Lines.Add("$($Entry.Key)=$($Entry.Value)") | Out-Null }
[IO.File]::WriteAllLines($EnvFile, $Lines, $Utf8NoBom)

Write-Host 'AJN PDF local admin environment configured.' -ForegroundColor Green
Write-Host "Environment file: $EnvFile"
Write-Host 'AJN_ANALYTICS_ENABLED=true' -ForegroundColor Green
Write-Host "Analytics token length: $($AnalyticsToken.Length)" -ForegroundColor Green
Write-Host "Media token length: $($MediaToken.Length)" -ForegroundColor Green
Write-Host 'The two tokens are distinct and were not printed.' -ForegroundColor Green
Write-Host 'Restart the local backend before testing the admin pages.' -ForegroundColor Yellow
Write-Host 'Production note: local .env.local does NOT configure the deployed backend. Set the same variable names in your hosting/Cloud Run environment and redeploy there.' -ForegroundColor Yellow

if ($CopyToken -eq 'Analytics') { $AnalyticsToken | Set-Clipboard; Write-Host 'Analytics admin token copied to clipboard.' -ForegroundColor Cyan }
if ($CopyToken -eq 'Media') { $MediaToken | Set-Clipboard; Write-Host 'Media admin token copied to clipboard.' -ForegroundColor Cyan }
