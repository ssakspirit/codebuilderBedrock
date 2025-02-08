// 명령어 데이터 클래스
class CommandData {
    constructor(command, blockId, socket) {
        this.command = command;
        this.blockId = blockId;
        this.socket = socket;
    }
}

// 좌표 클래스
class Position {
    constructor(x, y, z, isAbsolute = false) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.isAbsolute = isAbsolute;
    }

    toString() {
        const tilde = this.isAbsolute ? '' : '~';
        return `${tilde}${this.x} ${tilde}${this.y} ${tilde}${this.z}`;
    }
}

// Node.js 환경과 브라우저 환경 모두에서 동작하도록 처리
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경
    module.exports = { CommandData, Position };
} else {
    // 브라우저 환경
    window.CommandData = CommandData;
    window.Position = Position;
} 