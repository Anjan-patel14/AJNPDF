param(
    [switch]$SkipDeploy,
    [switch]$FullCheck
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Section([string]$Text) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Require-Success([string]$Label) {
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
    Write-Host "[PASS] $Label" -ForegroundColor Green
}

function Invoke-Vercel {
    param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        & vercel @Arguments
    } else {
        & npx --yes vercel@latest @Arguments
    }
}

Section 'AJN PDF :: 34-TOOL PRODUCTION RELEASE'

if (-not (Test-Path '.\package.json')) { throw 'package.json not found. Extract the ZIP first and run this script from the extracted project.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is missing. Install Node.js 22 LTS or 24 LTS.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm is missing from PATH.' }

$nodeVersion = (& node -p "process.versions.node").Trim()
$nodeMajor = [int](($nodeVersion -split '\.')[0])
Write-Host "[INFO] Node.js $nodeVersion"
if ($nodeMajor -lt 22 -or $nodeMajor -ge 25) {
    throw "AJN PDF requires Node.js >=22.12 and <25. Current version: $nodeVersion"
}

# Verified public production identity. These are public client-side identifiers, not secrets.
$env:NEXT_PUBLIC_APP_URL = 'https://www.ajnpdf.com'
$env:NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-4495802176396975'
$env:NEXT_PUBLIC_ADSENSE_SLOT_HOME_PRIMARY = '3648223351'
$env:NEXT_PUBLIC_ADSENSE_SLOT_HOME_SECONDARY = '4849624383'
$env:NEXT_PUBLIC_ADSENSE_SLOT_TOOL_CONTENT = '1601180258'

Section 'DEPENDENCIES'
if (-not (Test-Path '.\node_modules')) {
    Write-Host '[INFO] First run: installing exact package-lock dependencies.' -ForegroundColor Yellow
    & npm ci --prefer-offline --no-audit --no-fund
    Require-Success 'npm ci'
} else {
    Write-Host '[PASS] node_modules already exists; skipping reinstall.' -ForegroundColor Green
}

Section 'REFRESH SITEMAP MANIFEST'
& node scripts/generate-sitemap-lastmod.mjs
Require-Success 'sitemap lastmod generation'

Section 'FAST PRODUCTION GATES'
$fastChecks = @(
    'scripts/verify-r20-focused-seo.mjs',
    'scripts/verify-r21-product-ecosystem.mjs',
    'scripts/verify-final-ui.mjs',
    'scripts/verify-mobile-first.mjs',
    'scripts/verify-r24-public-tools.mjs',
    'scripts/verify-professional-seo.mjs',
    'scripts/verify-edit-pdf-public.mjs',
    'scripts/verify-browser-image-pdf.mjs',
    'scripts/verify-seo-ads.mjs',
    'scripts/verify-adsense-trust-seo.mjs',
    'scripts/verify-sitemap-indexing.mjs'
)
foreach ($check in $fastChecks) {
    & node $check
    Require-Success $check
}

if ($FullCheck) {
    Section 'FULL FRONTEND QUALITY GATE'
    & npm run check:frontend
    Require-Success 'npm run check:frontend'
} else {
    Section 'TYPECHECK + PRODUCTION BUILD'
    & npm run typecheck
    Require-Success 'npm run typecheck'
    & npm run build
    Require-Success 'npm run build'
}

if ($SkipDeploy) {
    Section 'PRODUCTION BUILD READY'
    Write-Host '[PASS] Build is production-ready. Deployment was skipped by request.' -ForegroundColor Green
    exit 0
}

Section 'VERCEL PRODUCTION DEPLOY'
Write-Host '[INFO] Production target is pinned to the existing anjan-patel14/ajnpdf Vercel project.' -ForegroundColor Yellow
$expectedVercelProjectId = 'prj_TIf2IH7TBzDFIpLSnS3ANiDPnYHU'
$expectedVercelOrgId = 'team_gW8v1ugSIkTzWdJCUh9PUbIC'

Invoke-Vercel whoami | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host '[INFO] Vercel login is required.' -ForegroundColor Yellow
    Invoke-Vercel login | Out-Host
    Require-Success 'Vercel login'
}

if (-not (Test-Path '.\.vercel\project.json')) {
    Write-Host '[INFO] No local Vercel project link found. Linking to existing project ajnpdf...' -ForegroundColor Yellow
    Invoke-Vercel link --yes --project ajnpdf | Out-Host
    Require-Success 'Vercel project link'
}

if (-not (Test-Path '.\.vercel\project.json')) {
    throw '.vercel/project.json was not created. Production deploy stopped to avoid deploying to the wrong project.'
}

