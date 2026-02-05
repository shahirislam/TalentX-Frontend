# TalentX Backend API – curl examples (PowerShell)
# Ensure backend is running: cd TalentX-Backend; npm start
# Default base URL: http://localhost:3000

$Base = if ($env:VITE_API_BASE_URL) { $env:VITE_API_BASE_URL } else { "http://localhost:3000" }

Write-Host "=== 1. Health check ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$Base/health" -Method Get
Write-Host ""

Write-Host "=== 2. List jobs (GET /jobs) – used by home page ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$Base/jobs" -Method Get
Write-Host ""

Write-Host "=== 3. Get one job (replace JOB_ID with an actual _id from step 2) ===" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri `"$Base/jobs/JOB_ID`" -Method Get"
Write-Host ""
