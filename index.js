const WSPort = 3000;
const ExpressPort = 3001;

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
    if (await portCheck(WSPort)) {
        figlet('Error', function (err, data) {
            if (err) {
                console.log('Error generating ASCII art'.red);
                console.log(err);
                process.exit(1);
            }
            console.log(data.red);
            console.log(`${WSPort}는 이미 사용중입니다.`.red);
            process.exit(1);
        });
    } else {
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
            const command = `/connect localhost:${WSPort}`;
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

            const wss = new WebSocket.Server({ port: WSPort });

            wss.on('connection', async socket => {
                if (await portCheck(ExpressPort)) {
                    figlet('Error', function (err, data) {
                        if (err) {
                            console.log('Error generating ASCII art'.red);
                            console.log(err);
                            process.exit(1);
                        }
                        console.clear();
                        console.log(data.red);
                        console.log(`${ExpressPort}는 이미 사용중입니다.`.red);
                        process.exit(1);
                    });
                }

                const server = http.createServer(app);
                const io = new Server(server, {
                    cors: {
                        origin: `http://localhost:${WSPort}`,
                        methods: ["GET", "POST"]
                    }
                });

                let minecraftSlot = 1;
                let commandBlocks = new Map();

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
                
                // 정적 파일 서비스 설정
                app.use(express.static(path.join(__dirname)));

                // 메인 페이지 라우트
                app.get('/', (req, res) => {
                    res.sendFile(path.join(__dirname, 'index.html'));
                });

                server.listen(ExpressPort, () => {
                    figlet('SteveCoding', function (err, data) {
                        if (err) {
                            console.log('Error generating ASCII art'.red);
                            console.log(err);
                            process.exit(1);
                        }
                        console.clear();
                        console.log(data.green);
                        console.log(`만약 웹사이트가 자동으로 접속이 안될경우 "http://localhost:${ExpressPort}"에 접속하세요.`);
                    });
                });

                exec(`start http://localhost:${ExpressPort}`);

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
}