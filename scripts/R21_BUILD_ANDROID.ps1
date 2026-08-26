param(
  [string]$ManifestUrl = 'https://www.ajnpdf.com/manifest.json',
  [string]$Workspace = '',
  [string]$ExpectedPackageId = '',
  [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not $Workspace) { $Workspace = Join-Path $Root 'mobile-android' }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required.' }
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx is required.' }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java/JDK is required by Bubblewrap/Android build tooling.' }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { throw 'keytool is required to verify the Android signing certificate.' }

if ($ExpectedPackageId -and $ExpectedPackageId -notmatch '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$') {
  throw "Invalid Android package ID: $ExpectedPackageId"
}

if ($Clean -and (Test-Path $Workspace)) {
  Remove-Item $Workspace -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $Workspace | Out-Null
Push-Location $Workspace
try {
  Write-Host 'AJN PDF Android Trusted Web Activity build' -ForegroundColor Cyan
  if (-not (Test-Path '.\twa-manifest.json')) {
    Write-Host "Initializing from $ManifestUrl" -ForegroundColor Cyan
    if ($ExpectedPackageId) {
      Write-Host "When Bubblewrap asks for the package ID, enter exactly: $ExpectedPackageId" -ForegroundColor Yellow
    } else {
      Write-Host 'Use the exact existing Play package ID if this app already exists in Google Play. Do not invent a replacement package for an update.' -ForegroundColor Yellow
    }
    npx -y @bubblewrap/cli@latest init --manifest="$ManifestUrl"
    if ($LASTEXITCODE -ne 0) { throw 'Bubblewrap initialization failed.' }
  }

  $manifestPath = Join-Path (Get-Location) 'twa-manifest.json'
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  $packageId = [string]$manifest.packageId
  if (-not $packageId) { throw 'twa-manifest.json does not contain packageId.' }
  if ($ExpectedPackageId -and $packageId -ne $ExpectedPackageId) {
    throw "Android package mismatch. Expected '$ExpectedPackageId' but Bubblewrap is configured for '$packageId'. Delete mobile-android and initialize again only if changing identity is intentional."
  }

  Write-Host "Package ID: $packageId" -ForegroundColor Green
  Write-Host 'Building signed Android outputs...' -ForegroundColor Cyan
  npx -y @bubblewrap/cli@latest build
  if ($LASTEXITCODE -ne 0) { throw 'Bubblewrap Android build failed.' }

  $apk = Get-ChildItem -Path . -Recurse -Filter 'app-release-signed.apk' -ErrorAction SilentlyContinue | Select-Object -First 1
  $aab = Get-ChildItem -Path . -Recurse -Filter 'app-release-bundle.aab' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $apk) { throw 'Build completed without finding app-release-signed.apk.' }
  if (-not $aab) { throw 'Build completed without finding app-release-bundle.aab.' }

  $certOutput = (& keytool -printcert -jarfile $apk.FullName 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) { throw 'keytool could not read the signed APK certificate.' }
  $shaMatch = [regex]::Match($certOutput, 'SHA256:\s*((?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})')
  if (-not $shaMatch.Success) { throw 'Unable to extract SHA-256 signer fingerprint from the APK.' }
  $fingerprint = $shaMatch.Groups[1].Value.ToUpperInvariant()

  $report = [ordered]@{
    packageId = $packageId
    sha256Fingerprint = $fingerprint
    apk = $apk.FullName
    aab = $aab.FullName
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  $reportPath = Join-Path $Workspace 'R21_ANDROID_BUILD.json'
  $report | ConvertTo-Json -Depth 4 | Set-Content $reportPath -Encoding utf8

  Write-Host "APK: $($apk.FullName)" -ForegroundColor Green
  Write-Host "AAB: $($aab.FullName)" -ForegroundColor Green
  Write-Host "SHA-256 signer: $fingerprint" -ForegroundColor Green
  Write-Host "Build report: $reportPath" -ForegroundColor Green
  Write-Host 'Digital Asset Links must contain this package ID and signing fingerprint. Google Play App Signing may use a different production signing fingerprint after upload.' -ForegroundColor Yellow
} finally {
  Pop-Location
}
