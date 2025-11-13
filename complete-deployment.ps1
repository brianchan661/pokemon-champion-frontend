# Complete Frontend Deployment Script
# This script builds, tags, pushes, and deploys the frontend

$env:PROJECT_ID = "pokemon-champion-476912"
$env:REGION = "us-central1"
$env:ARTIFACT_REPO_NAME = "pokemon-champion"
$env:BACKEND_URL = "https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Complete Frontend Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "📦 Step 1/4: Building Docker image..." -ForegroundColor Yellow
Write-Host "   Backend URL: $env:BACKEND_URL" -ForegroundColor Gray
Write-Host ""

docker build `
  --secret id=github_token,env=GITHUB_TOKEN `
  --build-arg NEXT_PUBLIC_API_URL=$env:BACKEND_URL `
  -t frontend:latest `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Tag
Write-Host "🏷️  Step 2/4: Tagging image..." -ForegroundColor Yellow
docker tag frontend:latest `
  $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tagging failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tagged successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Push
Write-Host "📤 Step 3/4: Pushing to Artifact Registry..." -ForegroundColor Yellow
Write-Host "   This may take 3-6 minutes..." -ForegroundColor Gray
Write-Host ""

# Configure Docker auth
gcloud auth configure-docker $env:REGION-docker.pkg.dev --project=$env:PROJECT_ID --quiet

docker push $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pushed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "🚀 Step 4/4: Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "   This may take 2-4 minutes..." -ForegroundColor Gray
Write-Host ""

gcloud run deploy pokemon-champion-frontend `
  --image=$env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest `
  --platform=managed `
  --region=$env:REGION `
  --allow-unauthenticated `
  --port=3000 `
  --cpu=1 `
  --memory=512Mi `
  --min-instances=0 `
  --max-instances=5 `
  --concurrency=80 `
  --timeout=60 `
  --set-env-vars="NODE_ENV=production" `
  --project=$env:PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Get frontend URL
$frontendUrl = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --project=$env:PROJECT_ID `
  --format="value(status.url)"

Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Yellow
Write-Host "   1. Open: $frontendUrl/pokemon" -ForegroundColor White
Write-Host "   2. Open DevTools (F12) -> Network tab" -ForegroundColor White
Write-Host "   3. Hard refresh (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "   4. Look for API call to: /api/pokemon (with /api)" -ForegroundColor White
Write-Host ""
Write-Host "💡 If still seeing old version:" -ForegroundColor Yellow
Write-Host "   - Clear browser cache completely" -ForegroundColor White
Write-Host "   - Try incognito/private window" -ForegroundColor White
Write-Host "   - Wait 1-2 minutes for CDN cache to clear" -ForegroundColor White
Write-Host ""
