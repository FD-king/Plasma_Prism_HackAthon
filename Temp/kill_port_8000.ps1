param([int]$Port = 8000)
$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        try { Stop-Process -Id $p -Force } catch {}
    }
}
Start-Sleep -Seconds 2
$after = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Measure-Object
Write-Host "remaining_listeners=$($after.Count)"
