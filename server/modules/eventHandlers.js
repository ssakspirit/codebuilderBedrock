const Logger = require('../utils/logger');

/**
 * 마인크래프트 이벤트 처리 클래스
 */
class EventHandlers {
    constructor(commandManager, sendFunction) {
        this.commandManager = commandManager;
        this.send = sendFunction;
        this.pendingBlockDetect = false;
        this.blockDetectResponseCount = 0;
    }

    /**
     * 마인크래프트 이벤트 메시지 처리
     * @param {object} data - 이벤트 데이터
     */
    handleMinecraftEvent(data) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

            if (parsedData.header && parsedData.header.eventName) {
                switch (parsedData.header.eventName) {
                    case 'PlayerMessage':
                        this.handlePlayerMessage(parsedData);
                        break;
                    case 'ItemAcquired':
                        this.handleItemAcquired(parsedData);
                        break;
                    case 'ItemUsed':
                        this.handleItemUsed(parsedData);
                        break;
                    case 'BlockPlaced':
                        this.handleBlockPlaced(parsedData);
                        break;
                    case 'BlockBroken':
                        this.handleBlockBroken(parsedData);
                        break;
                    default:
                        // 블록 감지 응답 처리
                        if (this.pendingBlockDetect && parsedData.body && parsedData.body.statusMessage) {
                            this.handleBlockDetectResponse(parsedData);
                        }
                        break;
                }
            }
        } catch (error) {
            console.error('이벤트 처리 중 오류:', error);
        }
    }

    /**
     * 플레이어 메시지 처리 (채팅 명령어)
     * @param {object} data - 플레이어 메시지 데이터
     */
    handlePlayerMessage(data) {
        Logger.logEvent('채팅 메시지 이벤트 수신', '전체 이벤트 데이터:', data);

        let message = null;
        if (data.body.message) {
            message = data.body.message;
        } else if (data.body.properties && data.body.properties.Message) {
            message = data.body.properties.Message;
        }

        console.log('메시지 내용:', message);

        if (message) {
            // 명령어 실행 시도
            const executed = this.commandManager.executeChatCommand(message);

            if (executed) {
                // 명령어 피드백 임시 비활성화 후 재활성화
                setTimeout(() => {
                    this.send('gamerule sendcommandfeedback false');  // 명령어 피드백 끄기
                }, 50);
                setTimeout(() => {
                    this.send('gamerule sendcommandfeedback true');  // 명령어 피드백 다시 켜기
                }, 100);
            } else {
                console.log('❌ 일치하는 명령어가 없습니다');
            }
        }
        console.log('=========================\n');
    }

    /**
     * 아이템 획득 이벤트 처리
     * @param {object} data - 아이템 획득 데이터
     */
    handleItemAcquired(data) {
        Logger.logEvent('아이템 획득 이벤트 수신', '전체 이벤트 데이터:', data);

        // 아이템 타입 추출
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
            const executed = this.commandManager.executeItemAcquired(itemType);
            if (!executed) {
                console.log('❌ 일치하는 아이템 코드가 없습니다');
                console.log('등록된 아이템들:', this.commandManager.getAllRegistrations().itemAcquired);
            }
        } else {
            console.log('❌ 아이템 타입을 찾을 수 없습니다');
        }
        console.log('==========================\n');
    }

    /**
     * 아이템 사용 이벤트 처리
     * @param {object} data - 아이템 사용 데이터
     */
    handleItemUsed(data) {
        Logger.logEvent('아이템 사용 이벤트 수신', '전체 이벤트 데이터:', data);

        // 플레이어 이름 추출
        let playerName = null;
        if (data.body.player && data.body.player.name) {
            playerName = data.body.player.name;
        } else if (data.body.playerName) {
            playerName = data.body.playerName;
        } else if (data.body.sender && data.body.sender.name) {
            playerName = data.body.sender.name;
        }

        // 아이템 타입 추출
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

        console.log('사용한 아이템:', itemType);
        console.log('플레이어:', playerName);

        if (itemType) {
            const executed = this.commandManager.executeItemUsed(itemType, playerName);
            if (!executed) {
                console.log('❌ 일치하는 아이템 사용 코드가 없습니다');
                console.log('등록된 아이템 사용들:', this.commandManager.getAllRegistrations().itemUsed);
            }
        } else {
            console.log('❌ 아이템 타입을 찾을 수 없습니다');
        }
        console.log('=============================\n');
    }

    /**
     * 블록 설치 이벤트 처리
     * @param {object} data - 블록 설치 데이터
     */
    handleBlockPlaced(data) {
        Logger.logEvent('블록 설치 이벤트 수신', '전체 이벤트 데이터:', data);

        // 블록 타입 추출
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
            const executed = this.commandManager.executeBlockPlaced(blockType);
            if (!executed) {
                console.log('❌ 일치하는 블록 설치 코드가 없습니다');
                console.log('등록된 블록들:', this.commandManager.getAllRegistrations().blockPlaced);
            }
        } else {
            console.log('❌ 블록 타입을 찾을 수 없습니다');
        }
        console.log('==========================\n');
    }

    /**
     * 블록 파괴 이벤트 처리
     * @param {object} data - 블록 파괴 데이터
     */
    handleBlockBroken(data) {
        Logger.logEvent('블록 파괴 이벤트 수신', '전체 이벤트 데이터:', data);

        // 블록 타입 추출
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
            const executed = this.commandManager.executeBlockBroken(blockType);
            if (!executed) {
                console.log('❌ 일치하는 블록 파괴 코드가 없습니다');
                console.log('등록된 블록들:', this.commandManager.getAllRegistrations().blockBroken);
            }
        } else {
            console.log('❌ 블록 타입을 찾을 수 없습니다');
        }
        console.log('==========================\n');
    }

    /**
     * 블록 감지 응답 처리
     * @param {object} data - 블록 감지 응답 데이터
     */
    handleBlockDetectResponse(data) {
        this.blockDetectResponseCount++;
        const statusMessage = data.body.statusMessage;

        console.log(`블록 감지 응답 ${this.blockDetectResponseCount}:`, statusMessage);

        // 모든 응답이 도착했는지 확인하고 처리
        if (this.blockDetectResponseCount >= 3) {
            this.pendingBlockDetect = false;
            this.blockDetectResponseCount = 0;
        }
    }

    /**
     * 블록 감지 상태 설정
     * @param {boolean} pending - 대기 상태
     */
    setPendingBlockDetect(pending) {
        this.pendingBlockDetect = pending;
        if (pending) {
            this.blockDetectResponseCount = 0;
        }
    }
}

module.exports = EventHandlers;