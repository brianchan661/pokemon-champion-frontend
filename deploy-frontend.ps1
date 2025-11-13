# Frontend Deployment Script
# This script tags and deploys the frontend image to Google Cloud Run

# Set your project configuration
$env:PROJECT_ID = "pokemon-champion-476912"  # Replace with your actual project ID
$env:REGION = "us-central1"
$env:ARTIFACT_REPO_NAME = "pokemon-champion"

Write-Host "🚀 Starting frontend deployment..." -ForegroundColor Cyan
Write-Host ""

# Verify project ID
Write-Host "📋 Project ID: $env:PROJECT_ID" -ForegroundColor Yellow
Write-Host "📍 Region: $env:REGION" -ForegroundColor Yellow
Write-Host ""

# Tag the image for Artifact Registry
Write-Host "🏷️  Tagging image for Artifact Registry..." -ForegroundColor Cyan
docker tag frontend:latest `
  $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to tag image" -ForegroundColor Red
    exit 1
}

# Optional: Tag with version for rollback capability
$VERSION = "v1.1.0-api-fix"
docker tag frontend:latest `
  $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:$VERSION

Write-Host "✅ Image tagged successfully" -ForegroundColor Green
Write-Host ""

# Configure Docker authentication
Write-Host "🔐 Configuring Docker authentication..." -ForegroundColor Cyan
gcloud auth configure-docker $env:REGION-docker.pkg.dev --project=$env:PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to configure Docker authentication" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker authentication configured" -ForegroundColor Green
Write-Host ""

# Push the image to Artifact Registry
Write-Host "📤 Pushing image to Artifact Registry..." -ForegroundColor Cyan
Write-Host "   This may take 3-6 minutes..." -ForegroundColor Gray
docker push $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push image" -ForegroundColor Red
    exit 1
}

# Push version tag
docker push $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:$VERSION

Write-Host "✅ Image pushed successfully" -ForegroundColor Green
Write-Host ""

# Deploy to Cloud Run
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "   This may take 2-4 minutes..." -ForegroundColor Gray
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
    Write-Host "❌ Failed to deploy to Cloud Run" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Get the frontend URL
Write-Host "🌐 Getting frontend URL..." -ForegroundColor Cyan
$env:FRONTEND_URL = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --format="value(status.url)" `
  --project=$env:PROJECT_ID

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend URL: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the Pokemon page: $env:FRONTEND_URL/pokemon" -ForegroundColor White
Write-Host "   2. Check browser DevTools Network tab" -ForegroundColor White
Write-Host "   3. Verify API calls go to: /api/pokemon (with /api)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 View logs:" -ForegroundColor Yellow
Write-Host "   gcloud logging tail 'resource.type=cloud_run_revision AND resource.labels.service_name=pokemon-champion-frontend' --project=$env:PROJECT_ID" -ForegroundColor Gray
Write-Host ""
