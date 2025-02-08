// 소켓 이벤트 상수
const SOCKET_EVENTS = {
    // 명령어 실행 관련
    EXECUTE_COMMAND: 'executeCommands',
    UPDATE_COMMAND: 'updateExecutionCommand',
    
    // 마인크래프트 메시지 관련
    MINECRAFT_MESSAGE: 'PlayerMessage',
    
    // 에이전트 명령어 관련
    AGENT_SPAWN: 'spawn',
    AGENT_MOVE: {
        FORWARD: 'goforward',
        BACK: 'goBack',
        UP: 'goUp',
        DOWN: 'goDown',
        LEFT: 'goLeft',
        RIGHT: 'goRight'
    },
    AGENT_TURN: {
        LEFT: 'rotateLeft',
        RIGHT: 'rotateRight'
    }
};

// 웹소켓 포트
const PORTS = {
    WEBSOCKET: 3000,
    EXPRESS: 3001
};

// Node.js 환경과 브라우저 환경 모두에서 동작하도록 처리
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경
    module.exports = { SOCKET_EVENTS, PORTS };
} else {
    // 브라우저 환경
    window.SOCKET_EVENTS = SOCKET_EVENTS;
    window.PORTS = PORTS;
} 