param(
  [string]$ProjectId = 'studio-4223217082-69711',
  [string]$SiteDomain = 'www.ajnpdf.com'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$script:NativeExit = 0

function Section([string]$Text) {
  Write-Host "`n============================================================" -ForegroundColor Cyan
  Write-Host " $Text" -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor Cyan
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

function Set-VercelConfig([string]$Name, [string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) { throw "Empty Vercel value refused for $Name" }
  $tmp = Join-Path $env:TEMP ("ajnpdf-r24-auth-" + [Guid]::NewGuid().ToString('N') + '.txt')
  [IO.File]::WriteAllText($tmp, $Value, [Text.UTF8Encoding]::new($false))
  try {
    Invoke-Cmd "npx -y vercel@latest env rm $Name production -y" -AllowFailure
    Invoke-Cmd "type `"$tmp`" | npx -y vercel@latest env add $Name production --visibility config --no-sensitive" -Label "Unable to configure Vercel env $Name"
    Write-Host "[ENV PASS] $Name" -ForegroundColor Green
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Get-StatusCode($ErrorRecord) {
  try { return [int]$ErrorRecord.Exception.Response.StatusCode } catch { return 0 }
}

function Get-IdpConfig([string]$IdpId, [hashtable]$Headers) {
  $escapedIdp = [uri]::EscapeDataString($IdpId)
  $uri = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/defaultSupportedIdpConfigs/$escapedIdp"
  try {
    return Invoke-RestMethod -Method Get -Uri $uri -Headers $Headers -TimeoutSec 30
  } catch {
    if ((Get-StatusCode $_) -eq 404) { return $null }
    throw
  }
}

function Enable-ExistingIdp([string]$IdpId, [hashtable]$Headers) {
  $existing = Get-IdpConfig $IdpId $Headers
  if (-not $existing) {
    throw "$IdpId is not configured in Firebase. Open Firebase Console > Authentication > Sign-in method > Google, enable it once, save, then rerun this command."
  }
  if ($existing.enabled -ne $true) {
    $escapedIdp = [uri]::EscapeDataString($IdpId)
    $uri = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/defaultSupportedIdpConfigs/${escapedIdp}?updateMask=enabled"
    $body = @{ name = "projects/$ProjectId/defaultSupportedIdpConfigs/$IdpId"; enabled = $true } | ConvertTo-Json
    Invoke-RestMethod -Method Patch -Uri $uri -Headers $Headers -ContentType 'application/json' -Body $body -TimeoutSec 30 | Out-Null
  }
  Write-Host "[PASS] $IdpId enabled" -ForegroundColor Green
}

function Get-SdkValue($SdkConfig, [string]$Raw, [string]$Key) {
  if ($SdkConfig -and $SdkConfig -isnot [string]) {
    $property = $SdkConfig.PSObject.Properties[$Key]
    if ($property -and $property.Value) { return [string]$property.Value }
  }
  $quotedKey = [regex]::Escape($Key)
  $patterns = @(
    '"' + $quotedKey + '"\s*:\s*"([^"]+)"',
    $quotedKey + '\s*:\s*["'']([^"'']+)["'']'
  )
  foreach ($pattern in $patterns) {
    $match = [regex]::Match($Raw, $pattern)
    if ($match.Success) { return $match.Groups[1].Value }
  }
  return ''
}

Section 'AJN PDF R24 :: GOOGLE + EMAIL AUTHENTICATION'

Write-Host '[1/8] Verifying local target...' -ForegroundColor Yellow
foreach ($command in @('node','npm','npx','gcloud','curl.exe')) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "$command is required." }
}
if (-not (Test-Path '.vercel\project.json')) { throw 'Vercel project is not linked.' }
$vercelProject = Get-Content '.vercel\project.json' -Raw | ConvertFrom-Json
if ($vercelProject.projectId -ne 'prj_bZQ5WOwR2hjxFkATT6NaiIr1AoN8') { throw 'Wrong Vercel project. Expected AJN PDF.' }
$who = (cmd /c 'npx -y vercel@latest whoami 2>&1' | Out-String)
if ($who -notmatch 'ajnpdf-2086') { throw 'Wrong Vercel account. Expected ajnpdf-2086.' }
Write-Host '[PASS] Correct AJN PDF Vercel account/project.' -ForegroundColor Green

Write-Host '`n[2/8] Verifying Google + Email source...' -ForegroundColor Yellow
node scripts/verify-r21-product-ecosystem.mjs
if ($LASTEXITCODE -ne 0) { throw 'AJN PDF authentication source verification failed.' }
Write-Host '[PASS] Google + Email/Gmail only; Facebook/GitHub/Anonymous absent.' -ForegroundColor Green

Write-Host '`n[3/8] Configuring Firebase sign-in policy...' -ForegroundColor Yellow
Invoke-Cmd "gcloud config set project $ProjectId" -Label 'Unable to select Google Cloud project'
$AccessToken = (& gcloud auth print-access-token --project=$ProjectId 2>$null | Out-String).Trim()
if (-not $AccessToken) { throw 'Unable to obtain Google Cloud access token.' }
$Headers = @{ Authorization = "Bearer $AccessToken"; 'X-Goog-User-Project' = $ProjectId }
$configUri = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/config"
$config = Invoke-RestMethod -Method Get -Uri $configUri -Headers $Headers -TimeoutSec 30
$domains = @($config.authorizedDomains | Where-Object { $_ })
foreach ($domain in @($SiteDomain, 'ajnpdf.com', "$ProjectId.firebaseapp.com")) {
  if ($domains -notcontains $domain) { $domains += $domain }
}
$policyBody = @{
  name = "projects/$ProjectId/config"
  signIn = @{
    anonymous = @{ enabled = $false }
    email = @{ enabled = $true; passwordRequired = $true }
  }
  authorizedDomains = @($domains | Select-Object -Unique)
} | ConvertTo-Json -Depth 8
$policyUri = "${configUri}?updateMask=signIn.anonymous.enabled,signIn.email.enabled,signIn.email.passwordRequired,authorizedDomains"
Invoke-RestMethod -Method Patch -Uri $policyUri -Headers $Headers -ContentType 'application/json' -Body $policyBody -TimeoutSec 30 | Out-Null
$config = Invoke-RestMethod -Method Get -Uri $configUri -Headers $Headers -TimeoutSec 30
if ($config.signIn.anonymous.enabled -eq $true) { throw 'Anonymous Authentication is still enabled.' }
if ($config.signIn.email.enabled -ne $true -or $config.signIn.email.passwordRequired -ne $true) { throw 'Email/password Authentication is not enabled correctly.' }
Write-Host '[PASS] Email/password enabled.' -ForegroundColor Green
Write-Host '[PASS] Anonymous Authentication disabled.' -ForegroundColor Green
Write-Host '[PASS] AJN PDF domains authorized.' -ForegroundColor Green

Write-Host '`n[4/8] Verifying Google provider...' -ForegroundColor Yellow
Enable-ExistingIdp 'google.com' $Headers

Write-Host '`n[5/8] Recovering Firebase Web SDK configuration...' -ForegroundColor Yellow
$appListRaw = (& npx -y firebase-tools@latest apps:list --project $ProjectId --json 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $appListRaw) { throw 'Unable to list Firebase apps. Run firebase login and retry.' }
$appListJson = $appListRaw | ConvertFrom-Json
$apps = @()
if ($appListJson.result -is [System.Array]) { $apps = @($appListJson.result) }
elseif ($appListJson.result.apps) { $apps = @($appListJson.result.apps) }
$webApps = @($apps | Where-Object { ([string]$_.platform).ToUpperInvariant() -eq 'WEB' -or ([string]$_.appId) -match ':web:' })
if (-not $webApps.Count) { throw 'No Firebase Web app is registered for AJN PDF.' }
$selected = $null
if ($webApps.Count -eq 1) { $selected = $webApps[0] }
else {
  $matches = @($webApps | Where-Object { ([string]$_.displayName) -match '(?i)ajn.*pdf|pdf.*ajn' })
  if ($matches.Count -eq 1) { $selected = $matches[0] }
}
if (-not $selected) {
  Write-Host 'Multiple Firebase Web apps found:' -ForegroundColor Yellow
  $webApps | ForEach-Object { Write-Host (" - " + $_.displayName + " :: " + $_.appId) }
  $chosenId = (Read-Host 'Enter the AJN PDF Firebase Web App ID exactly').Trim()
  $selected = $webApps | Where-Object { $_.appId -eq $chosenId } | Select-Object -First 1
}
if (-not $selected) { throw 'AJN PDF Firebase Web app could not be selected.' }
$sdkRaw = (& npx -y firebase-tools@latest apps:sdkconfig WEB $selected.appId --project $ProjectId --json 2>$null | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or -not $sdkRaw) { throw 'Unable to retrieve Firebase Web SDK configuration.' }
$sdkJson = $sdkRaw | ConvertFrom-Json
$sdkConfig = if ($sdkJson.result.sdkConfig) { $sdkJson.result.sdkConfig } else { $sdkJson.result }
$ApiKey = Get-SdkValue $sdkConfig $sdkRaw 'apiKey'
$AuthDomain = Get-SdkValue $sdkConfig $sdkRaw 'authDomain'
$AppId = Get-SdkValue $sdkConfig $sdkRaw 'appId'
if (-not $AuthDomain) { $AuthDomain = "$ProjectId.firebaseapp.com" }
if (-not $ApiKey -or -not $AppId) { throw 'Firebase Web SDK config is incomplete.' }
Write-Host "[PASS] Firebase Web app selected: $($selected.displayName)" -ForegroundColor Green

Write-Host '`n[6/8] Installing Firebase Web config in Vercel Production...' -ForegroundColor Yellow
Set-VercelConfig 'NEXT_PUBLIC_FIREBASE_API_KEY' $ApiKey
Set-VercelConfig 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' $ProjectId
Set-VercelConfig 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN' $AuthDomain
Set-VercelConfig 'NEXT_PUBLIC_FIREBASE_APP_ID' $AppId
Set-VercelConfig 'FIREBASE_PROJECT_ID' $ProjectId
Invoke-Cmd 'npx -y vercel@latest env rm NEXT_PUBLIC_GOOGLE_CLIENT_ID production -y' -AllowFailure
Write-Host '[PASS] Firebase Vercel production environment configured.' -ForegroundColor Green

Write-Host '`n[7/8] Running production checks...' -ForegroundColor Yellow
$env:NEXT_PUBLIC_FIREBASE_API_KEY=$ApiKey
$env:NEXT_PUBLIC_FIREBASE_PROJECT_ID=$ProjectId
$env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$AuthDomain
$env:NEXT_PUBLIC_FIREBASE_APP_ID=$AppId
$env:FIREBASE_PROJECT_ID=$ProjectId
npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
node scripts/verify-r21-product-ecosystem.mjs
if ($LASTEXITCODE -ne 0) { throw 'Auth verification failed.' }
npm run lint
if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'TypeScript failed.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
Write-Host '[PASS] Google + Email authentication production build.' -ForegroundColor Green

Write-Host '`n[8/8] Deploying authentication to Vercel Production...' -ForegroundColor Yellow
Invoke-Cmd 'npx -y vercel@latest --prod --yes' -Label 'Vercel production deployment failed'
$loginCode = (& curl.exe -L -s -o NUL -w '%{http_code}' "https://$SiteDomain/login" | Out-String).Trim()
$signupCode = (& curl.exe -L -s -o NUL -w '%{http_code}' "https://$SiteDomain/signup" | Out-String).Trim()
if ($loginCode -ne '200' -or $signupCode -ne '200') { throw "Live auth pages failed: login=$loginCode signup=$signupCode" }
$config = Invoke-RestMethod -Method Get -Uri $configUri -Headers $Headers -TimeoutSec 30
$google = Get-IdpConfig 'google.com' $Headers
if ($config.signIn.anonymous.enabled -eq $true) { throw 'Anonymous unexpectedly enabled.' }
if ($config.signIn.email.enabled -ne $true) { throw 'Email/password unexpectedly disabled.' }
if ($google.enabled -ne $true) { throw 'Google provider unexpectedly disabled.' }

Section 'AJN PDF R24 :: AUTHENTICATION PASS'
Write-Host 'Email / Gmail + password : ENABLED' -ForegroundColor Green
Write-Host 'Google                   : ENABLED' -ForegroundColor Green
Write-Host 'Password reset           : ENABLED' -ForegroundColor Green
Write-Host 'Facebook                 : NOT USED' -ForegroundColor DarkGray
Write-Host 'GitHub                   : NOT USED' -ForegroundColor DarkGray
Write-Host 'Anonymous / Guest        : DISABLED' -ForegroundColor Green
Write-Host 'Billing integration      : PRESERVED' -ForegroundColor Green
Write-Host 'Live /login              : HTTP 200' -ForegroundColor Green
Write-Host 'Live /signup             : HTTP 200' -ForegroundColor Green
Write-Host 'Next acceptance          : test one Email login and one Google login.' -ForegroundColor Yellow
