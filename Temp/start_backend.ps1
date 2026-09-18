Set-Location "F:\Download\PUKU\PukuHackAthonProjectRootFile\PLASMA_PRISM_HackAthon_Task"
$logOut = Join-Path $env:TEMP "prisma_backend.out.log"
$logErr = Join-path $env:TEMP "prisma_backend.err.log"
Start-Process -FilePath "python" -ArgumentList "-m","uvicorn","backend.main:app","--host","127.0.0.1","--port","8000","--log-level","info" `
    -RedirectStandardOutput $logOut -RedirectStandardError $logErr -WindowStyle Hidden
Start-Sleep -Seconds 4
$count = (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "listeners=$count  logs: $logOut / $logErr"
