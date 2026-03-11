<#
.SYNOPSIS
    Deploy Script for Pharmcare Pro Licensing System
.DESCRIPTION
    Pushes the database migration for system_license and deploys the new activate-license Edge Function to Supabase.
.EXAMPLE
    .\deploy_licensing.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "Starting Pharmcare Pro Licensing System Deployment..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

# Check if Supabase CLI is available
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Supabase CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install it using: scoop install supabase" -ForegroundColor Gray
    exit 1
}

# Ensure we are logged in and linked
Write-Host "Ensuring Supabase project is linked..." -ForegroundColor Yellow
# supabase link --project-ref <your-project-ref> (Assumes user is already linked in this dev environment)

Write-Host "`n[1/3] Applying Database Migrations..." -ForegroundColor Green
try {
    # This pushes the local migration to the remote project without prompting
    supabase db push --include-all
    Write-Host "Database migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to apply database migrations. Please check your Supabase connection." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Deploying 'activate-license' Edge Function..." -ForegroundColor Green
try {
    supabase functions deploy activate-license --no-verify-jwt
    Write-Host "Edge Function deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to deploy Edge Function." -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Setting up required Secrets (if not already set)..." -ForegroundColor Green
Write-Host "NOTE: Ensure your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "are available to your Edge Functions. This is usually automatic for Supabase hosted functions." -ForegroundColor Yellow

Write-Host "`n----------------------------------------------------" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "The Licensing System is now active." -ForegroundColor White
Write-Host "You can generate your first license securely directly in the database or via the Developer Portal if configured." -ForegroundColor White
