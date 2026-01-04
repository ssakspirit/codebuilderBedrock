# add-block

새로운 Blockly 커스텀 블록을 추가합니다.

## 작업 순서

1. **블록 타입 확인**
   - 사용자에게 추가할 블록의 종류 질문:
     - Hat Block (이벤트 트리거)
     - Agent Block (에이전트 명령)
     - Coordinate Block (좌표 시스템)
     - Utility Block (기타 유틸리티)

2. **블록 정의 추가** (`client/blockly/blocks.js`)
   - 블록의 시각적 구조 정의
   - 필드, 입력, 연결점 설정
   - 색상 및 스타일 지정
   - 툴팁 및 도움말 추가

3. **코드 생성기 추가** (`client/blockly/generators.js`)
   - JavaScript 코드 생성 함수 작성
   - Socket.IO 이벤트 emit 코드 생성
   - 비동기 처리 (async/await) 적용
   - 적절한 딜레이 설정

4. **서버 핸들러 추가** (`server/index.js`)
   - Socket.IO 이벤트 리스너 추가
   - Minecraft 명령어로 변환
   - WebSocket으로 전송
   - 로그 메시지 추가 (이모지 포함)

5. **Toolbox 업데이트** (`client/index.html`)
   - 해당 카테고리에 블록 추가
   - 필요시 새 카테고리 생성

6. **테스트**
   - 브라우저에서 블록 표시 확인
   - 블록 조립 및 실행 테스트
   - Minecraft에서 명령어 실행 확인

## 참고 문서

- [Blockly Custom Blocks](https://developers.google.com/blockly/guides/create-custom-blocks/overview)
- [Code Generators](https://developers.google.com/blockly/guides/create-custom-blocks/generating-code)
- docs/REFERENCES.md - Blockly 섹션
- docs/ARCHITECTURE.md - 블록 시스템 섹션

## 예시 코드

### 블록 정의
```javascript
Blockly.Blocks['agent_new_action'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트")
            .appendField(new Blockly.FieldDropdown([
                ["동작1", "action1"],
                ["동작2", "action2"]
            ]), "ACTION");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("에이전트가 특정 동작을 수행합니다");
    }
};
```

### 코드 생성기
```javascript
Blockly.JavaScript['agent_new_action'] = function(block) {
    const action = block.getFieldValue('ACTION');
    return `
        await new Promise(resolve => {
            socket.emit("newAction", "${action}");
            setTimeout(resolve, 150);
        });
    `;
};
```

### 서버 핸들러
```javascript
clientSocket.on("newAction", (action) => {
    console.log('🎯 [명령어 수신] newAction:', action);
    if (this.webSocketServer) {
        this.webSocketServer.send(`agent newcommand ${action}`);
        console.log(`✨ 마인크래프트로 전송: agent newcommand ${action}\n`);
    }
});
```
