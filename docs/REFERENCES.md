# 개발 레퍼런스 문서

이 프로젝트 개발에 참고할 수 있는 공식 문서 및 리소스 모음입니다.

---

## 📚 목차

1. [Minecraft Code Connection](#minecraft-code-connection)
2. [Minecraft Agent Commands](#minecraft-agent-commands)
3. [Blockly 개발](#blockly-개발)
4. [Bedrock Edition Protocol](#bedrock-edition-protocol)
5. [WebSocket & Socket.IO](#websocket--socketio)
6. [커뮤니티 리소스](#커뮤니티-리소스)

---

## Minecraft Code Connection

### Code Connection API (아카이브)

**중요:** Code Connection은 2023년 12월 1일에 공식적으로 중단되었습니다. Education Edition 1.7부터는 Code Builder가 클라이언트에 내장되어 있습니다.

- **API 문서 아카이브**: [Code Connection API - Internet Archive](https://archive.org/details/CodeConnectionAPI)
  - REST API 엔드포인트
  - 에이전트 명령어
  - 월드 명령어
  - 에러 코드

- **전체 텍스트**: [Code Connection API 전체 텍스트](https://archive.org/stream/CodeConnectionAPI/Code_Connection_API_djvu.txt)

- **Scribd 문서**: [Code Connection API PDF](https://www.scribd.com/document/468483066/Code-Connection-API-pdf)

### API 구조

**REST 서버**: 포트 8080에서 수신 대기
- GET 요청 사용
- 명령어 이름 및 인수 전달
- 에이전트 제어 및 월드 수정 명령 제공

### Minecraft Wiki

- [Code Connection – Minecraft Wiki](https://minecraft.wiki/w/Code_Connection)
- [Code Connection – Minecraft Fandom Wiki](https://minecraft.fandom.com/wiki/Code_Connection)
- [Code Connection 버전 히스토리](https://minecraft.fandom.com/wiki/Minecraft_Education_version_history/Code_Connection)

---

## Minecraft Agent Commands

### 공식 문서

- **Agent 위키**: [Agent – Minecraft Wiki](https://minecraft.wiki/w/Agent)
- **Agent 위키 (Fandom)**: [Agent – Minecraft Fandom Wiki](https://minecraft.fandom.com/wiki/Agent)
- **Agent 명령어**: [Commands/agent - Minecraft Wiki](https://minecraft.fandom.com/wiki/Commands/agent)

### MakeCode 레퍼런스

- **Agent 레퍼런스**: [Agent - Microsoft MakeCode](https://minecraft.makecode.com/reference/agent)
- **Agent Build 튜토리얼**: [Agent Build Tutorial](https://minecraft.makecode.com/tutorials/agent-build)

### 주요 Agent 명령어

#### 이동 및 회전
```
agent move <direction>           # 에이전트 이동 (forward/back/up/down/left/right)
agent turn <turnDirection>       # 에이전트 회전 (left/right)
agent tp <coordinates>           # 에이전트 텔레포트 (~x ~y ~z, x y z, ^x ^y ^z)
```

#### 블록 조작
```
agent place <slotNum> <direction>    # 슬롯의 블록 설치
agent destroy <direction>            # 블록 파괴
agent till <direction>               # 땅 경작
agent attack <direction>             # 공격
```

#### 감지 및 검사
```
agent detect <direction>             # 블록 감지
agent detectredstone <direction>     # 레드스톤 감지
agent inspect <direction>            # 블록 검사
agent inspectdata <direction>        # 블록 데이터 검사
```

#### 인벤토리 관리
```
agent drop <slotNum> <quantity> <direction>    # 아이템 버리기
agent dropall <direction>                      # 모든 아이템 버리기
agent collect <item>                           # 아이템 수집
agent transfer <srcSlot> <quantity> <dstSlot>  # 슬롯 간 이동
agent getitemcount <slotNum>                   # 아이템 개수 확인
agent getitemspace <slotNum>                   # 슬롯 여유 공간 확인
agent getitemdetail <slotNum>                  # 아이템 세부 정보
```

#### 기타
```
agent create                         # 에이전트 생성
```

### Agent 특징

- **인벤토리**: 27개 슬롯
- **사용 환경**: Minecraft Education Edition 및 WebSocket 서버 연결된 Bedrock Edition
- **주요 용도**: 심기, 수확, 채굴, 건축 등 자동화 작업

### 커뮤니티 예제

- **Agent Addon 예제**: [MinecraftAgent - GitHub](https://github.com/MRBBATES1/MinecraftAgent)
  - Bedrock Edition에서 에이전트 스폰 및 사용 방법 시연

---

## Blockly 개발

### 공식 문서

**중요 업데이트**: Blockly는 2025년 11월 10일에 Raspberry Pi Foundation으로 이전되었습니다.

#### Custom Blocks 가이드

- **개요**: [Custom blocks overview](https://developers.google.com/blockly/guides/create-custom-blocks/overview)
- **블록 정의**: [What's a block definition?](https://developers.google.com/blockly/guides/create-custom-blocks/define/block-definitions)
- **블록 구조**: [Anatomy of a block](https://developers.google.com/blockly/guides/create-custom-blocks/define/block-anatomy)
- **블록 패러다임**: [Block Paradigms](https://developers.google.com/blockly/guides/create-custom-blocks/block-paradigms)
- **블록 수정**: [Modify block definitions](https://developers.google.com/blockly/guides/create-custom-blocks/define/modify-definitions)

#### 개발 도구

- **Blockly Developer Tools**: [개발자 도구](https://developers.google.com/blockly/guides/create-custom-blocks/blockly-developer-tools)
  - 웹 기반 커스텀 블록 빌더
  - JSON/JavaScript 블록 정의 지원
  - 다양한 코드 생성 언어 지원
  - 입력/필드 추가, 툴팁, 색상 설정

- **Legacy Developer Tools**: [레거시 도구](https://developers.google.com/blockly/guides/create-custom-blocks/legacy-blockly-developer-tools)

#### 모범 사례

- **Best Practices**: [Best Practices](https://developers.google.com/blockly/guides/app-integration/best-practices)
- **Block Design**: [Block design](https://developers.google.com/blockly/guides/design/blocks)

### Custom Block 구성 요소

새로운 블록 타입을 정의하려면 세 가지 구성 요소가 필요합니다:

1. **Block Definition (블록 정의)**
   - 블록의 시각적 외관
   - 텍스트, 필드, 연결, 색상 등

2. **Code Generator (코드 생성기)**
   - 각 대상 언어별 별도 함수
   - 블록을 코드 문자열로 변환

3. **Toolbox Reference (툴박스 참조)**
   - 블록 타입 이름 사용
   - 사용자가 블록을 사용할 수 있도록 함

---

## Bedrock Edition Protocol

### 공식 문서

- **Mojang 공식 저장소**: [bedrock-protocol-docs](https://github.com/Mojang/bedrock-protocol-docs)
  - 서버 파트너용 네트워크 프로토콜 문서
  - 패킷 구조 트리 다이어그램
  - 관련 클래스 및 열거형

- **README**: [bedrock-protocol-docs README](https://github.com/Mojang/bedrock-protocol-docs/blob/main/README.md)

### 프로토콜 버전 (2025)

- **최신 정식 버전**: 1.21.131 - 프로토콜 버전 898
- **최신 프리뷰 버전**: Preview 26.0.26 - 프로토콜 버전 908

### 기술 세부사항

- **프로토콜**: UDP (Java Edition은 TCP 사용)
- **라이브러리**: RakNet
- **Wiki**: [Bedrock Edition protocol – Minecraft Wiki](https://minecraft.wiki/w/Bedrock_Edition_protocol)

### 커뮤니티 구현

- **PrismarineJS/bedrock-protocol**: [GitHub](https://github.com/PrismarineJS/bedrock-protocol)
  - Node.js 프로토콜 라이브러리
  - 인증 및 암호화 지원
  - npm 패키지: [bedrock-protocol](https://www.npmjs.com/package/bedrock-protocol)

### 커뮤니티 문서

- **Bedrock Wiki**: [wiki.bedrock.dev](https://wiki.bedrock.dev/servers/bedrock)
  - 커뮤니티 유지 관리 프로토콜 문서
  - [RakNet Protocol](https://wiki.bedrock.dev/servers/raknet)

- **wiki.vg**: [Protocol](https://wiki.vg/Protocol)

**중요**: 프로토콜 문서는 클라이언트/서버 내부 이해를 위한 것이며, 다른 소프트웨어/도구에서 사용하는 것은 지원되지 않습니다.

---

## WebSocket & Socket.IO

### WebSocket (ws)

이 프로젝트에서 Minecraft와 통신하는 데 사용됩니다.

- **npm 패키지**: [ws](https://www.npmjs.com/package/ws)
- **GitHub**: [websockets/ws](https://github.com/websockets/ws)
- **문서**: [ws Documentation](https://github.com/websockets/ws/blob/master/doc/ws.md)

#### 사용 예시
```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });
    ws.send('something');
});
```

### Socket.IO

브라우저 클라이언트와의 실시간 양방향 통신에 사용됩니다.

- **공식 사이트**: [Socket.IO](https://socket.io/)
- **문서**: [Socket.IO Documentation](https://socket.io/docs/v4/)
- **npm 패키지**: [socket.io](https://www.npmjs.com/package/socket.io)
- **클라이언트**: [socket.io-client](https://www.npmjs.com/package/socket.io-client)

#### 서버 사용 예시
```javascript
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });
});
```

#### 클라이언트 사용 예시
```javascript
const socket = io();
socket.emit("chat message", "hello");
socket.on("chat message", (msg) => {
    console.log(msg);
});
```

---

## 커뮤니티 리소스

### GitHub 프로젝트

- **Minecraft_API**: [Nathan-Nesbitt/Minecraft_API](https://github.com/Nathan-Nesbitt/Minecraft_API)
  - JavaScript API for Minecraft Education Edition
  - 외부 애플리케이션과 통신 프록시

- **mee-python**: [Ds110/mee-python](https://github.com/Ds110/mee-python)
  - Minecraft Education Edition용 Python 환경

### Minecraft Commands

- **명령어 리스트**: [Commands/List of Commands](https://minecraftbedrock-archive.fandom.com/wiki/Commands/List_of_Commands)
- **명령어 위키**: [Commands – Minecraft Wiki](https://minecraft.wiki/w/Commands)
- **Bedrock 명령어 전체 리스트**: [Complete list of Minecraft Bedrock commands](https://www.pocketgamer.com/minecraft/minecraft-bedrock-commands/)

### 추가 학습 자료

- **Microsoft Learn**: [More Sources of Info on Minecraft: Bedrock Edition](https://learn.microsoft.com/en-us/minecraft/creator/documents/moreinfosources?view=minecraft-bedrock-stable)

---

## 개발 시 주의사항

### Code Connection 중단

- Code Connection은 **2023년 12월 1일 중단**
- Education Edition 1.7+에서는 Code Builder가 내장
- 기존 API 문서는 Archive.org에서 참고 가능

### 프로토콜 사용

- 공식 프로토콜 문서는 **학습 목적**
- 상용/프로덕션 사용은 **비공식 지원**
- 버전별로 프로토콜 변경 가능

### Blockly 변경사항

- 2025년 11월 Raspberry Pi Foundation으로 이전
- 기존 API는 그대로 유지
- 최신 문서는 Google Developers 사이트 참조

---

## 프로젝트별 적용 사항

### 현재 프로젝트에서 사용 중인 기술

1. **WebSocket (ws)**: Minecraft Code Connection 프로토콜 구현
2. **Socket.IO**: 브라우저 ↔ 서버 실시간 통신
3. **Blockly**: 커스텀 블록 정의 및 코드 생성
4. **Express**: 웹 인터페이스 서빙
5. **Agent Commands**: 에이전트 제어

### 참고 우선순위

1. **Agent 명령어 구현**: [Agent - Minecraft Wiki](https://minecraft.wiki/w/Agent)
2. **Blockly 커스텀 블록**: [Custom blocks overview](https://developers.google.com/blockly/guides/create-custom-blocks/overview)
3. **Code Connection API**: [Archive.org 문서](https://archive.org/details/CodeConnectionAPI)
4. **Socket.IO 구현**: [Socket.IO Documentation](https://socket.io/docs/v4/)
5. **WebSocket 서버**: [ws Documentation](https://github.com/websockets/ws/blob/master/doc/ws.md)

---

## 유용한 검색 키워드

- "Minecraft Bedrock agent commands"
- "Blockly custom blocks tutorial"
- "Socket.IO realtime events"
- "WebSocket server Node.js"
- "Minecraft Education Edition API"
- "Code Connection protocol"

---

## Sources

- [Code Connection API - Internet Archive](https://archive.org/details/CodeConnectionAPI)
- [Agent – Minecraft Wiki](https://minecraft.wiki/w/Agent)
- [Custom blocks overview - Blockly](https://developers.google.com/blockly/guides/create-custom-blocks/overview)
- [bedrock-protocol-docs - GitHub](https://github.com/Mojang/bedrock-protocol-docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [ws - npm](https://www.npmjs.com/package/ws)
- [Bedrock Edition protocol – Minecraft Wiki](https://minecraft.wiki/w/Bedrock_Edition_protocol)
- [Agent - Microsoft MakeCode](https://minecraft.makecode.com/reference/agent)
- [Blockly Developer Tools](https://developers.google.com/blockly/guides/create-custom-blocks/blockly-developer-tools)
- [PrismarineJS/bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol)

---

이 문서는 프로젝트 개발 및 유지보수 시 참고할 수 있는 모든 주요 리소스를 정리한 것입니다.
각 링크는 특정 기능 구현이나 문제 해결 시 직접 참조할 수 있습니다.
