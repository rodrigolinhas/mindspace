@echo off
echo ==========================================
echo      MindSpace Setup (Windows)
echo ==========================================

echo [1/3] Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed.

echo [2/3] Verifying and installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error during installation.
    pause
    exit /b 1
)

echo [3/3] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Error during build.
    pause
    exit /b 1
)

echo ==========================================
echo      Setup Complete! 
echo ==========================================
echo You can now run the project with:
echo    npm run dev    (Development)
echo    npm start      (Production)
echo ==========================================
pause
