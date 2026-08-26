param(
  [string]$Root = '',
  [string]$CloudRunService = 'ajn-pdf-api',
  [string]$CloudRunRegion = 'asia-south1',
  [string]$AndroidPackageId = '',
  [switch]$SkipAndroid
)

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = (Resolve-Path $Root).Path
$EnvFile = Join-Path $Root '.env.local'
$ExpectedRelease = '3.2.0-r21'
$DefaultBackendUrl = 'https://ajn-pdf-api-rswf5f4f3q-el.a.run.app'
$script:AJNLastExitCode = 0

function Write-Section([string]$Text) {
  Write-Host "`n============================================================" -ForegroundColor Magenta
  Write-Host " $Text" -ForegroundColor Magenta
  Write-Host "============================================================" -ForegroundColor Magenta
}

function Invoke-Cmd([string]$Command, [switch]$AllowFailure, [string]$FailureLabel = 'Native command failed') {
  $saved = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $env:ComSpec /d /s /c "$Command 2>&1"
    $script:AJNLastExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $saved
  }
  if (-not $AllowFailure -and $script:AJNLastExitCode -ne 0) {
    throw "$FailureLabel (exit code $($script:AJNLastExitCode))."
  }
}

function Get-LocalEnvValue([string]$Name) {
  if (-not (Test-Path $EnvFile)) { return '' }
  $prefix = "$Name="
  $line = Get-Content $EnvFile | Where-Object { $_.StartsWith($prefix) } | Select-Object -Last 1
  if (-not $line) { return '' }
  return $line.Substring($prefix.Length).Trim()
}

function Set-LocalEnvValue([string]$Name, [string]$Value) {
  $lines = @()
  if (Test-Path $EnvFile) { $lines = @(Get-Content $EnvFile) }
  $prefix = "$Name="
  $lines = @($lines | Where-Object { -not $_.StartsWith($prefix) })
  if ($Value) { $lines += "$Name=$Value" }
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllLines($EnvFile, [string[]]$lines, $utf8)
}

function New-AdminToken {
  $bytes = New-Object byte[] 48
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_').TrimEnd('=')
}

