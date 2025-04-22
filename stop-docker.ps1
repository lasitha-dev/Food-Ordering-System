# stop-docker.ps1 - Script to stop the Food Ordering System Docker containers

Write-Host "Stopping Food Ordering System Docker containers..." -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan

# Ensure we're in the project root directory
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Stop and remove containers
Write-Host "Stopping containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nAll containers have been stopped." -ForegroundColor Green
Write-Host "To start the application again, run:" -ForegroundColor Yellow
Write-Host ".\start-docker.ps1" -ForegroundColor Yellow

# Optional: Remove volumes (uncomment if needed)
# Write-Host "`nDo you want to remove all Docker volumes? (y/n)" -ForegroundColor Yellow
# $response = Read-Host
# if ($response -eq 'y' -or $response -eq 'Y') {
#     Write-Host "Removing volumes..." -ForegroundColor Yellow
#     docker-compose down -v
#     Write-Host "Volumes removed." -ForegroundColor Green
# } 