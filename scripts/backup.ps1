param(
  [string]$OutDir = "$PSScriptRoot\\..\\backups",
  [int]$Keep = 10
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Resolve-Path (New-Item -ItemType Directory -Force -Path $OutDir)
$zip = Join-Path $out "ghosttrack-live-backup-$ts.zip"

$exclude = @("node_modules", "dist", ".git", "backups", "release", ".release", ".temp")
$items = Get-ChildItem -Force -LiteralPath $root | Where-Object { $exclude -notcontains $_.Name }

Compress-Archive -Path $items.FullName -DestinationPath $zip -Force

Get-ChildItem -LiteralPath $out -Filter "ghosttrack-live-backup-*.zip" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $Keep |
  Remove-Item -Force

Write-Output $zip

