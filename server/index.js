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
    const wsPort = await findAvailablePort(3000, 3010);
    if (!wsPort) {
        console.log('사용 가능한 WebSocket 포트를 찾을 수 없습니다.');
        process.exit(1);
    }
    const expressPort = await findAvailablePort(4000, 4010);
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
                clientSocket.on("say", (message) => {
                    send(`tellraw @a {"rawtext":[{"text":"<"},{"selector":"@s"},{"text":"> ${message}"}]}`);
                    console.log('💬 채팅: ' + message);
                });

                // 블록 설치 명령어 처리
                clientSocket.on("setblock", (data) => {
                    const tilde = data.isAbsolute ? '' : '~';
                    send(`setblock ${tilde}${data.x} ${tilde}${data.y} ${tilde}${data.z} ${data.blockType}`);
                    console.log(`🏗️ 블록 설치: ${tilde}${data.x} ${tilde}${data.y} ${tilde}${data.z}, 종류: ${data.blockType}`);
                });

                // 블록 채우기 명령어 처리
                clientSocket.on("fill", (command) => {
                    send(command);
                    console.log('🏗️ 블록 채우기:', command);
                });

                // 블록 탐지 명령어 처리
                clientSocket.on("blockDetect", (data) => {
                    console.log('🔍 블록 탐지 요청:', data.command);
                    
                    // 블록 탐지 상태 설정
                    pendingBlockDetect = true;
                    blockDetectResponseCount = 0;
                    
                    // 명령어 피드백을 잠시 켜서 결과를 받을 수 있도록 함
                    send('gamerule sendcommandfeedback true');
                    setTimeout(() => {
                        send(data.command);
                        console.log('🔍 블록 탐지 명령어 전송:', data.command);
                    }, 50);
                });

                // 몹 소환 명령어 처리
                clientSocket.on("summon", (command) => {
                    send(command);
                    console.log('👹 몹 소환:', command);
                });
            });       


            // WebSocket 메시지 처리
            socket.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.header.eventName === 'PlayerMessage') {
                        const chatMessage = data.body.message.trim();
                        console.log('\n=== 채팅 명령어 수신 ===');
                        console.log('수신된 명령어:', chatMessage);
                        
                        // 등록된 명령어 확인
                        const commandData = commandBlocks.get(chatMessage);
                        if (commandData) {
                            console.log('✅ 명령어 실행 시작');
                            console.log('------------------------');
                            send('gamerule sendcommandfeedback false');  // 명령어 피드백 끄기
                            send('closechat');  // 채팅창 닫기
                            commandData.socket.emit('executeCommands', commandData.blockId);
                            setTimeout(() => {
                                send('gamerule sendcommandfeedback true');  // 명령어 피드백 다시 켜기
                            }, 100);
                        } else {
                            console.log('❌ 일치하는 명령어가 없습니다');
                        }
                        console.log('=========================\n');
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