try {
    $project = Get-Content '.\.vercel\project.json' -Raw | ConvertFrom-Json
    Write-Host "[INFO] Linked Vercel projectId: $($project.projectId)"
    Write-Host "[INFO] Linked Vercel orgId:     $($project.orgId)"
    if ($project.projectId -ne $expectedVercelProjectId -or $project.orgId -ne $expectedVercelOrgId) {
        throw "Wrong Vercel project link. Expected projectId=$expectedVercelProjectId and orgId=$expectedVercelOrgId."
    }
    Write-Host '[PASS] Vercel project identity matches anjan-patel14/ajnpdf.' -ForegroundColor Green
} catch {
    throw 'Unable to read .vercel/project.json. Production deploy stopped.'
}

Write-Host '[INFO] Deploying the validated source to Vercel production...' -ForegroundColor Yellow
$deployOutput = @(Invoke-Vercel deploy --prod --yes 2>&1 | Tee-Object -Variable deployLines)
if ($LASTEXITCODE -ne 0) {
    $deployOutput | Out-Host
    throw 'Vercel production deployment failed.'
}
$deployOutput | Out-Host
Write-Host '[PASS] Vercel production deployment command completed.' -ForegroundColor Green

Section 'LIVE POST-DEPLOYMENT CHECKS'
$canonical = 'https://www.ajnpdf.com'
$expectedAdsTxt = 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0'
$backend = 'https://ajn-pdf-api-580158856470.asia-south1.run.app/ready'
$liveFailures = @()

function Check-Url([string]$Url, [string]$Label) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 8 -TimeoutSec 30
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
            $script:liveFailures += "$Label returned HTTP $($response.StatusCode)"
            Write-Host "[FAIL] $Label HTTP $($response.StatusCode)" -ForegroundColor Red
            return $null
        }
        Write-Host "[PASS] $Label HTTP $($response.StatusCode)" -ForegroundColor Green
        return $response
    } catch {
        $script:liveFailures += "${Label}: $($_.Exception.Message)"
        Write-Host "[FAIL] $Label - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

$home = Check-Url "$canonical/" 'Homepage'
$pdfTools = Check-Url "$canonical/pdf-tools" 'PDF tools directory'
$scanner = Check-Url "$canonical/scanner" 'Scanner'
$privacy = Check-Url "$canonical/privacy" 'Privacy policy'
$contact = Check-Url "$canonical/contact" 'Contact page'
$robots = Check-Url "$canonical/robots.txt" 'robots.txt'
$sitemap = Check-Url "$canonical/sitemap.xml" 'sitemap.xml'
$ads = Check-Url "$canonical/ads.txt" 'ads.txt'
$ready = Check-Url $backend 'AJN PDF backend /ready'

if ($robots) {
    $robotsText = [string]$robots.Content
    if ($robotsText -match 'Mediapartners-Google' -and $robotsText -match 'Google-Display-Ads-Bot') {
        Write-Host '[PASS] robots.txt explicitly allows AdSense crawlers.' -ForegroundColor Green
    } else {
        $liveFailures += 'robots.txt does not expose the explicit AdSense crawler rules.'
        Write-Host '[FAIL] robots.txt explicit AdSense crawler rules are missing.' -ForegroundColor Red
    }
}

if ($ads -and $ads.Content.Trim() -ne $expectedAdsTxt) {
    $liveFailures += 'ads.txt content does not match the authorised publisher declaration.'
    Write-Host '[FAIL] ads.txt publisher line mismatch.' -ForegroundColor Red
} elseif ($ads) {
    Write-Host '[PASS] ads.txt publisher line matches.' -ForegroundColor Green
}

if ($home) {
    $html = [string]$home.Content
    if ($html -match '34 public tools') {
        Write-Host '[PASS] Live homepage exposes the 34-tool catalog marker.' -ForegroundColor Green
    } else {
        $liveFailures += 'Live homepage does not show the 34-tool catalog marker yet.'
        Write-Host '[FAIL] Live homepage does not show the 34-tool catalog marker yet.' -ForegroundColor Red
    }
    if ($html -match 'View all 26') {
        $liveFailures += 'Live homepage still exposes the stale 26-tool count.'
        Write-Host '[FAIL] Live homepage still exposes the stale 26-tool count.' -ForegroundColor Red
    } else {
        Write-Host '[PASS] No stale 26-tool homepage count.' -ForegroundColor Green
    }
    if ($html -match 'ajn-release') {
        Write-Host '[PASS] Live AJN release marker is present.' -ForegroundColor Green
    } else {
        Write-Host '[WARN] Live release marker was not visible in fetched HTML.' -ForegroundColor Yellow
    }
}

Section 'FINAL RESULT'
if ($liveFailures.Count -gt 0) {
    Write-Host '[BLOCKER] Deployment command completed, but live production still has issues:' -ForegroundColor Red
    foreach ($failure in $liveFailures) { Write-Host " - $failure" -ForegroundColor Red }
    Write-Host 'Do NOT request AdSense review until these live checks pass.' -ForegroundColor Yellow
    exit 2
}

Write-Host '[PASS] AJN PDF production deployment and live checks passed.' -ForegroundColor Green
Write-Host '[NEXT] In AdSense, verify/publish Privacy & messaging CMP, then request review.' -ForegroundColor Cyan
