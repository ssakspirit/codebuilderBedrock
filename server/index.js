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
const fs = require('fs');
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
        const wsPort = await findAvailablePort(3000, 3050);
        const expressPort = await findAvailablePort(4000, 4050);

        if (!wsPort || !expressPort) {
            console.error('❌ 사용 가능한 포트를 찾을 수 없습니다.');
            process.exit(1);
        }

        console.log(`🌐 WebSocket 포트: ${wsPort}`);
        console.log(`🚀 Express 포트: ${expressPort}`);

        // Express 앱 설정
        const app = express();
        setupExpressApp(app, wsPort, expressPort);

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
        socketIOServer.setManagers(commandManager, eventHandlers, webSocketServer);
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
 * @param {number} wsPort - WebSocket 포트
 * @param {number} expressPort - Express 포트
 */
function setupExpressApp(app, wsPort = 3000, expressPort = 4000) {
    // 정적 파일 서빙
    app.use(express.static(path.join(__dirname, '../client')));
    app.use('/shared', express.static(path.join(__dirname, '../shared')));

    // 라우트 설정
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    });

    app.get('/admin', (req, res) => {
        try {
            const filePath = path.join(__dirname, '..', 'public', 'admin.html');
            console.log('🔍 admin.html 경로:', filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            res.set('Content-Type', 'text/html');
            res.send(content);
        } catch (error) {
            console.error('❌ admin.html 로드 실패:', error);
            res.status(404).send('관리자 페이지를 찾을 수 없습니다.');
        }
    });

    // API 라우트들
    app.get('/api/status', (req, res) => {
        res.json({
            wsPort: wsPort,
            webPort: expressPort,
            timestamp: new Date().toISOString(),
            status: 'running',
            minecraftConnected: minecraftConnected
        });
    });

    app.post('/api/network-setup', (req, res) => {
        const { spawn } = require('child_process');

        console.log('🔧 네트워크 설정 시작...');

        // 관리자 권한으로 CheckNetIsolation 명령 실행
        const setupProcess = spawn('powershell', [
            '-Command',
            'Start-Process', 'cmd',
            '-ArgumentList', '"/c CheckNetIsolation LoopbackExempt -a -n=Microsoft.MinecraftUWP_8wekyb3d8bbwe & pause"',
            '-Verb', 'RunAs'
        ], { stdio: 'pipe' });

        setupProcess.on('error', (error) => {
            console.error('❌ 네트워크 설정 실패:', error.message);
            res.json({
                success: false,
                message: '네트워크 설정에 실패했습니다. 관리자 권한이 필요합니다.',
                error: error.message
            });
        });

        setupProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ 네트워크 설정 완료');
                res.json({
                    success: true,
                    message: '네트워크 설정이 완료되었습니다.'
                });
            } else {
                console.error('❌ 네트워크 설정 실패, 종료 코드:', code);
                res.json({
                    success: false,
                    message: '네트워크 설정에 실패했습니다.',
                    error: `Process exited with code ${code}`
                });
            }
        });
    });
}


// 서버 시작
startServer().catch(error => {
    console.error('💥 서버 시작 실패:', error);
    process.exit(1);
});