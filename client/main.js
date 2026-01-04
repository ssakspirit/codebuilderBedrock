// 전역 변수 선언
let socket = io();
let workspace;
let isExecuting = false;  // 실행 상태를 추적하는 변수
let shouldStop = false;   // 중지 신호를 위한 변수

// 소켓 연결 디버깅
socket.on('connect', function() {
    console.log('✅ 서버에 연결되었습니다!', socket.id);
});

socket.on('disconnect', function() {
    console.log('❌ 서버와 연결이 끊어졌습니다!');
});

socket.on('connect_error', function(error) {
    console.error('🔥 연결 에러:', error);
});

// 블록 스타일 정의
Blockly.Theme.defineTheme('custom_theme', {
    'base': Blockly.Themes.Classic,
    'blockStyles': {
        'hat_blocks': {
            'hat': 'cap',
            'colourPrimary': '#60A5FA',
            'colourSecondary': '#93C5FD',
            'colourTertiary': '#3B82F6'
        },
        'rounded_blocks': {
            'colourPrimary': '#7ABB55',
            'colourSecondary': '#8FD169',
            'colourTertiary': '#669C46'
        },
        'repeat_blocks': {
            'colourPrimary': '#55833C',
            'colourSecondary': '#729665',
            'colourTertiary': '#3D6428'
        },
        'agent_blocks': {
            'colourPrimary': '#D83B01',
            'colourSecondary': '#E85C33',
            'colourTertiary': '#B32D01'
        },
        'variable_blocks': {
            'colourPrimary': '#a41e16',
            'colourSecondary': '#b84940',
            'colourTertiary': '#8b1912'
        },
        'math_blocks': {
            'colourPrimary': '#4c4d70',
            'colourSecondary': '#666790',
            'colourTertiary': '#363756'
        },
        'logic_blocks': {
            'colourPrimary': '#459197',
            'colourSecondary': '#5BA7AD',
            'colourTertiary': '#357B81'
        },
        'block_hat_blocks': {
            'hat': 'cap',
            'colourPrimary': '#7ABB55',
            'colourSecondary': '#8FD169',
            'colourTertiary': '#669C46'
        }
    }
});

// 알림 메시지 표시 함수
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 실행 중지 함수
function stopExecution() {
    if (isExecuting) {
        shouldStop = true;
        showNotification('실행을 중지합니다...');
    }
}

