// 공통 모듈 불러오기
const { SOCKET_EVENTS, PORTS } = require('../shared/constants');
const { CommandData, Position } = require('../shared/types');

const WebSocket = require('ws');
const uuid = require('uuid');
const express = require('express');
const { exec } = require('child_process');
const figlet = require('figlet');
const colors = require('colors');
const path = require('path');
const app = express();
const net = require('net');
const http = require('http');
const { Server } = require('socket.io');
const ncp = require('copy-paste');
const fse = require('fs-extra'); // 정적 파일 복사용
const os = require('os');

// 포트 자동 탐색 함수 추가
async function findAvailablePort(startPort, endPort) {
    for (let port = startPort; port <= endPort; port++) {
        if (!(await portCheck(port))) {
            return port;
        }
    }
    return null;
}

// 플레이어 명령어 실행을 위한 유틸리티 함수들
function executeAsPlayer(player, command) {
    if (player && player !== 'Unknown') {
        // 베드락 에디션 execute 문법 (간단한 형태)
        return `execute "${player}" ~ ~ ~ ${command}`;
    }
    return command;
}

function sendPlayerCommand(player, command, commandType = '명령어') {
    // 입력 검증
    if (!command || typeof command !== 'string') {
        console.error(`❌ ${commandType} 오류: 유효하지 않은 명령어`, command);
        return null;
    }
    
    const finalCommand = executeAsPlayer(player, command);
    
    if (player && player !== 'Unknown') {
        console.log(`🎮 ${commandType} 실행 (플레이어 컨텍스트):`);
        console.log(`   플레이어: ${player}`);
        console.log(`   원본 명령어: ${command}`);
        console.log(`   최종 명령어: ${finalCommand}`);
    } else {
        console.log(`🎮 ${commandType} 실행 (에이전트 컨텍스트): ${command}`);
    }
    
    return finalCommand;
}

start();

async function portCheck(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(false);
        });

        server.listen(port);
    });
}

// pkg로 빌드된 환경에서 정적 파일을 임시 폴더에 복사하는 함수
function extractAssetsIfNeeded() {
    if (process.pkg) {
        const tmpDir = path.join(os.tmpdir(), 'bedrock-agent-static');
        // 복사할 폴더 목록
        const folders = ['client', 'blocks', 'shared', 'public'];
        folders.forEach(folder => {
            // pkg 환경에서는 __dirname이 snapshot 경로를 가리키므로 상대 경로 사용
            const src = path.join(__dirname, '..', folder);
            const dest = path.join(tmpDir, folder);
            try {
                if (!fse.existsSync(dest)) {
                    console.log(`📁 ${folder} 폴더 추출 중...`);
                    fse.copySync(src, dest);
                    console.log(`✅ ${folder} 폴더 추출 완료`);
                }
            } catch (error) {
                console.error(`❌ ${folder} 폴더 추출 실패:`, error.message);
                // 필수 폴더가 없어도 계속 실행하도록 함
            }
        });
        return tmpDir;
    } else {
        return path.join(__dirname, '..');
    }
}

