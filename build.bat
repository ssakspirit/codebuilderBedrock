@echo off
chcp 65001 > nul
title Bedrock CodeBuilder - 빌드 스크립트

echo.
echo ========================================
echo   Bedrock CodeBuilder 빌드 스크립트
echo ========================================
echo.

echo 📦 의존성 설치 중...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install 실패
    pause
    exit /b 1
)

echo.
echo 🔨 테스트 빌드 시작...
call npm run build:test
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패
    pause
    exit /b 1
)

echo.
echo ✅ 빌드 완료!
echo 📁 파일 위치: dist\Bedrock-CodeBuilder-Debug.exe
echo.
echo 💡 테스트를 위해 실행해보세요:
echo    dist\Bedrock-CodeBuilder-Debug.exe
echo.

pause