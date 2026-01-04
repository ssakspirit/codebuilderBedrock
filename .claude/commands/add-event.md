# add-event

새로운 Minecraft 이벤트 핸들러를 추가합니다.

## 작업 순서

1. **이벤트 타입 확인**
   - 사용자에게 추가할 이벤트 종류 질문
   - 기존 이벤트: PlayerMessage, ItemAcquired, ItemUsed, BlockPlaced, BlockBroken
   - 추가 가능 이벤트: PlayerTravelled, MobKilled, ItemCrafted 등

2. **Hat 블록 추가** (`client/blockly/blocks.js`)
   ```javascript
   Blockly.Blocks['on_new_event'] = {
       init: function() {
           this.appendDummyInput()
               .appendField("🎮 새 이벤트 발생:");
           this.appendStatementInput("NEXT");
           this.setStyle('hat_blocks');
       }
   };
   ```

3. **블록 코드 생성기** (`client/blockly/generators.js`)
   - Hat 블록은 코드 생성하지 않음 (주석 추가)

4. **워크스페이스 리스너 추가** (`client/main.js`)
   ```javascript
   // Blockly 워크스페이스 변경 감지에 추가
   if (block.type === 'on_new_event') {
       socket.emit('updateNewEventCommand', {
           eventData: block.getFieldValue('EVENT_DATA'),
           blockId: block.id
       });
   }
   ```

5. **서버 등록 핸들러** (`server/index.js`)
   - Map 추가: `let newEventBlocks = new Map();`
   - 등록 이벤트 리스너 추가
   - 중복 검사 로직

6. **Minecraft 이벤트 구독** (`server/index.js`)
   ```javascript
   // WebSocket 연결 후 이벤트 구독
   ws.send(JSON.stringify({
       header: {
           requestId: uuid.v4(),
           messagePurpose: "subscribe",
           version: 1,
           messageType: "commandRequest"
       },
       body: {
           eventName: "NewEvent"
       }
   }));
   ```

7. **이벤트 핸들러 추가** (`server/index.js`)
   ```javascript
   case 'NewEvent':
       // 이벤트 데이터 파싱
       // Map에서 조회
       // Socket.IO로 클라이언트에 실행 요청
       break;
   ```

8. **클라이언트 실행 핸들러** (`client/main.js`)
   ```javascript
   socket.on('executeNewEventCommands', function(data) {
       // 블록 찾기 및 실행
   });
   ```

## 참고 문서

- docs/REFERENCES.md - 이벤트 시스템 섹션
- docs/ARCHITECTURE.md - 이벤트 시스템 섹션
- [Bedrock Protocol Events](https://github.com/Mojang/bedrock-protocol-docs)

## 이벤트 구조 예시

```json
{
  "header": {
    "eventName": "NewEvent",
    "messagePurpose": "event"
  },
  "body": {
    "eventData": "value",
    "player": {
      "name": "플레이어이름"
    }
  }
}
```
