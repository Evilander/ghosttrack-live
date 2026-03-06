param(
  [string]$NodeVersion = "",
  [string]$OutDir = "$PSScriptRoot\\..\\release",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $NodeVersion) {
  $NodeVersion = $env:GHOSTTRACK_NODE_VERSION
}
if (-not $NodeVersion) {
  $NodeVersion = "22.14.0"
}

if (-not $SkipBuild) {
  Push-Location $root
  try {
    npm run build | Out-Host
  } finally {
    Pop-Location
  }
}

$dist = Join-Path $root "dist"
if (-not (Test-Path $dist)) {
  throw "dist/ not found. Run npm run build first."
}

$tmp = Join-Path $root ".temp"
$rel = Join-Path $root ".release"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
New-Item -ItemType Directory -Force -Path $rel | Out-Null

$nodeZip = Join-Path $tmp "node-v$NodeVersion-win-x64.zip"
$nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
if (-not (Test-Path $nodeZip)) {
  Write-Host "Downloading Node v$NodeVersion..."
  curl.exe -L -o $nodeZip $nodeUrl | Out-Host
}

$nodeDir = Join-Path $tmp "node-v$NodeVersion-win-x64"
if (-not (Test-Path $nodeDir)) {
  Expand-Archive -Path $nodeZip -DestinationPath $tmp -Force
}

$pkg = Get-Content -Raw -Encoding UTF8 (Join-Path $root "package.json") | ConvertFrom-Json
$ver = $pkg.version
$sha = (git -C $root rev-parse --short HEAD).Trim()

$bundleName = "GhostTrack-Live-Portable-win64-$ver+$sha"
$bundleDir = Join-Path $rel $bundleName
if (Test-Path $bundleDir) { Remove-Item -Recurse -Force $bundleDir }
New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null

Copy-Item -Force (Join-Path $nodeDir "node.exe") (Join-Path $bundleDir "node.exe")
Copy-Item -Force (Join-Path $root "server.cjs") (Join-Path $bundleDir "server.cjs")
Copy-Item -Force (Join-Path $root "START.bat") (Join-Path $bundleDir "START.bat")
Copy-Item -Recurse -Force (Join-Path $root "dist") (Join-Path $bundleDir "dist")
if (Test-Path (Join-Path $root "README.md")) {
  Copy-Item -Force (Join-Path $root "README.md") (Join-Path $bundleDir "README.md")
}

$readmePortable = @"
GhostTrack Live (Portable)

1. Double-click START.bat
2. Your browser will open automatically

Notes:
- The server will pick a free port in 3000-3004.
- If you share on LAN, use the Network URL printed in the console window.
"@
Set-Content -Encoding UTF8 -Path (Join-Path $bundleDir "README_PORTABLE.txt") -Value $readmePortable

# Try to include Node license if present in extracted zip (varies by distribution)
$maybeLicense = Join-Path $nodeDir "LICENSE"
if (Test-Path $maybeLicense) {
  Copy-Item -Force $maybeLicense (Join-Path $bundleDir "NODE_LICENSE.txt")
}

$out = Resolve-Path (New-Item -ItemType Directory -Force -Path $OutDir)
$zip = Join-Path $out "$bundleName.zip"
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path $bundleDir -DestinationPath $zip -Force

Write-Output $zip