// Blockly 초기화 함수
function initBlockly() {
    // 메시지 한글화 설정
    Blockly.Msg['NEW_VARIABLE'] = '변수 만들기';
    Blockly.Msg['NEW_VARIABLE_TITLE'] = '새 변수 이름:';
    Blockly.Msg['RENAME_VARIABLE'] = '변수 이름 바꾸기';
    Blockly.Msg['RENAME_VARIABLE_TITLE'] = '"%1" 변수의 이름을 바꾸기:';
    Blockly.Msg['DELETE_VARIABLE'] = '"%1" 변수 삭제';
    Blockly.Msg['DELETE_VARIABLE_CONFIRMATION'] = '"%2" 변수가 %1곳에서 사용되고 있습니다. 삭제하시겠습니까?';
    Blockly.Msg['VARIABLE_ALREADY_EXISTS'] = '"%1" 변수가 이미 존재합니다.';
    Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'] = '"%1" 변수가 다른 타입으로 이미 존재합니다: "%2"';
    
    // 변수 블록 메시지 변경
    Blockly.Msg['VARIABLES_SET'] = '%1 값을 %2 로 정하기';
    Blockly.Msg['VARIABLES_GET'] = '%1';
    Blockly.Msg['VARIABLES_CHANGE'] = '%1 값을 %2 만큼 바꾸기';
    Blockly.Msg['MATH_CHANGE_TITLE'] = '%1 값을 %2 만큼 바꾸기';

    // 수학 블록 메시지 한글화
    Blockly.Msg['MATH_ARITHMETIC_HELPURL'] = '';
    Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_ADD'] = '두 수의 합을 반환합니다.';
    Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_MINUS'] = '두 수의 차를 반환합니다.';
    Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_MULTIPLY'] = '두 수의 곱을 반환합니다.';
    Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_DIVIDE'] = '두 수의 나눗셈 결과를 반환합니다.';
    Blockly.Msg['MATH_ARITHMETIC_TOOLTIP_POWER'] = '첫 번째 수를 두 번째 수만큼 거듭제곱한 결과를 반환합니다.';
    Blockly.Msg['MATH_NUMBER_TOOLTIP'] = '숫자입니다.';
    Blockly.Msg['MATH_ADDITION_SYMBOL'] = '+';
    Blockly.Msg['MATH_SUBTRACTION_SYMBOL'] = '-';
    Blockly.Msg['MATH_MULTIPLICATION_SYMBOL'] = '×';
    Blockly.Msg['MATH_DIVISION_SYMBOL'] = '÷';
    Blockly.Msg['MATH_POWER_SYMBOL'] = '^';

    Blockly.Msg['MATH_NUMBER_PROPERTY_EVEN'] = '짝수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_ODD'] = '홀수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_PRIME'] = '소수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_WHOLE'] = '정수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_POSITIVE'] = '양수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_NEGATIVE'] = '음수';
    Blockly.Msg['MATH_NUMBER_PROPERTY_DIVISIBLE_BY'] = '다음으로 나눌 수 있음:';
    
    Blockly.Msg['MATH_IS_TOOLTIP'] = '숫자가 짝수, 홀수, 소수, 정수, 양수, 음수인지 또는 특정 수로 나눌 수 있는지 검사합니다.';
    
    Blockly.Msg['MATH_ROUND_OPERATOR_ROUND'] = '반올림';
    Blockly.Msg['MATH_ROUND_OPERATOR_ROUNDUP'] = '올림';
    Blockly.Msg['MATH_ROUND_OPERATOR_ROUNDDOWN'] = '내림';
    
    Blockly.Msg['MATH_MODULO_TITLE'] = '%1 ÷ %2 의 나머지';
    Blockly.Msg['MATH_MODULO_TOOLTIP'] = '두 수를 나눈 나머지를 반환합니다.';

    // 숫자 속성 블록의 텍스트를 한글로 변경
    Blockly.Msg['MATH_IS_EVEN'] = '짝수';
    Blockly.Msg['MATH_IS_ODD'] = '홀수';
    Blockly.Msg['MATH_IS_PRIME'] = '소수';
    Blockly.Msg['MATH_IS_WHOLE'] = '정수';
    Blockly.Msg['MATH_IS_POSITIVE'] = '양수';
    Blockly.Msg['MATH_IS_NEGATIVE'] = '음수';
    Blockly.Msg['MATH_IS_DIVISIBLE_BY'] = '다음 수로 나누어떨어짐:';        
    
    //논리 블록 메시지 한글화
    Blockly.Msg["CONTROLS_IF_MSG_IF"] = "만약";
    Blockly.Msg["CONTROLS_IF_MSG_ELSE"] = "그렇지 않으면";
    Blockly.Msg["CONTROLS_IF_MSG_THEN"] = "실행";
    Blockly.Msg["LOGIC_BOOLEAN_TRUE"] = "참";
    Blockly.Msg["LOGIC_BOOLEAN_FALSE"] = "거짓";

    // workspace 초기화
    workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        scrollbars: true,
        trashcan: true,
        theme: 'custom_theme',
        grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        }
    });

    // JavaScript 생성기 초기화
    Blockly.JavaScript.init(workspace);
    Blockly.JavaScript.addReservedWords('code');
    Blockly.JavaScript.STATEMENT_PREFIX = '';
    
    // 기본 변수 생성
    workspace.createVariable('점수', '', '점수');

    // 변수 카테고리의 flyout 수정
    const originalFlyoutCategory = Blockly.Variables.flyoutCategory;
    Blockly.Variables.flyoutCategory = function(workspace) {
        const blockList = originalFlyoutCategory(workspace);
        blockList.forEach(blockDef => {
            if (blockDef.type === 'variables_set') {
                blockDef.input = {
                    name: 'VALUE',
                    shadow: {
                        type: 'math_number',
                        fields: { NUM: '0' }
                    }
                };
            }
        });
        return blockList;
    };

    // 변수 카테고리 스타일 설정 제거
    workspace.getToolbox().getToolboxItems().forEach(category => {
        if (category.getName() === '변수') {
            category.getDiv().style.backgroundColor = '';  // 배경색 제거
        }
    });

    // 작업 영역의 변경사항을 감지하여 명령어 업데이트
    workspace.addChangeListener(function(event) {
        if (event.type == Blockly.Events.BLOCK_CHANGE || 
            event.type == Blockly.Events.BLOCK_CREATE || 
            event.type == Blockly.Events.BLOCK_DELETE) {
            
            // 블록 삭제 시 서버에서 등록 제거
            if (event.type == Blockly.Events.BLOCK_DELETE && event.oldXml) {
                const deletedBlockType = event.oldXml.getAttribute('type');
                const deletedBlockId = event.oldXml.getAttribute('id');

                console.log('블록 삭제 감지:', { type: deletedBlockType, id: deletedBlockId });

                if (deletedBlockType === 'on_chat_command' ||
                    deletedBlockType === 'on_item_use' ||
                    deletedBlockType === 'on_block_placed' ||
                    deletedBlockType === 'on_block_broken' ||
                    deletedBlockType === 'on_mob_killed') {
                    // 삭제된 블록의 등록 제거를 서버에 요청
                    socket.emit('removeBlockRegistration', {
                        blockType: deletedBlockType,
                        blockId: deletedBlockId
                    });
                    console.log('서버로 블록 등록 제거 요청 전송:', { type: deletedBlockType, id: deletedBlockId });
                }
            }
            
            const blocks = workspace.getTopBlocks(true);
            
            // 채팅 명령어 블록 처리
            const chatCommandBlocks = blocks.filter(block => block.type === 'on_chat_command');
            const commands = new Set();
            chatCommandBlocks.forEach(block => {
                const command = block.getFieldValue('COMMAND');
                if (commands.has(command)) {
                    showNotification('중복된 명령어가 있습니다!');
                    return;
                }
                commands.add(command);
                
                const blockId = block.id;
                socket.emit('updateExecutionCommand', { command, blockId });
            });
            
            // 아이템 사용 블록 처리
            const itemUseBlocks = blocks.filter(block => block.type === 'on_item_use');
            itemUseBlocks.forEach(block => {
                const itemInput = block.getInputTargetBlock('ITEM');
                if (itemInput && itemInput.type === 'item_type') {
                    const itemType = itemInput.getFieldValue('ITEM_TYPE');
                    const blockId = block.id;
                    
                    console.log('아이템 블록 감지:', { item: itemType, blockId });
                    socket.emit('updateItemUseCommand', { item: itemType, blockId });
                    console.log('서버로 아이템 등록 전송 완료:', itemType);
                }
            });
            
            // 블록 설치 감지 블록 처리
            const blockPlacedBlocks = blocks.filter(block => block.type === 'on_block_placed');
            blockPlacedBlocks.forEach(block => {
                const blockInput = block.getInputTargetBlock('BLOCK');
                if (blockInput && blockInput.type === 'block_type') {
                    const blockType = blockInput.getFieldValue('BLOCK_TYPE');
                    const blockId = block.id;
                    
                    console.log('블록 설치 감지 블록 감지:', { blockType: blockType, blockId });
                    socket.emit('updateBlockPlacedCommand', { blockType: blockType, blockId });
                    console.log('서버로 블록 설치 등록 전송 완료:', blockType);
                }
            });
            
            // 블록 파괴 감지 블록 처리
            const blockBrokenBlocks = blocks.filter(block => block.type === 'on_block_broken');
            blockBrokenBlocks.forEach(block => {
                const blockInput = block.getInputTargetBlock('BLOCK');
                if (blockInput && blockInput.type === 'block_type') {
                    const blockType = blockInput.getFieldValue('BLOCK_TYPE');
                    const blockId = block.id;

                    console.log('블록 파괴 감지 블록 감지:', { blockType: blockType, blockId });
                    socket.emit('updateBlockBrokenCommand', { blockType: blockType, blockId });
                    console.log('서버로 블록 파괴 등록 전송 완료:', blockType);
                }
            });

            // 몹 처치 감지 블록 처리
            const mobKilledBlocks = blocks.filter(block => block.type === 'on_mob_killed');
            mobKilledBlocks.forEach(block => {
                // MOB_TYPE 입력에서 연결된 블록 가져오기
                const mobTypeBlock = block.getInputTargetBlock('MOB_TYPE');
                let mobType = 'all'; // 기본값: 모든 몹

                console.log('🔍 [디버그] 몹 처치 블록 분석:');
                console.log('  - mobTypeBlock 존재:', !!mobTypeBlock);
                if (mobTypeBlock) {
                    console.log('  - mobTypeBlock.type:', mobTypeBlock.type);
                    console.log('  - isShadow:', mobTypeBlock.isShadow());
                    console.log('  - 모든 필드:', Object.keys(mobTypeBlock.inputList));

                    if (mobTypeBlock.type === 'mob_type') {
                        mobType = mobTypeBlock.getFieldValue('MOB_TYPE');
                        console.log('  - MOB_TYPE 필드 값:', mobType);
                    }
                }

                const blockId = block.id;

                console.log('몹 처치 감지 블록 감지:', { mobType: mobType, blockId });
                socket.emit('updateMobKilledCommand', { mobType: mobType, blockId });
                console.log('서버로 몹 처치 등록 전송 완료:', mobType);
            });
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    initBlockly();
});

// 아이템 등록 에러 처리
socket.on('itemRegistrationError', function(data) {
    console.error('❌ 아이템 등록 에러:', data.error);
    console.error('중복 아이템:', data.item);
    showNotification(`❌ ${data.item} 아이템은 이미 등록되어 있습니다!`);
});

// 블록 설치 등록 에러 처리
socket.on('blockPlacedRegistrationError', function(data) {
    console.error('❌ 블록 설치 등록 에러:', data.error);
    console.error('중복 블록:', data.blockType);
    showNotification(`❌ ${data.blockType} 블록은 이미 등록되어 있습니다!`);
});

// 블록 파괴 등록 에러 처리
socket.on('blockBrokenRegistrationError', function(data) {
    console.error('❌ 블록 파괴 등록 에러:', data.error);
    console.error('중복 블록:', data.blockType);
    showNotification(`❌ ${data.blockType} 블록 파괴는 이미 등록되어 있습니다!`);
});

// 몹 처치 등록 에러 처리
socket.on('mobKilledRegistrationError', function(data) {
    console.error('❌ 몹 처치 등록 에러:', data.error);
    console.error('중복 몹:', data.mobType);
    const mobTypeDisplay = data.mobType === 'all' ? '모든 몹' : data.mobType;
    showNotification(`❌ ${mobTypeDisplay} 처치는 이미 등록되어 있습니다!`);

    // 중복 블록 자동 삭제
    setTimeout(() => {
        const blocks = workspace.getTopBlocks(true);
        const duplicateBlocks = blocks.filter(block =>
            block.type === 'on_mob_killed' &&
            block.id !== data.existingBlockId
        );

        duplicateBlocks.forEach(block => {
            const mobTypeBlock = block.getInputTargetBlock('MOB_TYPE');
            let mobType = 'all';
            if (mobTypeBlock && mobTypeBlock.type === 'mob_type') {
                mobType = mobTypeBlock.getFieldValue('MOB_TYPE');
            }

            // 같은 몹 타입의 중복 블록 찾아서 삭제
            if (mobType === data.mobType) {
                console.log('🗑️ 중복 블록 자동 삭제:', block.id);
                block.dispose(true);
            }
        });
    }, 100);
});

// 아이템 사용 이벤트 처리
socket.on('executeItemCommands', async function(blockId) {
    if (isExecuting) {
        showNotification('이미 실행 중입니다.');
        return;
    }
    
    const blocks = workspace.getTopBlocks(true);
    const eventBlocks = blocks.filter(block => block.type === 'on_item_use');
    
    const targetBlock = eventBlocks.find(block => block.id === blockId);
    if (targetBlock) {
        try {
            isExecuting = true;
            shouldStop = false;
            console.log('\n=== 아이템 사용 실행 시작 ===');
            console.log('블록 ID:', blockId);
            console.log('------------------------');
            showNotification('아이템 사용 명령을 실행합니다...');
            
            let code = '';
            let nextBlock = targetBlock.getInputTargetBlock('NEXT');
            
            while (nextBlock) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    isExecuting = false;
                    return;
                }
                
                // 코드 생성기 재초기화
                Blockly.JavaScript.init(workspace);
                
                if (Blockly.JavaScript[nextBlock.type]) {
                    code += Blockly.JavaScript[nextBlock.type](nextBlock);
                } else {
                    console.warn(`블록 타입 "${nextBlock.type}"에 대한 코드 생성기가 없습니다.`);
                }
                
                nextBlock = nextBlock.getNextBlock();
            }
            
            // 디버깅을 위한 생성된 코드 출력
            console.log('생성된 코드:', code);
            
            await eval('(async () => { ' + code + ' })()');
            console.log('------------------------');
            console.log('=== 실행 완료 ===\n');
            showNotification('아이템 사용 실행이 완료되었습니다.');
        } catch (e) {
            console.log('❌ 실행 중 오류 발생');
            console.error('오류 내용:', e);
            showNotification('실행 중 오류가 발생했습니다: ' + e.message);
        } finally {
            isExecuting = false;
            shouldStop = false;
        }
    } else {
        console.log('❌ 아이템 사용 블록을 찾을 수 없음');
        showNotification('해당 아이템 사용 블록을 찾을 수 없습니다.');
    }
});

