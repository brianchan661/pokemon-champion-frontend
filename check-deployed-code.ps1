# Check what code is actually deployed in the frontend

$env:PROJECT_ID = "pokemon-champion-476912"
$env:REGION = "us-central1"

Write-Host "🔍 Checking deployed frontend code..." -ForegroundColor Cyan
Write-Host ""

# Get the frontend URL
$frontendUrl = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --project=$env:PROJECT_ID `
  --format="value(status.url)"

Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""

# Download and check the main JS bundle
Write-Host "📥 Downloading main JS bundle to check API URL..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$frontendUrl/pokemon" -UseBasicParsing

# Extract the main app JS file
$jsFiles = $response.Content | Select-String -Pattern '/_next/static/chunks/pages/_app-[a-f0-9]+\.js' -AllMatches

if ($jsFiles.Matches.Count -gt 0) {
    $jsFile = $jsFiles.Matches[0].Value
    $jsUrl = "$frontendUrl$jsFile"
    
    Write-Host "📄 Found JS file: $jsFile" -ForegroundColor Green
    Write-Host "🔗 URL: $jsUrl" -ForegroundColor Gray
    Write-Host ""
    
    # Download the JS file
    $jsContent = Invoke-WebRequest -Uri $jsUrl -UseBasicParsing
    
    # Check for API URL patterns
    Write-Host "🔍 Searching for API URL patterns in bundle..." -ForegroundColor Yellow
    Write-Host ""
    
    # Look for the backend URL
    if ($jsContent.Content -match 'pokemon-champion-backend[^"]*') {
        $match = $Matches[0]
        Write-Host "✅ Found backend URL in bundle: $match" -ForegroundColor Green
        
        # Check if it includes /api
        if ($match -match '/api') {
            Write-Host "✅ URL includes /api - NEW VERSION DEPLOYED!" -ForegroundColor Green
        } else {
            Write-Host "❌ URL does NOT include /api - OLD VERSION STILL DEPLOYED!" -ForegroundColor Red
            Write-Host ""
            Write-Host "⚠️  You need to rebuild and redeploy:" -ForegroundColor Yellow
            Write-Host "   1. cd pokemon-champion-frontend" -ForegroundColor White
            Write-Host "   2. .\rebuild-and-deploy.ps1" -ForegroundColor White
            Write-Host "   3. .\deploy-frontend.ps1" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Could not find backend URL in bundle" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Could not find main JS file in HTML" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Alternative: Check in browser DevTools" -ForegroundColor Cyan
Write-Host "   1. Open: $frontendUrl/pokemon" -ForegroundColor White
Write-Host "   2. F12 -> Network tab" -ForegroundColor White
Write-Host "   3. Look for API calls to /pokemon or /api/pokemon" -ForegroundColor White
Write-Host ""
