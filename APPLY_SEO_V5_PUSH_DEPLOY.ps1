$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$SourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Repo = 'git@github.com:Anjan-patel14/AJNPDF.git'
$ExpectedProjectId = 'prj_TIf2IH7TBzDFIpLSnS3ANiDPnYHU'
$ExpectedOrgId = 'team_gW8v1ugSIkTzWdJCUh9PUbIC'
$ExpectedAdsTxt = 'google.com, pub-4495802176396975, DIRECT, f08c47fec0942fa0'
$GitWork = Join-Path $env:TEMP 'AJNPDF_SEO_V5_GIT'

function Section([string]$Text) {
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor Cyan
}
function Require-LastExit([string]$Label) {
    if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE." }
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

Section 'AJN PDF SEO V5 :: PRECHECK'
foreach ($cmd in @('node','npm','git')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd is not installed or not in PATH." }
}
$nodeVersion = (& node -p "process.versions.node").Trim()
$nodeMajor = [int](($nodeVersion -split '\.')[0])
Write-Host "[INFO] Node.js $nodeVersion"
if ($nodeMajor -lt 22 -or $nodeMajor -ge 25) { throw "Use Node.js >=22.12 and <25. Current: $nodeVersion" }

Set-Location $SourceRoot
if (-not (Test-Path '.\package.json')) { throw 'package.json is missing from the SEO V5 package.' }

Section 'SOURCE SEO / ADSENSE GATES'
& node scripts/generate-sitemap-lastmod.mjs
Require-LastExit 'sitemap lastmod generation'
$checks = @(
    'scripts/verify-adsense-trust-seo.mjs',
    'scripts/verify-r20-focused-seo.mjs',
    'scripts/verify-r21-product-ecosystem.mjs',
    'scripts/verify-r24-public-tools.mjs',
    'scripts/verify-seo-ads.mjs',
    'scripts/verify-sitemap-indexing.mjs'
)
foreach ($check in $checks) {
    & node $check
    Require-LastExit $check
}

Section 'BACK UP CURRENT GITHUB MAIN'
Remove-Item $GitWork -Recurse -Force -ErrorAction SilentlyContinue
& git clone --branch main --single-branch $Repo $GitWork
Require-LastExit 'clone Anjan-patel14/AJNPDF main'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupBranch = "backup-before-seo-v5-$stamp"
& git -C $GitWork branch $backupBranch
Require-LastExit 'create backup branch'
& git -C $GitWork push origin $backupBranch
Require-LastExit "push backup branch $backupBranch"
Write-Host "[PASS] Remote backup branch created: $backupBranch" -ForegroundColor Green

Section 'SYNC VALIDATED V5 SOURCE INTO EXISTING REPO'
$excludeDirs = @(
    '.git','node_modules','.next','.next-local','.next-dev','.vercel',
    '__pycache__','.pytest_cache'
)
$excludeFiles = @('.env','.env.local','.env.production','.env.development')
$roboArgs = @($SourceRoot,$GitWork,'/MIR','/R:2','/W:1','/NFL','/NDL','/NJH','/NJS','/NP','/XD') + $excludeDirs + @('/XF') + $excludeFiles
& robocopy @roboArgs | Out-Host
$roboCode = $LASTEXITCODE
if ($roboCode -ge 8) { throw "robocopy failed with exit code $roboCode" }
Write-Host "[PASS] Source sync completed (robocopy code $roboCode)." -ForegroundColor Green

Set-Location $GitWork
& git diff --check
Require-LastExit 'git diff --check'

Section 'INSTALL + VERIFY ACTUAL GITHUB WORKTREE'
& npm ci --no-audit --no-fund
Require-LastExit 'npm ci'
& node scripts/generate-sitemap-lastmod.mjs
Require-LastExit 'sitemap lastmod generation in Git worktree'
foreach ($check in $checks) {
    & node $check
    Require-LastExit $check
}
& npm run typecheck
Require-LastExit 'npm run typecheck'
& npm run build
Require-LastExit 'npm run build'

Section 'COMMIT + PUSH MAIN'
& git add -A
$changes = (& git status --porcelain)
if ([string]::IsNullOrWhiteSpace(($changes -join "`n"))) {
    Write-Host '[PASS] GitHub main already matches SEO V5; no commit required.' -ForegroundColor Green
} else {
    if (-not (& git config user.name)) { & git config user.name 'AJN PDF Release' }
    if (-not (& git config user.email)) { & git config user.email 'anjandev325@gmail.com' }
    & git commit -m 'SEO: AdSense trust, legal pages and 34-tool release'
    Require-LastExit 'git commit'
    & git push origin main
    Require-LastExit 'git push origin main'
}
$head = (& git rev-parse HEAD).Trim()
Write-Host "[PASS] GitHub main HEAD: $head" -ForegroundColor Green

Section 'VERCEL PRODUCTION DEPLOY'
Invoke-Vercel whoami | Out-Host
if ($LASTEXITCODE -ne 0) {
    Invoke-Vercel login | Out-Host
    Require-LastExit 'Vercel login'
}
Remove-Item '.\.vercel' -Recurse -Force -ErrorAction SilentlyContinue
Invoke-Vercel link --yes --project ajnpdf | Out-Host
Require-LastExit 'Vercel link existing ajnpdf project'

if (-not (Test-Path '.\.vercel\project.json')) { throw '.vercel/project.json was not created.' }
$project = Get-Content '.\.vercel\project.json' -Raw | ConvertFrom-Json
if ($project.projectId -ne $ExpectedProjectId -or $project.orgId -ne $ExpectedOrgId) {
    throw "Wrong Vercel target. Expected $ExpectedOrgId / $ExpectedProjectId but got $($project.orgId) / $($project.projectId)."
}
Write-Host '[PASS] Vercel target confirmed: anjan-patel14/ajnpdf' -ForegroundColor Green

Invoke-Vercel --prod --yes | Out-Host
Require-LastExit 'Vercel production deploy'

Section 'LIVE TRUST CHECK'
function Fetch([string]$Url,[string]$Label) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -MaximumRedirection 8 -TimeoutSec 30
        Write-Host "[PASS] $Label HTTP $($r.StatusCode)" -ForegroundColor Green
        return $r
    } catch {
        $status = $null
        try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq 403) {
            Write-Host "[CLOUDFLARE] $Label returned HTTP 403. Check Cloudflare bot/challenge settings before AdSense review." -ForegroundColor Yellow
        } else {
            Write-Host "[WARN] $Label fetch failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

$home = Fetch 'https://www.ajnpdf.com/' 'Homepage'
$robots = Fetch 'https://www.ajnpdf.com/robots.txt' 'robots.txt'
$sitemap = Fetch 'https://www.ajnpdf.com/sitemap.xml' 'sitemap.xml'
$ads = Fetch 'https://www.ajnpdf.com/ads.txt' 'ads.txt'
$privacy = Fetch 'https://www.ajnpdf.com/privacy' 'Privacy'
$terms = Fetch 'https://www.ajnpdf.com/terms' 'Terms'
$disclaimer = Fetch 'https://www.ajnpdf.com/disclaimer' 'Disclaimer'
$contact = Fetch 'https://www.ajnpdf.com/contact' 'Contact'

if ($ads) {
    if ($ads.Content.Trim() -ne $ExpectedAdsTxt) { throw 'ads.txt does not match the authorised AdSense publisher declaration.' }
    Write-Host '[PASS] ads.txt publisher line matches.' -ForegroundColor Green
}
if ($robots) {
    $rt = [string]$robots.Content
    if ($rt -notmatch 'Mediapartners-Google' -or $rt -notmatch 'Google-Display-Ads-Bot') {
        throw 'robots.txt is missing explicit AdSense crawler allow rules.'
    }
    Write-Host '[PASS] robots.txt explicitly allows AdSense crawlers.' -ForegroundColor Green
}
if ($home) {
    $html = [string]$home.Content
    if ($html -match 'View all 26') { throw 'Stale View all 26 text is still live.' }
    Write-Host '[PASS] stale 26-tool homepage copy is gone.' -ForegroundColor Green
}

Section 'DONE'
Write-Host '[PASS] AJN PDF SEO V5 source is synced, validated, pushed and deployed.' -ForegroundColor Green
Write-Host "[INFO] Git backup branch: $backupBranch" -ForegroundColor Cyan
Write-Host '[NEXT] Complete the Cloudflare verified-bot settings in CLOUDFLARE_ADSENSE_SETUP.txt before requesting AdSense review.' -ForegroundColor Cyan
