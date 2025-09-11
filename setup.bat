@echo off
chcp 65001 > nul
title Bedrock CodeBuilder - 연결 설정

echo.
echo ========================================
echo   Bedrock CodeBuilder 연결 설정
echo ========================================
echo.
echo 마인크래프트와의 연결을 위한 네트워크 설정을 진행합니다...
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 관리자 권한이 필요합니다!
    echo.
    echo 이 파일을 마우스 우클릭 한 후
    echo "관리자 권한으로 실행"을 선택해주세요.
    echo.
    pause
    exit /b 1
)

echo ✅ 관리자 권한 확인됨
echo.
echo 네트워크 설정 중...

:: 마인크래프트 네트워크 예외 추가
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"

if %errorlevel% equ 0 (
    echo ✅ 설정이 완료되었습니다!
    echo.
    echo 이제 Bedrock-CodeBuilder.exe를 실행할 수 있습니다.
) else (
    echo ❌ 설정 중 오류가 발생했습니다.
    echo.
    echo 마인크래프트가 설치되어 있는지 확인해주세요.
    echo 마인크래프트 베드락 에디션만 지원됩니다.
)

echo.
echo 아무 키나 눌러 종료하세요...
pause > nul