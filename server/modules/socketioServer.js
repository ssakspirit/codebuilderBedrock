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
        this.webSocketServer = null;
    }

    /**
     * 명령어 관리자와 이벤트 핸들러 설정
     * @param {CommandManager} commandManager - 명령어 관리자
     * @param {EventHandlers} eventHandlers - 이벤트 핸들러
     * @param {WebSocketServer} webSocketServer - WebSocket 서버
     */
    setManagers(commandManager, eventHandlers, webSocketServer) {
        this.commandManager = commandManager;
        this.eventHandlers = eventHandlers;
        this.webSocketServer = webSocketServer;
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

                // WebSocket 서버를 통해 마인크래프트로 명령 전송
                if (this.webSocketServer) {
                    this.webSocketServer.send(`/agent detect ${data.direction} block`);
                }
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

            // ========== 에이전트 명령어 핸들러 (1.21.123 호환성) ==========

            // 에이전트 생성
            clientSocket.on("spawn", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent create");
                    console.log('✨ 에이전트 생성');
                }
            });

            // 에이전트 이동 명령어
            clientSocket.on("goforward", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move forward");
                    console.log('➡️ 앞으로 이동');
                }
            });

            clientSocket.on("goBack", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move back");
                    console.log('⬅️ 뒤로 이동');
                }
            });

            clientSocket.on("goUp", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move up");
                    console.log('⬆️ 위로 이동');
                }
            });

            clientSocket.on("goDown", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move down");
                    console.log('⬇️ 아래로 이동');
                }
            });

            clientSocket.on("goLeft", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move left");
                    console.log('↖️ 왼쪽으로 이동');
                }
            });

            clientSocket.on("goRight", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent move right");
                    console.log('↗️ 오른쪽으로 이동');
                }
            });

            // 에이전트 회전
            clientSocket.on("rotateLeft", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent turn left");
                    console.log('↪️ 왼쪽으로 회전');
                }
            });

            clientSocket.on("rotateRight", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent turn right");
                    console.log('↩️ 오른쪽으로 회전');
                }
            });

            // 블록 파괴
            clientSocket.on("destroy", (direction) => {
                if (this.webSocketServer) {
                    this.webSocketServer.send(`agent destroy ${direction}`);
                    console.log(`⛏️ ${direction} 블록 파괴`);
                }
            });

            // 에이전트 공격
            clientSocket.on("attack", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent attack");
                    console.log('⚔️ 공격');
                }
            });

            // 블록 설치
            clientSocket.on("place", (direction) => {
                if (this.webSocketServer) {
                    this.webSocketServer.send(`agent place ${direction}`);
                    console.log(`🧱 ${direction} 블록 설치`);
                }
            });

            // 수집
            clientSocket.on("collect", () => {
                if (this.webSocketServer) {
                    this.webSocketServer.send("agent collect all");
                    console.log('🔍 아이템 수집');
                }
            });

            // 드롭
            clientSocket.on("drop", (slot) => {
                if (this.webSocketServer) {
                    this.webSocketServer.send(`agent drop ${slot} all`);
                    console.log(`📦 슬롯 ${slot} 드롭`);
                }
            });

            // 텔레포트
            clientSocket.on("teleport", (position) => {
                if (this.webSocketServer) {
                    this.webSocketServer.send(`agent tp ${position}`);
                    console.log(`📍 텔레포트: ${position}`);
                }
            });

            // setblock 명령어
            clientSocket.on("setblock", (data) => {
                if (this.webSocketServer) {
                    const { x, y, z, blockType, isAbsolute, isCamera, isFacing, isLocal } = data;
                    let command;

                    if (isAbsolute) {
                        command = `setblock ${x} ${y} ${z} ${blockType}`;
                    } else if (isCamera) {
                        command = `execute @p ~ ~ ~ setblock ~${x} ~${y} ~${z} ${blockType}`;
                    } else if (isFacing && isLocal) {
                        command = `execute @p ~ ~ ~ setblock ^${x} ^${y} ^${z} ${blockType}`;
                    } else {
                        command = `execute @p ~ ~ ~ setblock ~${x} ~${y} ~${z} ${blockType}`;
                    }

                    this.webSocketServer.send(command);
                    console.log(`🔨 블록 설치: ${command}`);
                }
            });

            // fill 명령어
            clientSocket.on("fill", (data) => {
                if (this.webSocketServer) {
                    const { x1, y1, z1, x2, y2, z2, blockType, isAbsolute } = data;
                    let command;

                    if (isAbsolute) {
                        command = `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${blockType}`;
                    } else {
                        command = `execute @p ~ ~ ~ fill ~${x1} ~${y1} ~${z1} ~${x2} ~${y2} ~${z2} ${blockType}`;
                    }

                    this.webSocketServer.send(command);
                    console.log(`🏗️ 영역 채우기: ${command}`);
                }
            });

            // summon 명령어
            clientSocket.on("summon", (data) => {
                if (this.webSocketServer) {
                    const { entityType, x, y, z, isAbsolute } = data;
                    let command;

                    if (isAbsolute) {
                        command = `summon ${entityType} ${x} ${y} ${z}`;
                    } else {
                        command = `execute @p ~ ~ ~ summon ${entityType} ~${x} ~${y} ~${z}`;
                    }

                    this.webSocketServer.send(command);
                    console.log(`👾 몹 소환: ${command}`);
                }
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