# start-docker.ps1 - Script to start the Food Ordering System using Docker Compose

Write-Host "Starting Food Ordering System using Docker Compose..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Ensure we're in the project root directory
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Build and start the containers
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check the status of containers
Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host "`nAccess the application at:" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "- Auth Service: http://localhost:3001" -ForegroundColor Green
Write-Host "- Restaurant Service: http://localhost:3002" -ForegroundColor Green
Write-Host "- Order Service: http://localhost:3003" -ForegroundColor Green

Write-Host "`nTo stop the application, run:" -ForegroundColor Yellow
Write-Host ".\stop-docker.ps1" -ForegroundColor Yellow

Write-Host "`nTo view logs:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f [service_name]" -ForegroundColor Yellow
Write-Host "Example: docker-compose logs -f auth-service" -ForegroundColor Yellow 