# 마인크래프트 에이전트 블록 코딩

이 프로젝트는 마인크래프트 에이전트를 블록 코딩으로 제어할 수 있는 웹 기반 도구입니다.

## 주요 기능

- 블록 기반의 직관적인 코딩 인터페이스
- 실시간 에이전트 제어
- 다양한 에이전트 명령어 지원 (이동, 회전, 블록 설치/파괴 등)
- 채팅 명령어를 통한 코드 실행
- 반복문과 변수 지원

## 명령블록 사용 메뉴얼

### 기본 사용법
- 블록을 드래그하여 워크스페이스에 배치
- 블록을 연결하여 원하는 동작 순서 구성
- 실행 버튼을 클릭하여 코드 실행

### 지원하는 명령블록
- **이동 명령**: 앞으로 이동, 뒤로 이동, 좌우 이동, 점프
- **회전 명령**: 좌우 회전, 위아래 회전
- **블록 조작**: 블록 설치, 블록 파괴, 블록 감지
- **제어 명령**: 반복문, 조건문, 대기
- **에이전트 명령**: 에이전트 선택, 에이전트 상태 확인

### 멀티플레이 지원
멀티플레이 시 참여한 모든 플레이어가 작성한 코드를 사용할 수 있습니다.

**주의사항**: 일부 명령블록은 멀티플레이에서 제한됩니다:
- 서버 관리자 전용 명령
- 월드 설정 변경 명령
- 플레이어 권한 관련 명령

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