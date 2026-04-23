param(
  [string]$ApiBase = "",
  [int]$Port = 5188
)

$ErrorActionPreference = "Stop"

if ($ApiBase -and $ApiBase.Trim().Length -gt 0) {
  $env:VITE_API_BASE = $ApiBase.Trim()
}

$env:PORT = "$Port"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$viteBin = Join-Path $projectRoot "..\..\..\FrontEnd\node_modules\vite\bin\vite.js"
if (Test-Path $viteBin) {
  Write-Host "[EduRepo] Using existing Vite from FrontEnd node_modules" -ForegroundColor Cyan
  node $viteBin --config ./vite.config.js --port $Port
  exit $LASTEXITCODE
}

Write-Host "[EduRepo] Vite not found at $viteBin" -ForegroundColor Yellow
Write-Host "[EduRepo] Try installing deps: npm i && npm run dev" -ForegroundColor Yellow
exit 1
