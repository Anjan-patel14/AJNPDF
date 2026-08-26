param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [string]$AdminEmail = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root
try {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required.' }
  if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { throw 'npx is required.' }

  Write-Host "AJN PDF R21 Firebase setup: $ProjectId" -ForegroundColor Cyan
  Write-Host 'Deploying Firestore rules and indexes...' -ForegroundColor Cyan
  npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project $ProjectId
  if ($LASTEXITCODE -ne 0) { throw 'Firebase deploy failed. Sign in with Firebase CLI and verify the project ID.' }

  Write-Host ''
  Write-Host 'Firebase rules/indexes deployed.' -ForegroundColor Green
  Write-Host 'Authentication code is already wired in AJN PDF.' -ForegroundColor Green
  Write-Host 'Enable Email/Password in Firebase Console > Authentication > Sign-in method.' -ForegroundColor Yellow
  Write-Host 'Enable Google there too only if you want Google sign-in, then provide the Web OAuth client ID.' -ForegroundColor Yellow
  Write-Host ''
  Write-Host "Required web env: NEXT_PUBLIC_FIREBASE_PROJECT_ID=$ProjectId" -ForegroundColor White
  Write-Host 'Required web env: NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase Web API key>' -ForegroundColor White
  Write-Host 'Optional Google env: NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Web OAuth client ID>' -ForegroundColor White
  Write-Host "Required server env: FIREBASE_PROJECT_ID=$ProjectId" -ForegroundColor White
  if ($AdminEmail) { Write-Host "Required server env: AJN_ADMIN_EMAILS=$AdminEmail" -ForegroundColor White }
} finally {
  Pop-Location
}
