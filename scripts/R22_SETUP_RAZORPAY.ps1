param(
  [string]$ProjectId = 'studio-4223217082-69711',
  [string]$CloudRunService = 'ajn-pdf-api',
  [string]$CloudRunRegion = 'asia-south1'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$script:NativeExit = 0

function Section([string]$Text) {
  Write-Host "`n============================================================" -ForegroundColor Magenta
  Write-Host " $Text" -ForegroundColor Magenta
  Write-Host "============================================================" -ForegroundColor Magenta
}

function Invoke-Cmd([string]$Command, [switch]$AllowFailure, [string]$Label = 'Command failed') {
  $saved = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $env:ComSpec /d /s /c "$Command 2>&1"
    $script:NativeExit = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $saved
  }
  if (-not $AllowFailure -and $script:NativeExit -ne 0) {
    throw "$Label (exit code $($script:NativeExit))."
  }
}

function New-SecretValue {
  $bytes = New-Object byte[] 48
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_').TrimEnd('=')
}

function Read-Secret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

function Set-VercelProductionEnv([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { throw "Empty Vercel value refused for $Name" }
  $tmp = Join-Path $env:TEMP ("ajnpdf-r22-vercel-" + [Guid]::NewGuid().ToString('N') + '.txt')
  [IO.File]::WriteAllText($tmp, $Value, [Text.UTF8Encoding]::new($false))
  try {
    Invoke-Cmd "npx -y vercel@latest env rm $Name production -y" -AllowFailure
    Invoke-Cmd "type `"$tmp`" | npx -y vercel@latest env add $Name production" -Label "Unable to configure Vercel env $Name"
    Write-Host "[ENV PASS] $Name" -ForegroundColor Green
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Set-GcpSecret([string]$Name, [string]$Value) {
  $tmp = Join-Path $env:TEMP ("ajnpdf-r22-gcp-" + [Guid]::NewGuid().ToString('N') + '.txt')
  [IO.File]::WriteAllText($tmp, $Value, [Text.UTF8Encoding]::new($false))
  try {
    Invoke-Cmd "gcloud secrets describe $Name --project $ProjectId" -AllowFailure
    if ($script:NativeExit -ne 0) {
      Invoke-Cmd "gcloud secrets create $Name --replication-policy=automatic --project $ProjectId" -Label "Unable to create Secret Manager secret $Name"
    }
    Invoke-Cmd "gcloud secrets versions add $Name --data-file=`"$tmp`" --project $ProjectId" -Label "Unable to add secret version for $Name"
    Write-Host "[SECRET PASS] $Name" -ForegroundColor Green
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Parse-Inr([string]$Prompt) {
  $raw = Read-Host $Prompt
  [decimal]$value = 0
  if (-not [decimal]::TryParse($raw, [Globalization.NumberStyles]::Number, [Globalization.CultureInfo]::InvariantCulture, [ref]$value)) {
    throw "Invalid INR amount: $raw"
  }
  if ($value -lt 1 -or $value -gt 500000) { throw 'Amount must be between INR 1 and INR 500000.' }
  return $value
}

Section 'AJN PDF R22 :: SECURE RAZORPAY BILLING SETUP'

Write-Host '[1/10] Checking source and tools...' -ForegroundColor Cyan
foreach ($command in @('git','node','npx','gcloud')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command is required." }
}
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'r22/razorpay-billing') { throw "Run this setup from r22/razorpay-billing. Current branch: $branch" }
node scripts/verify-r21-product-ecosystem.mjs
if ($LASTEXITCODE -ne 0) { throw 'AJN product/billing verification failed.' }
Write-Host '[PASS] R22 billing source verification.' -ForegroundColor Green

Write-Host '`n[2/10] Confirming the AJN PDF Vercel project...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest whoami' -Label 'Vercel login check failed'
if (-not (Test-Path '.vercel\project.json')) {
  Write-Host 'No Vercel project is linked. Link ONLY the AJN PDF project that owns ajnpdf.com.' -ForegroundColor Yellow
  Invoke-Cmd 'npx -y vercel@latest link' -Label 'Vercel project link failed'
}
Invoke-Cmd 'npx -y vercel@latest project inspect' -Label 'Unable to inspect linked Vercel project'
$confirm = (Read-Host 'If the project shown above is AJN PDF / ajnpdf.com, type AJNPDF').Trim().ToUpperInvariant()
if ($confirm -ne 'AJNPDF') { throw 'Stopped before touching Vercel. Link the correct AJN PDF project first.' }
Write-Host '[PASS] AJN PDF Vercel target confirmed.' -ForegroundColor Green

Write-Host '`n[3/10] Reading NEW rotated Razorpay Live credentials and prices...' -ForegroundColor Cyan
$KeyId = (Read-Host 'Enter NEW rotated Razorpay LIVE Key ID').Trim()
if ($KeyId -notmatch '^rzp_live_[A-Za-z0-9]+$') { throw 'A Razorpay Live Key ID beginning with rzp_live_ is required.' }
$KeySecret = Read-Secret 'Enter NEW rotated Razorpay LIVE Key Secret'
if ([string]::IsNullOrWhiteSpace($KeySecret) -or $KeySecret.Length -lt 16) { throw 'Razorpay Key Secret is invalid.' }
$MonthlyInr = Parse-Inr 'Enter AJN PDF Premium 30-day price in INR (example: 49)'
$YearlyInr = Parse-Inr 'Enter AJN PDF Premium 365-day price in INR (example: 399)'
if ($YearlyInr -le $MonthlyInr) { throw '365-day price must be greater than the 30-day price.' }
$MonthlyPaise = [int64][Math]::Round($MonthlyInr * 100, 0)
$YearlyPaise = [int64][Math]::Round($YearlyInr * 100, 0)
$WebhookSecret = New-SecretValue
$InternalToken = New-SecretValue
Write-Host '[PASS] Prices accepted and fresh server secrets generated without printing them.' -ForegroundColor Green

Write-Host '`n[4/10] Configuring Google Cloud Secret Manager...' -ForegroundColor Cyan
Invoke-Cmd "gcloud config set project $ProjectId" -Label 'Unable to select Google Cloud project'
Invoke-Cmd "gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com --project $ProjectId" -Label 'Unable to enable required Google Cloud APIs'
Set-GcpSecret 'ajnpdf-razorpay-key-secret' $KeySecret
Set-GcpSecret 'ajnpdf-razorpay-webhook-secret' $WebhookSecret
Set-GcpSecret 'ajnpdf-billing-internal-token' $InternalToken

Write-Host '`n[5/10] Granting the Cloud Run identity Firestore + Secret Manager access...' -ForegroundColor Cyan
$ServiceAccount = (gcloud run services describe $CloudRunService --project $ProjectId --region $CloudRunRegion --format='value(spec.template.spec.serviceAccountName)').Trim()
if (-not $ServiceAccount) {
  $ProjectNumber = (gcloud projects describe $ProjectId --format='value(projectNumber)').Trim()
  if (-not $ProjectNumber) { throw 'Unable to determine Google Cloud project number.' }
  $ServiceAccount = "$ProjectNumber-compute@developer.gserviceaccount.com"
}
Invoke-Cmd "gcloud projects add-iam-policy-binding $ProjectId --member=serviceAccount:$ServiceAccount --role=roles/datastore.user --condition=None --quiet" -Label 'Unable to grant Firestore access'
Invoke-Cmd "gcloud projects add-iam-policy-binding $ProjectId --member=serviceAccount:$ServiceAccount --role=roles/secretmanager.secretAccessor --condition=None --quiet" -Label 'Unable to grant Secret Manager access'
Write-Host "[PASS] Runtime service account: $ServiceAccount" -ForegroundColor Green

Write-Host '`n[6/10] Deploying AJN PDF backend billing routes...' -ForegroundColor Cyan
$RazorpaySecretEnv = 'RAZORPAY_KEY_' + 'SECRET'
$WebhookSecretEnv = 'RAZORPAY_WEBHOOK_' + 'SECRET'
$InternalSecretEnv = 'AJN_BILLING_INTERNAL_' + 'TOKEN'
$SecretBindings = "$RazorpaySecretEnv=ajnpdf-razorpay-key-secret:latest,$WebhookSecretEnv=ajnpdf-razorpay-webhook-secret:latest,$InternalSecretEnv=ajnpdf-billing-internal-token:latest"
Push-Location (Join-Path $Root 'backend')
try {
  Invoke-Cmd "gcloud run deploy $CloudRunService --source . --project $ProjectId --region $CloudRunRegion --platform managed --allow-unauthenticated --update-env-vars=FIREBASE_PROJECT_ID=$ProjectId,RAZORPAY_KEY_ID=$KeyId,AJN_PREMIUM_30D_PAISE=$MonthlyPaise,AJN_PREMIUM_365D_PAISE=$YearlyPaise --update-secrets=$SecretBindings" -Label 'Cloud Run Razorpay deployment failed'
} finally { Pop-Location }
$BackendUrl = (gcloud run services describe $CloudRunService --project $ProjectId --region $CloudRunRegion --format='value(status.url)').Trim()
if ($BackendUrl -notmatch '^https://') { throw 'Cloud Run production URL could not be resolved.' }
$billingStatus = Invoke-RestMethod -Uri "$BackendUrl/api/billing/status" -TimeoutSec 30
if (-not $billingStatus.enabled) { throw 'Cloud Run billing status is not enabled after deployment.' }
Write-Host "[PASS] Billing backend enabled: $BackendUrl" -ForegroundColor Green

Write-Host '`n[7/10] Configuring Vercel production billing environment...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest env rm NEXT_PUBLIC_AJN_BILLING_URL production -y' -AllowFailure
Set-VercelProductionEnv 'AJN_BILLING_INTERNAL_TOKEN' $InternalToken
Set-VercelProductionEnv 'NEXT_PUBLIC_AJN_RAZORPAY_ENABLED' 'true'
Set-VercelProductionEnv 'NEXT_PUBLIC_AJN_PREMIUM_30D_INR' ([string]$MonthlyInr)
Set-VercelProductionEnv 'NEXT_PUBLIC_AJN_PREMIUM_365D_INR' ([string]$YearlyInr)
Set-VercelProductionEnv 'NEXT_PUBLIC_PDF_BACKEND_URL' $BackendUrl
Write-Host '[PASS] Vercel billing environment configured. Razorpay Key Secret is NOT stored in Vercel.' -ForegroundColor Green

Write-Host '`n[8/10] Running production frontend checks...' -ForegroundColor Cyan
$env:NEXT_PUBLIC_AJN_RAZORPAY_ENABLED='true'
$env:NEXT_PUBLIC_AJN_PREMIUM_30D_INR=[string]$MonthlyInr
$env:NEXT_PUBLIC_AJN_PREMIUM_365D_INR=[string]$YearlyInr
$env:AJN_BILLING_INTERNAL_TOKEN=$InternalToken
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
node scripts/verify-r21-product-ecosystem.mjs
if ($LASTEXITCODE -ne 0) { throw 'R22 billing verification failed.' }
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'TypeScript failed.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
Write-Host '[PASS] Production frontend checks.' -ForegroundColor Green

Write-Host '`n[9/10] Deploying AJN PDF billing frontend to Vercel production...' -ForegroundColor Cyan
Invoke-Cmd 'npx -y vercel@latest --prod --yes' -Label 'Vercel production deployment failed'
$pricing = Invoke-WebRequest -Uri 'https://www.ajnpdf.com/pricing' -UseBasicParsing -TimeoutSec 45
if ($pricing.StatusCode -ne 200) { throw 'Live AJN PDF pricing page is unavailable.' }
Write-Host '[PASS] Vercel production deployment completed.' -ForegroundColor Green

Write-Host '`n[10/10] Preparing Razorpay webhook registration...' -ForegroundColor Cyan
$WebhookUrl = "$BackendUrl/api/billing/webhook"
Set-Clipboard -Value $WebhookSecret
Write-Host "Webhook URL : $WebhookUrl" -ForegroundColor Cyan
Write-Host 'Events      : payment.captured, order.paid' -ForegroundColor Cyan
Write-Host 'Webhook secret has been copied to your clipboard. Paste it into Razorpay Dashboard when adding the webhook.' -ForegroundColor Yellow
Write-Host 'Also confirm Razorpay Dashboard > Payment Capture is set to Automatic Capture.' -ForegroundColor Yellow

Section 'AJN PDF R22 :: BILLING SETUP RESULT'
Write-Host 'Razorpay architecture : Orders + server signature verification + captured-status verification' -ForegroundColor Green
Write-Host 'Entitlement storage   : Firestore subscriptions/{uid}' -ForegroundColor Green
Write-Host 'Premium products      : 30-day + 365-day prepaid access' -ForegroundColor Green
Write-Host 'Automatic renewal     : NOT ENABLED / NOT CLAIMED' -ForegroundColor Yellow
Write-Host 'Premium ads           : disabled while signed in' -ForegroundColor Green
Write-Host 'Razorpay Key Secret   : Google Secret Manager / Cloud Run only' -ForegroundColor Green
Write-Host 'Webhook secret        : Google Secret Manager; copied locally for Dashboard setup' -ForegroundColor Green
Write-Host "Webhook URL           : $WebhookUrl" -ForegroundColor Cyan
Write-Host 'Final manual action   : Add the webhook in Razorpay Dashboard and run one small live payment acceptance test.' -ForegroundColor Yellow

$KeySecret = $null
$WebhookSecret = $null
$InternalToken = $null
[GC]::Collect()
