# Bedrock CodeBuilder - 빌드 가이드

## 📦 실행 파일 빌드하기

다른 사용자가 Node.js 설치 없이 바로 사용할 수 있는 실행 파일을 만들 수 있습니다.

### 1️⃣ 필요한 도구 설치

```bash
npm install
```

### 2️⃣ Windows 실행 파일 빌드

```bash
npm run build
```

✅ **결과**: `dist/Bedrock-CodeBuilder.exe` 파일이 생성됩니다.

### 3️⃣ 모든 플랫폼용 빌드 (선택사항)

```bash
npm run build:all
```

✅ **결과**: `dist/` 폴더에 다음 파일들이 생성됩니다:
- `bedrock-agent-win.exe` (Windows)
- `bedrock-agent-macos` (macOS)
- `bedrock-agent-linux` (Linux)

## 🚀 배포용 패키지 만들기

### 1. 실행 파일 빌드
```bash
npm run build
```

### 2. 필요한 파일들을 함께 패키징
배포할 때는 다음 파일들을 포함하세요:

```
📁 Bedrock-CodeBuilder/
├── 🔧 Bedrock-CodeBuilder.exe    (메인 실행 파일)
├── 🛠️ setup.bat                  (마인크래프트 연결 설정)
└── 📄 README.md                  (사용 설명서)
```

### 3. setup.bat 파일 생성 (필수)
마인크래프트 연결을 위한 설정 파일입니다:

```batch
@echo off
echo Bedrock CodeBuilder 연결 설정 중...
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
echo 설정이 완료되었습니다!
pause
```

## 📋 사용자 가이드 (README.md)

배포 시 포함할 사용자 가이드:

```markdown
# Bedrock CodeBuilder 사용법

## 1단계: 초기 설정
1. `setup.bat` 파일을 **관리자 권한**으로 실행
2. 설정 완료 메시지 확인

## 2단계: 프로그램 실행
1. `Bedrock-CodeBuilder.exe` 실행
2. 브라우저에서 관리 페이지가 자동으로 열림

## 3단계: 마인크래프트 연결
1. 마인크래프트 베드락 에디션 실행
2. 월드에 입장 후 채팅창 열기 (T키)
3. 관리 페이지에 표시된 연결 명령어 입력
4. 자동으로 블록 코딩 페이지가 열림

## 문제 해결
- 연결이 안 될 경우: setup.bat를 다시 관리자 권한으로 실행
- 프로그램 종료: 관리 페이지 창을 닫으면 프로그램이 종료됩니다
```

## 🎯 빌드 옵션 설명

### 기본 빌드 (`npm run build`)
- Windows 64비트용 실행 파일 생성
- 파일명: `Bedrock-CodeBuilder.exe`
- 크기: 약 50-80MB

### 전체 플랫폼 빌드 (`npm run build:all`)
- Windows, macOS, Linux 모든 플랫폼용 생성
- 각각 별도의 실행 파일로 빌드
- 용량이 큰 편 (플랫폼당 50-80MB)

## 💡 배포 팁

1. **압축**: ZIP 파일로 압축하여 배포하면 용량이 줄어듭니다
2. **바이러스 검사**: 일부 백신에서 false positive가 발생할 수 있습니다
3. **테스트**: 다른 컴퓨터에서 실행 테스트를 권장합니다
4. **버전 관리**: package.json의 version을 업데이트하세요

## 🔧 고급 설정

더 많은 pkg 옵션은 [pkg 공식 문서](https://github.com/vercel/pkg)를 참고하세요.