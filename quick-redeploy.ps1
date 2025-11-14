# Quick Frontend Redeploy Script
# Builds and deploys the frontend in one step

$env:PROJECT_ID = "pokemon-champion-476912"
$env:REGION = "us-central1"
$env:ARTIFACT_REPO_NAME = "pokemon-champion"
$env:BACKEND_URL = "https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app"

Write-Host "🔨 Rebuilding frontend..." -ForegroundColor Cyan

docker build `
  --secret id=github_token,env=GITHUB_TOKEN `
  --build-arg NEXT_PUBLIC_API_URL=$env:BACKEND_URL `
  -t frontend:latest `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🏷️  Tagging..." -ForegroundColor Cyan
docker tag frontend:latest $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

Write-Host "📤 Pushing..." -ForegroundColor Cyan
gcloud auth configure-docker $env:REGION-docker.pkg.dev --project=$env:PROJECT_ID --quiet
docker push $env:REGION-docker.pkg.dev/$env:PROJECT_ID/$env:ARTIFACT_REPO_NAME/frontend:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Deploying..." -ForegroundColor Cyan
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
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Done!" -ForegroundColor Green

# Get the frontend URL
$env:FRONTEND_URL = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --format="value(status.url)" `
  --project=$env:PROJECT_ID

Write-Host ""
Write-Host "🌐 Frontend URL: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host "📝 Test pagination: $env:FRONTEND_URL/pokemon" -ForegroundColor Yellow