// 블록 설치 이벤트 처리
socket.on('executeBlockPlacedCommands', async function(blockId) {
    if (isExecuting) {
        showNotification('이미 실행 중입니다.');
        return;
    }
    
    const blocks = workspace.getTopBlocks(true);
    const eventBlocks = blocks.filter(block => block.type === 'on_block_placed');
    
    const targetBlock = eventBlocks.find(block => block.id === blockId);
    if (targetBlock) {
        try {
            isExecuting = true;
            shouldStop = false;
            console.log('\n=== 블록 설치 실행 시작 ===');
            console.log('블록 ID:', blockId);
            console.log('------------------------');
            showNotification('블록 설치 명령을 실행합니다...');
            
            let code = '';
            let nextBlock = targetBlock.getInputTargetBlock('NEXT');
            
            while (nextBlock) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    isExecuting = false;
                    return;
                }
                
                // 코드 생성기 재초기화
                Blockly.JavaScript.init(workspace);
                
                if (Blockly.JavaScript[nextBlock.type]) {
                    code += Blockly.JavaScript[nextBlock.type](nextBlock);
                } else {
                    console.warn(`블록 타입 "${nextBlock.type}"에 대한 코드 생성기가 없습니다.`);
                }
                
                nextBlock = nextBlock.getNextBlock();
            }
            
            // 디버깅을 위한 생성된 코드 출력
            console.log('생성된 코드:', code);
            
            await eval('(async () => { ' + code + ' })()');
            console.log('------------------------');
            console.log('=== 실행 완료 ===\n');
            showNotification('블록 설치 실행이 완료되었습니다.');
        } catch (e) {
            console.log('❌ 실행 중 오류 발생');
            console.error('오류 내용:', e);
            showNotification('실행 중 오류가 발생했습니다: ' + e.message);
        } finally {
            isExecuting = false;
            shouldStop = false;
        }
    } else {
        console.log('❌ 블록 설치 블록을 찾을 수 없음');
        showNotification('해당 블록 설치 블록을 찾을 수 없습니다.');
    }
});

