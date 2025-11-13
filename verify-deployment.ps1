# Verification Script - Check if new frontend is deployed

$env:PROJECT_ID = "pokemon-champion-476912"
$env:REGION = "us-central1"

Write-Host "🔍 Checking frontend deployment..." -ForegroundColor Cyan
Write-Host ""

# Get the current revision
Write-Host "📋 Current Cloud Run Revision:" -ForegroundColor Yellow
$revision = gcloud run revisions list `
  --service=pokemon-champion-frontend `
  --region=$env:REGION `
  --project=$env:PROJECT_ID `
  --format="table(metadata.name,status.conditions[0].lastTransitionTime,metadata.labels.['client.knative.dev/nonce'])" `
  --limit=1

Write-Host $revision
Write-Host ""

# Get the image being used
Write-Host "🖼️  Current Image:" -ForegroundColor Yellow
$image = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --project=$env:PROJECT_ID `
  --format="value(spec.template.spec.containers[0].image)"

Write-Host $image
Write-Host ""

# Get the frontend URL
$frontendUrl = gcloud run services describe pokemon-champion-frontend `
  --region=$env:REGION `
  --project=$env:PROJECT_ID `
  --format="value(status.url)"

Write-Host "🌐 Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""

# Check the build time of the image in Artifact Registry
Write-Host "📦 Checking image in Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts docker images describe `
  us-central1-docker.pkg.dev/$env:PROJECT_ID/pokemon-champion/frontend:latest `
  --project=$env:PROJECT_ID `
  --format="table(image_summary.digest,image_summary.upload_time)"

Write-Host ""
Write-Host "💡 To verify the fix is deployed:" -ForegroundColor Yellow
Write-Host "   1. Open: $frontendUrl/pokemon" -ForegroundColor White
Write-Host "   2. Open Browser DevTools (F12) -> Network tab" -ForegroundColor White
Write-Host "   3. Look for API calls - they should go to:" -ForegroundColor White
Write-Host "      ✅ https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app/api/pokemon" -ForegroundColor Green
Write-Host "      ❌ NOT: https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app/pokemon" -ForegroundColor Red
Write-Host ""
Write-Host "🔄 If still seeing old version:" -ForegroundColor Yellow
Write-Host "   - Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   - Hard refresh (Ctrl+Shift+R or Ctrl+F5)" -ForegroundColor White
Write-Host "   - Try incognito/private window" -ForegroundColor White
Write-Host ""
