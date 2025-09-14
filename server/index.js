console.log('🔥🔥🔥 프로그램 파일 로딩 시작!');

// 모듈 로딩
const { SOCKET_EVENTS, PORTS } = require('../shared/constants');
const { CommandData, Position } = require('../shared/types');
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const http = require('http');
const ncp = require('copy-paste');
const fse = require('fs-extra');
const os = require('os');

// 커스텀 모듈 로딩
const { findAvailablePort } = require('./modules/portManager');
const Logger = require('./utils/logger');
const CommandManager = require('./modules/commandManager');
const EventHandlers = require('./modules/eventHandlers');
const SocketIOServer = require('./modules/socketioServer');
const WebSocketServer = require('./modules/websocketServer');

console.log('🎉 모든 모듈 로딩 완료!');

// 전역 상태
let minecraftConnected = false;

/**
 * 메인 서버 시작 함수
 */
async function startServer() {
    try {
        // ASCII 아트 출력
        await Logger.printTitle('Bedrock CodeBuilder', 'green');

        // 사용 가능한 포트 찾기
        const wsPort = await findAvailablePort(PORTS.WS_START, PORTS.WS_END);
        const expressPort = await findAvailablePort(PORTS.EXPRESS_START, PORTS.EXPRESS_END);

        if (!wsPort || !expressPort) {
            console.error('❌ 사용 가능한 포트를 찾을 수 없습니다.');
            process.exit(1);
        }

        console.log(`🌐 WebSocket 포트: ${wsPort}`);
        console.log(`🚀 Express 포트: ${expressPort}`);

        // Express 앱 설정
        const app = express();
        setupExpressApp(app);

        // 네트워크 설정 확인 및 설정
        await setupNetworkSettings();

        // HTTP 서버 생성
        const server = http.createServer(app);

        // Socket.IO 서버 생성
        const socketIOServer = new SocketIOServer(server, wsPort);

        // 명령어 관리자 생성
        const commandManager = new CommandManager();

        // WebSocket 서버 생성 (마인크래프트 연결용)
        const webSocketServer = new WebSocketServer(wsPort);

        // 이벤트 핸들러 생성
        const eventHandlers = new EventHandlers(commandManager, (cmd) => {
            webSocketServer.send(cmd);
        });

        // 의존성 연결
        socketIOServer.setManagers(commandManager, eventHandlers);
        webSocketServer.setHandlers(eventHandlers, socketIOServer);

        // Socket.IO 이벤트 리스너 설정
        socketIOServer.setupEventListeners();

        // Express 서버 시작
        server.listen(expressPort, () => {
            Logger.logServerStart(wsPort, expressPort);

            // 클립보드에 연결 명령어 복사
            const command = `/connect localhost:${wsPort}`;
            ncp.copy(command, () => {
                Logger.logMinecraftConnection(command);
            });

            // 관리자 페이지 자동 실행
            exec(`start http://localhost:${expressPort}/admin`);
        });

        // WebSocket 서버 시작
        webSocketServer.start();

        // 마인크래프트 연결 시 블록 코딩 페이지 자동 실행
        webSocketServer.wss.on('connection', () => {
            minecraftConnected = true;
            exec(`start http://localhost:${expressPort}`);
        });

        console.log('✅ 서버가 성공적으로 시작되었습니다!');

    } catch (error) {
        console.error('❌ 서버 시작 중 오류 발생:', error);
        process.exit(1);
    }
}

/**
 * Express 애플리케이션 설정
 * @param {Express} app - Express 앱 인스턴스
 */
function setupExpressApp(app) {
    // 정적 파일 서빙
    app.use(express.static(path.join(__dirname, '../client')));
    app.use('/shared', express.static(path.join(__dirname, '../shared')));

    // 라우트 설정
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    });

    app.get('/admin', (req, res) => {
        const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bedrock CodeBuilder - 관리자</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; text-align: center; }
                .status { padding: 20px; margin: 20px 0; border-radius: 5px; }
                .connected { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                .disconnected { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
                .info { background-color: #e2e3e5; border: 1px solid #d6d8db; color: #383d41; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
                .button:hover { background-color: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 Bedrock CodeBuilder 관리자</h1>
                <div class="status ${minecraftConnected ? 'connected' : 'disconnected'}">
                    <h3>${minecraftConnected ? '✅ 마인크래프트 연결됨' : '❌ 마인크래프트 연결 안됨'}</h3>
                    <p>${minecraftConnected ? '마인크래프트가 성공적으로 연결되어 있습니다.' : '마인크래프트 연결을 기다리고 있습니다.'}</p>
                </div>
                <div class="info">
                    <h3>📋 연결 방법</h3>
                    <p>1. 마인크래프트를 실행하고 채팅창을 엽니다 (T키)</p>
                    <p>2. 아래 명령어를 입력하세요: <code>/connect localhost:${findAvailablePort ? 'PORT' : 'PORT_UNKNOWN'}</code></p>
                    <p>3. 연결에 실패하면 <strong>setup.bat</strong>을 관리자 권한으로 실행하세요</p>
                </div>
                <div class="info">
                    <h3>🔧 바로가기</h3>
                    <button class="button" onclick="window.open('/', '_blank')">블록 코딩 페이지 열기</button>
                    <button class="button" onclick="location.reload()">페이지 새로고침</button>
                </div>
            </div>
        </body>
        </html>`;
        res.send(adminHtml);
    });
}

/**
 * 네트워크 설정 확인 및 구성
 */
async function setupNetworkSettings() {
    return new Promise((resolve) => {
        // 네트워크 설정 확인
        exec('CheckNetIsolation LoopbackExempt -s', (error, stdout) => {
            if (error || !stdout.includes('Microsoft.MinecraftUWP_8wekyb3d8bbwe')) {
                console.log('⚠️ 네트워크 설정이 필요합니다. setup.bat를 실행 중...');

                // 자동으로 setup.bat 실행 시도
                exec('powershell -Command "Start-Process setup.bat -Verb RunAs"', (setupError) => {
                    if (setupError) {
                        console.log('❌ 자동 설정 실패. 수동으로 setup.bat을 실행해주세요.');
                    } else {
                        console.log('✅ 네트워크 설정 창이 열렸습니다.');
                    }
                });
            } else {
                console.log('✅ 네트워크 설정이 올바르게 구성되어 있습니다.');
            }

            setTimeout(resolve, 1000);
        });
    });
}

// 서버 시작
startServer().catch(error => {
    console.error('💥 서버 시작 실패:', error);
    process.exit(1);
});