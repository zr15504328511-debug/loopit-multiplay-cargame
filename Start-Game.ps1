param([int]$Port = 4173, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    Write-Host 'Node.js is required. Install Node.js, then run Start-Game.cmd again.'
    exit 1
}
$gameUrl = "http://127.0.0.1:$Port"
function Test-GameServer {
    try { $response = Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 1; return $response.Content.Contains('Sling Club') } catch { return $false }
}
if (-not (Test-GameServer)) {
    $outputDirectory = Join-Path $projectRoot 'output'
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
    $env:PORT = [string]$Port
    $serverScript = Join-Path $projectRoot 'tools\server.mjs'
    $gameProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList ('"' + $serverScript + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $outputDirectory 'server.log') -RedirectStandardError (Join-Path $outputDirectory 'server-error.log')
    $gameProcess.Id | Set-Content -LiteralPath (Join-Path $outputDirectory 'server.pid')
    $serverReady = $false
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        if (Test-GameServer) { $serverReady = $true; break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $serverReady) { Write-Host 'Could not start the server. Check output/server-error.log or try another port.'; exit 1 }
}
if (-not $NoBrowser) { Start-Process $gameUrl }
Write-Host "Loopit Car Game is running at $gameUrl"
