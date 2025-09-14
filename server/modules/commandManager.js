const Logger = require('../utils/logger');

/**
 * 명령어 관리 클래스
 * 채팅 명령어, 아이템 이벤트, 블록 이벤트 등의 등록과 실행을 관리
 */
class CommandManager {
    constructor() {
        this.commandBlocks = new Map();         // 채팅 명령어 -> {blockId, socket}
        this.itemBlocks = new Map();            // 아이템 획득 -> {blockId, socket}
        this.itemUsedBlocks = new Map();        // 아이템 사용 -> {blockId, socket}
        this.blockPlacedBlocks = new Map();     // 블록 설치 -> {blockId, socket}
        this.blockBrokenBlocks = new Map();     // 블록 파괴 -> {blockId, socket}
    }

    /**
     * 채팅 명령어 등록
     * @param {string} command - 명령어
     * @param {string} blockId - 블록 ID
     * @param {object} socket - 클라이언트 소켓
     */
    registerChatCommand(command, blockId, socket) {
        this.commandBlocks.set(command, {
            blockId: blockId,
            socket: socket
        });
        Logger.logRegistration('명령어', this.commandBlocks);
    }

    /**
     * 아이템 획득 이벤트 등록
     * @param {string} item - 아이템 타입
     * @param {string} blockId - 블록 ID
     * @param {object} socket - 클라이언트 소켓
     */
    registerItemAcquired(item, blockId, socket) {
        // 같은 블록 ID를 가진 이전 아이템들을 제거
        const itemsToRemove = [];
        for (let [itemType, blockData] of this.itemBlocks.entries()) {
            if (blockData.blockId === blockId) {
                itemsToRemove.push(itemType);
            }
        }
        itemsToRemove.forEach(itemType => {
            this.itemBlocks.delete(itemType);
            console.log('🗑️ 이전 아이템 제거:', itemType);
        });

        // 중복 확인
        if (this.itemBlocks.has(item)) {
            console.log('❌ 중복 아이템 등록 시도 거부:', item);
            socket.emit('itemRegistrationError', {
                error: '같은 아이템에 대한 블록이 이미 존재합니다.',
                item: item,
                existingBlockId: this.itemBlocks.get(item).blockId
            });
            return false;
        }

        // 새로운 아이템 등록
        this.itemBlocks.set(item, {
            blockId: blockId,
            socket: socket
        });

        Logger.logRegistration('아이템 명령어', this.itemBlocks);
        return true;
    }

    /**
     * 아이템 사용 이벤트 등록
     * @param {string} item - 아이템 타입
     * @param {string} blockId - 블록 ID
     * @param {object} socket - 클라이언트 소켓
     */
    registerItemUsed(item, blockId, socket) {
        // 같은 블록 ID를 가진 이전 아이템들을 제거
        const itemsToRemove = [];
        for (let [itemType, blockData] of this.itemUsedBlocks.entries()) {
            if (blockData.blockId === blockId) {
                itemsToRemove.push(itemType);
            }
        }
        itemsToRemove.forEach(itemType => {
            this.itemUsedBlocks.delete(itemType);
            console.log('🗑️ 이전 아이템 사용 등록 제거:', itemType);
        });

        // 중복 확인
        if (this.itemUsedBlocks.has(item)) {
            console.log('❌ 중복 아이템 사용 등록 시도 거부:', item);
            socket.emit('itemUsedRegistrationError', {
                error: '같은 아이템 사용에 대한 블록이 이미 존재합니다.',
                item: item,
                existingBlockId: this.itemUsedBlocks.get(item).blockId
            });
            return false;
        }

        // 새로운 아이템 사용 등록
        this.itemUsedBlocks.set(item, {
            blockId: blockId,
            socket: socket
        });

        Logger.logRegistration('아이템 사용 명령어', this.itemUsedBlocks);
        return true;
    }

