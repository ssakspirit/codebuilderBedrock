const WebSocket = require('ws');
const uuid = require('uuid');
const Logger = require('../utils/logger');

/**
 * WebSocket 서버 관리 클래스 (마인크래프트 연결)
 */
class WebSocketServer {
    constructor(wsPort) {
        this.wss = new WebSocket.Server({ port: wsPort });
        this.socket = null;
        this.minecraftSlot = 1;
        this.eventHandlers = null;
        this.socketIOServer = null;
    }

    /**
     * 이벤트 핸들러와 Socket.IO 서버 설정
     * @param {EventHandlers} eventHandlers - 이벤트 핸들러
     * @param {SocketIOServer} socketIOServer - Socket.IO 서버
     */
    setHandlers(eventHandlers, socketIOServer) {
        this.eventHandlers = eventHandlers;
        this.socketIOServer = socketIOServer;
    }

    /**
     * WebSocket 서버 시작
     */
    start() {
        this.wss.on('connection', async (socket) => {
            console.log('\n🎮 마인크래프트 연결됨! 블록 코딩 페이지를 여는 중...'.green);

            this.socket = socket;

            // 마인크래프트 이벤트 구독
            this.subscribeToEvents();

            // 메시지 수신 처리
            socket.on('message', (message) => {
                if (this.eventHandlers) {
                    this.eventHandlers.handleMinecraftEvent(message);
                }
            });

            // 연결 해제 처리
            socket.on('close', () => {
                console.log('❌ 마인크래프트 연결이 해제되었습니다.');
                this.socket = null;

                // Socket.IO 클라이언트들에게 연결 해제 알림
                if (this.socketIOServer) {
                    this.socketIOServer.broadcast('minecraftDisconnected', {
                        message: '마인크래프트와의 연결이 끊어졌습니다.'
                    });
                }
            });

            // 오류 처리
            socket.on('error', (error) => {
                console.error('❌ WebSocket 오류:', error);
            });

            // Socket.IO에서 전달받은 블록 감지 요청 처리
            if (this.socketIOServer) {
                this.socketIOServer.getIO().on('connection', (clientSocket) => {
                    clientSocket.on('forwardBlockDetect', (data) => {
                        this.handleBlockDetectRequest(data);
                    });
                });
            }
        });
    }

    /**
     * 마인크래프트 명령어 전송
     * @param {string} command - 전송할 명령어
     */
    send(command) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = {
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "commandRequest"
                },
                "body": {
                    "version": 1,
                    "commandLine": command,
                    "origin": {
                        "type": "player"
                    }
                }
            };

            this.socket.send(JSON.stringify(message));
            console.log('📤 명령어 전송:', command);
        } else {
            console.error('❌ 마인크래프트가 연결되지 않았습니다.');
        }
    }

    /**
     * 마인크래프트 이벤트 구독
     */
    subscribeToEvents() {
        const events = [
            'PlayerMessage',
            'ItemAcquired',
            'ItemUsed',
            'BlockPlaced',
            'BlockBroken'
        ];

        events.forEach(eventName => {
            this.socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "subscribe"
                },
                "body": {
                    "eventName": eventName
                }
            }));
            console.log(`✅ ${eventName} 이벤트 구독 완료`);
        });
    }

    /**
     * 블록 감지 요청 처리
     * @param {object} data - 블록 감지 요청 데이터
     */
    handleBlockDetectRequest(data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('❌ 마인크래프트가 연결되지 않았습니다.');
            return;
        }

        try {
            const position = JSON.parse(data.position);

            // 절대 좌표인지 확인
            if (position.isAbsolute) {
                this.send(`testforblock ${position.x} ${position.y} ${position.z} air`);
                this.send(`testforblock ${position.x} ${position.y} ${position.z} stone`);
                this.send(`testforblock ${position.x} ${position.y} ${position.z} grass_block`);
            } else {
                // 상대 좌표 처리
                const relativeCommand = position.isFacing && position.isLocal ?
                    `testforblock ~${position.x} ~${position.y} ~${position.z}` :
                    `testforblock ~${position.x} ~${position.y} ~${position.z}`;

                this.send(`${relativeCommand} air`);
                this.send(`${relativeCommand} stone`);
                this.send(`${relativeCommand} grass_block`);
            }

            if (this.eventHandlers) {
                this.eventHandlers.setPendingBlockDetect(true);
            }
        } catch (error) {
            console.error('블록 감지 요청 처리 중 오류:', error);
        }
    }

    /**
     * 마인크래프트 연결 상태 확인
     * @returns {boolean} 연결 상태
     */
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * 현재 슬롯 번호 증가
     */
    incrementSlot() {
        this.minecraftSlot++;
        if (this.minecraftSlot > 36) {
            this.minecraftSlot = 1;
        }
    }

    /**
     * 현재 슬롯 번호 반환
     * @returns {number} 슬롯 번호
     */
    getCurrentSlot() {
        return this.minecraftSlot;
    }
}

module.exports = WebSocketServer;