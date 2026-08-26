param(
    [string]$Region = "asia-south1",
    [string]$Service = "ajn-pdf-api",
    [string]$ArtifactRepository = "ajnpdf",
    [string]$VercelOrigin = "https://ajn-delta.vercel.app",
    [int]$MaxInstances = 1
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$GCloudCommand = Get-Command gcloud.cmd -ErrorAction SilentlyContinue
if (-not $GCloudCommand) {
    $GCloudCommand = Get-Command gcloud -ErrorAction SilentlyContinue
}
if (-not $GCloudCommand) {
    throw "Google Cloud CLI (gcloud) is not installed."
}
$GCloudExe = $GCloudCommand.Source

function Run-GCloud {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Args)
    $OldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $script:GCloudExe @Args
        $Code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $OldPreference
    }
    if ($Code -ne 0) {
        throw "gcloud failed ($Code): gcloud $($Args -join ' ')"
    }
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Text)
    [System.IO.File]::WriteAllText(
        $Path,
        $Text,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $Root

Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host " AJN PDF CLOUD RUN BACKEND - PRODUCTION R2.1" -ForegroundColor Cyan
Write-Host " Free-first / scale-to-zero / max instances $MaxInstances" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor DarkCyan

if (-not (Get-Command gcloud.cmd -ErrorAction SilentlyContinue)) {
    throw "Google Cloud CLI (gcloud) is not installed. Install it, reopen PowerShell, run 'gcloud auth login', select a project, then run this script again."
}

$Account = (& $GCloudExe auth list --filter="status:ACTIVE" --format="value(account)" 2>$null).Trim()
if (-not $Account) {
    throw "No active Google Cloud login was found. Run: gcloud auth login"
}

$Project = (& $GCloudExe config get-value project 2>$null).Trim()
if (-not $Project -or $Project -eq "(unset)") {
    throw "No Google Cloud project is selected. Run: gcloud config set project YOUR_PROJECT_ID"
}

if (-not (Test-Path (Join-Path $Root "backend\Dockerfile"))) {
    throw "backend\Dockerfile was not found. Run this script from the AJN-PDF-GITHUB project root."
}

Write-Host "Account: $Account"
Write-Host "Project: $Project"
Write-Host "Region : $Region"
Write-Host "Service: $Service"

Write-Host "`n==> Enabling required Google Cloud APIs" -ForegroundColor Cyan
Run-GCloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    --project $Project `
    --quiet

Write-Host "`n==> Preparing Artifact Registry" -ForegroundColor Cyan
$OldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    $RepoList = & $GCloudExe artifacts repositories list `
        --location $Region `
        --project $Project `
        --format="value(name)" 2>$null
    $RepoListCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $OldPreference
}
if ($RepoListCode -ne 0) {
    throw "Unable to list Artifact Registry repositories."
}
$RepoExists = @($RepoList | ForEach-Object { "$_" }) | Where-Object { $_ -match "(^|/)$([regex]::Escape($ArtifactRepository))$" }
if (-not $RepoExists) {
    Run-GCloud artifacts repositories create $ArtifactRepository `
        --repository-format=docker `
        --location=$Region `
        --description="AJN PDF production backend images" `
        --project=$Project `
        --quiet
} else {
    Write-Host "Artifact Registry '$ArtifactRepository' already exists." -ForegroundColor Green
}

$Tag = Get-Date -Format "yyyyMMdd-HHmmss"
$Image = "$Region-docker.pkg.dev/$Project/$ArtifactRepository/$Service`:$Tag"

Write-Host "`n==> Cloud Build: native engines + full backend acceptance gate" -ForegroundColor Cyan
Write-Host "Image: $Image"
Run-GCloud builds submit (Join-Path $Root "backend") `
    --tag $Image `
    --project $Project `
    --quiet

$Origins = @(
    $VercelOrigin,
    "https://ajnpdf.com",
    "https://www.ajnpdf.com"
) | Where-Object { $_ -and $_.Trim() } | ForEach-Object { $_.Trim().TrimEnd("/") } | Select-Object -Unique

$AllowedOrigins = $Origins -join ","
$EnvFile = Join-Path ([System.IO.Path]::GetTempPath()) ("ajn-cloud-run-env-" + [guid]::NewGuid().ToString("N") + ".yaml")

$EnvYaml = @"
AJN_ALLOWED_ORIGINS: "$AllowedOrigins"
AJN_ENABLE_HSTS: "false"
AJN_LOG_LEVEL: "INFO"
AJN_MAX_FILE_MB: "30"
AJN_MAX_TOTAL_MB: "30"
AJN_MAX_UPLOAD_FILES: "30"
AJN_MAX_OUTPUT_MB: "30"
AJN_MAX_PDF_PAGES: "250"
AJN_MAX_RENDER_MPIX: "500"
AJN_MAX_IMAGE_PIXELS: "60000000"
AJN_MAX_IMAGE_FRAMES: "100"
AJN_MAX_BATCH_MPIX: "200"
AJN_RATE_LIMIT_PER_MINUTE: "120"
AJN_ANALYTICS_RATE_LIMIT_PER_MINUTE: "240"
AJN_ADMIN_RATE_LIMIT_PER_MINUTE: "30"
AJN_MAX_CONCURRENT_JOBS: "1"
AJN_PROCESSING_TIMEOUT_SECONDS: "270"
AJN_MIN_FREE_DISK_MB: "128"
AJN_ANALYTICS_ENABLED: "false"
AJN_ANALYTICS_RETENTION_DAYS: "90"
AJN_TRUST_PROXY_HEADERS: "false"
AJN_ANALYTICS_DB: "/tmp/ajn_analytics.sqlite3"
AJN_PUBLIC_MEDIA_DB: "/tmp/ajn_public_media.sqlite3"
AJN_PUBLIC_MEDIA_ROOT: "/tmp/public_media"
AJN_PUBLIC_IMAGE_MAX_MB: "10"
AJN_PUBLIC_IMAGE_MAX_PIXELS: "40000000"
"@
Write-Utf8NoBom -Path $EnvFile -Text $EnvYaml

$StartupProbe = "httpGet.path=/ready,httpGet.port=8000,initialDelaySeconds=0,failureThreshold=30,timeoutSeconds=5,periodSeconds=5"
$LivenessProbe = "httpGet.path=/health,httpGet.port=8000,initialDelaySeconds=60,failureThreshold=3,timeoutSeconds=5,periodSeconds=30"

try {
    Write-Host "`n==> Deploying server-assisted processing service" -ForegroundColor Cyan
    Run-GCloud run deploy $Service `
        --image $Image `
        --region $Region `
        --platform managed `
        --allow-unauthenticated `
        --ingress all `
        --execution-environment gen2 `
        --port 8000 `
        --cpu 2 `
        --memory 4Gi `
        --concurrency 1 `
        --timeout 300 `
        --min-instances 0 `
        --max-instances $MaxInstances `
        --cpu-throttling `
        --startup-probe $StartupProbe `
        --liveness-probe $LivenessProbe `
        --deploy-health-check `
        --env-vars-file $EnvFile `
        --labels "app=ajn-pdf,component=backend,release=cloudrun-r21" `
        --project $Project `
        --quiet
}
finally {
    Remove-Item -LiteralPath $EnvFile -Force -ErrorAction SilentlyContinue
}

$Url = (& $GCloudExe run services describe $Service `
    --region $Region `
    --project $Project `
    --format="value(status.url)").Trim()