    /**
     * 블록 설치 이벤트 등록
     * @param {string} blockType - 블록 타입
     * @param {string} blockId - 블록 ID
     * @param {object} socket - 클라이언트 소켓
     */
    registerBlockPlaced(blockType, blockId, socket) {
        // 같은 블록 ID를 가진 이전 블록들을 제거
        const blocksToRemove = [];
        for (let [type, blockData] of this.blockPlacedBlocks.entries()) {
            if (blockData.blockId === blockId) {
                blocksToRemove.push(type);
            }
        }
        blocksToRemove.forEach(type => {
            this.blockPlacedBlocks.delete(type);
            console.log('🗑️ 이전 블록 제거:', type);
        });

        // 중복 확인
        if (this.blockPlacedBlocks.has(blockType)) {
            console.log('❌ 중복 블록 등록 시도 거부:', blockType);
            socket.emit('blockPlacedRegistrationError', {
                error: '같은 블록에 대한 명령이 이미 존재합니다.',
                blockType: blockType,
                existingBlockId: this.blockPlacedBlocks.get(blockType).blockId
            });
            return false;
        }

        // 새로운 블록 설치 등록
        this.blockPlacedBlocks.set(blockType, {
            blockId: blockId,
            socket: socket
        });

        Logger.logRegistration('블록 설치 명령어', this.blockPlacedBlocks);
        return true;
    }

    /**
     * 블록 파괴 이벤트 등록
     * @param {string} blockType - 블록 타입
     * @param {string} blockId - 블록 ID
     * @param {object} socket - 클라이언트 소켓
     */
    registerBlockBroken(blockType, blockId, socket) {
        // 같은 블록 ID를 가진 이전 블록들을 제거
        const blocksToRemove = [];
        for (let [type, blockData] of this.blockBrokenBlocks.entries()) {
            if (blockData.blockId === blockId) {
                blocksToRemove.push(type);
            }
        }
        blocksToRemove.forEach(type => {
            this.blockBrokenBlocks.delete(type);
            console.log('🗑️ 이전 블록 제거:', type);
        });

        // 중복 확인
        if (this.blockBrokenBlocks.has(blockType)) {
            console.log('❌ 중복 블록 파괴 등록 시도 거부:', blockType);
            socket.emit('blockBrokenRegistrationError', {
                error: '같은 블록 파괴에 대한 명령이 이미 존재합니다.',
                blockType: blockType,
                existingBlockId: this.blockBrokenBlocks.get(blockType).blockId
            });
            return false;
        }

        // 새로운 블록 파괴 등록
        this.blockBrokenBlocks.set(blockType, {
            blockId: blockId,
            socket: socket
        });

        Logger.logRegistration('블록 파괴 명령어', this.blockBrokenBlocks);
        return true;
    }

    /**
     * 등록 제거
     * @param {string} blockType - 블록 타입
     * @param {string} blockId - 블록 ID
     */
    removeRegistration(blockType, blockId) {
        console.log(`\n🗑️ 블록 등록 제거 요청: ${blockType} (ID: ${blockId})`);

        let removed = false;

        // 각 Map에서 해당 블록 ID를 가진 항목 제거
        if (blockType === 'on_chat_command') {
            for (let [command, data] of this.commandBlocks.entries()) {
                if (data.blockId === blockId) {
                    this.commandBlocks.delete(command);
                    console.log(`✅ 채팅 명령어 "${command}" 제거됨`);
                    removed = true;
                }
            }
        } else if (blockType === 'on_item_use') {
            for (let [item, data] of this.itemBlocks.entries()) {
                if (data.blockId === blockId) {
                    this.itemBlocks.delete(item);
                    console.log(`✅ 아이템 "${item}" 제거됨`);
                    removed = true;
                }
            }
        } else if (blockType === 'on_item_used') {
            for (let [item, data] of this.itemUsedBlocks.entries()) {
                if (data.blockId === blockId) {
                    this.itemUsedBlocks.delete(item);
                    console.log(`✅ 아이템 사용 "${item}" 제거됨`);
                    removed = true;
                }
            }
        } else if (blockType === 'on_block_placed') {
            for (let [block, data] of this.blockPlacedBlocks.entries()) {
                if (data.blockId === blockId) {
                    this.blockPlacedBlocks.delete(block);
                    console.log(`✅ 블록 설치 "${block}" 제거됨`);
                    removed = true;
                }
            }
        } else if (blockType === 'on_block_broken') {
            for (let [block, data] of this.blockBrokenBlocks.entries()) {
                if (data.blockId === blockId) {
                    this.blockBrokenBlocks.delete(block);
                    console.log(`✅ 블록 파괴 "${block}" 제거됨`);
                    removed = true;
                }
            }
        }

        if (removed) {
            console.log('현재 등록 현황:');
            console.log(`- 채팅 명령어: ${this.commandBlocks.size}개`);
            console.log(`- 아이템 획득: ${this.itemBlocks.size}개`);
            console.log(`- 아이템 사용: ${this.itemUsedBlocks.size}개`);
            console.log(`- 블록 설치: ${this.blockPlacedBlocks.size}개`);
            console.log(`- 블록 파괴: ${this.blockBrokenBlocks.size}개`);
        } else {
            console.log('❌ 제거할 블록을 찾을 수 없음');
        }

        console.log('=======================\n');
    }