// 블록 파괴 이벤트 처리
socket.on('executeBlockBrokenCommands', async function(blockId) {
    if (isExecuting) {
        showNotification('이미 실행 중입니다.');
        return;
    }
    
    const blocks = workspace.getTopBlocks(true);
    const eventBlocks = blocks.filter(block => block.type === 'on_block_broken');
    
    const targetBlock = eventBlocks.find(block => block.id === blockId);
    if (targetBlock) {
        try {
            isExecuting = true;
            shouldStop = false;
            console.log('\n=== 블록 파괴 실행 시작 ===');
            console.log('블록 ID:', blockId);
            console.log('------------------------');
            showNotification('블록 파괴 명령을 실행합니다...');
            
            let code = '';
            let nextBlock = targetBlock.getInputTargetBlock('NEXT');
            
            while (nextBlock) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    isExecuting = false;
                    return;
                }
                
                // 코드 생성기 재초기화
                Blockly.JavaScript.init(workspace);
                
                if (Blockly.JavaScript[nextBlock.type]) {
                    code += Blockly.JavaScript[nextBlock.type](nextBlock);
                } else {
                    console.warn(`블록 타입 "${nextBlock.type}"에 대한 코드 생성기가 없습니다.`);
                }
                
                nextBlock = nextBlock.getNextBlock();
            }
            
            // 디버깅을 위한 생성된 코드 출력
            console.log('생성된 코드:', code);
            
            await eval('(async () => { ' + code + ' })()');
            console.log('------------------------');
            console.log('=== 실행 완료 ===\n');
            showNotification('블록 파괴 실행이 완료되었습니다.');
        } catch (e) {
            console.log('❌ 실행 중 오류 발생');
            console.error('오류 내용:', e);
            showNotification('실행 중 오류가 발생했습니다: ' + e.message);
        } finally {
            isExecuting = false;
            shouldStop = false;
        }
    } else {
        console.log('❌ 블록 파괴 블록을 찾을 수 없음');
        showNotification('해당 블록 파괴 블록을 찾을 수 없습니다.');
    }
});

