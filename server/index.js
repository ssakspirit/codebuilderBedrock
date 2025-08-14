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
        console.clear();
        console.log(data.green);
        console.log(`Minecraft Bedrock CodeBuilder created by SteveCoding`);
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

        // WebSocket 서버 실행
        const wss = new WebSocket.Server({ port: wsPort });

        wss.on('connection', async socket => {
            // Express 포트가 사용 중인지 재확인 (사실상 위에서 이미 확인함)
            // 바로 서버 실행
            const server = http.createServer(app);
            const io = new Server(server, {
                cors: {
                    origin: `http://localhost:${wsPort}`,
                    methods: ["GET", "POST"]
                }
            });

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

                clientSocket.on("tpPos", (data) => {
                    // 방향에 따른 facing 좌표 설정
                    let facingCoord;
                    switch(data.facing) {
                        case 'north': facingCoord = '~ ~ ~-1'; break;
                        case 'south': facingCoord = '~ ~ ~1'; break;
                        case 'east': facingCoord = '~1 ~ ~'; break;
                        case 'west': facingCoord = '~-1 ~ ~'; break;
                    }
                    
                    // 절대좌표인 경우 ~ 기호를 제거
                    const tilde = data.isAbsolute ? '' : '~';
                    send(`agent tp ${tilde}${data.x} ${tilde}${data.y} ${tilde}${data.z} facing ${facingCoord}`);
                    console.log(`🎯 ${data.isAbsolute ? '절대' : '상대'}좌표 이동: ${tilde}${data.x} ${tilde}${data.y} ${tilde}${data.z}, 방향: ${data.facing}`);
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

                // 블록 설치 명령어 처리
                clientSocket.on("setblock", (data) => {
                    const prefix = data.isFacing ? '^' : (data.isAbsolute ? '' : '~');
                    const command = `setblock ${prefix}${data.x} ${prefix}${data.y} ${prefix}${data.z} ${data.blockType}`;
                    
                    // 통합 함수 사용
                    const finalCommand = sendPlayerCommand(data.executingPlayer, command, '블록 설치');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 블록 채우기 명령어 처리
                clientSocket.on("fill", (data) => {
                    const command = typeof data === 'string' ? data : data.command;
                    const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                    
                    // 통합 함수 사용
                    const finalCommand = sendPlayerCommand(executingPlayer, command, '블록 채우기');
                    if (finalCommand) {
                        send(finalCommand);
                    }
                });

                // 블록 탐지 명령어 처리
                clientSocket.on("blockDetect", (data) => {
                    const command = data.command;
                    const executingPlayer = data.executingPlayer;
                    
                    // 통합 함수로 최종 명령어 생성
                    const finalCommand = sendPlayerCommand(executingPlayer, command, '블록 탐지');
                    
                    if (finalCommand) {
                        // 블록 탐지 상태 설정
                        pendingBlockDetect = true;
                        blockDetectResponseCount = 0;
                        
                        // 명령어 피드백을 잠시 켜서 결과를 받을 수 있도록 함
                        send('gamerule sendcommandfeedback true');
                        setTimeout(() => {
                            send(finalCommand);
                            console.log('🔍 블록 탐지 명령어 전송:', finalCommand);
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
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
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
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        cx = centerPos.x;
                        cy = centerPos.y;
                        cz = centerPos.z;
                        prefix = centerPos.isAbsolute === false ? '~' : '';
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
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
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
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        cx = centerPos.x;
                        cy = centerPos.y;
                        cz = centerPos.z;
                        prefix = centerPos.isAbsolute === false ? '~' : '';
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
                    console.log('   executingPlayer:', executingPlayer);
                    console.log('   조건 검사:', centerPos.isAbsolute === false, executingPlayer && executingPlayer !== 'Unknown');
                    
                    // 상대좌표인 경우 플레이어 위치를 기준으로 절대좌표로 변환
                    if (centerPos.isAbsolute === false && executingPlayer && executingPlayer !== 'Unknown') {
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
                    } else {
                        // 절대좌표인 경우 그대로 사용
                        cx = centerPos.x;
                        cy = centerPos.y;
                        cz = centerPos.z;
                        prefix = centerPos.isAbsolute === false ? '~' : '';
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
                    const startPos = start;
                    const endPos = end;
                    
                    // 좌표 정리
                    let sx, sy, sz, ex, ey, ez;
                    let prefix = '';
                    
                    // 시작점 좌표 처리 (절대좌표로 가정)
                    sx = Math.floor(startPos.x);
                    sy = Math.floor(startPos.y);
                    sz = Math.floor(startPos.z);
                    
                    // 끝점 좌표 처리 (절대좌표로 가정)
                    ex = Math.floor(endPos.x);
                    ey = Math.floor(endPos.y);
                    ez = Math.floor(endPos.z);
                    
                    // blockType에서 따옴표 제거
                    const cleanBlockType = blockType.replace(/['"]/g, '');
                    
                    console.log(`📊 선 생성 정보:`);
                    console.log(`   시작점: (${sx}, ${sy}, ${sz})`);
                    console.log(`   끝점: (${ex}, ${ey}, ${ez})`);
                    console.log(`   블록: ${cleanBlockType}`);
                    
                    // 3D 브레즌햄 선 알고리즘 (Bresenham's Line Algorithm 3D)
                    const dx = Math.abs(ex - sx);
                    const dy = Math.abs(ey - sy);
                    const dz = Math.abs(ez - sz);
                    
                    const x_inc = (ex >= sx) ? 1 : -1;
                    const y_inc = (ey >= sy) ? 1 : -1;
                    const z_inc = (ez >= sz) ? 1 : -1;
                    
                    const err_1 = dx - dy;
                    const err_2 = dx - dz;
                    const err_3 = dy - dz;
                    
                    let x = sx, y = sy, z = sz;
                    const dx2 = dx * 2;
                    const dy2 = dy * 2;
                    const dz2 = dz * 2;
                    
                    const linePoints = [];
                    
                    // 주 축에 따른 선 그리기
                    if (dx >= dy && dx >= dz) {
                        // x축이 주 축
                        let err_xy = dx - dy;
                        let err_xz = dx - dz;
                        
                        for (let i = 0; i < dx; i++) {
                            linePoints.push({x, y, z});
                            
                            if (err_xy > 0) {
                                if (err_xz > 0) {
                                    x += x_inc;
                                    err_xy -= dy2;
                                    err_xz -= dz2;
                                } else {
                                    z += z_inc;
                                    err_xy -= dy2;
                                    err_xz += dx2;
                                }
                            } else {
                                if (err_xz > 0) {
                                    y += y_inc;
                                    err_xy += dx2;
                                    err_xz -= dz2;
                                } else if (err_xy > err_xz) {
                                    y += y_inc;
                                    err_xy += dx2;
                                    err_xz += dx2;
                                } else {
                                    z += z_inc;
                                    err_xy += dx2;
                                    err_xz += dx2;
                                }
                            }
                        }
                    } else if (dy >= dx && dy >= dz) {
                        // y축이 주 축
                        let err_yx = dy - dx;
                        let err_yz = dy - dz;
                        
                        for (let i = 0; i < dy; i++) {
                            linePoints.push({x, y, z});
                            
                            if (err_yx > 0) {
                                if (err_yz > 0) {
                                    y += y_inc;
                                    err_yx -= dx2;
                                    err_yz -= dz2;
                                } else {
                                    z += z_inc;
                                    err_yx -= dx2;
                                    err_yz += dy2;
                                }
                            } else {
                                if (err_yz > 0) {
                                    x += x_inc;
                                    err_yx += dy2;
                                    err_yz -= dz2;
                                } else if (err_yx > err_yz) {
                                    x += x_inc;
                                    err_yx += dy2;
                                    err_yz += dy2;
                                } else {
                                    z += z_inc;
                                    err_yx += dy2;
                                    err_yz += dy2;
                                }
                            }
                        }
                    } else {
                        // z축이 주 축
                        let err_zx = dz - dx;
                        let err_zy = dz - dy;
                        
                        for (let i = 0; i < dz; i++) {
                            linePoints.push({x, y, z});
                            
                            if (err_zx > 0) {
                                if (err_zy > 0) {
                                    z += z_inc;
                                    err_zx -= dx2;
                                    err_zy -= dy2;
                                } else {
                                    y += y_inc;
                                    err_zx -= dx2;
                                    err_zy += dz2;
                                }
                            } else {
                                if (err_zy > 0) {
                                    x += x_inc;
                                    err_zx += dz2;
                                    err_zy -= dy2;
                                } else if (err_zx > err_zy) {
                                    x += x_inc;
                                    err_zx += dz2;
                                    err_zy += dz2;
                                } else {
                                    y += y_inc;
                                    err_zx += dz2;
                                    err_zy += dz2;
                                }
                            }
                        }
                    }
                    
                    // 끝점도 추가
                    linePoints.push({x: ex, y: ey, z: ez});
                    
                    console.log(`📏 생성할 점의 개수: ${linePoints.length}`);
                    
                    // 각 점에 블록 설치
                    for (const point of linePoints) {
                        const setBlockCommand = `setblock ${point.x} ${point.y} ${point.z} ${cleanBlockType}`;
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
                clientSocket.on("summon", (data) => {
                    const command = typeof data === 'string' ? data : data.command;
                    const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
                    
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
            
            // pkg로 빌드된 환경에서 정적 파일을 임시 폴더에 복사하는 함수
            function extractAssetsIfNeeded() {
                if (process.pkg) {
                    const base = path.dirname(process.execPath);
                    const tmpDir = path.join(os.tmpdir(), 'bedrock-agent-static');
                    // 복사할 폴더 목록
                    const folders = ['client', 'blocks', 'shared', 'public'];
                    folders.forEach(folder => {
                        const src = path.join(base, folder);
                        const dest = path.join(tmpDir, folder);
                        if (!fse.existsSync(dest)) {
                            fse.copySync(src, dest);
                        }
                    });
                    return tmpDir;
                } else {
                    return path.join(__dirname, '..');
                }
            }

            // 정적 파일 경로를 임시 폴더로 보정
            const staticBase = extractAssetsIfNeeded();
            app.use(express.static(path.join(staticBase, 'client')));
            app.use('/shared', express.static(path.join(staticBase, 'shared')));
            app.use('/blocks', express.static(path.join(staticBase, 'blocks')));
            app.get('/', (req, res) => {
                res.sendFile(path.join(staticBase, 'client', 'index.html'));
            });

            // Express 서버 실행
            server.listen(expressPort, () => {
                figlet('SteveCoding', function (err, data) {
                    if (err) {
                        console.log('Error generating ASCII art'.red);
                        console.log(err);
                        process.exit(1);
                    }
                    console.clear();
                    console.log(data.green);
                    console.log(`만약 웹사이트가 자동으로 접속이 안될경우 "http://localhost:${expressPort}"에 접속하세요.`);
                });
            });

            // 웹 브라우저 자동 실행
            exec(`start http://localhost:${expressPort}`);

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