if (-not $Url) {
    throw "Cloud Run deployed but the service URL could not be resolved."
}

Write-Host "`n==> Verifying live service" -ForegroundColor Cyan
$Health = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 60
$Ready = Invoke-RestMethod -Uri "$Url/ready" -TimeoutSec 60
$Tools = Invoke-RestMethod -Uri "$Url/api/tools" -TimeoutSec 60

if ($Health.status -ne "ok") { throw "Cloud Run /health is not OK." }
if ($Ready.status -ne "ok") { throw "Cloud Run /ready is not OK." }

$Available = @($Tools.tools | Where-Object { $_.available -eq $true })
$Unavailable = @($Tools.tools | Where-Object { $_.available -ne $true })

$CriticalIds = @(
    "protect-pdf", "unlock-pdf", "repair-pdf",
    "docx-to-pdf", "xlsx-to-pdf", "pptx-to-pdf",
    "odt-to-pdf", "ods-to-pdf", "odp-to-pdf",
    "pdf-to-docx", "pdf-to-xlsx", "pdf-to-pptx",
    "epub-to-pdf", "mobi-to-pdf", "azw3-to-pdf",
    "pdf-to-mobi", "pdf-to-azw3", "msg-to-pdf", "url-to-pdf"
)

$MissingCritical = @()
foreach ($Id in $CriticalIds) {
    $Entry = @($Tools.tools | Where-Object { $_.id -eq $Id } | Select-Object -First 1)
    if ($Entry.Count -eq 0 -or $Entry[0].available -ne $true) {
        $MissingCritical += $Id
    }
}
if ($MissingCritical.Count -gt 0) {
    throw "Critical backend capabilities are unavailable: $($MissingCritical -join ', ')"
}

$UrlFile = Join-Path $Root "CLOUD_RUN_BACKEND_URL.txt"
$Url | Set-Content -LiteralPath $UrlFile -Encoding ASCII

$VercelEnv = @"
NEXT_PUBLIC_PDF_BACKEND_URL=$Url
NEXT_PUBLIC_APP_URL=$VercelOrigin
"@
Write-Utf8NoBom -Path (Join-Path $Root "CLOUD_RUN_VERCEL_ENV.txt") -Text $VercelEnv

$Summary = [ordered]@{
    deployed_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    project = $Project
    region = $Region
    service = $Service
    backend_url = $Url
    image = $Image
    health = $Health.status
    ready = $Ready.status
    backend_version = $Health.version
    available_tools = $Available.Count
    total_tools = @($Tools.tools).Count
    unavailable_tools = @($Unavailable | ForEach-Object { [ordered]@{ id=$_.id; reason=$_.unavailableReason } })
}
$Summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $Root "CLOUD_RUN_DEPLOYMENT_RESULT.json") -Encoding UTF8

Write-Host "`n==================================================" -ForegroundColor DarkGreen
Write-Host " AJN PDF CLOUD RUN BACKEND PASSED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor DarkGreen
Write-Host "Backend URL    : $Url" -ForegroundColor Green
Write-Host "Backend version: $($Health.version)" -ForegroundColor Green
Write-Host "Available tools: $($Available.Count)/$(@($Tools.tools).Count)" -ForegroundColor Green
Write-Host "Scale to zero  : min instances 0" -ForegroundColor Green
Write-Host "Cost guard     : max instances $MaxInstances" -ForegroundColor Green
Write-Host "Concurrency    : 1" -ForegroundColor Green

if ($Unavailable.Count -gt 0) {
    Write-Host "`nDependency-gated capabilities:" -ForegroundColor Yellow
    $Unavailable | ForEach-Object {
        Write-Host " - $($_.id): $($_.unavailableReason)"
    }
}

Write-Host "`nNEXT:" -ForegroundColor Yellow
Write-Host "1. Run: .\TEST_CLOUD_RUN_BACKEND.ps1"
Write-Host "2. In Vercel set NEXT_PUBLIC_PDF_BACKEND_URL=$Url"
Write-Host "3. Redeploy the Next.js frontend."