    /**
     * 채팅 명령어 실행
     * @param {string} command - 실행할 명령어
     * @returns {boolean} 실행 성공 여부
     */
    executeChatCommand(command) {
        const blockData = this.commandBlocks.get(command);
        if (blockData) {
            console.log('✅ 명령어 코드 실행 시작');
            console.log('------------------------');
            blockData.socket.emit('executeCommand', blockData.blockId);
            return true;
        }
        return false;
    }

    /**
     * 아이템 획득 이벤트 실행
     * @param {string} itemType - 아이템 타입
     * @returns {boolean} 실행 성공 여부
     */
    executeItemAcquired(itemType) {
        const itemData = this.itemBlocks.get(itemType);
        if (itemData) {
            console.log('✅ 아이템 획득 코드 실행 시작');
            console.log('------------------------');
            itemData.socket.emit('executeItemCommands', itemData.blockId);
            return true;
        }
        return false;
    }

    /**
     * 아이템 사용 이벤트 실행
     * @param {string} itemType - 아이템 타입
     * @param {string} playerName - 플레이어 이름
     * @returns {boolean} 실행 성공 여부
     */
    executeItemUsed(itemType, playerName = null) {
        const itemUsedData = this.itemUsedBlocks.get(itemType);
        if (itemUsedData) {
            console.log('✅ 아이템 사용 코드 실행 시작');
            console.log('------------------------');
            itemUsedData.socket.emit('executeItemUsedCommands', {
                blockId: itemUsedData.blockId,
                playerName: playerName,
                itemType: itemType
            });
            return true;
        }
        return false;
    }

    /**
     * 블록 설치 이벤트 실행
     * @param {string} blockType - 블록 타입
     * @returns {boolean} 실행 성공 여부
     */
    executeBlockPlaced(blockType) {
        const blockData = this.blockPlacedBlocks.get(blockType);
        if (blockData) {
            console.log('✅ 블록 설치 코드 실행 시작');
            console.log('------------------------');
            blockData.socket.emit('executeBlockPlacedCommands', blockData.blockId);
            return true;
        }
        return false;
    }

    /**
     * 블록 파괴 이벤트 실행
     * @param {string} blockType - 블록 타입
     * @returns {boolean} 실행 성공 여부
     */
    executeBlockBroken(blockType) {
        const blockData = this.blockBrokenBlocks.get(blockType);
        if (blockData) {
            console.log('✅ 블록 파괴 코드 실행 시작');
            console.log('------------------------');
            blockData.socket.emit('executeBlockBrokenCommands', blockData.blockId);
            return true;
        }
        return false;
    }

    /**
     * 모든 등록된 명령어 가져오기
     * @returns {object} 모든 등록된 명령어들
     */
    getAllRegistrations() {
        return {
            chatCommands: Array.from(this.commandBlocks.keys()),
            itemAcquired: Array.from(this.itemBlocks.keys()),
            itemUsed: Array.from(this.itemUsedBlocks.keys()),
            blockPlaced: Array.from(this.blockPlacedBlocks.keys()),
            blockBroken: Array.from(this.blockBrokenBlocks.keys())
        };
    }
}

module.exports = CommandManager;