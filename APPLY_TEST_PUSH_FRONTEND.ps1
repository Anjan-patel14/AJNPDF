param(
    [string]$RepoPath = "",
    [switch]$SkipPush,
    [switch]$SkipLiveWait
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$env:GIT_PAGER = "cat"
$env:PAGER = "cat"
$ReleaseRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$R10_9_CompatibilityCommitMessage = "fix: complete image licensing and admin diagnostics"
$CommitMessage = "fix: make AJN PDF R11.5 Windows verification reliable"

function Test-AjnRepo([string]$Path) {
    if (-not $Path -or -not (Test-Path -LiteralPath $Path -PathType Container)) { return $false }
    if (-not (Test-Path -LiteralPath (Join-Path $Path ".git") -PathType Container)) { return $false }
    $Package = Join-Path $Path "package.json"
    if (-not (Test-Path -LiteralPath $Package -PathType Leaf)) { return $false }
    try { return ((Get-Content -LiteralPath $Package -Raw | ConvertFrom-Json).name -eq "ajnpdf") } catch { return $false }
}

function Invoke-NodeGate([string]$Script, [string]$Label) {
    Write-Host "`n$Label" -ForegroundColor Cyan
    node $Script
    if ($LASTEXITCODE -ne 0) { throw "$Label failed." }
}

function Invoke-NpmGate([string]$Script, [string]$Label) {
    Write-Host "`n$Label" -ForegroundColor Cyan
    npm.cmd run $Script
    if ($LASTEXITCODE -ne 0) { throw "$Label failed." }
}

function Get-TrackedChanges([string]$Repository, [string[]]$Paths) {
    $Args = @("-C", $Repository, "status", "--porcelain=v1", "--untracked-files=no", "--") + $Paths
    return @(git @Args | Where-Object { $_ -and $_.Trim() })
}

function Assert-NoExistingStagedChanges([string]$Repository) {
    $AlreadyStaged = @(git -C $Repository diff --cached --name-only | Where-Object { $_ -and $_.Trim() })
    if ($AlreadyStaged.Count -gt 0) {
        Write-Host "Existing staged files:" -ForegroundColor Red
        $AlreadyStaged | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw "Safety stop: unstage or commit existing staged work before applying R11.5."
    }
}

Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host " AJN PDF 3.1.0 R11.5 WINDOWS BACKEND HASH / INTEGRATION HOTFIX" -ForegroundColor Cyan
Write-Host " R11.4 cumulative integration retained + Windows-safe backend hash verification" -ForegroundColor Cyan
Write-Host " Five locales + schema + Chrome package + safe Git push" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkCyan
# R11_BACKEND_POLICY: release owns only backend/.env.example, backend/app/main.py and backend/app/conversion_engine.py; all other protected backend source remains frozen.
Write-Host "Backend policy: only the three declared R11 backend files are release-owned; all other protected backend source remains frozen." -ForegroundColor DarkGray

Set-Location -LiteralPath $ReleaseRoot
Invoke-NodeGate ".\scripts\verify-r11-live-trust.mjs" "R11 source trust/production audit"
Invoke-NodeGate ".\scripts\verify-r10-chrome-extension.mjs" "Retained Chrome extension source audit"
Invoke-NodeGate ".\scripts\verify-r10-8-stability.mjs" "Retained R10.8 stability audit"
Invoke-NodeGate ".\scripts\verify-r10-9-search-admin.mjs" "Retained R10.9 search/admin audit"
Invoke-NodeGate ".\scripts\verify-r9-final-production.mjs" "Retained R9 final-production audit"
Invoke-NodeGate ".\scripts\verify-backend-frozen.mjs" "R11 backend source baseline audit"

if (-not $RepoPath) {
    $Known = @(
        "C:\Users\ANJAN PATEL\Desktop\AJN-PDF-GITHUB",
        (Join-Path $env:USERPROFILE "Desktop\AJN-PDF-GITHUB"),
        (Join-Path $env:USERPROFILE "Downloads\AJN-PDF-dev (2)\AJN-PDF-dev"),
        (Join-Path $env:USERPROFILE "Downloads\AJN-PDF-dev\AJN-PDF-dev")
    )
    foreach ($Candidate in $Known) { if (Test-AjnRepo $Candidate) { $RepoPath = $Candidate; break } }
}
if (-not (Test-AjnRepo $RepoPath)) { throw "AJN PDF Git repository was not found. Re-run with -RepoPath 'C:\path\to\AJN-PDF-GITHUB'." }
$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path

$Branch = (git -C $RepoPath branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) { throw "Could not determine Git branch." }
if ($Branch -ne "main") { throw "R11.5 must be applied on main. Current branch: $Branch" }
Write-Host "`nRepository: $RepoPath" -ForegroundColor Green
Write-Host "Branch    : $Branch" -ForegroundColor Green

Assert-NoExistingStagedChanges $RepoPath

# Back up every pre-existing tracked change before any release-owned overwrite.
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $env:USERPROFILE "Downloads"
$PatchPath = Join-Path $BackupRoot "AJN-PDF-BEFORE-R11-5-$Stamp.patch"
$StatusPath = Join-Path $BackupRoot "AJN-PDF-BEFORE-R11-5-$Stamp-status.txt"
$Diff = @(git -C $RepoPath --no-pager diff --binary)
[IO.File]::WriteAllLines($PatchPath, $Diff, [Text.UTF8Encoding]::new($false))
$Status = @(git -C $RepoPath status --porcelain=v1)
[IO.File]::WriteAllLines($StatusPath, $Status, [Text.UTF8Encoding]::new($false))
Write-Host "Safety patch : $PatchPath" -ForegroundColor Yellow
Write-Host "Safety status: $StatusPath" -ForegroundColor Yellow

# R11.5 is idempotent after a previously interrupted R11 run.
# Dirty backend release-owned files are allowed only when their bytes already match this release.
$BackendPatchPaths = @("backend/.env.example", "backend/app/main.py", "backend/app/conversion_engine.py")
$BackendConflicts = @()
foreach ($Relative in $BackendPatchPaths) {
    $Dirty = @(Get-TrackedChanges $RepoPath @($Relative))
    if ($Dirty.Count -eq 0) { continue }
    $Source = Join-Path $ReleaseRoot ($Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    $Target = Join-Path $RepoPath ($Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    $MatchesRelease = $false
    if ((Test-Path -LiteralPath $Source -PathType Leaf) -and (Test-Path -LiteralPath $Target -PathType Leaf)) {
        $SourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Source).Hash
        $TargetHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $Target).Hash
        $MatchesRelease = ($SourceHash -eq $TargetHash)
    }
    if ($MatchesRelease) {
        Write-Host "Existing partial R11 backend file already matches release: $Relative" -ForegroundColor DarkGreen
    } else {
        $BackendConflicts += $Relative
    }
}
if ($BackendConflicts.Count -gt 0) {
    Write-Host "Conflicting backend files:" -ForegroundColor Red
    $BackendConflicts | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    throw "Safety stop: a release-owned backend file has local content different from R11.5. A backup patch was created; no reset/clean was performed."
}

# Remove only accidental root files created by the previously interrupted shell command.
$Accidental = @(
    "Online - Convert, Merge, Compress",
    "Online - Convert, Merge, Compress, Edit",
    "s, edit, sign, scan and  PDF, document and image files online with simple, powerful tools."
)
foreach ($Name in $Accidental) {
    $Full = Join-Path $RepoPath $Name
    if (Test-Path -LiteralPath $Full -PathType Leaf) {
        $Tracked = @(git -C $RepoPath ls-files -- $Name)
        if ($Tracked.Count -eq 0) {
            Remove-Item -LiteralPath $Full -Force
            Write-Host "Removed accidental untracked file: $Name" -ForegroundColor DarkYellow
        }
    }
}
if (Test-Path -LiteralPath (Join-Path $RepoPath "scripts\verify-r8-premium-pro-ui.mjs.before-r8-lint-fix")) {
    Write-Host "Preserved existing R8 verifier backup file." -ForegroundColor Green
}

$ReleaseOwned = @()

# Cumulative installer rule: sync the complete packaged frontend/source verifier surfaces.
# This prevents package audits from passing while the installed repository keeps an older prerequisite file.
foreach ($Tree in @("src", "scripts", "chrome-extension")) {
    $TreeRoot = Join-Path $ReleaseRoot $Tree
    if (Test-Path -LiteralPath $TreeRoot -PathType Container) {
        $ReleaseOwned += @(Get-ChildItem -LiteralPath $TreeRoot -Recurse -File | ForEach-Object {
            $_.FullName.Substring($ReleaseRoot.Length + 1).Replace([IO.Path]::DirectorySeparatorChar, '/')
        })
    }
}

$RootOwned = @(
    ".env.example",
    "ADSENSE_REVIEW_CHECKLIST.md",
    "AJN-PDF-CHROME-EXTENSION-1.0.0.zip",
    "APPLY_TEST_PUSH_FRONTEND.ps1",
    "BACKEND_UNCHANGED_SHA256.txt",
    "BACKUP_RUNTIME_DATA.ps1",
    "CHROME_WEB_STORE_SUBMISSION_GUIDE.md",
    "CONFIGURE_AJN_ADMIN_LOCAL.ps1",
    "POST_DEPLOYMENT_CHECKLIST.md",
    "PRODUCTION_DEPLOYMENT_GUIDE.md",
    "README.md",
    "SEO_GROWTH_SYSTEM.md",
    "SEO_SETUP_CHECKLIST.md",
    "SETUP_FULL_PRODUCTION.ps1",
    "R10_8_1_INTEGRATION_VERIFIER_HOTFIX.md",
    "R10_8_FEATURES_FUNCTIONS_LOGIC.md",
    "R10_8_STABILITY_MOBILE_TRUST.md",
    "R10_9_ADMIN_RUNTIME_GUIDE.md",
    "R10_9_SEARCH_ADMIN_PRODUCTION_POLISH.md",
    "R11_LIVE_TRUST_PRODUCTION_CLEANUP.md",
    "R11_POST_DEPLOYMENT_CHECKLIST.md",
    "R11_1_BACKEND_BASELINE_HOTFIX.md",
    "R11_2_POWERSHELL_HERO_HOTFIX.md",
    "R11_3_VERIFIER_COMPATIBILITY_HOTFIX.md",
    "R11_4_CUMULATIVE_INSTALL_HOTFIX.md",
    "R11_5_WINDOWS_BACKEND_HASH_HOTFIX.md",
    "next.config.ts",
    "backend/.env.example",
    "backend/app/main.py",
    "backend/app/conversion_engine.py",
    "public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip"
)
$ReleaseOwned += $RootOwned
$ReleaseOwned = @($ReleaseOwned | Sort-Object -Unique)

# Integration guard: all files directly read by the retained installed source verifiers must be synced.
$RequiredInstalledAuditFiles = @(
    "APPLY_TEST_PUSH_FRONTEND.ps1",
    "CONFIGURE_AJN_ADMIN_LOCAL.ps1",
    "next.config.ts",
    "scripts/verify-brand-media-theme.mjs",
    "scripts/verify-production.mjs",
    "src/app/admin/analytics/page.tsx",
    "src/app/admin/media/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/discover/[slug]/page.tsx",
    "src/app/discover/page.tsx",
    "src/app/error.tsx",
    "src/app/faq/page.tsx",
    "src/app/globals.css",
    "src/app/image-licensing/page.tsx",
    "src/app/layout.tsx",
    "src/app/limits/page.tsx",
"src/app/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
    "src/app/status/page.tsx",
    "src/app/tools/[id]/page.tsx",
    "src/app/transparency/page.tsx",
    "src/components/ajn/tool-runtime-facts.tsx",
    "src/components/ajnpdf/processing-activity-provider.tsx",
    "src/components/junction/_shared.tsx",
    "src/components/junction/backend-status.tsx",
    "src/components/junction/tool-editorial-content.tsx",
    "src/components/landing/hero.tsx",
    "src/components/landing/main-footer.tsx",
    "src/components/landing/navbar.tsx",
    "src/components/landing/services-grid.tsx",
    "src/lib/admin-diagnostics.ts",
    "src/lib/pdf-backend.ts",
    "src/lib/seo-config.ts",
    "src/lib/seo-strategy.ts",
    "src/lib/tool-limits.ts",
    "src/lib/tool-policy.ts",
    "chrome-extension/pdf-builder.js",
    "chrome-extension/tools.js",
    "chrome-extension/workspace.js"
)
$MissingIntegration = @($RequiredInstalledAuditFiles | Where-Object { $ReleaseOwned -notcontains $_ })
if ($MissingIntegration.Count -gt 0) {
    $MissingIntegration | ForEach-Object { Write-Host "Missing cumulative integration path: $_" -ForegroundColor Red }
    throw "R11.5 cumulative integration manifest is incomplete."
}
Write-Host "Cumulative integration manifest: PASS ($($ReleaseOwned.Count) release-owned files)" -ForegroundColor Green


# Clear Git index flags that can hide working-tree changes on tracked release-owned files.
foreach ($Relative in $ReleaseOwned) {
    $Tracked = @(git -C $RepoPath ls-files -- $Relative)
    if ($Tracked.Count -gt 0) {
        git -C $RepoPath update-index --no-assume-unchanged -- $Relative 2>$null
        git -C $RepoPath update-index --no-skip-worktree -- $Relative 2>$null
    }
}

Write-Host "`nApplying cumulative R10.8 + R10.9 + R11.5 release-owned files..." -ForegroundColor Cyan
foreach ($Relative in $ReleaseOwned) {
    $Source = Join-Path $ReleaseRoot ($Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Release-owned file is missing from R11.5: $Relative" }
    $Target = Join-Path $RepoPath ($Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Target -Force
}

Set-Location -LiteralPath $RepoPath
Invoke-NodeGate ".\scripts\verify-r11-live-trust.mjs" "Installed R11.5 source trust/production audit"
Invoke-NodeGate ".\scripts\verify-r10-chrome-extension.mjs" "Installed Chrome extension audit"
Invoke-NodeGate ".\scripts\verify-r10-8-stability.mjs" "Installed R10.8 stability audit"
Invoke-NodeGate ".\scripts\verify-r10-9-search-admin.mjs" "Installed R10.9 search/admin audit"
Invoke-NodeGate ".\scripts\verify-r9-final-production.mjs" "Installed R9 final-production audit"
Invoke-NodeGate ".\scripts\verify-backend-frozen.mjs" "Installed R11.5 backend baseline audit"
Invoke-NpmGate "verify:seo-ads" "SEO / AdSense source gate"
Invoke-NpmGate "verify:production" "Production source gate"
Invoke-NpmGate "verify:trust-ui" "Trust/UI source gate"
Invoke-NpmGate "verify:links" "Internal links gate"
Invoke-NpmGate "verify:final-ui" "Final UI gate"
Invoke-NpmGate "verify:growth-seo" "Growth SEO gate"
Invoke-NpmGate "verify:brand-media-theme" "Brand/media gate"
Invoke-NpmGate "verify:accessibility" "Accessibility source gate"
Invoke-NpmGate "verify:mobile-first" "Mobile-first source gate"
Invoke-NpmGate "verify:i18n" "Five-language i18n gate"
Invoke-NpmGate "verify:tool-ux" "Tool UX gate"
Invoke-NpmGate "verify:code-quality" "Code-quality gate"
Invoke-NpmGate "verify:backend-workflow" "Backend workflow source gate"
Invoke-NpmGate "verify:capabilities" "Live capability manifest gate"
Invoke-NpmGate "lint" "ESLint zero-warning gate"
Invoke-NpmGate "typecheck" "TypeScript semantic gate"
Invoke-NpmGate "build" "Optimized Next.js production build"
Invoke-NodeGate ".\scripts\verify-r10-8-runtime.mjs" "Built-production SSR / header / duplicate-hero runtime smoke"

# Stage only R11 release-owned files. Untracked backups and unrelated local work are not staged.
foreach ($Relative in $ReleaseOwned) {
    $Target = Join-Path $RepoPath ($Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (Test-Path -LiteralPath $Target) {
        if ($Relative -eq "public/downloads/AJN-PDF-CHROME-EXTENSION-1.0.0.zip") { git -C $RepoPath add -f -- $Relative }
        else { git -C $RepoPath add -- $Relative }
    }
    if ($LASTEXITCODE -ne 0) { throw "git add failed for $Relative" }
}

$Staged = @(git -C $RepoPath diff --cached --name-only | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($Staged.Count -eq 0) {
    Write-Host "No new R11 diff remains to commit; current HEAD may already contain this cumulative release." -ForegroundColor Yellow
} else {
    $Unexpected = @($Staged | Where-Object { $ReleaseOwned -notcontains $_.Replace('\','/') })
    if ($Unexpected.Count -gt 0) {
        Write-Host "Unexpected staged files:" -ForegroundColor Red
        $Unexpected | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw "Safety stop: staging contains files outside the R11.5 cumulative release manifest."
    }

    Write-Host "`nR11.5 staged files:" -ForegroundColor Cyan
    $Staged | ForEach-Object { Write-Host "  $_" }
    git -C $RepoPath --no-pager diff --cached --stat

    git -C $RepoPath commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }
}

if (-not $SkipPush) {
    git -C $RepoPath fetch origin main
    if ($LASTEXITCODE -ne 0) { throw "git fetch origin main failed." }
    $Counts = (git -C $RepoPath rev-list --left-right --count origin/main...HEAD).Trim() -split "\s+"
    $Behind = [int]$Counts[0]
    $Ahead = [int]$Counts[1]
    if ($Behind -gt 0) { throw "Local main is behind origin/main by $Behind commit(s). R11 refuses to force push." }
    if ($Ahead -gt 0) {
        Write-Host "`nPushing main to origin..." -ForegroundColor Cyan
        git -C $RepoPath push origin main
        if ($LASTEXITCODE -ne 0) { throw "Git push failed." }
    } else {
        Write-Host "origin/main already contains the current HEAD." -ForegroundColor Green
    }
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " AJN PDF R11.5 SOURCE / BUILD / GIT UPDATE COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Canonical host : https://www.ajnpdf.com" -ForegroundColor Green
Write-Host "Homepage SEO   : updated" -ForegroundColor Green
Write-Host "Five locales   : updated / 511 keys retained" -ForegroundColor Green
Write-Host "Stale routes   : canonical redirects added" -ForegroundColor Green
Write-Host "Trust copy     : temporary processing wording hardened" -ForegroundColor Green
Write-Host "Schema         : developer / AJN Studio publisher / AJN PDF brand aligned" -ForegroundColor Green
Write-Host "Chrome package : rebuilt for www canonical host" -ForegroundColor Green
Write-Host "Backend defaults: canonical production origins aligned" -ForegroundColor Green
Write-Host "`nFinal Git status:" -ForegroundColor Cyan
git -C $RepoPath status -sb
Write-Host "`nLatest commits:" -ForegroundColor Cyan
git -C $RepoPath --no-pager log --oneline -5

if (-not $SkipPush -and -not $SkipLiveWait) {
    Write-Host "`nWaiting briefly for the production deployment to expose the new homepage title..." -ForegroundColor Cyan
    $Ready = $false
    for ($Attempt = 1; $Attempt -le 18; $Attempt++) {
        try {
            $Html = (Invoke-WebRequest -UseBasicParsing -Uri "https://www.ajnpdf.com/" -TimeoutSec 15).Content
            if ($Html -like "*Free PDF Tools Online - Convert, Merge, Compress*") { $Ready = $true; break }
        } catch { }
        Start-Sleep -Seconds 20
    }
    if ($Ready) {
        Write-Host "Production appears updated. Running the R11 live audit..." -ForegroundColor Green
        node ".\scripts\audit-r11-live-site.mjs"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "The Git/build update succeeded, but the live audit found deployment/provider items that still need attention." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Git push succeeded, but the production deployment did not expose the new title within the wait window." -ForegroundColor Yellow
        Write-Host "After Vercel finishes, run: node scripts/audit-r11-live-site.mjs" -ForegroundColor Yellow
    }
}

Write-Host "`nProvider-side items are intentionally not fabricated by this ZIP:" -ForegroundColor Yellow
Write-Host "- Search Console recrawl/index changes" -ForegroundColor Yellow
Write-Host "- field Core Web Vitals" -ForegroundColor Yellow
Write-Host "- AdSense/CMP approval" -ForegroundColor Yellow
Write-Host "- Chrome Web Store approval" -ForegroundColor Yellow
Write-Host "- managed durable database/object storage and production secret values" -ForegroundColor Yellow
