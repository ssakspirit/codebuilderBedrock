# 마인크래프트 에이전트 블록 코딩

이 프로젝트는 마인크래프트 에이전트를 블록 코딩으로 제어할 수 있는 웹 기반 도구입니다.

## 주요 기능

- 블록 기반의 직관적인 코딩 인터페이스
- 실시간 에이전트 제어
- 다양한 에이전트 명령어 지원 (이동, 회전, 블록 설치/파괴 등)
- 채팅 명령어를 통한 코드 실행
- 반복문과 변수 지원

## 시작하기

1. 프로젝트 클론:
```bash
git clone https://github.com/ssakspirit/codebuilderBedrock.git
```

2. 의존성 설치:
```bash
npm install
```

3. 서버 실행:
```bash
node index.js
```

4. 웹 브라우저에서 접속:
```
http://localhost:3000
```

## 기술 스택

- Node.js
- Socket.IO
- Blockly
- HTML/CSS/JavaScript

## 라이선스

MIT License 

## 마인크래프트 베드락 에디션(Windows)에서 로컬 서버 연결 허용

Microsoft Store에서 설치한 마인크래프트 베드락 에디션(UWP 앱)은 보안상 기본적으로 localhost(127.0.0.1)로의 네트워크 접근이 차단되어 있습니다. 

**아래 명령어를 반드시 관리자 권한 명령 프롬프트에서 실행해 주세요!**

```bash
CheckNetIsolation LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"
```

이 명령어를 실행하면 마인크래프트가 여러분의 서버(이 프로그램)와 정상적으로 통신할 수 있습니다.

- 예외 목록 확인:  
  `CheckNetIsolation LoopbackExempt -s`
- 예외 삭제:  
  `CheckNetIsolation LoopbackExempt -d -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"` 