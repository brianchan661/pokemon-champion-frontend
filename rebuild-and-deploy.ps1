# Quick rebuild and deploy script
# Run this after fixing code issues

$env:PROJECT_ID = "pokemon-champion-476912"
$env:REGION = "us-central1"
$env:ARTIFACT_REPO_NAME = "pokemon-champion"
$env:BACKEND_URL = "https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app"

Write-Host "🔨 Rebuilding frontend Docker image..." -ForegroundColor Cyan
docker build `
  --secret id=github_token,env=GITHUB_TOKEN `
  --build-arg NEXT_PUBLIC_API_URL=$env:BACKEND_URL `
  -t frontend:latest `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: .\deploy-frontend.ps1" -ForegroundColor Yellow