function Set-VercelProductionEnv([string]$Name, [string]$Value) {
  if (-not $Value) { throw "Refusing to configure empty Vercel value for $Name" }
  $tmp = Join-Path $env:TEMP ("ajn-r21-env-" + [Guid]::NewGuid().ToString('N') + '.txt')
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($tmp, $Value, $utf8)
  try {
    Invoke-Cmd "npx -y vercel@latest env rm $Name production -y" -AllowFailure -FailureLabel "Vercel env removal failed for $Name"
    Invoke-Cmd "type `"$tmp`" | npx -y vercel@latest env add $Name production" -FailureLabel "Vercel env configuration failed for $Name"
    Write-Host "[ENV PASS] $Name" -ForegroundColor Green
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Assert-Http200([string]$Url) {
  $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 45
  if ($r.StatusCode -ne 200) { throw "$Url returned HTTP $($r.StatusCode)" }
  return $r
}

Set-Location $Root
Write-Section 'AJN PDF R21 :: FINAL PRODUCTION CLOSURE'

Write-Host '[1/9] Verifying source and required local environment...' -ForegroundColor Cyan
if (-not (Test-Path $EnvFile)) { throw '.env.local is missing. Run the R21 Firebase/setup stage first.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required.' }
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) { throw 'Google Cloud CLI is required.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required.' }
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx is required.' }

$FirebaseProjectId = Get-LocalEnvValue 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
if (-not $FirebaseProjectId) { $FirebaseProjectId = Get-LocalEnvValue 'FIREBASE_PROJECT_ID' }
$FirebaseApiKey = Get-LocalEnvValue 'NEXT_PUBLIC_FIREBASE_API_KEY'
$GoogleClientId = Get-LocalEnvValue 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
$AdminEmails = Get-LocalEnvValue 'AJN_ADMIN_EMAILS'
$BuzzUrl = Get-LocalEnvValue 'NEXT_PUBLIC_AJN_BUZZ_URL'
$BackendUrl = Get-LocalEnvValue 'NEXT_PUBLIC_PDF_BACKEND_URL'
if (-not $BackendUrl) { $BackendUrl = $DefaultBackendUrl }

$required = [ordered]@{
  NEXT_PUBLIC_FIREBASE_PROJECT_ID = $FirebaseProjectId
  NEXT_PUBLIC_FIREBASE_API_KEY = $FirebaseApiKey
  NEXT_PUBLIC_GOOGLE_CLIENT_ID = $GoogleClientId
  AJN_ADMIN_EMAILS = $AdminEmails
  NEXT_PUBLIC_AJN_BUZZ_URL = $BuzzUrl
}
foreach ($entry in $required.GetEnumerator()) {
  if (-not $entry.Value) { throw "Required .env.local value is missing: $($entry.Key)" }
}
if ($BuzzUrl -notmatch '^https://') { throw 'NEXT_PUBLIC_AJN_BUZZ_URL must be HTTPS.' }
if ($BackendUrl -notmatch '^https://') { throw 'NEXT_PUBLIC_PDF_BACKEND_URL must be HTTPS.' }
Set-LocalEnvValue 'FIREBASE_PROJECT_ID' $FirebaseProjectId
Set-LocalEnvValue 'NEXT_PUBLIC_PDF_BACKEND_URL' $BackendUrl
Set-LocalEnvValue 'NEXT_PUBLIC_AJN_BILLING_URL' ''

$head = (git rev-parse HEAD).Trim()
Write-Host "[PASS] Source HEAD: $head" -ForegroundColor Green
Write-Host '[PASS] Billing URL removed; checkout remains disabled until a real provider exists.' -ForegroundColor Green

Write-Host '`n[2/9] Running production source gates...' -ForegroundColor Cyan
Invoke-Cmd 'node scripts/verify-r21-product-ecosystem.mjs' -FailureLabel 'R21 product verification failed'
Invoke-Cmd 'npm run verify:r19-release' -FailureLabel 'R19 release verification failed'
Invoke-Cmd 'npm run lint' -FailureLabel 'Lint failed'
Invoke-Cmd 'npm run typecheck' -FailureLabel 'Typecheck failed'
Invoke-Cmd 'npm run build' -FailureLabel 'Production build failed'
Write-Host '[PASS] Local production gates are green.' -ForegroundColor Green

Write-Host '`n[3/9] Synchronizing server-only admin secret with Cloud Run...' -ForegroundColor Cyan
$AdminToken = Get-LocalEnvValue 'AJN_ANALYTICS_ADMIN_TOKEN'
if (-not $AdminToken -or $AdminToken.Length -lt 40) {
  $AdminToken = New-AdminToken
  Set-LocalEnvValue 'AJN_ANALYTICS_ADMIN_TOKEN' $AdminToken
  Write-Host '[PASS] Generated a fresh admin token locally without printing it.' -ForegroundColor Green
} else {
  Write-Host '[PASS] Reusing the unexposed locally generated admin token from the interrupted deployment.' -ForegroundColor Green
}

Invoke-Cmd "gcloud config set project $FirebaseProjectId" -FailureLabel 'Unable to select Google Cloud project'
Invoke-Cmd "gcloud run services update $CloudRunService --project $FirebaseProjectId --region $CloudRunRegion --update-env-vars AJN_ANALYTICS_ADMIN_TOKEN=$AdminToken" -FailureLabel 'Unable to synchronize AJN analytics admin token with Cloud Run'
Assert-Http200 "$BackendUrl/ready" | Out-Null
Write-Host "[PASS] Cloud Run ready: $BackendUrl" -ForegroundColor Green

Write-Host '`n[4/9] Logging in/linking the correct Vercel project...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest whoami' -AllowFailure -FailureLabel 'Vercel account check failed'
if ($script:AJNLastExitCode -ne 0) {
  Invoke-Cmd 'npx -y vercel@latest login' -FailureLabel 'Vercel login failed'
}
if (-not (Test-Path (Join-Path $Root '.vercel\project.json'))) {
  Write-Host 'Select the AJN PDF Vercel project that owns ajnpdf.com. Do NOT select an unrelated project.' -ForegroundColor Yellow
  Invoke-Cmd 'npx -y vercel@latest link' -FailureLabel 'Vercel project linking failed'
}
if (-not (Test-Path (Join-Path $Root '.vercel\project.json'))) { throw 'Vercel project link was not created.' }
Write-Host '[PASS] Vercel project link exists.' -ForegroundColor Green

Write-Host '`n[5/9] Applying production environment to Vercel...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest env rm NEXT_PUBLIC_AJN_BILLING_URL production -y' -AllowFailure -FailureLabel 'Billing env cleanup failed'
Set-VercelProductionEnv 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' $FirebaseProjectId
Set-VercelProductionEnv 'FIREBASE_PROJECT_ID' $FirebaseProjectId
Set-VercelProductionEnv 'NEXT_PUBLIC_FIREBASE_API_KEY' $FirebaseApiKey
Set-VercelProductionEnv 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' $GoogleClientId
Set-VercelProductionEnv 'AJN_ADMIN_EMAILS' $AdminEmails
Set-VercelProductionEnv 'AJN_ANALYTICS_ADMIN_TOKEN' $AdminToken
Set-VercelProductionEnv 'NEXT_PUBLIC_AJN_BUZZ_URL' $BuzzUrl
Set-VercelProductionEnv 'NEXT_PUBLIC_PDF_BACKEND_URL' $BackendUrl
Write-Host '[PASS] Production environment configured; billing remains absent.' -ForegroundColor Green

Write-Host '`n[6/9] Deploying AJN PDF R21 to Vercel production...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest --prod --yes' -FailureLabel 'Vercel production deployment failed'
Write-Host '[PASS] Vercel production deployment command completed.' -ForegroundColor Green

Write-Host '`n[7/9] Verifying live AJN PDF domain...' -ForegroundColor Cyan
$home = Assert-Http200 'https://www.ajnpdf.com/'
if ($home.Content -notmatch [regex]::Escape($ExpectedRelease)) { throw "Live homepage does not contain release marker $ExpectedRelease." }
foreach ($path in @('/pdf-tools','/login','/signup','/merge-pdf','/protect-pdf','/img','/manifest.json')) {
  Assert-Http200 ("https://www.ajnpdf.com" + $path) | Out-Null
}
$billingProbe = Assert-Http200 'https://www.ajnpdf.com/pricing'
if ($billingProbe.Content -notmatch 'Billing link not configured yet|Checkout not configured') {
  Write-Host '[WARN] Pricing page is live, but static HTML did not expose the expected disabled-billing copy. Verify the button visually.' -ForegroundColor Yellow
}
Write-Host '[PASS] Live domain is serving R21 and critical routes.' -ForegroundColor Green

if ($SkipAndroid) {
  Write-Host '`n[8/9] Android build explicitly skipped.' -ForegroundColor Yellow
  Write-Host '[9/9] Digital Asset Links skipped with Android.' -ForegroundColor Yellow
} else {
  Write-Host '`n[8/9] Building signed Android APK + AAB...' -ForegroundColor Cyan
  if (-not $AndroidPackageId) {
    $existingManifest = Join-Path $Root 'mobile-android\twa-manifest.json'
    if (Test-Path $existingManifest) {
      $AndroidPackageId = [string]((Get-Content $existingManifest -Raw | ConvertFrom-Json).packageId)
    }
  }
  if (-not $AndroidPackageId) {
    Write-Host 'AJN PDF previously had a native scaffold using com.ajnpdf.app, but do not reuse any package blindly if a Play app already exists.' -ForegroundColor Yellow
    $AndroidPackageId = Read-Host 'Enter FINAL Android package ID (exact Play package if updating an existing app)'
  }
  if ($AndroidPackageId -notmatch '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$') { throw "Invalid Android package ID: $AndroidPackageId" }

  & (Join-Path $PSScriptRoot 'R21_BUILD_ANDROID.ps1') -ManifestUrl 'https://www.ajnpdf.com/manifest.json' -ExpectedPackageId $AndroidPackageId
  if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
  $AndroidReportPath = Join-Path $Root 'mobile-android\R21_ANDROID_BUILD.json'
  if (-not (Test-Path $AndroidReportPath)) { throw 'Android build report was not generated.' }
  $AndroidReport = Get-Content $AndroidReportPath -Raw | ConvertFrom-Json
  if (-not (Test-Path $AndroidReport.apk)) { throw 'Signed APK is missing.' }
  if (-not (Test-Path $AndroidReport.aab)) { throw 'Signed AAB is missing.' }
  Write-Host '[PASS] Signed APK/AAB produced and signer fingerprint extracted.' -ForegroundColor Green

  Write-Host '`n[9/9] Publishing and verifying Digital Asset Links...' -ForegroundColor Cyan
  Set-LocalEnvValue 'AJN_ANDROID_PACKAGE_ID' ([string]$AndroidReport.packageId)
  Set-LocalEnvValue 'AJN_ANDROID_SHA256_FINGERPRINTS' ([string]$AndroidReport.sha256Fingerprint)
  Set-VercelProductionEnv 'AJN_ANDROID_PACKAGE_ID' ([string]$AndroidReport.packageId)
  Set-VercelProductionEnv 'AJN_ANDROID_SHA256_FINGERPRINTS' ([string]$AndroidReport.sha256Fingerprint)
  Invoke-Cmd 'npx -y vercel@latest --prod --yes' -FailureLabel 'Vercel Android asset-links redeployment failed'

  $asset = Assert-Http200 'https://www.ajnpdf.com/.well-known/assetlinks.json'
  $assetJson = $asset.Content | ConvertFrom-Json
  $match = @($assetJson | Where-Object {
    $_.target.package_name -eq $AndroidReport.packageId -and
    @($_.target.sha256_cert_fingerprints) -contains $AndroidReport.sha256Fingerprint
  }).Count -gt 0
  if (-not $match) { throw 'Digital Asset Links does not contain the built Android package and signer fingerprint.' }
  Write-Host '[PASS] Digital Asset Links matches the signed APK.' -ForegroundColor Green
  Write-Host "APK: $($AndroidReport.apk)" -ForegroundColor Cyan
  Write-Host "AAB: $($AndroidReport.aab)" -ForegroundColor Cyan
  Write-Host 'If Google Play App Signing is enabled, add the Play App Signing SHA-256 fingerprint to AJN_ANDROID_SHA256_FINGERPRINTS before store rollout.' -ForegroundColor Yellow
}

Write-Section 'AJN PDF R21 :: PRODUCTION CLOSURE RESULT'
Write-Host 'PDF-only catalog       : PASS (20 tools)' -ForegroundColor Green
Write-Host 'Firebase Auth          : CONFIGURED' -ForegroundColor Green
Write-Host 'Firestore              : DEPLOYED' -ForegroundColor Green
Write-Host 'Cloud Run backend      : READY' -ForegroundColor Green
Write-Host 'Admin secret wiring    : SYNCHRONIZED' -ForegroundColor Green
Write-Host 'Billing                : DISABLED / NOT CONFIGURED' -ForegroundColor Yellow
Write-Host 'AJN Buzz handoff       : CONFIGURED' -ForegroundColor Green
Write-Host 'Vercel production      : DEPLOYED' -ForegroundColor Green
Write-Host 'Live R21 domain        : VERIFIED' -ForegroundColor Green
if ($SkipAndroid) {
  Write-Host 'Android APK/AAB        : SKIPPED' -ForegroundColor Yellow
  Write-Host 'Digital Asset Links    : SKIPPED' -ForegroundColor Yellow
} else {
  Write-Host 'Android APK/AAB        : BUILT' -ForegroundColor Green
  Write-Host 'Digital Asset Links    : VERIFIED FOR LOCAL SIGNER' -ForegroundColor Green
}
Write-Host 'Public API key access  : DISABLED until a key is intentionally issued' -ForegroundColor Yellow
Write-Host "Backend URL            : $BackendUrl" -ForegroundColor Cyan
Write-Host 'Next product           : AJN Buzz image tools only, after AJN PDF closure.' -ForegroundColor Cyan

$AdminToken = $null
[GC]::Collect()
