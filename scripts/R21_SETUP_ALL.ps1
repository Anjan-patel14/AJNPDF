param(
  [string]$FirebaseProjectId = '',
  [string]$FirebaseApiKey = '',
  [string]$GoogleClientId = '',
  [string]$AdminEmail = '',
  [string]$BillingUrl = '',
  [string]$BuzzUrl = '',
  [string]$DesktopDownloadUrl = '',
  [string]$AndroidUrl = '',
  [string]$IosUrl = '',
  [switch]$DeployFirebase,
  [switch]$GenerateApiKey,
  [switch]$BuildAndroid,
  [switch]$DeployVercel
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root '.env.local'

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { throw "$Name is required." }
}

function Set-DotEnvValue([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { return }
  $lines = @()
  if (Test-Path $EnvFile) { $lines = @(Get-Content $EnvFile) }
  $escaped = $Value.Replace('`r','').Replace('`n','')
  $replacement = "$Name=$escaped"
  $found = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^$([regex]::Escape($Name))=") { $lines[$i] = $replacement; $found = $true; break }
  }
  if (-not $found) { $lines += $replacement }
  Set-Content -Path $EnvFile -Value $lines -Encoding utf8
}

Require-Command node
Require-Command npm
Require-Command npx
Push-Location $Root
try {
  Write-Host '============================================================' -ForegroundColor DarkMagenta
  Write-Host ' AJN PDF R21 :: PRODUCT ECOSYSTEM SETUP' -ForegroundColor Magenta
  Write-Host ' PDF-only + Firebase + Premium + API + Admin + Android' -ForegroundColor Magenta
  Write-Host '============================================================' -ForegroundColor DarkMagenta

  Set-DotEnvValue 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' $FirebaseProjectId
  Set-DotEnvValue 'FIREBASE_PROJECT_ID' $FirebaseProjectId
  Set-DotEnvValue 'NEXT_PUBLIC_FIREBASE_API_KEY' $FirebaseApiKey
  Set-DotEnvValue 'NEXT_PUBLIC_GOOGLE_CLIENT_ID' $GoogleClientId
  Set-DotEnvValue 'AJN_ADMIN_EMAILS' $AdminEmail
  Set-DotEnvValue 'NEXT_PUBLIC_AJN_BILLING_URL' $BillingUrl
  Set-DotEnvValue 'NEXT_PUBLIC_AJN_BUZZ_URL' $BuzzUrl
  Set-DotEnvValue 'NEXT_PUBLIC_AJN_DESKTOP_DOWNLOAD_URL' $DesktopDownloadUrl
  Set-DotEnvValue 'NEXT_PUBLIC_AJN_ANDROID_URL' $AndroidUrl
  Set-DotEnvValue 'NEXT_PUBLIC_AJN_IOS_URL' $IosUrl

  Write-Host '[1/6] Installing locked frontend dependencies...' -ForegroundColor Cyan
  npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }

  Write-Host '[2/6] Running R21 architecture and release gates...' -ForegroundColor Cyan
  node .\scripts\verify-r21-product-ecosystem.mjs
  if ($LASTEXITCODE -ne 0) { throw 'R21 ecosystem verification failed.' }
  npm run verify:r19-release
  if ($LASTEXITCODE -ne 0) { throw 'R21 release inventory verification failed.' }

  Write-Host '[3/6] Running lint and TypeScript checks...' -ForegroundColor Cyan
  npm run lint
  if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw 'TypeScript validation failed.' }

  Write-Host '[4/6] Building production Next.js application...' -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }

  if ($DeployFirebase) {
    if (-not $FirebaseProjectId) { throw '-FirebaseProjectId is required with -DeployFirebase.' }
    Write-Host '[5/6] Deploying Firebase rules/indexes...' -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'R21_FIREBASE_SETUP.ps1') -ProjectId $FirebaseProjectId -AdminEmail $AdminEmail
  } else {
    Write-Host '[5/6] Firebase deployment skipped. Use -DeployFirebase when project configuration is ready.' -ForegroundColor DarkGray
  }

  if ($GenerateApiKey) {
    Write-Host '[API] Generating a developer API key...' -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'R21_CREATE_API_KEY.ps1') -Id 'owner' -Scopes 'read,convert,sign' -Rate 60
  }

  if ($BuildAndroid) {
    Write-Host '[Android] Building APK + AAB...' -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'R21_BUILD_ANDROID.ps1')
  }

  if ($DeployVercel) {
    Write-Host '[6/6] Deploying current source to Vercel...' -ForegroundColor Cyan
    Write-Host 'Production Firebase/billing values must also exist in the linked Vercel project environment.' -ForegroundColor Yellow
    npx -y vercel@latest --prod --yes
    if ($LASTEXITCODE -ne 0) { throw 'Vercel deployment failed. Check account/project limits and environment configuration.' }
  } else {
    Write-Host '[6/6] Vercel deployment skipped. Use -DeployVercel when production environment values are configured.' -ForegroundColor DarkGray
  }

  Write-Host ''
  Write-Host 'AJN PDF R21 local production setup: PASS' -ForegroundColor Green
  Write-Host "Environment file: $EnvFile" -ForegroundColor Green
  Write-Host 'Core PDF tools do not require Firebase; account features activate when Firebase values are configured.' -ForegroundColor White
} finally {
  Pop-Location
}