async function start() {
    // 사용할 포트 범위 지정
    const wsPort = await findAvailablePort(3000, 3050);
    if (!wsPort) {
        console.log('사용 가능한 WebSocket 포트를 찾을 수 없습니다.');
        process.exit(1);
    }
    const expressPort = await findAvailablePort(4000, 4050);
    if (!expressPort) {
        console.log('사용 가능한 Express 포트를 찾을 수 없습니다.');
        process.exit(1);
    }

    figlet('SteveCoding', function (err, data) {
        if (err) {
            console.log('Error generating ASCII art');
            console.log(err);
            process.exit(1);
        }

        // Express 서버 설정 (마인크래프트 연결과 독립적으로)
        const staticBase = extractAssetsIfNeeded();
        app.use(express.static(path.join(staticBase, 'client')));
        app.use('/shared', express.static(path.join(staticBase, 'shared')));
        app.use('/blocks', express.static(path.join(staticBase, 'blocks')));
        app.use('/public', express.static(path.join(staticBase, 'public')));
        app.get('/', (req, res) => {
            const indexPath = path.join(staticBase, 'client', 'index.html');
            console.log('👀 메인 페이지 경로:', indexPath);
            if (fse.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                console.error('❌ 메인 페이지 파일을 찾을 수 없습니다:', indexPath);
                res.status(404).send('메인 페이지를 찾을 수 없습니다.');
            }
        });
        
        // 관리자 페이지
        app.get('/admin', (req, res) => {
            const adminPath = path.join(staticBase, 'public', 'admin.html');
            console.log('👀 관리자 페이지 경로:', adminPath);
            if (fse.existsSync(adminPath)) {
                res.sendFile(adminPath);
            } else {
                console.error('❌ 관리자 페이지 파일을 찾을 수 없습니다:', adminPath);
                res.status(404).send('관리자 페이지를 찾을 수 없습니다.');
            }
        });
        
        // 마인크래프트 연결 상태 추적
        let minecraftConnected = false;
        
        // API: 서버 상태 정보
        app.get('/api/status', (req, res) => {
            res.json({
                wsPort: wsPort,
                webPort: expressPort,
                timestamp: new Date().toISOString(),
                status: 'running',
                minecraftConnected: minecraftConnected
            });
        });
        
        // API: 서버 재시작
        app.post('/api/restart', (req, res) => {
            res.json({ message: '서버 재시작 중...' });
            console.log('🔄 웹 UI에서 서버 재시작 요청됨'.yellow);
            setTimeout(() => {
                process.exit(0); // PM2나 nodemon이 자동으로 재시작
            }, 1000);
        });
        
        // API: 서버 종료
        app.post('/api/stop', (req, res) => {
            res.json({ message: '서버 종료 중...' });
            console.log('⏹️  웹 UI에서 서버 종료 요청됨'.red);
            setTimeout(() => {
                process.exit(0);
            }, 1000);
        });
        
        // API: 연결 초기화
        app.post('/api/clear', (req, res) => {
            res.json({ message: '연결 초기화됨' });
            console.log('🧹 웹 UI에서 연결 초기화 요청됨'.cyan);
            // 여기에 연결 초기화 로직 추가 가능
        });

        // Express 서버를 즉시 시작
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: `http://localhost:${wsPort}`,
                methods: ["GET", "POST"]
            }
        });

        // Express 서버 실행
        server.listen(expressPort, () => {
            console.clear();
            console.log(data.green);
            console.log(`\n🌐 서버 관리 UI가 자동으로 열립니다...`.cyan);
            console.log(`📊 관리 페이지: http://localhost:${expressPort}/admin`.green);
            console.log(`🧩 블록 코딩 페이지: http://localhost:${expressPort}`.yellow);
            console.log(`\n   - 실시간 서버 상태 확인`.gray);
            console.log(`   - 마인크래프트 연결 정보`.gray);
            console.log(`   - 블록 코딩 인터페이스`.gray);
            
            // 클립보드에 명령어 복사
            const command = `/connect localhost:${wsPort}`;
            ncp.copy(command, function() {
                console.log('\n=== 마인크래프트 연결 방법 ==='.yellow);
                console.log('1. 마인크래프트 채팅창을 엽니다 (T키)'.cyan);
                console.log(`2. 아래 명령어를 붙여넣기 하세요 (Ctrl+V)`.cyan);
                console.log(`   ${command}`.green);
                console.log('   (이미 클립보드에 복사되어 있습니다)'.gray);
                console.log('3. 엔터키를 눌러 실행하세요'.cyan);
                console.log('\n연결에 실패할 경우:'.yellow);
                console.log('- "setup.bat"를 실행하세요'.gray);
                console.log('- 마인크래프트가 최신 버전인지 확인하세요'.gray);
                console.log('=========================\n'.yellow);
            });
            
            // 웹 브라우저 자동 실행 (관리자 페이지로) - Express 서버 시작 즉시
            exec(`start http://localhost:${expressPort}/admin`);
        });

        // WebSocket 서버 실행
        const wss = new WebSocket.Server({ port: wsPort });

        wss.on('connection', async socket => {
            console.log('\n🎮 마인크래프트 연결됨! 블록 코딩 페이지를 여는 중...'.green);
            
            // 마인크래프트 연결 상태 업데이트
            minecraftConnected = true;
            
            // 마인크래프트 연결 시 블록 코딩 페이지 자동 실행
            exec(`start http://localhost:${expressPort}`);

            let minecraftSlot = 1;
            let commandBlocks = new Map();
            let itemBlocks = new Map(); // item -> {blockId, socket}
            let blockPlacedBlocks = new Map(); // blockType -> {blockId, socket}
            let blockBrokenBlocks = new Map(); // blockType -> {blockId, socket}
            let pendingBlockDetect = false;
            let blockDetectResponseCount = 0;

            // Socket.IO 연결 처리
            io.on('connection', (clientSocket) => {
                console.log('\n=== 웹 클라이언트 연결됨 ===\n');

                // 실행 명령어 업데이트 처리
                clientSocket.on('updateExecutionCommand', (data) => {
                    if (data && data.command) {
                        commandBlocks.set(data.command, {
                            blockId: data.blockId,
                            socket: clientSocket
                        });
                        
                        console.log('\n=== 명령어 등록 ===');
                        console.log('총 등록된 명령어 수:', commandBlocks.size);
                        console.log('------------------------');
                        for (let [command, blockData] of commandBlocks.entries()) {
                            console.log(`• "${command}" (ID: ${blockData.blockId})`);
                        }
                        console.log('=========================\n');
                    }
                });

                // 아이템 획득 명령어 업데이트 처리
                clientSocket.on('updateItemUseCommand', (data) => {
                    console.log('🔍 updateItemUseCommand 수신된 데이터:', data);
                    if (data && data.item) {
                        // 같은 블록 ID를 가진 이전 아이템들을 제거
                        const itemsToRemove = [];
                        for (let [item, blockData] of itemBlocks.entries()) {
                            if (blockData.blockId === data.blockId) {
                                itemsToRemove.push(item);
                            }
                        }
                        itemsToRemove.forEach(item => {
                            itemBlocks.delete(item);
                            console.log('🗑️ 이전 아이템 제거:', item);
                        });
                        
                        // 이미 같은 아이템이 등록되어 있는지 확인
                        if (itemBlocks.has(data.item)) {
                            console.log('❌ 중복 아이템 등록 시도 거부:', data.item);
                            console.log('이미 등록된 블록 ID:', itemBlocks.get(data.item).blockId);
                            clientSocket.emit('itemRegistrationError', {
                                error: '같은 아이템에 대한 블록이 이미 존재합니다.',
                                item: data.item,
                                existingBlockId: itemBlocks.get(data.item).blockId
                            });
                            return;
                        }
                        
                        // 새로운 아이템 등록
                        itemBlocks.set(data.item, {
                            blockId: data.blockId,
                            socket: clientSocket
                        });
                        
                        console.log('\n=== 아이템 획득 등록 ===');
                        console.log('등록된 아이템:', data.item);
                        console.log('블록 ID:', data.blockId);
                        console.log('총 등록된 아이템 수:', itemBlocks.size);
                        console.log('------------------------');
                        for (let [item, blockData] of itemBlocks.entries()) {
                            console.log(`• "${item}" (ID: ${blockData.blockId})`);
                        }
                        console.log('======================\n');
                    } else {
                        console.log('❌ 유효하지 않은 아이템 데이터:', data);
                    }
                });

                // 블록 설치 명령어 업데이트 처리
                clientSocket.on('updateBlockPlacedCommand', (data) => {
                    console.log('🔍 updateBlockPlacedCommand 수신된 데이터:', data);
                    if (data && data.blockType) {
                        // 같은 블록 ID를 가진 이전 블록들을 제거
                        const blocksToRemove = [];
                        for (let [blockType, blockData] of blockPlacedBlocks.entries()) {
                            if (blockData.blockId === data.blockId) {
                                blocksToRemove.push(blockType);
                            }
                        }
                        blocksToRemove.forEach(blockType => {
                            blockPlacedBlocks.delete(blockType);
                            console.log('🗑️ 이전 블록 제거:', blockType);
                        });
                        
                        // 이미 같은 블록이 등록되어 있는지 확인
                        if (blockPlacedBlocks.has(data.blockType)) {
                            console.log('❌ 중복 블록 등록 시도 거부:', data.blockType);
                            console.log('이미 등록된 블록 ID:', blockPlacedBlocks.get(data.blockType).blockId);
                            clientSocket.emit('blockPlacedRegistrationError', {
                                error: '같은 블록에 대한 명령이 이미 존재합니다.',
                                blockType: data.blockType,
                                existingBlockId: blockPlacedBlocks.get(data.blockType).blockId
                            });
                            return;
                        }
                        
                        // 새로운 블록 등록
                        blockPlacedBlocks.set(data.blockType, {
                            blockId: data.blockId,
                            socket: clientSocket
                        });
                        
                        console.log('\n=== 블록 설치 감지 등록 ===');
                        console.log('등록된 블록:', data.blockType);
                        console.log('블록 ID:', data.blockId);
                        console.log('총 등록된 블록 수:', blockPlacedBlocks.size);
                        console.log('------------------------');
                        for (let [blockType, blockData] of blockPlacedBlocks.entries()) {
                            console.log(`• "${blockType}" (ID: ${blockData.blockId})`);
                        }
                        console.log('======================\n');
                    } else {
                        console.log('❌ 유효하지 않은 블록 데이터:', data);
                    }
                });

                // 블록 파괴 명령어 업데이트 처리
                clientSocket.on('updateBlockBrokenCommand', (data) => {
                    console.log('🔍 updateBlockBrokenCommand 수신된 데이터:', data);
                    if (data && data.blockType) {
                        // 같은 블록 ID를 가진 이전 블록들을 제거
                        const blocksToRemove = [];
                        for (let [blockType, blockData] of blockBrokenBlocks.entries()) {
                            if (blockData.blockId === data.blockId) {
                                blocksToRemove.push(blockType);
                            }
                        }
                        blocksToRemove.forEach(blockType => {
                            blockBrokenBlocks.delete(blockType);
                            console.log('🗑️ 이전 블록 파괴 감지 제거:', blockType);
                        });
                        
                        // 이미 같은 블록이 등록되어 있는지 확인
                        if (blockBrokenBlocks.has(data.blockType)) {
                            console.log('❌ 중복 블록 파괴 등록 시도 거부:', data.blockType);
                            console.log('이미 등록된 블록 ID:', blockBrokenBlocks.get(data.blockType).blockId);
                            clientSocket.emit('blockBrokenRegistrationError', {
                                error: '같은 블록에 대한 파괴 명령이 이미 존재합니다.',
                                blockType: data.blockType,
                                existingBlockId: blockBrokenBlocks.get(data.blockType).blockId
                            });
                            return;
                        }
                        
                        // 새로운 블록 등록
                        blockBrokenBlocks.set(data.blockType, {
                            blockId: data.blockId,
                            socket: clientSocket
                        });
                        
                        console.log('\n=== 블록 파괴 감지 등록 ===');
                        console.log('등록된 블록:', data.blockType);
                        console.log('블록 ID:', data.blockId);
                        console.log('총 등록된 블록 수:', blockBrokenBlocks.size);
                        console.log('------------------------');
                        for (let [blockType, blockData] of blockBrokenBlocks.entries()) {
                            console.log(`• "${blockType}" (ID: ${blockData.blockId})`);
                        }
                        console.log('======================\n');
                    } else {
                        console.log('❌ 유효하지 않은 블록 파괴 데이터:', data);
                    }
                });

                // 블록 등록 제거 처리
                clientSocket.on('removeBlockRegistration', (data) => {
                    console.log('🗑️ 블록 등록 제거 요청 수신:', data);
                    
                    const { blockType, blockId } = data;
                    
                    // 채팅 명령어 블록 제거
                    if (blockType === 'on_chat_command') {
                        for (let [command, blockData] of commandBlocks.entries()) {
                            if (blockData.blockId === blockId) {
                                commandBlocks.delete(command);
                                console.log('✅ 채팅 명령어 제거:', command);
                                break;
                            }
                        }
                    }
                    
                    // 아이템 사용 블록 제거
                    if (blockType === 'on_item_use') {
                        for (let [item, blockData] of itemBlocks.entries()) {
                            if (blockData.blockId === blockId) {
                                itemBlocks.delete(item);
                                console.log('✅ 아이템 사용 제거:', item);
                                break;
                            }
                        }
                    }
                    
                    // 블록 설치 감지 제거
                    if (blockType === 'on_block_placed') {
                        for (let [block, blockData] of blockPlacedBlocks.entries()) {
                            if (blockData.blockId === blockId) {
                                blockPlacedBlocks.delete(block);
                                console.log('✅ 블록 설치 감지 제거:', block);
                                break;
                            }
                        }
                    }
                    
                    // 블록 파괴 감지 제거
                    if (blockType === 'on_block_broken') {
                        for (let [block, blockData] of blockBrokenBlocks.entries()) {
                            if (blockData.blockId === blockId) {
                                blockBrokenBlocks.delete(block);
                                console.log('✅ 블록 파괴 감지 제거:', block);
                                break;
                            }
                        }
                    }
                    
                    console.log('현재 등록 상태:');
                    console.log('- 채팅 명령어:', commandBlocks.size + '개');
                    console.log('- 아이템 사용:', itemBlocks.size + '개');
                    console.log('- 블록 설치:', blockPlacedBlocks.size + '개');
                    console.log('- 블록 파괴:', blockBrokenBlocks.size + '개');
                });

                // 일반 명령어 실행 처리 (주로 아이템 지급)
                clientSocket.on("executeCommand", (data) => {
                    const command = typeof data === 'string' ? data : data.command;
                    const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                    
                    // @s를 실제 플레이어 이름으로 치환
                    let processedCommand = command;
                    if (executingPlayer && processedCommand.includes('@s')) {
                        processedCommand = processedCommand.replace(/@s/g, `"${executingPlayer}"`);
                    }
                    
                    // 통합 함수 사용
                    const finalCommand = sendPlayerCommand(executingPlayer, processedCommand, '아이템 지급');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 에이전트 명령어 처리
                clientSocket.on("spawn", () => {
                    send("agent create");
                    console.log('✨ 에이전트 생성');
                });

                clientSocket.on("goforward", () => {
                    send("agent move forward");
                    console.log('➡️ 앞으로 이동');
                });

                clientSocket.on("goBack", () => {
                    send("agent move back");
                    console.log('⬅️ 뒤로 이동');
                });

                clientSocket.on("goUp", () => {
                    send("agent move up");
                    console.log('⬆️ 위로 이동');
                });

                clientSocket.on("goDown", () => {
                    send("agent move down");
                    console.log('⬇️ 아래로 이동');
                });

                clientSocket.on("goLeft", () => {
                    send("agent move left");
                    console.log('↖️ 왼쪽으로 이동');
                });

                clientSocket.on("goRight", () => {
                    send("agent move right");
                    console.log('↗️ 오른쪽으로 이동');
                });

                clientSocket.on("rotateLeft", () => {
                    send("agent turn left");
                    console.log('↪️ 왼쪽으로 회전');
                });

                clientSocket.on("rotateRight", () => {
                    send("agent turn right");
                    console.log('↩️ 오른쪽으로 회전');
                });

                clientSocket.on("destroy", (direction) => {
                    send(`agent destroy ${direction}`);
                    console.log('💥 블록 파괴:', direction);
                });

                clientSocket.on("attack", () => {
                    send("agent attack forward");
                    console.log('⚔️ 공격');
                });

                clientSocket.on("dropAll", () => {
                    send("agent dropall forward");
                    console.log('📦 모든 아이템 버리기');
                });

                clientSocket.on("setSlot", slot => {
                    minecraftSlot = slot;
                    send(`agent select ${slot}`);
                    console.log('🎯 슬롯 선택:', slot);
                });

                clientSocket.on("dropSlotItem", () => {
                    send(`agent drop ${minecraftSlot} 1 forward`);
                    console.log('🗑️ 선택 슬롯 아이템 버리기');
                });

                clientSocket.on("place", (direction) => {
                    send(`agent place ${minecraftSlot} ${direction}`);
                    console.log('🏗️ 블록 설치:', direction);
                });

                clientSocket.on("tp", () => {
                    send("agent tp");
                    console.log('💫 텔레포트');
                });

                clientSocket.on("collect", () => {
                    send("agent collect all");
                    console.log('🧲 아이템 줍기');
                });

                clientSocket.on("stop", () => {
                    figlet('Connection', function (err, data) {
                        if (err) {
                            console.log('Error generating ASCII art'.red);
                            console.log(err);
                            process.exit(1);
                        }
                        console.clear();
                        console.log(data.red);
                        figlet('Disconnected', function (err, data) {
                            if (err) {
                                console.log('Error generating ASCII art'.red);
                                console.log(err);
                                process.exit(1);
                            }
                            console.log(data.red);
                            process.exit(0);
                        });
                    });
                });

                clientSocket.on("tpPos", async (data) => {
                    console.log('🔍 에이전트 텔레포트 데이터 디버깅:');
                    console.log('   data:', JSON.stringify(data, null, 2));
                    
                    let finalX = data.x;
                    let finalY = data.y;
                    let finalZ = data.z;
                    
                    // 위치 좌표 카메라 처리 (플레이어 방향 기반 변환)
                    if (data.isCamera) {
                        console.log('   → 위치 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${data.executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            const convertedCoords = convertCameraPosition(data.x, data.y, data.z, playerDirection);
                            console.log('🎯 위치 카메라 좌표 변환:', convertedCoords);
                            
                            finalX = convertedCoords.x;
                            finalY = convertedCoords.y;
                            finalZ = convertedCoords.z;
                            
                        } catch (error) {
                            console.error('❌ 위치 카메라 위치 처리 오류:', error);
                            // 오류 시 기본 상대좌표로 처리
                            finalX = data.x;
                            finalY = data.y;
                            finalZ = data.z;
                        }
                    }
                    
                    // 바라보는 방향 위치 처리 (isFacing 또는 isLocal)
                    if (data.isFacing || data.isLocal) {
                        console.log('   → 바라보는 방향 위치 처리 중...');
                        console.log('🔍 바라보는 방향 위치 좌표:', { x: data.x, y: data.y, z: data.z });
                        console.log('   → 바라보는 방향 위치는 ^ 좌표로 처리됩니다');
                        
                        // 바라보는 방향 위치는 그대로 ^ 좌표로 전달 (서버 처리 없음)
                        finalX = data.x;
                        finalY = data.y;
                        finalZ = data.z;
                    }
                    
                    // 바라보는 방향은 data.facing을 직접 사용
                    
                    // 좌표 기호 결정
                    let coordPrefix;
                    if (data.isFacing || data.isLocal) {
                        coordPrefix = '^';  // 바라보는 방향 위치는 ^ 사용
                        console.log('   → ^ 좌표 사용 (바라보는 방향 위치)');
                    } else if (data.isCamera) {
                        coordPrefix = '~';  // 카메라 위치는 ~ 사용 (상대 좌표)
                        console.log('   → ~ 좌표 사용 (카메라 상대 위치)');
                    } else {
                        coordPrefix = data.isAbsolute ? '' : '~';  // 절대/상대 좌표
                        console.log(`   → ${coordPrefix || '절대'} 좌표 사용`);
                    }
                    
                    // 에이전트 텔레포트 (위치만)
                    const tpCommand = `agent tp ${coordPrefix}${finalX} ${coordPrefix}${finalY} ${coordPrefix}${finalZ}`;
                    console.log('🤖 에이전트 텔레포트 명령어:', tpCommand);
                    
                    send(tpCommand);
                    console.log(`🎯 에이전트 이동: ${coordPrefix}${finalX} ${coordPrefix}${finalY} ${coordPrefix}${finalZ}`);
                });

                clientSocket.on("till", (direction) => {
                    send(`agent till ${direction}`);
                    console.log('🌱 땅 경작:', direction);
                });

                // 채팅창에 말하기 명령어 처리
                clientSocket.on("say", (data) => {
                    const message = typeof data === 'string' ? data : data.message;
                    const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                    
                    let command;
                    if (executingPlayer) {
                        // 플레이어 컨텍스트에서 채팅
                        command = `tellraw @a {"rawtext":[{"text":"<${executingPlayer}> ${message}"}]}`;
                    } else {
                        // 에이전트 컨텍스트에서 채팅
                        command = `tellraw @a {"rawtext":[{"text":"<"},{"selector":"@s"},{"text":"> ${message}"}]}`;
                    }
                    
                    const finalCommand = sendPlayerCommand(executingPlayer, command, '채팅');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 카메라 위치 좌표 변환 함수 (posCamera 구현)
                function convertCameraPosition(x, y, z, yaw) {
                    // 마인크래프트 yaw를 0-360도로 정규화
                    let normalizedYaw = ((yaw % 360) + 360) % 360;
                    
                    // 8방향으로 분류 (각 45도씩)
                    // 0도 = 남쪽, 90도 = 서쪽, 180도 = 북쪽, 270도 = 동쪽
                    let worldX = 0;
                    let worldY = y; // 위/아래는 그대로  
                    let worldZ = 0;
                    
                    // Z축 (앞/뒤) 변환 - 플레이어 방향에 따라 월드 X, Z축으로 분산
                    if (normalizedYaw >= 337.5 || normalizedYaw < 22.5) {
                        // 남쪽 (0도) - Z+ 방향
                        worldZ = z;
                    } else if (normalizedYaw >= 22.5 && normalizedYaw < 67.5) {
                        // 남서쪽 - 서쪽에 더 가까우면 서쪽 우선
                        if (normalizedYaw > 45) {
                            worldX = -z; // 서쪽 우선
                        } else {
                            worldZ = z;  // 남쪽 우선
                        }
                    } else if (normalizedYaw >= 67.5 && normalizedYaw < 112.5) {
                        // 서쪽 (90도) - X- 방향
                        worldX = -z;
                    } else if (normalizedYaw >= 112.5 && normalizedYaw < 157.5) {
                        // 북서쪽 - 북쪽에 더 가까우면 북쪽 우선
                        if (normalizedYaw > 135) {
                            worldZ = -z; // 북쪽 우선
                        } else {
                            worldX = -z; // 서쪽 우선
                        }
                    } else if (normalizedYaw >= 157.5 && normalizedYaw < 202.5) {
                        // 북쪽 (180도) - Z- 방향
                        worldZ = -z;
                    } else if (normalizedYaw >= 202.5 && normalizedYaw < 247.5) {
                        // 북동쪽 - 동쪽에 더 가까우면 동쪽 우선
                        if (normalizedYaw > 225) {
                            worldX = z;  // 동쪽 우선
                        } else {
                            worldZ = -z; // 북쪽 우선
                        }
                    } else if (normalizedYaw >= 247.5 && normalizedYaw < 292.5) {
                        // 동쪽 (270도) - X+ 방향
                        worldX = z;
                    } else if (normalizedYaw >= 292.5 && normalizedYaw < 337.5) {
                        // 남동쪽 - 남쪽에 더 가까우면 남쪽 우선
                        if (normalizedYaw > 315) {
                            worldZ = z;  // 남쪽 우선
                        } else {
                            worldX = z;  // 동쪽 우선
                        }
                    }
                    
                    // X축 (오른쪽/왼쪽) 변환 - 플레이어 방향에 따라 회전
                    if (normalizedYaw >= 337.5 || normalizedYaw < 22.5) {
                        // 남쪽: 오른쪽이 서쪽(-X)
                        worldX += -x;
                    } else if (normalizedYaw >= 67.5 && normalizedYaw < 112.5) {
                        // 서쪽: 오른쪽이 남쪽(+Z)
                        worldZ += -x;
                    } else if (normalizedYaw >= 157.5 && normalizedYaw < 202.5) {
                        // 북쪽: 오른쪽이 동쪽(+X)
                        worldX += x;
                    } else if (normalizedYaw >= 247.5 && normalizedYaw < 292.5) {
                        // 동쪽: 오른쪽이 북쪽(-Z)
                        worldZ += x;
                    } else {
                        // 대각선 방향들은 가장 가까운 축으로
                        worldX += (normalizedYaw > 180) ? x : -x;
                    }
                    
                    console.log(`🧭 방향 변환: yaw=${normalizedYaw}° (${x},${y},${z}) → (${worldX},${worldY},${worldZ})`);
                    
                    return {
                        x: Math.round(worldX),
                        y: Math.round(worldY),
                        z: Math.round(worldZ)
                    };
                }

                // 블록 설치 명령어 처리
                clientSocket.on("setblock", async (data) => {
                    console.log('🔍 블록 설치 데이터 디버깅:');
                    console.log('   data:', JSON.stringify(data, null, 2));
                    console.log('   isLocal:', data.isLocal);
                    console.log('   isFacing:', data.isFacing);
                    console.log('   isCamera:', data.isCamera);
                    console.log('   isAbsolute:', data.isAbsolute);
                    
                    // 카메라 상대 위치 처리 (특별 처리)
                    if (data.isCamera) {
                        console.log('   → 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            // 플레이어 방향 정보 조회
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${data.executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            // 방향 기반 좌표 변환
                            const convertedCoords = convertCameraPosition(data.x, data.y, data.z, playerDirection);
                            console.log('🔄 좌표 변환 결과:', convertedCoords);
                            
                            // 변환된 좌표로 명령어 생성
                            const cameraCommand = `setblock ~${convertedCoords.x} ~${convertedCoords.y} ~${convertedCoords.z} ${data.blockType}`;
                            console.log('   → 카메라 변환 명령어:', cameraCommand);
                            
                            const finalCommand = sendPlayerCommand(data.executingPlayer, cameraCommand, '카메라 블록 설치');
                            if (finalCommand) {
                                send(finalCommand);
                            }
                            return; // 일반 처리 로직 건너뛰기
                        } catch (error) {
                            console.error('❌ 카메라 위치 처리 오류:', error);
                        }
                    }
                    
                    let prefix = '';
                    
                    if (data.isLocal || data.isFacing) {
                        // 로컬/바라보는 방향: 정확한 시선 방향 기준 (posLocal)
                        prefix = '^';
                    } else if (data.isCamera) {
                        // 카메라 상대 위치: 월드 축 기반 (posCamera)
                        prefix = '~';
                        console.log('   → 카메라 상대 위치로 선택 (월드 축 기준), prefix: ~');
                    } else if (data.isAbsolute) {
                        // 절대 좌표
                        prefix = '';
                    } else {
                        // 상대 좌표
                        prefix = '~';
                    }
                    
                    const command = `setblock ${prefix}${data.x} ${prefix}${data.y} ${prefix}${data.z} ${data.blockType}`;
                    console.log('   최종 명령어:', command);
                    
                    // 통합 함수 사용
                    const finalCommand = sendPlayerCommand(data.executingPlayer, command, '블록 설치');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 블록 채우기 명령어 처리
                clientSocket.on("fill", async (data) => {
                    // 이전 호환성을 위한 처리 (command만 있는 경우)
                    if (typeof data === 'string' || (data.command && !data.startPos && !data.endPos)) {
                        const command = typeof data === 'string' ? data : data.command;
                        const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                        
                        const finalCommand = sendPlayerCommand(executingPlayer, command, '블록 채우기');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        return;
                    }
                    
                    // 새로운 카메라 위치 처리
                    const { startPos, endPos, blockType, fillMode, executingPlayer } = data;
                    let finalStartPos = startPos;
                    let finalEndPos = endPos;
                    
                    console.log('🔍 블록 채우기 데이터 디버깅:');
                    console.log('   startPos:', JSON.stringify(startPos, null, 2));
                    console.log('   endPos:', JSON.stringify(endPos, null, 2));
                    
                    // 시작점 카메라 위치 처리
                    if (startPos.isCamera) {
                        console.log('   → 시작점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            const convertedStartCoords = convertCameraPosition(startPos.x, startPos.y, startPos.z, playerDirection);
                            console.log('🎯 시작점 카메라 좌표 변환:', convertedStartCoords);
                            
                            finalStartPos = convertedStartCoords;
                            
                        } catch (error) {
                            console.error('❌ 시작점 카메라 위치 처리 오류:', error);
                        }
                    }
                    
                    // 끝점 카메라 위치 처리
                    if (endPos.isCamera) {
                        console.log('   → 끝점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            const convertedEndCoords = convertCameraPosition(endPos.x, endPos.y, endPos.z, playerDirection);
                            console.log('🎯 끝점 카메라 좌표 변환:', convertedEndCoords);
                            
                            finalEndPos = convertedEndCoords;
                            
                        } catch (error) {
                            console.error('❌ 끝점 카메라 위치 처리 오류:', error);
                        }
                    }
                    
                    // prefix 결정
                    const startPrefix = startPos.isFacing ? '^' : (startPos.isAbsolute ? '' : '~');
                    const endPrefix = endPos.isFacing ? '^' : (endPos.isAbsolute ? '' : '~');
                    
                    // 최종 명령어 생성
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    const command = `fill ${startPrefix}${finalStartPos.x} ${startPrefix}${finalStartPos.y} ${startPrefix}${finalStartPos.z} ${endPrefix}${finalEndPos.x} ${endPrefix}${finalEndPos.y} ${endPrefix}${finalEndPos.z} ${cleanBlockType} ${fillMode}`;
                    
                    console.log('🧱 블록 채우기 명령어:', command);
                    
                    const finalCommand = sendPlayerCommand(executingPlayer, command, '블록 채우기');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 블록 탐지 명령어 처리
                clientSocket.on("blockDetect", async (data) => {
                    console.log('🔍 블록 탐지 데이터 디버깅:');
                    console.log('   data:', JSON.stringify(data, null, 2));
                    
                    let finalCommand = data.command;
                    const executingPlayer = data.executingPlayer;
                    const pos = data.position;
                    
                    // 카메라 위치 처리 (블록 설치와 동일한 방식)
                    if (pos && pos.isCamera) {
                        console.log('   → 카메라 상대 위치 처리 (블록 탐지) - 플레이어 방향 조회 중...');
                        
                        try {
                            // 플레이어 방향 정보 조회
                            const playerDirection = await new Promise((resolve, reject) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                let responseReceived = false;
                                
                                const responseHandler = (message) => {
                                    try {
                                        if (responseReceived) return;
                                        
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                responseReceived = true;
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                        
                                        // querytarget 응답이지만 details가 없는 경우
                                        if (jsonData.header && jsonData.header.messagePurpose === 'commandResponse' && 
                                            jsonData.body && jsonData.body.statusMessage && 
                                            jsonData.body.statusMessage.includes('querytarget')) {
                                            console.log('🔍 querytarget 응답 감지했지만 details 없음 - 기본값 0 사용');
                                            responseReceived = true;
                                            socket.off('message', responseHandler);
                                            resolve(0);
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                const timeout = setTimeout(() => {
                                    if (!responseReceived) {
                                        responseReceived = true;
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 (블록 탐지) - 기본값 0 사용');
                                        resolve(0);
                                    }
                                }, 500); // 타임아웃을 0.5초로 줄임
                                
                                // gamerule sendcommandfeedback를 잠시 켜서 응답을 받을 수 있도록 함
                                send('gamerule sendcommandfeedback true');
                                setTimeout(() => {
                                    send(queryCommand);
                                }, 50);
                            });
                            
                            // 방향 기반 좌표 변환
                            const convertedCoords = convertCameraPosition(pos.x, pos.y, pos.z, playerDirection);
                            console.log('🔄 좌표 변환 결과 (블록 탐지):', convertedCoords);
                            
                            // 변환된 좌표로 명령어 생성
                            const cameraCommand = `testforblock ~${convertedCoords.x} ~${convertedCoords.y} ~${convertedCoords.z} ${data.blockType}`;
                            console.log('   → 카메라 변환 명령어:', cameraCommand);
                            
                            // 카메라 처리된 명령어로 블록 탐지 실행
                            const playerCommand = sendPlayerCommand(executingPlayer, cameraCommand, '카메라 블록 탐지');
                            
                            if (playerCommand) {
                                // 카메라 블록 탐지 전용 처리
                                console.log('🔍 카메라 블록 탐지 실행 - 전용 처리');
                                
                                let cameraDetectResponseCount = 0;
                                let cameraDetectProcessed = false;
                                
                                // 전용 리스너 설정
                                const cameraDetectHandler = (message) => {
                                    try {
                                        if (cameraDetectProcessed) return;
                                        
                                        const messageStr = message.toString();
                                        const jsonData = JSON.parse(messageStr);
                                        
                                        if (jsonData.header && jsonData.header.messagePurpose === 'commandResponse') {
                                            const statusCode = jsonData.body.statusCode;
                                            cameraDetectResponseCount++;
                                            
                                            console.log('🔍 카메라 탐지 응답 #' + cameraDetectResponseCount + ', 상태코드:', statusCode);
                                            
                                            // testforblock 실제 응답 (상태 코드가 0이 아닌 경우)
                                            if (statusCode !== 0) {
                                                // 블록이 없거나 다른 블록
                                                console.log('🔍 카메라 블록 탐지 결과: 블록 없음 (상태코드:', statusCode, ')');
                                                cameraDetectProcessed = true;
                                                socket.off('message', cameraDetectHandler);
                                                clientSocket.emit('blockDetectResult', false);
                                                // 명령어 피드백 끄기
                                                setTimeout(() => {
                                                    send('gamerule sendcommandfeedback false');
                                                }, 100);
                                            } else if (cameraDetectResponseCount >= 2) {
                                                // 2번 이상 응답이 왔는데도 에러가 없으면 성공
                                                console.log('🔍 카메라 블록 탐지 결과: 블록 존재 (응답 2회)');
                                                cameraDetectProcessed = true;
                                                socket.off('message', cameraDetectHandler);
                                                clientSocket.emit('blockDetectResult', true);
                                                // 명령어 피드백 끄기
                                                setTimeout(() => {
                                                    send('gamerule sendcommandfeedback false');
                                                }, 100);
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 카메라 블록 탐지 응답 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', cameraDetectHandler);
                                
                                // 타임아웃 설정 (더 길게 설정)
                                setTimeout(() => {
                                    if (!cameraDetectProcessed) {
                                        cameraDetectProcessed = true;
                                        socket.off('message', cameraDetectHandler);
                                        console.log('🔍 카메라 블록 탐지 타임아웃 - 성공으로 간주');
                                        clientSocket.emit('blockDetectResult', true);
                                        // 명령어 피드백 끄기
                                        setTimeout(() => {
                                            send('gamerule sendcommandfeedback false');
                                        }, 100);
                                    }
                                }, 800); // 블록 탐지 타임아웃을 0.8초로 줄임
                                
                                // 명령어 실행
                                send(playerCommand);
                                console.log('🔍 카메라 블록 탐지 명령어 전송:', playerCommand);
                            }
                            return; // 일반 처리 로직 건너뛰기
                            
                        } catch (error) {
                            console.error('❌ 카메라 위치 처리 오류 (블록 탐지):', error);
                            // 오류 시에도 일반 처리 로직 건너뛰기
                            return;
                        }
                    }
                    
                    // 통합 함수로 최종 명령어 생성
                    const playerCommand = sendPlayerCommand(executingPlayer, finalCommand, '블록 탐지');
                    
                    if (playerCommand) {
                        // 블록 탐지 상태 설정
                        pendingBlockDetect = true;
                        blockDetectResponseCount = 0;
                        
                        // 명령어 피드백을 잠시 켜서 결과를 받을 수 있도록 함
                        send('gamerule sendcommandfeedback true');
                        setTimeout(() => {
                            send(playerCommand);
                            console.log('🔍 블록 탐지 명령어 전송:', playerCommand);
                        }, 50);
                    }
                });

                // 플레이어 위치 쿼리 함수
                function getPlayerPosition(playerName) {
                    return new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('플레이어 위치 쿼리 타임아웃'));
                        }, 3000);

                        const queryCommand = `querytarget "${playerName}"`;
                        console.log('📍 플레이어 위치 쿼리:', queryCommand);
                        
                        // 응답 대기를 위한 임시 이벤트 리스너
                        const responseHandler = (message) => {
                            try {
                                const data = JSON.parse(message);
                                if (data.header.messagePurpose === 'commandResponse' && 
                                    data.body.commandLine && data.body.commandLine.includes('querytarget')) {
                                    
                                    clearTimeout(timeout);
                                    socket.off('message', responseHandler);
                                    
                                    if (data.body.details && data.body.details.length > 0) {
                                        const player = data.body.details[0];
                                        console.log('✅ 플레이어 위치 수신:', player.position);
                                        resolve({
                                            x: Math.floor(player.position.x),
                                            y: Math.floor(player.position.y), 
                                            z: Math.floor(player.position.z)
                                        });
                                    } else {
                                        reject(new Error('플레이어 위치 정보 없음'));
                                    }
                                }
                            } catch (e) {
                                // JSON 파싱 오류는 무시 (다른 메시지일 수 있음)
                            }
                        };

                        socket.on('message', responseHandler);
                        send(queryCommand);
                    });
                }

                // 원 모양 생성 처리
                clientSocket.on("createCircle", async (data) => {
                    console.log('\n🔴 원 모양 생성 요청 수신');
                    console.log('  요청 데이터:', data);
                    
                    const { center, radius, direction, mode, blockType, executingPlayer } = data;
                    
                    if (!center || !radius || !direction || !mode || !blockType) {
                        console.error('❌ 원 생성 오류: 필수 데이터 누락', data);
                        return;
                    }
                    
                    const commands = [];
                    const r = parseInt(radius);
                    
                    // center는 이제 직접 객체로 전달됨
                    const centerPos = center;
                    
                    let cx, cy, cz, prefix;
                    
                    console.log('🔍 좌표 모드 확인:');
                    console.log('   centerPos.isAbsolute:', centerPos.isAbsolute);
                    console.log('   centerPos.isCamera:', centerPos.isCamera);
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
                        // 카메라 상대 위치 처리 확인
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            try {
                                console.log('📍 상대좌표 감지 - 플레이어 위치 쿼리 중...');
                                const playerPos = await getPlayerPosition(executingPlayer);
                                
                                cx = playerPos.x + centerPos.x;
                                cy = playerPos.y + centerPos.y;
                                cz = playerPos.z + centerPos.z;
                                prefix = ''; // 절대좌표로 변환되었으므로 prefix 없음
                                
                                console.log(`🎯 좌표 변환 완료:`);
                                console.log(`   플레이어 위치: (${playerPos.x}, ${playerPos.y}, ${playerPos.z})`);
                                console.log(`   상대 오프셋: (${centerPos.x}, ${centerPos.y}, ${centerPos.z})`);
                                console.log(`   절대 중심: (${cx}, ${cy}, ${cz})`);
                            } catch (error) {
                                console.error('❌ 플레이어 위치 쿼리 실패:', error.message);
                                // 실패 시 원래 상대좌표 사용
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';
                            }
                        }
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            cx = centerPos.x;
                            cy = centerPos.y;
                            cz = centerPos.z;
                            if (centerPos.isLocal || centerPos.isFacing) {
                                prefix = '^';  // 로컬/바라보는 방향: 정확한 시선 방향 (posLocal)
                            } else {
                                prefix = centerPos.isAbsolute === false ? '~' : '';
                            }
                        }
                    }
                    
                    // blockType에서 따옴표 제거 (JavaScript에서 전달될 때 따옴표가 포함될 수 있음)
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    
                    console.log(`📊 원 생성 정보:`);
                    console.log(`   중심: (${cx}, ${cy}, ${cz})`);
                    console.log(`   반지름: ${r}`);
                    console.log(`   방향: ${direction}`);
                    console.log(`   모드: ${mode}`);
                    console.log(`   블록: ${cleanBlockType}`);
                    
                    // 최적화된 원 생성 알고리즘 (대칭성 활용)
                    const quarterPoints = new Set();
                    
                    // 1/4 원만 계산 (0 <= x, y <= r)
                    for (let x = 0; x <= r; x++) {
                        for (let y = 0; y <= r; y++) {
                            const distance = Math.sqrt(x * x + y * y);
                            let shouldPlace = false;
                            
                            if (mode === 'fill') {
                                shouldPlace = distance <= r;
                            } else {
                                shouldPlace = Math.abs(distance - r) < 0.5; // 더 정밀한 기준
                            }
                            
                            if (shouldPlace) {
                                quarterPoints.add(`${x},${y}`);
                            }
                        }
                    }
                    
                    console.log(`🔄 1/4 원 점 수: ${quarterPoints.size}개`);
                    
                    // 1/4 원을 4개 사분면으로 대칭 확장
                    const points = new Set();
                    for (const pointStr of quarterPoints) {
                        const [x, y] = pointStr.split(',').map(Number);
                        
                        // 4개 사분면 대칭
                        const symmetries = [
                            [x, y],      // 1사분면
                            [-x, y],     // 2사분면
                            [-x, -y],    // 3사분면
                            [x, -y]      // 4사분면
                        ];
                        
                        for (const [symX, symY] of symmetries) {
                            let finalX, finalY, finalZ;
                            
                            // 방향에 따른 좌표 변환
                            if (direction === 'y') {
                                // Y축 평면 (수평면)
                                finalX = cx + symX;
                                finalY = cy;
                                finalZ = cz + symY;
                            } else if (direction === 'x') {
                                // X축 평면 (수직면)
                                finalX = cx;
                                finalY = cy + symX;
                                finalZ = cz + symY;
                            } else {
                                // Z축 평면 (수직면)
                                finalX = cx + symX;
                                finalY = cy + symY;
                                finalZ = cz;
                            }
                            
                            const command = `setblock ${prefix}${finalX} ${prefix}${finalY} ${prefix}${finalZ} ${cleanBlockType}`;
                            commands.push(command);
                        }
                    }
                    
                    console.log(`📦 생성된 블록 수: ${commands.length}개`);
                    
                    // 명령어들을 순차적으로 실행
                    for (let i = 0; i < commands.length; i++) {
                        const command = commands[i];
                        
                        // 통합 함수 사용
                        const finalCommand = sendPlayerCommand(executingPlayer, command, '원 생성');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        
                        // 서버 부하 방지를 위한 짧은 지연
                        if (i % 10 === 0 && i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                    
                    console.log('✅ 원 모양 생성 완료');
                });

                // 공 모양 생성 처리
                clientSocket.on("createSphere", async (data) => {
                    console.log('\n⚪ 공 모양 생성 요청 수신');
                    console.log('  요청 데이터:', data);
                    
                    const { center, radius, mode, blockType, executingPlayer } = data;
                    
                    if (!center || !radius || !mode || !blockType) {
                        console.error('❌ 구 생성 오류: 필수 데이터 누락', data);
                        return;
                    }
                    
                    const commands = [];
                    const r = parseInt(radius);
                    
                    // center는 직접 객체로 전달됨
                    const centerPos = center;
                    
                    let cx, cy, cz, prefix;
                    
                    console.log('🔍 좌표 모드 확인:');
                    console.log('   centerPos.isAbsolute:', centerPos.isAbsolute);
                    console.log('   centerPos.isCamera:', centerPos.isCamera);
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
                        // 카메라 상대 위치 처리 확인
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            try {
                                console.log('📍 상대좌표 감지 - 플레이어 위치 쿼리 중...');
                                const playerPos = await getPlayerPosition(executingPlayer);
                                
                                cx = playerPos.x + centerPos.x;
                                cy = playerPos.y + centerPos.y;
                                cz = playerPos.z + centerPos.z;
                                prefix = ''; // 절대좌표로 변환되었으므로 prefix 없음
                                
                                console.log(`🎯 좌표 변환 완료:`);
                                console.log(`   플레이어 위치: (${playerPos.x}, ${playerPos.y}, ${playerPos.z})`);
                                console.log(`   상대 오프셋: (${centerPos.x}, ${centerPos.y}, ${centerPos.z})`);
                                console.log(`   절대 중심: (${cx}, ${cy}, ${cz})`);
                            } catch (error) {
                                console.error('❌ 플레이어 위치 쿼리 실패:', error.message);
                                // 실패 시 원래 상대좌표 사용
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';
                            }
                        }
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            cx = centerPos.x;
                            cy = centerPos.y;
                            cz = centerPos.z;
                            if (centerPos.isLocal || centerPos.isFacing) {
                                prefix = '^';  // 로컬/바라보는 방향: 정확한 시선 방향 (posLocal)
                            } else {
                                prefix = centerPos.isAbsolute === false ? '~' : '';
                            }
                        }
                    }
                    
                    // blockType에서 따옴표 제거
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    
                    console.log(`📊 구 생성 정보:`);
                    console.log(`   중심: (${cx}, ${cy}, ${cz})`);
                    console.log(`   반지름: ${r}`);
                    console.log(`   모드: ${mode}`);
                    console.log(`   블록: ${cleanBlockType}`);
                    
                    // 최적화된 구 생성 알고리즘 (1/8 구 대칭성 활용)
                    const eighthPoints = new Set();
                    
                    // 1/8 구만 계산 (0 <= x, y, z <= r)
                    for (let x = 0; x <= r; x++) {
                        for (let y = 0; y <= r; y++) {
                            for (let z = 0; z <= r; z++) {
                                const distance = Math.sqrt(x * x + y * y + z * z);
                                let shouldPlace = false;
                                
                                if (mode === 'fill') {
                                    shouldPlace = distance <= r;
                                } else {
                                    shouldPlace = Math.abs(distance - r) < 0.5; // 구 표면
                                }
                                
                                if (shouldPlace) {
                                    eighthPoints.add(`${x},${y},${z}`);
                                }
                            }
                        }
                    }
                    
                    console.log(`🔄 1/8 구 점 수: ${eighthPoints.size}개`);
                    
                    // 1/8 구를 8개 팔분면으로 대칭 확장
                    const points = new Set();
                    for (const pointStr of eighthPoints) {
                        const [x, y, z] = pointStr.split(',').map(Number);
                        
                        // 8개 팔분면 대칭
                        const symmetries = [
                            [x, y, z],      // 1팔분면
                            [-x, y, z],     // 2팔분면
                            [-x, -y, z],    // 3팔분면
                            [x, -y, z],     // 4팔분면
                            [x, y, -z],     // 5팔분면
                            [-x, y, -z],    // 6팔분면
                            [-x, -y, -z],   // 7팔분면
                            [x, -y, -z]     // 8팔분면
                        ];
                        
                        for (const [symX, symY, symZ] of symmetries) {
                            const finalX = cx + symX;
                            const finalY = cy + symY;
                            const finalZ = cz + symZ;
                            
                            const command = `setblock ${prefix}${finalX} ${prefix}${finalY} ${prefix}${finalZ} ${cleanBlockType}`;
                            commands.push(command);
                        }
                    }
                    
                    console.log(`📦 생성된 블록 수: ${commands.length}개`);
                    
                    // 명령어들을 순차적으로 실행
                    for (let i = 0; i < commands.length; i++) {
                        const command = commands[i];
                        
                        // 통합 함수 사용
                        const finalCommand = sendPlayerCommand(executingPlayer, command, '구 생성');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        
                        // 서버 부하 방지를 위한 짧은 지연
                        if (i % 10 === 0 && i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                    
                    console.log('✅ 공 모양 생성 완료');
                });

                // 반구 모양 생성 처리
                clientSocket.on("createHemisphere", async (data) => {
                    console.log('\n🌗 반구 모양 생성 요청 수신');
                    console.log('  요청 데이터:', data);
                    
                    const { center, radius, axis, mode, blockType, executingPlayer } = data;
                    
                    if (!center || !radius || !axis || !mode || !blockType) {
                        console.error('❌ 반구 생성 오류: 필수 데이터 누락', data);
                        return;
                    }
                    
                    const commands = [];
                    const r = parseInt(radius);
                    
                    // center는 직접 객체로 전달됨
                    const centerPos = center;
                    
                    let cx, cy, cz, prefix;
                    
                    console.log('🔍 좌표 모드 확인:');
                    console.log('   centerPos.isAbsolute:', centerPos.isAbsolute);
                    console.log('   centerPos.isCamera:', centerPos.isCamera);
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
                        // 카메라 상대 위치 처리 확인
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            try {
                                console.log('📍 상대좌표 감지 - 플레이어 위치 쿼리 중...');
                                const playerPos = await getPlayerPosition(executingPlayer);
                                
                                cx = playerPos.x + centerPos.x;
                                cy = playerPos.y + centerPos.y;
                                cz = playerPos.z + centerPos.z;
                                prefix = ''; // 절대좌표로 변환되었으므로 prefix 없음
                                
                                console.log(`🎯 좌표 변환 완료:`);
                                console.log(`   플레이어 위치: (${playerPos.x}, ${playerPos.y}, ${playerPos.z})`);
                                console.log(`   상대 오프셋: (${centerPos.x}, ${centerPos.y}, ${centerPos.z})`);
                                console.log(`   절대 중심: (${cx}, ${cy}, ${cz})`);
                            } catch (error) {
                                console.error('❌ 플레이어 위치 쿼리 실패:', error.message);
                                // 실패 시 원래 상대좌표 사용
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';
                            }
                        }
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        if (centerPos.isCamera) {
                            console.log('   → 중심점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                            
                            try {
                                const playerDirection = await new Promise((resolve) => {
                                    const queryCommand = `querytarget "${executingPlayer}"`;
                                    console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                    
                                    const responseHandler = (message) => {
                                        try {
                                            const messageStr = message.toString();
                                            console.log('📍 방향 조회 응답:', messageStr);
                                            
                                            const jsonData = JSON.parse(messageStr);
                                            if (jsonData.body && jsonData.body.details) {
                                                const details = JSON.parse(jsonData.body.details);
                                                if (details && details[0] && details[0].yRot !== undefined) {
                                                    const yaw = parseFloat(details[0].yRot);
                                                    console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                    socket.off('message', responseHandler);
                                                    resolve(yaw);
                                                    return;
                                                }
                                            }
                                        } catch (error) {
                                            console.log('❌ 방향 조회 파싱 오류:', error.message);
                                        }
                                    };
                                    
                                    socket.on('message', responseHandler);
                                    
                                    setTimeout(() => {
                                        socket.off('message', responseHandler);
                                        console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                        resolve(0);
                                    }, 1000);
                                    
                                    send(queryCommand);
                                });
                                
                                // 카메라 좌표 변환 적용
                                const convertedCoords = convertCameraPosition(centerPos.x, centerPos.y, centerPos.z, playerDirection);
                                console.log('🎯 중심점 카메라 좌표 변환:', convertedCoords);
                                
                                cx = convertedCoords.x;
                                cy = convertedCoords.y;
                                cz = convertedCoords.z;
                                prefix = '~';  // 카메라 위치는 상대 좌표로 처리
                                
                            } catch (error) {
                                console.error('❌ 중심점 카메라 위치 처리 오류:', error);
                                cx = centerPos.x;
                                cy = centerPos.y;
                                cz = centerPos.z;
                                prefix = '~';  // 오류 시 상대 좌표로 처리
                            }
                        } else {
                            cx = centerPos.x;
                            cy = centerPos.y;
                            cz = centerPos.z;
                            if (centerPos.isLocal || centerPos.isFacing) {
                                prefix = '^';  // 로컬/바라보는 방향: 정확한 시선 방향 (posLocal)
                            } else {
                                prefix = centerPos.isAbsolute === false ? '~' : '';
                            }
                        }
                    }
                    
                    // blockType에서 따옴표 제거
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    
                    console.log(`📊 반구 생성 정보:`);
                    console.log(`   중심: (${cx}, ${cy}, ${cz})`);
                    console.log(`   반지름: ${r}`);
                    console.log(`   방향: ${axis}`);
                    console.log(`   모드: ${mode}`);
                    console.log(`   블록: ${cleanBlockType}`);
                    
                    // 최적화된 반구 생성 알고리즘 (1/4 반구 대칭성 활용)
                    const quarterPoints = new Set();
                    
                    // 1/4 반구만 계산 (0 <= x, y, z <= r)
                    for (let x = 0; x <= r; x++) {
                        for (let y = 0; y <= r; y++) {
                            for (let z = 0; z <= r; z++) {
                                const distance = Math.sqrt(x * x + y * y + z * z);
                                let shouldPlace = false;
                                
                                if (mode === 'fill') {
                                    shouldPlace = distance <= r;
                                } else {
                                    shouldPlace = Math.abs(distance - r) < 0.5; // 반구 표면
                                }
                                
                                if (shouldPlace) {
                                    quarterPoints.add(`${x},${y},${z}`);
                                }
                            }
                        }
                    }
                    
                    console.log(`🔄 1/4 반구 점 수: ${quarterPoints.size}개`);
                    
                    // 1/4 반구를 4개 사분면으로 대칭 확장
                    const points = new Set();
                    for (const pointStr of quarterPoints) {
                        const [x, y, z] = pointStr.split(',').map(Number);
                        
                        // 4개 사분면 대칭
                        const symmetries = [
                            [x, y, z],      // 1사분면
                            [-x, y, z],     // 2사분면
                            [-x, -y, z],    // 3사분면
                            [x, -y, z]      // 4사분면
                        ];
                        
                        for (const [symX, symY, symZ] of symmetries) {
                            let finalX, finalY, finalZ;
                            
                            // 선택된 축에 따라 좌표 변환
                            switch(axis) {
                                case "x":
                                    finalX = cx + symZ; // z를 x로
                                    finalY = cy + symY;
                                    finalZ = cz + symX; // x를 z로
                                    break;
                                case "-x":
                                    finalX = cx - symZ; // z를 -x로
                                    finalY = cy + symY;
                                    finalZ = cz + symX; // x를 z로
                                    break;
                                case "y":
                                    finalX = cx + symX;
                                    finalY = cy + symZ; // z를 y로
                                    finalZ = cz + symY; // y를 z로
                                    break;
                                case "-y":
                                    finalX = cx + symX;
                                    finalY = cy - symZ; // z를 -y로
                                    finalZ = cz + symY; // y를 z로
                                    break;
                                case "z":
                                    finalX = cx + symX;
                                    finalY = cy + symY;
                                    finalZ = cz + symZ;
                                    break;
                                case "-z":
                                    finalX = cx + symX;
                                    finalY = cy + symY;
                                    finalZ = cz - symZ;
                                    break;
                            }
                            
                            const command = `setblock ${prefix}${finalX} ${prefix}${finalY} ${prefix}${finalZ} ${cleanBlockType}`;
                            commands.push(command);
                        }
                    }
                    
                    console.log(`📦 생성된 블록 수: ${commands.length}개`);
                    
                    // 명령어들을 순차적으로 실행
                    for (let i = 0; i < commands.length; i++) {
                        const command = commands[i];
                        
                        // 통합 함수 사용
                        const finalCommand = sendPlayerCommand(executingPlayer, command, '반구 생성');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        
                        // 서버 부하 방지를 위한 짧은 지연
                        if (i % 10 === 0 && i > 0) {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                    }
                    
                    console.log('✅ 반구 모양 생성 완료');
                });

                // 선 모양 생성 처리
                clientSocket.on("createLine", async (data) => {
                    console.log('\n📏 선 모양 생성 요청 수신');
                    console.log('  요청 데이터:', data);
                    
                    const { start, end, blockType, executingPlayer } = data;
                    let startPos = start;
                    let endPos = end;
                    
                    // 카메라 상대 위치 처리 (시작점)
                    if (startPos.isCamera) {
                        console.log('   → 시작점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            // 카메라 좌표 변환 적용
                            const convertedStartCoords = convertCameraPosition(startPos.x, startPos.y, startPos.z, playerDirection);
                            console.log('🎯 시작점 카메라 좌표 변환:', convertedStartCoords);
                            
                            startPos = {
                                x: convertedStartCoords.x,
                                y: convertedStartCoords.y,
                                z: convertedStartCoords.z,
                                isAbsolute: false // 상대 좌표로 처리
                            };
                            
                        } catch (error) {
                            console.error('❌ 시작점 카메라 위치 처리 오류:', error);
                            startPos.isAbsolute = false; // 오류 시 상대 좌표로 처리
                        }
                    }
                    
                    // 카메라 상대 위치 처리 (끝점)
                    if (endPos.isCamera) {
                        console.log('   → 끝점 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            // 카메라 좌표 변환 적용
                            const convertedEndCoords = convertCameraPosition(endPos.x, endPos.y, endPos.z, playerDirection);
                            console.log('🎯 끝점 카메라 좌표 변환:', convertedEndCoords);
                            
                            endPos = {
                                x: convertedEndCoords.x,
                                y: convertedEndCoords.y,
                                z: convertedEndCoords.z,
                                isAbsolute: false // 상대 좌표로 처리
                            };
                            
                        } catch (error) {
                            console.error('❌ 끝점 카메라 위치 처리 오류:', error);
                            endPos.isAbsolute = false; // 오류 시 상대 좌표로 처리
                        }
                    }
                    
                    // 좌표 정리
                    let sx, sy, sz, ex, ey, ez;
                    let useRelativeCoords = false;
                    
                    // 상대/절대 좌표 여부 확인 (시작점이나 끝점 중 하나라도 상대좌표면 상대좌표 사용)
                    if (startPos.isAbsolute === false || startPos.isFacing || startPos.isLocal ||
                        endPos.isAbsolute === false || endPos.isFacing || endPos.isLocal) {
                        useRelativeCoords = true;
                    }
                    
                    // 시작점 좌표 처리
                    sx = Math.floor(startPos.x);
                    sy = Math.floor(startPos.y);
                    sz = Math.floor(startPos.z);
                    
                    // 끝점 좌표 처리
                    ex = Math.floor(endPos.x);
                    ey = Math.floor(endPos.y);
                    ez = Math.floor(endPos.z);
                    
                    // blockType에서 따옴표 제거
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    
                    console.log(`📊 선 생성 정보:`);
                    console.log(`   시작점: (${sx}, ${sy}, ${sz})`);
                    console.log(`   끝점: (${ex}, ${ey}, ${ez})`);
                    console.log(`   블록: ${cleanBlockType}`);
                    
                    // 선형 보간 알고리즘 (Linear Interpolation)
                    const dx = ex - sx;
                    const dy = ey - sy;
                    const dz = ez - sz;
                    
                    // 가장 긴 축의 거리를 구해서 보간 단계 수 결정
                    const maxDistance = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
                    const linePoints = [];
                    
                    // 시작점부터 끝점까지 균등하게 보간
                    for (let i = 0; i <= maxDistance; i++) {
                        const t = maxDistance === 0 ? 0 : i / maxDistance; // 보간 비율 (0 ~ 1)
                        
                        const x = Math.round(sx + t * dx);
                        const y = Math.round(sy + t * dy);
                        const z = Math.round(sz + t * dz);
                        
                        // 중복 좌표 제거 (연속된 같은 좌표 방지)
                        const lastPoint = linePoints[linePoints.length - 1];
                        if (!lastPoint || lastPoint.x !== x || lastPoint.y !== y || lastPoint.z !== z) {
                            linePoints.push({x, y, z});
                        }
                    }
                    
                    console.log(`📏 생성할 점의 개수: ${linePoints.length}`);
                    
                    // 각 점에 블록 설치
                    for (const point of linePoints) {
                        const prefix = useRelativeCoords ? '~' : '';
                        const setBlockCommand = `setblock ${prefix}${point.x} ${prefix}${point.y} ${prefix}${point.z} ${cleanBlockType}`;
                        console.log(`🟩 블록 설치: ${setBlockCommand}`);
                        
                        const finalCommand = sendPlayerCommand(executingPlayer, setBlockCommand, '선 생성');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms 지연
                    }
                    
                    console.log('✅ 선 모양 생성 완료');
                });

                // 플레이어 위치 조회 처리
                clientSocket.on("getPlayerPosition", async (data) => {
                    const playerName = data.player || 'Unknown';
                    
                    console.log('📍 플레이어 위치 조회 요청 수신');
                    console.log('  대상 플레이어:', playerName);
                    
                    if (playerName === 'Unknown') {
                        console.log('❌ 플레이어 정보가 없어 위치 조회 불가');
                        clientSocket.emit('playerPositionResult', { x: 0, y: 0, z: 0 });
                        return;
                    }
                    
                    try {
                        // querytarget 명령으로 플레이어 위치 조회
                        const command = `querytarget "${playerName}"`;
                        console.log('🔍 실행할 명령어:', command);
                        
                        // 결과를 받기 위한 임시 변수
                        let positionReceived = false;
                        
                        // 응답 리스너 설정 (임시)
                        const responseHandler = (message) => {
                            if (positionReceived) return;
                            
                            try {
                                const messageStr = message.toString();
                                console.log('📍 수신된 응답:', messageStr);
                                
                                // querytarget 응답에서 좌표 추출
                                // JSON 형식에서 position 데이터 추출
                                let posMatch = null;
                                
                                try {
                                    // JSON 응답인 경우
                                    const jsonData = JSON.parse(messageStr);
                                    if (jsonData.body && jsonData.body.details) {
                                        const details = JSON.parse(jsonData.body.details);
                                        if (details && details[0] && details[0].position) {
                                            const pos = details[0].position;
                                            posMatch = [null, pos.x, pos.y, pos.z];
                                        }
                                    }
                                } catch (e) {
                                    // JSON 파싱 실패 시 기존 정규식 사용
                                    posMatch = messageStr.match(/at\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);
                                }
                                
                                if (posMatch) {
                                    const x = Math.floor(parseFloat(posMatch[1]));
                                    const y = Math.floor(parseFloat(posMatch[2])) - 1; // 다리 위치로 조정
                                    const z = Math.floor(parseFloat(posMatch[3]));
                                    
                                    console.log('✅ 플레이어 위치 파싱 성공:', { x, y, z });
                                    clientSocket.emit('playerPositionResult', { x, y, z });
                                    positionReceived = true;
                                    
                                    // 리스너 제거
                                    socket.off('message', responseHandler);
                                }
                            } catch (error) {
                                console.error('❌ 위치 정보 파싱 오류:', error);
                            }
                        };
                        
                        // 임시 리스너 등록
                        socket.on('message', responseHandler);
                        
                        // 명령어 전송
                        send(command);
                        
                        // 3초 후 타임아웃
                        setTimeout(() => {
                            if (!positionReceived) {
                                console.log('⏰ 플레이어 위치 조회 타임아웃');
                                clientSocket.emit('playerPositionResult', { x: 0, y: 0, z: 0 });
                                socket.off('message', responseHandler);
                            }
                        }, 3000);
                        
                    } catch (error) {
                        console.error('❌ 플레이어 위치 조회 실패:', error);
                        clientSocket.emit('playerPositionResult', { x: 0, y: 0, z: 0 });
                    }
                });

                // 몹 소환 명령어 처리
                clientSocket.on("summon", async (data) => {
                    console.log('🔍 몹 소환 데이터 디버깅:');
                    console.log('   data:', JSON.stringify(data, null, 2));
                    
                    // 이전 호환성을 위한 처리
                    if (typeof data === 'string' || data.command) {
                        const command = typeof data === 'string' ? data : data.command;
                        const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                        
                        const finalCommand = sendPlayerCommand(executingPlayer, command, '몹 소환');
                        if (finalCommand) {
                            send(finalCommand);
                        }
                        return;
                    }
                    
                    // 새로운 위치 정보 처리
                    const { mobType, position, executingPlayer } = data;
                    let pos = position;
                    
                    // 카메라 상대 위치 처리
                    if (pos.isCamera) {
                        console.log('   → 카메라 상대 위치 처리 시작 - 플레이어 방향 조회 중...');
                        
                        try {
                            const playerDirection = await new Promise((resolve) => {
                                const queryCommand = `querytarget "${executingPlayer}"`;
                                console.log('🔍 플레이어 방향 조회 명령어:', queryCommand);
                                
                                const responseHandler = (message) => {
                                    try {
                                        const messageStr = message.toString();
                                        console.log('📍 방향 조회 응답:', messageStr);
                                        
                                        const jsonData = JSON.parse(messageStr);
                                        if (jsonData.body && jsonData.body.details) {
                                            const details = JSON.parse(jsonData.body.details);
                                            if (details && details[0] && details[0].yRot !== undefined) {
                                                const yaw = parseFloat(details[0].yRot);
                                                console.log('🧭 플레이어 방향 (yaw):', yaw);
                                                socket.off('message', responseHandler);
                                                resolve(yaw);
                                                return;
                                            }
                                        }
                                    } catch (error) {
                                        console.log('❌ 방향 조회 파싱 오류:', error.message);
                                    }
                                };
                                
                                socket.on('message', responseHandler);
                                
                                setTimeout(() => {
                                    socket.off('message', responseHandler);
                                    console.log('⏰ 방향 조회 타임아웃 - 기본값 0 사용');
                                    resolve(0);
                                }, 1000);
                                
                                send(queryCommand);
                            });
                            
                            // 카메라 좌표 변환 적용
                            const convertedCoords = convertCameraPosition(pos.x, pos.y, pos.z, playerDirection);
                            console.log('🎯 카메라 좌표 변환:', convertedCoords);
                            
                            pos = {
                                x: convertedCoords.x,
                                y: convertedCoords.y,
                                z: convertedCoords.z,
                                isAbsolute: false // 상대 좌표로 처리
                            };
                            
                        } catch (error) {
                            console.error('❌ 카메라 위치 처리 오류:', error);
                            pos.isAbsolute = false; // 오류 시 상대 좌표로 처리
                        }
                    }
                    
                    // 좌표 prefix 결정
                    const prefix = pos.isFacing ? '^' : (pos.isAbsolute ? '' : '~');
                    
                    // 몹 타입에서 따옴표 제거
                    const cleanMobType = mobType.replace(/['"]/g, '');
                    
                    // 명령어 생성
                    const command = `summon ${cleanMobType} ${prefix}${pos.x} ${prefix}${pos.y} ${prefix}${pos.z}`;
                    console.log('🐾 몹 소환 명령어:', command);
                    
                    // 통합 함수 사용
                    const finalCommand = sendPlayerCommand(executingPlayer, command, '몹 소환');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });
            });       


            // WebSocket 메시지 처리
            socket.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.header.eventName === 'PlayerMessage') {
                        const chatMessage = data.body.message.trim();
                        const playerName = data.body.sender || data.body.sourceName || data.body.playerName || 'Unknown';
                        console.log('\n=== 채팅 명령어 수신 ===');
                        console.log('실행 플레이어:', playerName);
                        console.log('수신된 명령어:', chatMessage);
                        
                        // 등록된 명령어 확인
                        const commandData = commandBlocks.get(chatMessage);
                        if (commandData) {
                            console.log('✅ 명령어 실행 시작');
                            console.log('------------------------');
                            send('gamerule sendcommandfeedback false');  // 명령어 피드백 끄기
                            send('closechat');  // 채팅창 닫기
                            // 플레이어 정보와 함께 명령어 실행
                            commandData.socket.emit('executeCommands', { 
                                blockId: commandData.blockId,
                                executingPlayer: playerName
                            });
                            setTimeout(() => {
                                send('gamerule sendcommandfeedback true');  // 명령어 피드백 다시 켜기
                            }, 100);
                        } else {
                            console.log('❌ 일치하는 명령어가 없습니다');
                        }
                        console.log('=========================\n');
                    }
                    
                    if (data.header.eventName === 'ItemAcquired') {
                        console.log('\n=== 아이템 획득 이벤트 수신 ===');
                        console.log('전체 이벤트 데이터:', JSON.stringify(data, null, 2));
                        
                        // 아이템 타입 추출 (ItemAcquired 이벤트 구조에 맞게)
                        let itemType = null;
                        if (data.body.item && data.body.item.id) {
                            itemType = data.body.item.id;
                        } else if (data.body.item && data.body.item.itemType) {
                            itemType = data.body.item.itemType;
                        } else if (data.body.itemType) {
                            itemType = data.body.itemType;
                        } else if (data.body.item && data.body.item.type) {
                            itemType = data.body.item.type;
                        } else if (data.body.item) {
                            itemType = data.body.item;
                        }
                        
                        console.log('획득한 아이템:', itemType);
                        
                        if (itemType) {
                            // 등록된 아이템 확인
                            const itemData = itemBlocks.get(itemType);
                            if (itemData) {
                                console.log('✅ 아이템 획득 코드 실행 시작');
                                console.log('------------------------');
                                itemData.socket.emit('executeItemCommands', itemData.blockId);
                            } else {
                                console.log('❌ 일치하는 아이템 코드가 없습니다');
                                console.log('등록된 아이템들:', Array.from(itemBlocks.keys()));
                            }
                        } else {
                            console.log('❌ 아이템 타입을 찾을 수 없습니다');
                        }
                        console.log('==========================\n');
                    }
                    
                    if (data.header.eventName === 'BlockPlaced') {
                        console.log('\n=== 블록 설치 이벤트 수신 ===');
                        console.log('전체 이벤트 데이터:', JSON.stringify(data, null, 2));
                        
                        // 블록 타입 추출 (BlockPlaced 이벤트 구조에 맞게)
                        let blockType = null;
                        if (data.body.block && data.body.block.id) {
                            blockType = data.body.block.id;
                        } else if (data.body.block && data.body.block.type) {
                            blockType = data.body.block.type;
                        } else if (data.body.blockType) {
                            blockType = data.body.blockType;
                        } else if (data.body.block) {
                            blockType = data.body.block;
                        }
                        
                        console.log('설치된 블록:', blockType);
                        
                        if (blockType) {
                            // 등록된 블록 확인
                            const blockData = blockPlacedBlocks.get(blockType);
                            if (blockData) {
                                console.log('✅ 블록 설치 코드 실행 시작');
                                console.log('------------------------');
                                blockData.socket.emit('executeBlockPlacedCommands', blockData.blockId);
                            } else {
                                console.log('❌ 일치하는 블록 설치 코드가 없습니다');
                                console.log('등록된 블록들:', Array.from(blockPlacedBlocks.keys()));
                            }
                        } else {
                            console.log('❌ 블록 타입을 찾을 수 없습니다');
                        }
                        console.log('==========================\n');
                    }
                    
                    if (data.header.eventName === 'BlockBroken') {
                        console.log('\n=== 블록 파괴 이벤트 수신 ===');
                        console.log('전체 이벤트 데이터:', JSON.stringify(data, null, 2));
                        
                        // 블록 타입 추출 (BlockBroken 이벤트 구조에 맞게)
                        let blockType = null;
                        if (data.body.block && data.body.block.id) {
                            blockType = data.body.block.id;
                        } else if (data.body.block && data.body.block.type) {
                            blockType = data.body.block.type;
                        } else if (data.body.blockType) {
                            blockType = data.body.blockType;
                        } else if (data.body.block) {
                            blockType = data.body.block;
                        }
                        
                        console.log('파괴된 블록:', blockType);
                        
                        if (blockType) {
                            // 등록된 블록 확인
                            const blockData = blockBrokenBlocks.get(blockType);
                            if (blockData) {
                                console.log('✅ 블록 파괴 코드 실행 시작');
                                console.log('------------------------');
                                blockData.socket.emit('executeBlockBrokenCommands', blockData.blockId);
                            } else {
                                console.log('❌ 일치하는 블록 파괴 코드가 없습니다');
                                console.log('등록된 블록들:', Array.from(blockBrokenBlocks.keys()));
                            }
                        } else {
                            console.log('❌ 블록 타입을 찾을 수 없습니다');
                        }
                        console.log('==========================\n');
                    }
                    
                    // 추가 아이템 관련 이벤트 처리
                    if (['PlayerInteract', 'ItemUsed', 'PlayerInteractWithEntity', 'ItemSelected'].includes(data.header.eventName)) {
                        console.log(`\n=== ${data.header.eventName} 이벤트 수신 ===`);
                        console.log('전체 이벤트 데이터:', JSON.stringify(data, null, 2));
                        console.log('===========================================\n');
                    }
                    
                    // 명령어 응답 처리 (블록 탐지 등)
                    if (data.header.messagePurpose === 'commandResponse') {
                        const statusCode = data.body.statusCode;
                        const success = statusCode === 0;
                        const commandLine = data.body.commandLine || '';
                        
                        console.log('🔍 명령어 응답 수신:');
                        console.log('  - 명령어:', commandLine);
                        console.log('  - 상태 코드:', statusCode);
                        console.log('  - 성공 여부:', success);
                        console.log('  - 블록 탐지 대기 중:', pendingBlockDetect);
                        
                        // 블록 탐지가 대기 중이고 명령어 응답이 온 경우
                        if (pendingBlockDetect) {
                            blockDetectResponseCount++;
                            console.log('🔍 응답 순서:', blockDetectResponseCount);
                            
                            // 상태 코드가 0이 아닌 경우가 실제 testforblock 응답
                            // (gamerule 명령어들은 모두 상태 코드 0)
                            if (statusCode !== 0) {
                                // testforblock 명령어의 실제 응답
                                // 상태 코드가 0이 아니면 블록이 없거나 다른 블록
                                const blockExists = false;
                                console.log('🔍 블록 탐지 최종 결과 (실패 코드):', blockExists ? '블록 존재' : '블록 없음');
                                console.log('🔍 상태 코드:', statusCode);
                                
                                // 결과 전송
                                io.emit('blockDetectResult', blockExists);
                                
                                // 블록 탐지 상태 리셋
                                pendingBlockDetect = false;
                                blockDetectResponseCount = 0;
                                
                                // 명령어 피드백 다시 끄기
                                setTimeout(() => {
                                    send('gamerule sendcommandfeedback false');
                                }, 100);
                            } else if (blockDetectResponseCount >= 5) {
                                // 너무 많은 응답이 왔는데도 0이 아닌 코드가 없으면 타임아웃
                                console.log('🔍 블록 탐지 타임아웃 - 블록 존재로 간주');
                                const blockExists = true; // 오류 코드가 없으면 성공으로 간주
                                
                                // 결과 전송
                                io.emit('blockDetectResult', blockExists);
                                
                                // 블록 탐지 상태 리셋
                                pendingBlockDetect = false;
                                blockDetectResponseCount = 0;
                                
                                // 명령어 피드백 다시 끄기
                                setTimeout(() => {
                                    send('gamerule sendcommandfeedback false');
                                }, 100);
                            } else {
                                console.log('🔍 gamerule 응답으로 추정, testforblock 응답 대기 중...');
                            }
                        }
                    }
                } catch (error) {
                    console.error('메시지 처리 중 오류:', error);
                }
            });

            function send(command) {
                const msg = {
                    header: {
                        version: 1,
                        requestId: uuid.v4(),
                        messagePurpose: 'commandRequest',
                        messageType: 'commandRequest'
                    },
                    body: {
                        version: 1,
                        commandLine: command,
                        origin: {
                            type: 'player'
                        }
                    }
                };

                switch(command) {
                    case 'agent move forward':
                        console.log('🔵 앞으로 이동');
                        break;
                    case 'agent move back':
                        console.log('🔵 뒤로 이동');
                        break;
                    case 'agent move up':
                        console.log('🔵 위로 이동');
                        break;
                    case 'agent move down':
                        console.log('🔵 아래로 이동');
                        break;
                    case 'agent move left':
                        console.log('🔵 왼쪽으로 이동');
                        break;
                    case 'agent move right':
                        console.log('🔵 오른쪽으로 이동');
                        break;
                    case 'agent turn left':
                        console.log('🔄 왼쪽으로 회전');
                        break;
                    case 'agent turn right':
                        console.log('🔄 오른쪽으로 회전');
                        break;
                    case 'agent create':
                        console.log('✨ 에이전트 생성');
                        break;
                    case 'agent tp':
                        console.log('💫 에이전트 텔레포트');
                        break;
                    case 'agent destroy forward':
                        console.log('💥 블록 파괴');
                        break;
                    case 'agent attack forward':
                        console.log('⚔️ 공격');
                        break;
                    default:
                        console.log('실행:', command);
                }

                socket.send(JSON.stringify(msg));
            }
            


            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "subscribe"
                },
                "body": {
                    "eventName": "PlayerMessage"
                }
            }));

            // ItemAcquired 이벤트 구독 (아이템 획득)
            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "subscribe"
                },
                "body": {
                    "eventName": "ItemAcquired"
                }
            }));

            // BlockPlaced 이벤트 구독 (블록 설치)
            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "subscribe"
                },
                "body": {
                    "eventName": "BlockPlaced"
                }
            }));

            // BlockBroken 이벤트 구독 (블록 파괴)
            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),
                    "messageType": "commandRequest",
                    "messagePurpose": "subscribe"
                },
                "body": {
                    "eventName": "BlockBroken"
                }
            }));

            // 추가 이벤트들 구독 (아이템 관련)
            const additionalEvents = ['PlayerInteract', 'ItemUsed', 'PlayerInteractWithEntity', 'ItemSelected', 'ItemDropped', 'ItemCrafted'];
            additionalEvents.forEach(eventName => {
                socket.send(JSON.stringify({
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
            });

            socket.on("close", () => {
                // 마인크래프트 연결 상태 업데이트
                minecraftConnected = false;
                
                figlet('Connection', function (err, data) {
                    if (err) {
                        console.log('Error generating ASCII art'.red);
                        console.log(err);
                        process.exit(1);
                    }
                    console.clear();
                    console.log(data.red);
                    figlet('Disconnected', function (err, data) {
                        if (err) {
                            console.log('Error generating ASCII art'.red);
                            console.log(err);
                            process.exit(1);
                        }
                        console.log(data.red);
                        process.exit(0);
                    });
                });
            })
        });
    });
}

// 전역 에러 핸들링
process.on('uncaughtException', (error) => {
    console.error('❌ 치명적 오류 발생:', error);
    console.log('프로그램을 종료합니다. 아무 키나 눌러주세요...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 처리되지 않은 Promise 거부:', reason);
    console.log('프로그램을 종료합니다. 아무 키나 눌러주세요...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
});

// 프로그램 시작
console.log('🚀 Bedrock CodeBuilder 시작 중...');
start().catch(error => {
    console.error('❌ 시작 중 오류 발생:', error);
    console.log('아무 키나 눌러 종료하세요...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => process.exit(1));
});