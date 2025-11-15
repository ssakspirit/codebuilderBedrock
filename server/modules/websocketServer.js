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
        // WebSocket 서버 옵션 설정 (1.21.123 호환성 개선)
        this.wss.on('connection', async (socket, request) => {
            console.log('\n🎮 마인크래프트 연결됨! 블록 코딩 페이지를 여는 중...'.green);
            console.log('📡 연결 프로토콜:', request.headers['sec-websocket-protocol'] || 'default');
            console.log('🔐 연결 버전:', request.headers['sec-websocket-version'] || 'unknown');

            this.socket = socket;

            // 연결 확인 메시지 전송
            try {
                this.send('say §a[CodeBuilder] 연결 성공! 블록 코딩을 시작하세요.');
            } catch (error) {
                console.log('⚠️ 초기 메시지 전송 실패 (정상일 수 있음)');
            }

            // 마인크래프트 이벤트 구독
            setTimeout(() => {
                this.subscribeToEvents();
            }, 500); // 연결 안정화를 위한 딜레이

            // 메시지 수신 처리
            socket.on('message', (message) => {
                try {
                    if (this.eventHandlers) {
                        this.eventHandlers.handleMinecraftEvent(message);
                    }
                } catch (error) {
                    console.error('❌ 메시지 처리 오류:', error);
                }
            });

            // 연결 해제 처리
            socket.on('close', (code, reason) => {
                console.log(`❌ 마인크래프트 연결이 해제되었습니다. (코드: ${code}, 이유: ${reason})`);
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
                console.error('❌ WebSocket 오류:', error.message);
                console.error('📋 오류 상세:', error);
            });

            // Ping/Pong 설정 (연결 유지)
            socket.on('pong', () => {
                console.log('🏓 Pong 수신 - 연결 활성 상태');
            });

            // 주기적인 연결 확인
            const pingInterval = setInterval(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.ping();
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // 30초마다 ping

        });

        // WebSocket 서버 오류 처리
        this.wss.on('error', (error) => {
            console.error('❌ WebSocket 서버 오류:', error.message);
        });
    }

    /**
     * 마인크래프트 명령어 전송
     * @param {string} command - 전송할 명령어
     */
    send(command) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const requestId = uuid.v4();
            const message = {
                "header": {
                    "version": 1,
                    "requestId": requestId,
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

            try {
                this.socket.send(JSON.stringify(message));
                console.log('📤 명령어 전송:', command);
                console.log('🆔 요청 ID:', requestId);
            } catch (error) {
                console.error('❌ 명령어 전송 실패:', error.message);
                console.error('📋 명령어:', command);
            }
        } else {
            const state = this.socket ? this.socket.readyState : 'no socket';
            console.error(`❌ 마인크래프트가 연결되지 않았습니다. (상태: ${state})`);
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

        console.log('\n📡 이벤트 구독 시작...');
        events.forEach((eventName, index) => {
            // 순차적 구독을 위한 딜레이
            setTimeout(() => {
                try {
                    const message = {
                        "header": {
                            "version": 1,
                            "requestId": uuid.v4(),
                            "messageType": "commandRequest",
                            "messagePurpose": "subscribe"
                        },
                        "body": {
                            "eventName": eventName
                        }
                    };

                    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                        this.socket.send(JSON.stringify(message));
                        console.log(`✅ ${eventName} 이벤트 구독 완료`);
                    } else {
                        console.warn(`⚠️ ${eventName} 이벤트 구독 실패 - 연결 끊김`);
                    }
                } catch (error) {
                    console.error(`❌ ${eventName} 이벤트 구독 중 오류:`, error.message);
                }
            }, index * 100); // 각 이벤트마다 100ms 간격
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