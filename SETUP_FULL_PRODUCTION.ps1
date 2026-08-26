param(
  [string]$Repo = "",
  [string]$Project = "studio-4223217082-69711",
  [string]$Region = "asia-south1",
  [string]$Service = "ajn-pdf-api",
  [int]$MaxFileMb = 30,
  [int]$MaxTotalMb = 30,
  [switch]$SkipGitPush,
  [switch]$SkipCloudRun,
  [switch]$SkipVercel,
  [switch]$FullBrowserAudit
)
$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot 'R16_PRODUCTION_SETUP_AND_DEPLOY.ps1'
if (-not (Test-Path -LiteralPath $target)) { throw 'R16 production runner is missing.' }
$runner = [scriptblock]::Create((Get-Content -LiteralPath $target -Raw))
& $runner -Repo $Repo -Project $Project -Region $Region -Service $Service -MaxFileMb $MaxFileMb -MaxTotalMb $MaxTotalMb -SkipGitPush:$SkipGitPush -SkipCloudRun:$SkipCloudRun -SkipVercel:$SkipVercel -FullBrowserAudit:$FullBrowserAudit
