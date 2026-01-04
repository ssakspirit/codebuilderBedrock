# fix-bug

버그를 수정합니다.

## 작업 순서

1. **문제 파악**
   - 사용자로부터 버그 증상 수집
   - 재현 방법 확인
   - 예상 동작 vs 실제 동작 비교

2. **로그 확인**
   - 서버 콘솔 로그 확인
   - 브라우저 콘솔 로그 확인 (F12)
   - 에러 메시지 및 스택 트레이스 분석

3. **코드 위치 찾기**
   ```bash
   # 관련 코드 검색
   grep -r "키워드" server/
   grep -r "키워드" client/
   ```

4. **버그 카테고리 분류**

   ### a) 명령어 실행 안됨
   - 블록 등록 확인 (commandBlocks Map)
   - Socket.IO 이벤트 전송 확인
   - 서버 핸들러 존재 확인
   - WebSocket 연결 상태 확인

   ### b) 블록이 작동하지 않음
   - 블록 정의 확인 (blocks.js)
   - 코드 생성기 확인 (generators.js)
   - 생성된 코드 문법 오류 확인
   - eval() 실행 오류 확인

   ### c) Minecraft 연결 문제
   - WebSocket 포트 확인 (3000-3050)
   - CheckNetIsolation 설정 확인
   - 방화벽 설정 확인
   - Minecraft 버전 호환성 확인

   ### d) UI/UX 문제
   - Blockly 워크스페이스 설정 확인
   - CSS 스타일 확인
   - 브라우저 호환성 확인

5. **수정 구현**
   - 최소한의 변경으로 문제 해결
   - 기존 코드 패턴 유지
   - 한국어 주석 및 로그 추가

6. **테스트**
   - 수정 사항 테스트
   - 재현 방법으로 버그 재확인
   - 관련 기능 회귀 테스트
   - 엣지 케이스 확인

7. **문서 업데이트**
   - .commit_message.txt 업데이트
   - 필요시 README.md 또는 docs/ 업데이트

## 일반적인 버그 패턴

### Socket.IO 연결 문제
```javascript
// 확인: 클라이언트 연결 상태
socket.on('connect', () => {
    console.log('✅ 서버 연결됨:', socket.id);
});

socket.on('disconnect', () => {
    console.log('❌ 서버 연결 끊김');
});
```

### Map에서 조회 실패
```javascript
// 확인: 등록된 명령어 출력
console.log('등록된 명령어:', Array.from(commandBlocks.keys()));

// 확인: 대소문자 일치
const blockData = commandBlocks.get(command.toLowerCase());
```

### eval() 오류
```javascript
// 확인: 생성된 코드 출력
console.log('실행할 코드:', blockCode);

// 확인: 문법 오류
try {
    await eval(blockCode);
} catch (error) {
    console.error('코드 실행 오류:', error);
    console.error('문제 코드:', blockCode);
}
```

### WebSocket 메시지 전송 실패
```javascript
// 확인: WebSocket 연결 상태
if (ws.readyState === WebSocket.OPEN) {
    ws.send(command);
} else {
    console.error('❌ WebSocket 연결 안됨:', ws.readyState);
}
```

## 참고 문서

- docs/ARCHITECTURE.md - 전체 시스템 구조
- docs/REFERENCES.md - 관련 API 문서
- CLAUDE.md - 개발 가이드라인
