# PowerShell script to set up development environment
Write-Host "Setting up development environment..." -ForegroundColor Green
Write-Host ""

Write-Host "Creating .env.local file..." -ForegroundColor Yellow
$envContent = @"
# Local Development Environment Variables
NODE_ENV=development
DISABLE_EMAILS=true

# Add any other local environment variables below
# RESEND_API_KEY=your_key_here
# EMAIL_FROM=your_email_here
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host ".env.local file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can run your development server without email API errors." -ForegroundColor Cyan
Write-Host ""
Write-Host "To start development:" -ForegroundColor Yellow
Write-Host "  1. Frontend only: npm run dev" -ForegroundColor White
Write-Host "  2. Backend only: cd server && npm run dev" -ForegroundColor White
Write-Host "  3. Both: npm run dev & cd server && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