// 몹 처치 이벤트 처리
socket.on('executeMobKilledCommands', async function(blockId) {
    if (isExecuting) {
        showNotification('이미 실행 중입니다.');
        return;
    }

    const blocks = workspace.getTopBlocks(true);
    const eventBlocks = blocks.filter(block => block.type === 'on_mob_killed');

    const targetBlock = eventBlocks.find(block => block.id === blockId);
    if (targetBlock) {
        try {
            isExecuting = true;
            shouldStop = false;
            console.log('\n=== 몹 처치 실행 시작 ===');
            console.log('블록 ID:', blockId);
            console.log('------------------------');
            showNotification('몹 처치 명령을 실행합니다...');

            let code = '';
            let nextBlock = targetBlock.getInputTargetBlock('NEXT');

            while (nextBlock) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    isExecuting = false;
                    return;
                }

                // 코드 생성기 재초기화
                Blockly.JavaScript.init(workspace);

                if (Blockly.JavaScript[nextBlock.type]) {
                    code += Blockly.JavaScript[nextBlock.type](nextBlock);
                } else {
                    console.warn(`블록 타입 "${nextBlock.type}"에 대한 코드 생성기가 없습니다.`);
                }

                nextBlock = nextBlock.getNextBlock();
            }

            // 디버깅을 위한 생성된 코드 출력
            console.log('생성된 코드:', code);

            await eval('(async () => { ' + code + ' })()');
            console.log('------------------------');
            console.log('=== 실행 완료 ===\n');
            showNotification('몹 처치 실행이 완료되었습니다.');
        } catch (e) {
            console.log('❌ 실행 중 오류 발생');
            console.error('오류 내용:', e);
            showNotification('실행 중 오류가 발생했습니다: ' + e.message);
        } finally {
            isExecuting = false;
            shouldStop = false;
        }
    } else {
        console.log('❌ 몹 처치 블록을 찾을 수 없음');
        showNotification('해당 몹 처치 블록을 찾을 수 없습니다.');
    }
});

