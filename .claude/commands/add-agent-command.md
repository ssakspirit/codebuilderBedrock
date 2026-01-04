# add-agent-command

새로운 Minecraft Agent 명령어를 추가합니다.

## 작업 순서

1. **Agent 명령어 확인**
   - Minecraft Agent 명령어 목록 참고
   - 명령어 문법 확인
   - 파라미터 종류 확인

   참고: docs/REFERENCES.md - "Minecraft Agent Commands" 섹션

2. **블록 정의 추가** (`client/blockly/blocks.js`)

   ### 기본 패턴
   ```javascript
   Blockly.Blocks['agent_new_command'] = {
       init: function() {
           this.appendDummyInput()
               .appendField("에이전트")
               .appendField(new Blockly.FieldDropdown([
                   ["옵션1", "value1"],
                   ["옵션2", "value2"]
               ]), "OPTION");
           this.setPreviousStatement(true, null);
           this.setNextStatement(true, null);
           this.setColour(230);  // 에이전트 블록 색상
           this.setTooltip("에이전트 명령어 설명");
           this.setHelpUrl("https://minecraft.wiki/w/Agent");
       }
   };
   ```

3. **코드 생성기 추가** (`client/blockly/generators.js`)

   ### 단순 명령어 (파라미터 없음)
   ```javascript
   Blockly.JavaScript['agent_new_command'] = function(block) {
       return `
           await new Promise(resolve => {
               socket.emit("agentNewCommand");
               setTimeout(resolve, 150);
           });
       `;
   };
   ```

   ### 파라미터 있는 명령어
   ```javascript
   Blockly.JavaScript['agent_new_command'] = function(block) {
       const option = block.getFieldValue('OPTION');
       const count = Blockly.JavaScript.valueToCode(block, 'COUNT', ...) || '1';

       return `
           await new Promise(resolve => {
               socket.emit("agentNewCommand", {
                   option: "${option}",
                   count: ${count}
               });
               setTimeout(resolve, 150);
           });
       `;
   };
   ```

4. **서버 핸들러 추가** (`server/index.js`)

   Socket.IO 이벤트 리스너 섹션에 추가:

   ```javascript
   clientSocket.on("agentNewCommand", (data) => {
       console.log('\n🎯 [명령어 수신] agentNewCommand:', data);
       if (this.webSocketServer) {
           const command = `agent newcommand ${data.option} ${data.count}`;
           this.webSocketServer.send(command);
           console.log(`🤖 마인크래프트로 전송: ${command}\n`);
       } else {
           console.log('❌ WebSocket 서버가 없음\n');
       }
   });
   ```

5. **Toolbox에 블록 추가** (`client/index.html`)

   Agent 카테고리에 블록 추가:
   ```xml
   <category name="에이전트" colour="#D83B01">
       <!-- 기존 블록들... -->
       <block type="agent_new_command"></block>
   </category>
   ```

6. **테스트**
   - npm start로 서버 실행
   - 브라우저에서 새 블록 확인
   - Minecraft 연결 후 블록 실행
   - 서버 로그에서 명령어 전송 확인
   - Minecraft에서 동작 확인

## Agent 명령어 레퍼런스

### 기본 명령어
- `agent move <direction>` - 이동 (forward/back/up/down/left/right)
- `agent turn <direction>` - 회전 (left/right)
- `agent attack <direction>` - 공격
- `agent destroy <direction>` - 블록 파괴
- `agent place <slotNum> <direction>` - 블록 설치
- `agent drop <slotNum> <quantity> <direction>` - 아이템 버리기
- `agent dropall <direction>` - 모든 아이템 버리기
- `agent inspect <direction>` - 블록 검사
- `agent detect <direction>` - 블록 감지
- `agent till <direction>` - 땅 경작
- `agent collect <item>` - 아이템 수집
- `agent transfer <srcSlot> <quantity> <dstSlot>` - 슬롯 간 이동
- `agent tp <x> <y> <z>` - 텔레포트
- `agent create` - 에이전트 생성
- `agent getitemcount <slotNum>` - 아이템 개수
- `agent getitemspace <slotNum>` - 여유 공간
- `agent getitemdetail <slotNum>` - 아이템 상세 정보

### 방향 값
- `forward`, `back`, `up`, `down`, `left`, `right`

### 슬롯 번호
- 1-27 (에이전트 인벤토리 슬롯)

## 참고 문서

- [Agent Commands - Minecraft Wiki](https://minecraft.wiki/w/Agent)
- [Agent Reference - MakeCode](https://minecraft.makecode.com/reference/agent)
- docs/REFERENCES.md - Agent 명령어 섹션
- docs/ARCHITECTURE.md - 블록 시스템 섹션
