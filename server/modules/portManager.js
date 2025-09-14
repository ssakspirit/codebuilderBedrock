const net = require('net');

/**
 * 포트 사용 가능 여부 확인
 * @param {number} port - 확인할 포트 번호
 * @returns {Promise<boolean>} 포트가 사용 중이면 true, 사용 가능하면 false
 */
function portCheck(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, (err) => {
            if (err) {
                resolve(true); // 포트 사용 중
            } else {
                server.once('close', () => {
                    resolve(false); // 포트 사용 가능
                });
                server.close();
            }
        });
        server.on('error', () => {
            resolve(true); // 포트 사용 중
        });
    });
}

/**
 * 사용 가능한 포트 자동 탐색
 * @param {number} startPort - 시작 포트
 * @param {number} endPort - 끝 포트
 * @returns {Promise<number|null>} 사용 가능한 포트 번호 또는 null
 */
async function findAvailablePort(startPort, endPort) {
    for (let port = startPort; port <= endPort; port++) {
        if (!(await portCheck(port))) {
            return port;
        }
    }
    return null;
}

module.exports = {
    portCheck,
    findAvailablePort
};