// 명령어 실행 이벤트 처리
socket.on('executeCommands', async function(data) {
    // 이전 버전 호환성을 위해 data가 문자열인 경우 처리
    const blockId = typeof data === 'string' ? data : data.blockId;
    const executingPlayer = typeof data === 'object' ? data.executingPlayer : null;
    
    // 전역 변수로 현재 실행하는 플레이어 정보 저장
    window.currentExecutingPlayer = executingPlayer;
    
    if (isExecuting) {
        showNotification('이미 실행 중입니다.');
        return;
    }
    
    const blocks = workspace.getTopBlocks(true);
    const eventBlocks = blocks.filter(block => block.type === 'on_chat_command');
    
    const targetBlock = eventBlocks.find(block => block.id === blockId);
    if (targetBlock) {
        try {
            isExecuting = true;
            shouldStop = false;
            console.log('\n=== 명령어 실행 시작 ===');
            if (executingPlayer) {
                console.log('실행 플레이어:', executingPlayer);
            }
            console.log('블록 ID:', blockId);
            console.log('------------------------');
            showNotification('명령을 실행합니다...');
            
            let code = '';
            let nextBlock = targetBlock.getInputTargetBlock('NEXT');
            
            while (nextBlock) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    isExecuting = false;
                    return;
                }
                
                // 코드 생성기 재초기화
                Blockly.JavaScript.init(workspace);
                
                if (Blockly.JavaScript[nextBlock.type]) {
                    code += Blockly.JavaScript[nextBlock.type](nextBlock);
                } else {
                    console.warn(`블록 타입 "${nextBlock.type}"에 대한 코드 생성기가 없습니다.`);
                }
                
                nextBlock = nextBlock.getNextBlock();
            }
            
            // 디버깅을 위한 생성된 코드 출력
            console.log('생성된 코드:', code);
            
            await eval('(async () => { ' + code + ' })()');
            console.log('------------------------');
            console.log('=== 실행 완료 ===\n');
            showNotification('실행이 완료되었습니다.');
        } catch (e) {
            console.log('❌ 실행 중 오류 발생');
            console.error('오류 내용:', e);
            showNotification('실행 중 오류가 발생했습니다: ' + e.message);
        } finally {
            isExecuting = false;
            shouldStop = false;
        }
    } else {
        console.log('❌ 명령어 블록을 찾을 수 없음');
        showNotification('해당 명령어 블록을 찾을 수 없습니다.');
    }
});

