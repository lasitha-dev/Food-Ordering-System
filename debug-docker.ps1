# debug-docker.ps1 - Script to debug Docker container connectivity issues

Write-Host "Docker Debugging Tool" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running or not installed" -ForegroundColor Red
    exit 1
}

# Check if containers are running
Write-Host "`nChecking container status..." -ForegroundColor Yellow
docker-compose ps

# Check container logs for errors
Write-Host "`nChecking auth-service logs..." -ForegroundColor Yellow
docker-compose logs --tail=20 auth-service

# Check container network
Write-Host "`nChecking network connectivity..." -ForegroundColor Yellow

# Function to test connectivity from the frontend container to a service
function Test-ContainerConnectivity {
    param(
        [string]$SourceContainer,
        [string]$TargetService,
        [string]$TargetPort
    )
    
    Write-Host "Testing connectivity from $SourceContainer to $TargetService on port $TargetPort..." -NoNewline
    
    $command = "wget -q --spider --timeout=5 http://$($TargetService):$($TargetPort) 2>/dev/null || echo 'Connection failed'"
    $result = docker-compose exec -T $SourceContainer sh -c $command
    
    if ($result -eq "") {
        Write-Host "  [SUCCESS]" -ForegroundColor Green
    } else {
        Write-Host "  [FAILED]" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
    }
}

# Test connectivity between containers
Test-ContainerConnectivity -SourceContainer "frontend" -TargetService "auth-service" -TargetPort "3001"
Test-ContainerConnectivity -SourceContainer "frontend" -TargetService "order-service" -TargetPort "3003"
Test-ContainerConnectivity -SourceContainer "frontend" -TargetService "restaurant-service" -TargetPort "3002"

# Check environment variables in frontend container
Write-Host "`nChecking frontend environment variables..." -ForegroundColor Yellow
docker-compose exec -T frontend sh -c "env | grep REACT_APP"

# Show network information
Write-Host "`nNetwork information:" -ForegroundColor Yellow
docker network ls | findstr food-ordering-system

Write-Host "`nDebugging complete!" -ForegroundColor Cyan
Write-Host "If issues persist, try:" -ForegroundColor Yellow
Write-Host "1. Rebuilding all containers: docker-compose build --no-cache" -ForegroundColor Yellow
Write-Host "2. Restarting with clean volumes: docker-compose down -v && docker-compose up -d" -ForegroundColor Yellow
Write-Host "3. Checking browser console for more details" -ForegroundColor Yellow 