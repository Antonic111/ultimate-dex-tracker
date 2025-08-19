@echo off
echo Setting up development environment...
echo.

echo Creating .env.local file...
(
echo # Local Development Environment Variables
echo NODE_ENV=development
echo DISABLE_EMAILS=true
echo.
echo # Add any other local environment variables below
echo # RESEND_API_KEY=your_key_here
echo # EMAIL_FROM=your_email_here
) > .env.local

echo.
echo .env.local file created successfully!
echo.
echo Now you can run your development server without email API errors.
echo.
echo To start development:
echo   1. Frontend only: npm run dev
echo   2. Backend only: cd server ^&^& npm run dev
echo   3. Both: npm run dev ^&^& cd server ^&^& npm run dev
echo.
pause
