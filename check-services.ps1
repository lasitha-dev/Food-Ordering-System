# check-services.ps1 - Script to check health of all services

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    Write-Host "Checking $ServiceName at $Url..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  [OK]" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  [FAILED] - Status code: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  [FAILED] - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "Checking service health..." -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

# Check Auth Service
$authHealth = Test-ServiceHealth -ServiceName "Auth Service" -Url "http://localhost:3001/health"

# Check Restaurant Service
$restaurantHealth = Test-ServiceHealth -ServiceName "Restaurant Service" -Url "http://localhost:3002/"

# Check Order Service
$orderHealth = Test-ServiceHealth -ServiceName "Order Service" -Url "http://localhost:3003/"

# Check Frontend
$frontendHealth = Test-ServiceHealth -ServiceName "Frontend" -Url "http://localhost:3000"

Write-Host ""
Write-Host "Health Check Summary:" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan

# Auth Service
$authStatus = if ($authHealth) { "Running" } else { "Not Running" }
$authColor = if ($authHealth) { "Green" } else { "Red" }
Write-Host "Auth Service:       $authStatus" -ForegroundColor $authColor

# Restaurant Service
$restaurantStatus = if ($restaurantHealth) { "Running" } else { "Not Running" }
$restaurantColor = if ($restaurantHealth) { "Green" } else { "Red" }
Write-Host "Restaurant Service: $restaurantStatus" -ForegroundColor $restaurantColor

# Order Service
$orderStatus = if ($orderHealth) { "Running" } else { "Not Running" }
$orderColor = if ($orderHealth) { "Green" } else { "Red" }
Write-Host "Order Service:      $orderStatus" -ForegroundColor $orderColor

# Frontend
$frontendStatus = if ($frontendHealth) { "Running" } else { "Not Running" }
$frontendColor = if ($frontendHealth) { "Green" } else { "Red" }
Write-Host "Frontend:           $frontendStatus" -ForegroundColor $frontendColor

if (-not ($authHealth -and $restaurantHealth -and $orderHealth -and $frontendHealth)) {
    Write-Host ""
    Write-Host "Some services are not running. Use .\start-dev.ps1 to start all services." -ForegroundColor Yellow
} 