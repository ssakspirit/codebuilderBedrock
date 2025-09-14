const { Server } = require('socket.io');
const Logger = require('../utils/logger');

/**
 * Socket.IO 서버 관리 클래스
 */
class SocketIOServer {
    constructor(server, wsPort) {
        this.io = new Server(server, {
            cors: {
                origin: `http://localhost:${wsPort}`,
                methods: ["GET", "POST"]
            }
        });
        this.commandManager = null;
        this.eventHandlers = null;
    }

    /**
     * 명령어 관리자와 이벤트 핸들러 설정
     * @param {CommandManager} commandManager - 명령어 관리자
     * @param {EventHandlers} eventHandlers - 이벤트 핸들러
     */
    setManagers(commandManager, eventHandlers) {
        this.commandManager = commandManager;
        this.eventHandlers = eventHandlers;
    }

    /**
     * Socket.IO 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.io.on('connection', (clientSocket) => {
            console.log('\n=== 웹 클라이언트 연결됨 ===\n');

            // 채팅 명령어 업데이트 처리
            clientSocket.on('updateExecutionCommand', (data) => {
                if (data && data.command) {
                    this.commandManager.registerChatCommand(data.command, data.blockId, clientSocket);
                }
            });

            // 아이템 획득 명령어 업데이트 처리 (기존 ItemAcquired용)
            clientSocket.on('updateItemUseCommand', (data) => {
                console.log('🔍 updateItemUseCommand 수신된 데이터:', data);
                if (data && data.item) {
                    this.commandManager.registerItemAcquired(data.item, data.blockId, clientSocket);
                } else {
                    console.log('❌ 유효하지 않은 아이템 데이터:', data);
                }
            });

            // 아이템 사용 명령어 업데이트 처리 (ItemUsed 이벤트용)
            clientSocket.on('updateItemUsedCommand', (data) => {
                console.log('🔍 updateItemUsedCommand 수신된 데이터:', data);
                if (data && data.item) {
                    this.commandManager.registerItemUsed(data.item, data.blockId, clientSocket);
                } else {
                    console.log('❌ 유효하지 않은 아이템 사용 데이터:', data);
                }
            });

            // 블록 설치 명령어 업데이트 처리
            clientSocket.on('updateBlockPlacedCommand', (data) => {
                console.log('🔍 updateBlockPlacedCommand 수신된 데이터:', data);
                if (data && data.blockType) {
                    this.commandManager.registerBlockPlaced(data.blockType, data.blockId, clientSocket);
                } else {
                    console.log('❌ 유효하지 않은 블록 설치 데이터:', data);
                }
            });

            // 블록 파괴 명령어 업데이트 처리
            clientSocket.on('updateBlockBrokenCommand', (data) => {
                console.log('🔍 updateBlockBrokenCommand 수신된 데이터:', data);
                if (data && data.blockType) {
                    this.commandManager.registerBlockBroken(data.blockType, data.blockId, clientSocket);
                } else {
                    console.log('❌ 유효하지 않은 블록 파괴 데이터:', data);
                }
            });

            // 블록 등록 제거 처리
            clientSocket.on('removeBlockRegistration', (data) => {
                if (data && data.blockType && data.blockId) {
                    this.commandManager.removeRegistration(data.blockType, data.blockId);
                }
            });

            // 명령어 중지 처리
            clientSocket.on('stopExecution', () => {
                console.log('\n🛑 실행 중지 요청 수신');
                clientSocket.broadcast.emit('stopExecution');
                clientSocket.emit('stopExecution');
            });

            // 블록 감지 요청 처리
            clientSocket.on('blockDetect', (data) => {
                console.log('🔍 블록 감지 요청:', data);
                if (this.eventHandlers) {
                    this.eventHandlers.setPendingBlockDetect(true);
                }

                // 블록 감지 요청을 마인크래프트로 전송하는 로직은 WebSocket 서버에서 처리
                this.io.emit('forwardBlockDetect', data);
            });

            // 서버 상태 요청 처리
            clientSocket.on('getServerStatus', () => {
                const registrations = this.commandManager.getAllRegistrations();
                clientSocket.emit('serverStatus', {
                    connected: true,
                    registrations: registrations,
                    totalRegistrations:
                        registrations.chatCommands.length +
                        registrations.itemAcquired.length +
                        registrations.itemUsed.length +
                        registrations.blockPlaced.length +
                        registrations.blockBroken.length
                });
            });

            // 클라이언트 연결 해제 처리
            clientSocket.on('disconnect', () => {
                console.log('❌ 웹 클라이언트 연결 해제됨');
            });
        });
    }

    /**
     * 모든 클라이언트에게 메시지 브로드캐스트
     * @param {string} event - 이벤트 이름
     * @param {object} data - 전송할 데이터
     */
    broadcast(event, data) {
        this.io.emit(event, data);
    }

    /**
     * Socket.IO 서버 인스턴스 반환
     * @returns {Server} Socket.IO 서버 인스턴스
     */
    getIO() {
        return this.io;
    }
}

module.exports = SocketIOServer;