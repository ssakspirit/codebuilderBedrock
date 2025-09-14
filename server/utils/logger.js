const colors = require('colors');
const figlet = require('figlet');

/**
 * 로깅 유틸리티 클래스
 */
class Logger {
    /**
     * ASCII 아트 타이틀 출력
     * @param {string} text - 출력할 텍스트
     * @param {string} color - 색상 (기본값: green)
     */
    static async printTitle(text, color = 'green') {
        return new Promise((resolve, reject) => {
            figlet(text, (err, data) => {
                if (err) {
                    console.log('🔥 ASCII 아트 생성 실패');
                    console.dir(err);
                    reject(err);
                    return;
                }
                console.log(data[color]);
                resolve(data);
            });
        });
    }

    /**
     * 모듈 로딩 상태 출력
     * @param {string} moduleName - 모듈 이름
     * @param {boolean} success - 성공 여부
     */
    static logModuleLoad(moduleName, success = true) {
        const status = success ? '✅' : '❌';
        console.log(`${status} ${moduleName} 로딩 ${success ? '완료' : '실패'}`);
    }

    /**
     * 서버 시작 정보 출력
     * @param {number} wsPort - WebSocket 포트
     * @param {number} expressPort - Express 포트
     */
    static logServerStart(wsPort, expressPort) {
        console.clear();
        console.log(`\n🌐 서버 관리 UI가 자동으로 열립니다...`.cyan);
        console.log(`📊 관리 페이지: http://localhost:${expressPort}/admin`.green);
        console.log(`🧩 블록 코딩 페이지: http://localhost:${expressPort}`.yellow);
        console.log(`\n   - 실시간 서버 상태 확인`.gray);
        console.log(`   - 마인크래프트 연결 정보`.gray);
        console.log(`   - 블록 코딩 인터페이스`.gray);
    }

    /**
     * 마인크래프트 연결 정보 출력
     * @param {string} command - 연결 명령어
     */
    static logMinecraftConnection(command) {
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
    }

    /**
     * 이벤트 로깅
     * @param {string} eventType - 이벤트 타입
     * @param {string} message - 메시지
     * @param {object} data - 추가 데이터
     */
    static logEvent(eventType, message, data = null) {
        console.log(`\n=== ${eventType} ===`);
        console.log(message);
        if (data) {
            console.log('데이터:', JSON.stringify(data, null, 2));
        }
        console.log('='.repeat(eventType.length + 8) + '\n');
    }

    /**
     * 명령어 등록 로깅
     * @param {string} type - 등록 타입
     * @param {Map} registrationMap - 등록된 항목들
     */
    static logRegistration(type, registrationMap) {
        console.log(`\n=== ${type} 등록 ===`);
        console.log(`총 등록된 ${type} 수:`, registrationMap.size);
        console.log('------------------------');
        for (let [key, data] of registrationMap.entries()) {
            console.log(`• "${key}" (ID: ${data.blockId})`);
        }
        console.log('=========================\n');
    }
}

module.exports = Logger;