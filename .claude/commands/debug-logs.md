# debug-logs

디버깅 로그를 추가하거나 기존 로그를 개선합니다.

## 작업 순서

1. **로그 위치 확인**
   - 사용자에게 로그를 추가할 위치 질문:
     - 서버 (server/index.js)
     - 클라이언트 (client/main.js)
     - 블록 생성기 (client/blockly/generators.js)

2. **로그 레벨 선택**
   - ✅ 성공 (성공적인 작업)
   - 🎯 이벤트 (명령어/이벤트 수신)
   - ➡️ 이동 (에이전트 이동)
   - 🏗️ 블록 (블록 설치)
   - 💥 파괴 (블록 파괴)
   - 🔍 디버그 (디버깅 정보)
   - ❌ 오류 (에러)
   - 📦 데이터 (데이터 출력)

3. **서버 로그 추가 패턴**
   ```javascript
   console.log('\n🎯 [명령어 수신] commandName:', data);
   console.log('   파라미터:', param1, param2);
   console.log('   처리 시작...');
   // 처리 코드
   console.log('✅ 명령어 처리 완료\n');
   ```

4. **클라이언트 로그 추가 패턴**
   ```javascript
   console.log('\n=== 블록 실행 시작 ===');
   console.log('블록 ID:', blockId);
   console.log('블록 타입:', block.type);
   console.log('생성된 코드:', code);
   console.log('=== 실행 완료 ===\n');
   ```

5. **에러 로그 추가**
   ```javascript
   try {
       // 코드
   } catch (error) {
       console.error('❌ 오류 발생:', error.message);
       console.error('   스택:', error.stack);
       console.error('   위치:', '함수명/파일명');
   }
   ```

6. **디버그 플래그 추가 (선택)**
   ```javascript
   const DEBUG = process.env.DEBUG === 'true';

   if (DEBUG) {
       console.log('🔍 [DEBUG]', detailedInfo);
   }
   ```

## 로그 모범 사례

### 좋은 로그
```javascript
console.log('\n=== 채팅 명령어 실행 ===');
console.log(`명령어: "${command}"`);
console.log(`블록 ID: ${blockData.blockId}`);
console.log(`소켓 연결 상태: ${blockData.socket.connected ? '연결됨' : '연결 안됨'}`);
console.log('========================\n');
```

### 피해야 할 로그
```javascript
console.log('test'); // 의미 없는 로그
console.log(data); // 구조화되지 않은 객체 출력
```

## 참고 사항

- 한국어 메시지 사용 (프로젝트 컨벤션)
- 이모지를 통한 시각적 구분
- 구조화된 로그 출력
- 중요한 데이터만 출력 (민감 정보 제외)
