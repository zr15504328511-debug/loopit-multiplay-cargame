$projectRoot = $PSScriptRoot
$pidPath = Join-Path $projectRoot 'output\server.pid'
if (Test-Path -LiteralPath $pidPath) {
    $serverProcessId = [int](Get-Content -LiteralPath $pidPath)
    $serverProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $serverProcessId" -ErrorAction SilentlyContinue
    $expectedScript = Join-Path $projectRoot 'tools\server.mjs'
    if ($serverProcessInfo -and $serverProcessInfo.Name -eq 'node.exe' -and $serverProcessInfo.CommandLine.Contains($expectedScript)) {
        Stop-Process -Id $serverProcessId
        Write-Host 'Game server stopped.'
    } else { Write-Host 'No matching game server is running.' }
}