// 파일 저장 기능
function saveWorkspace() {
    try {
        // 현재 워크스페이스의 블록 확인
        const topBlocks = workspace.getTopBlocks(true);
        console.log('💾 저장할 블록 수:', topBlocks.length);
        console.log('📦 저장할 블록 타입들:', topBlocks.map(b => b.type));
        
        if (topBlocks.length === 0) {
            showNotification('저장할 블록이 없습니다.');
            return;
        }
        
        // 현재 워크스페이스를 XML로 변환
        const xml = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToPrettyText(xml);
        
        console.log('📄 생성된 XML 미리보기:', xmlText.substring(0, 200) + '...');
        
        // 사용자에게 파일 이름 입력 받기
        const now = new Date();
        const timestamp = now.getFullYear() + 
            String(now.getMonth() + 1).padStart(2, '0') + 
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') + 
            String(now.getMinutes()).padStart(2, '0');
        const defaultName = `마인크래프트_블록_${timestamp}`;
        
        const userFileName = prompt('파일 이름을 입력하세요:', defaultName);
        if (!userFileName) {
            showNotification('저장이 취소되었습니다.');
            return;
        }
        
        // .xml 확장자 자동 추가 (없을 경우)
        const filename = userFileName.endsWith('.xml') ? userFileName : `${userFileName}.xml`;
        
        // 파일 다운로드
        const blob = new Blob([xmlText], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ 파일 저장 완료:', filename);
        showNotification(`파일이 저장되었습니다: ${filename} (${topBlocks.length}개 블록)`);
    } catch (error) {
        console.error('❌ 파일 저장 실패:', error);
        showNotification('파일 저장에 실패했습니다: ' + error.message);
    }
}

// 파일 불러오기 기능
function loadWorkspace() {
    try {
        // 숨겨진 파일 입력 요소 생성
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml';
        input.style.display = 'none';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const xmlText = e.target.result;
                    console.log('📄 파일 내용 미리보기:', xmlText.substring(0, 200) + '...');
                    
                    // 기존 워크스페이스 내용 지우기
                    workspace.clear();
                    console.log('🧹 워크스페이스 초기화 완료');
                    
                    // DOMParser를 사용한 XML 파싱
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                    
                    // 파싱 오류 확인
                    const parseError = xmlDoc.querySelector('parsererror');
                    if (parseError) {
                        throw new Error('XML 파싱 오류: ' + parseError.textContent);
                    }
                    
                    console.log('📋 XML 파싱 완료');
                    
                    // 블록들 로드
                    Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
                    
                    // 로드된 블록 수 확인
                    const loadedBlocks = workspace.getTopBlocks(true);
                    console.log('🔢 로드된 블록 수:', loadedBlocks.length);
                    console.log('📦 로드된 블록 타입들:', loadedBlocks.map(b => b.type));
                    
                    // 워크스페이스 렌더링 강제 새로고침
                    workspace.render();
                    
                    console.log('✅ 파일 불러오기 완료:', file.name);
                    showNotification(`파일을 불러왔습니다: ${file.name} (${loadedBlocks.length}개 블록)`);
                    
                } catch (error) {
                    console.error('❌ 파일 불러오기 실패:', error);
                    showNotification('파일 불러오기에 실패했습니다: ' + error.message);
                }
            };
            
            reader.readAsText(file);
            document.body.removeChild(input);
        };
        
        document.body.appendChild(input);
        input.click();
    } catch (error) {
        console.error('❌ 파일 불러오기 실패:', error);
        showNotification('파일 불러오기에 실패했습니다: ' + error.message);
    }
}