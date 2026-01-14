
Write-Host "Deploying list-users..."
npx supabase functions deploy list-users --no-verify-jwt --project-ref ucbmifoxfozwtrelceuv

Write-Host "Deploying create-user..."
npx supabase functions deploy create-user --no-verify-jwt --project-ref ucbmifoxfozwtrelceuv

Write-Host "Deploying complete-sale..."
npx supabase functions deploy complete-sale --no-verify-jwt --project-ref ucbmifoxfozwtrelceuv

Write-Host "Deploying bulk-upload-inventory..."
npx supabase functions deploy bulk-upload-inventory --no-verify-jwt --project-ref ucbmifoxfozwtrelceuv

Write-Host "Deployment attempts finished."
Write-Host "Please check the output above for any errors."
pause
