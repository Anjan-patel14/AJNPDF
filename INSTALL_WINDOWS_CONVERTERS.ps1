$ErrorActionPreference = "Stop"

function Test-AnyCommand([string[]]$Names, [string[]]$Paths = @()) {
  foreach ($name in $Names) { if (Get-Command $name -ErrorAction SilentlyContinue) { return $true } }
  foreach ($path in $Paths) { if (Test-Path -LiteralPath $path) { return $true } }
  return $false
}

function Add-ToSessionAndUserPath([string]$Directory) {
  if (-not (Test-Path -LiteralPath $Directory)) { return }
  $normalized = $Directory.TrimEnd('\')
  $processEntries = @($env:Path -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim().TrimEnd('\') })
  if ($processEntries -notcontains $normalized) { $env:Path = $env:Path.TrimEnd(';') + ';' + $Directory }
  try {
    $userPath = [Environment]::GetEnvironmentVariable('Path','User')
    $userEntries = @($userPath -split ';' | Where-Object { $_ } | ForEach-Object { $_.Trim().TrimEnd('\') })
    if ($userEntries -notcontains $normalized) {
      $newPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $Directory } else { $userPath.TrimEnd(';') + ';' + $Directory }
      [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    }
  } catch {
    Write-Warning "Persistent user PATH could not be updated. $Directory is available for this setup session."
  }
}

function Install-WingetPackage([string]$Id, [string]$Label) {
  Write-Host "==> Installing $Label with WinGet" -ForegroundColor Cyan
  & winget install --id $Id --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
  return ($LASTEXITCODE -eq 0)
}

function Install-ChocoPackage([string]$Id, [string]$Label) {
  $choco = Get-Command choco.exe -ErrorAction SilentlyContinue
  if (-not $choco) { return $false }
  Write-Host "==> Installing $Label with Chocolatey" -ForegroundColor Cyan
  & $choco.Source install $Id --yes --no-progress --limit-output
  return ($LASTEXITCODE -eq 0)
}

function Install-Msi([string]$Url, [string]$Name) {
  $destination = Join-Path $env:TEMP $Name
  Write-Host "==> Downloading $Name" -ForegroundColor Cyan
  Invoke-WebRequest -Uri $Url -OutFile $destination -UseBasicParsing -TimeoutSec 900
  $process = Start-Process msiexec.exe -ArgumentList "/i `"$destination`" /qn /norestart" -Wait -PassThru
  if ($process.ExitCode -notin @(0,1641,3010)) { throw "$Name installation failed with exit code $($process.ExitCode)." }
}

$winget = Get-Command winget.exe -ErrorAction SilentlyContinue

if (-not (Test-AnyCommand @('soffice.exe','libreoffice.exe') @('C:\Program Files\LibreOffice\program\soffice.exe'))) {
  $installed = $false
  if ($winget) { $installed = Install-WingetPackage 'TheDocumentFoundation.LibreOffice' 'LibreOffice document converter' }
  if (-not $installed) { Write-Warning 'LibreOffice is not installed. Install the current Windows x86-64 build from libreoffice.org, then rerun setup.' }
}

if (-not (Test-AnyCommand @('.exe') @('C:\Program Files\-\.exe'))) {
  $installed = $false
  if (-not $installed) {
    Write-Warning '  could not be installed automatically. Install it with Chocolatey (choco install  -y) or use the  Windows installation guidance, then rerun setup.'
  }
}

if (-not (Test-AnyCommand @('ebook-convert.exe') @('C:\Program Files\Calibre2\ebook-convert.exe'))) {
  $installed = $false
  if ($winget) { $installed = Install-WingetPackage 'calibre.calibre' 'Calibre eBook converter' }
  if (-not $installed) { $installed = Install-ChocoPackage 'calibre' 'Calibre eBook converter' }
  if (-not $installed) {
    try {
      Install-Msi 'https://download.calibre-ebook.com/9.11.0/calibre-64bit-9.11.0.msi' 'calibre-64bit-9.11.0.msi'
      $installed = $true
    } catch {
      Write-Warning "Calibre was not installed automatically. MOBI and AZW3 tools remain unavailable: $($_.Exception.Message)"
    }
  }
}

$ghostscript = Get-ChildItem 'C:\Program Files\gs' -Filter gswin64c.exe -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ghostscript -and -not (Get-Command gswin64c.exe -ErrorAction SilentlyContinue)) {
  Write-Host 'INFO: Ghostscript is not installed. XPS/PostScript tools remain unavailable until a licensed engine is configured.' -ForegroundColor Yellow
}

Add-ToSessionAndUserPath 'C:\Program Files\LibreOffice\program'
Add-ToSessionAndUserPath 'C:\Program Files\-'
Add-ToSessionAndUserPath 'C:\Program Files\Calibre2'

$env:Path = @(
  [Environment]::GetEnvironmentVariable('Path','Machine')
  [Environment]::GetEnvironmentVariable('Path','User')
  'C:\Program Files\LibreOffice\program'
  'C:\Program Files\-'
  'C:\Program Files\Calibre2'
) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
$env:Path = $env:Path -join ';'

Write-Host "Converter dependency installation step completed." -ForegroundColor Green
