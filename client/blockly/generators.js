// 코드 생성기 정의

// 변수 관련 코드 생성기
Blockly.JavaScript['variables_get'] = function(block) {
    const varName = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    return [varName, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['variables_set'] = function(block) {
    const argument0 = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
    const varName = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    return `${varName} = ${argument0};\n`;
};

// 변수 값 바꾸기 코드 생성기
Blockly.JavaScript['math_change'] = function(block) {
    const argument0 = Blockly.JavaScript.valueToCode(block, 'DELTA', Blockly.JavaScript.ORDER_ADDITION) || '0';
    const varName = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
    return `${varName} = (typeof ${varName} == 'number' ? ${varName} : 0) + Number(${argument0});\n`;
};

// 블록 타입 코드 생성기
Blockly.JavaScript.forBlock['block_type'] = function(block) {
    const blockType = block.getFieldValue('BLOCK_TYPE');
    return [`"${blockType}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

// 블록 설치 코드 생성기
Blockly.JavaScript['set_block'] = function(block) {
    const position = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_ATOMIC) || '{"x":0, "y":0, "z":0, "isAbsolute":false}';
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    
    return `
        await (async () => {
            if (shouldStop) {
                console.log('실행이 중단되었습니다.');
                return;
            }
            await new Promise(resolve => {
                const pos = JSON.parse(${position});
                socket.emit("setblock", {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    blockType: ${blockType},
                    isAbsolute: pos.isAbsolute
                });
                setTimeout(resolve, 150);
                console.log('블록 설치:', pos, '타입:', ${blockType});
            });
        })();
    `;
};

// 좌표 블록 코드 생성기
Blockly.JavaScript.forBlock['coordinate_pos'] = function(block) {
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const z = Blockly.JavaScript.valueToCode(block, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const posObj = `{"x": Number(${x}), "y": Number(${y}), "z": Number(${z}), "isAbsolute": false}`;
    return [`JSON.stringify(${posObj})`, Blockly.JavaScript.ORDER_ATOMIC];
};

// 절대좌표 블록 코드 생성기
Blockly.JavaScript.forBlock['world_pos'] = function(block) {
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const z = Blockly.JavaScript.valueToCode(block, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const posObj = `{"x": Number(${x}), "y": Number(${y}), "z": Number(${z}), "isAbsolute": true}`;
    return [`JSON.stringify(${posObj})`, Blockly.JavaScript.ORDER_ATOMIC];
};

// 에이전트 이동 코드 생성기
Blockly.JavaScript['agent_move'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    const distance = Blockly.JavaScript.valueToCode(block, 'DISTANCE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    let command = '';
    let delay = 200;
    
    switch(direction) {
        case 'forward': command = 'goforward'; break;
        case 'back': command = 'goBack'; break;
        case 'up': command = 'goUp'; break;
        case 'down': command = 'goDown'; break;
        case 'left': command = 'goLeft'; break;
        case 'right': command = 'goRight'; break;
    }
    
    return `
        await (async () => {
            console.log('\\n=== 이동 명령 실행 시작 ===');
            console.log('방향: ${direction}, 거리: ${distance}칸');
            console.log('------------------------');

            for (let i = 0; i < ${distance}; i++) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    showNotification('실행이 중단되었습니다.');
                    return;
                }
                
                await new Promise(resolve => {
                    socket.emit("${command}");
                    setTimeout(resolve, ${delay});
                });
            }

            console.log('=== 이동 완료 ===\\n');
        })();
    `;
};

// 회전 명령 코드 생성기
Blockly.JavaScript['agent_turn'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    let command = direction === 'left' ? 'rotateLeft' : 'rotateRight';
    return `await new Promise(resolve => {
        socket.emit("${command}");
        setTimeout(resolve, 50);
    });\n`;
};

// 블록 파괴 명령 코드 생성기
Blockly.JavaScript['agent_destroy'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    return `await new Promise(resolve => {
        socket.emit("destroy", "${direction}");
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 공격 명령 코드 생성기
Blockly.JavaScript['agent_attack'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("attack");
        setTimeout(resolve, 150);
    });\n`;
};

// 블록 설치 명령 코드 생성기
Blockly.JavaScript['agent_place'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    return `await new Promise(resolve => {
        socket.emit("place", "${direction}");
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 생성 명령 코드 생성기
Blockly.JavaScript['agent_spawn'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("spawn");
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 텔레포트 명령 코드 생성기
Blockly.JavaScript['agent_tp'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("tp");
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 텔레포트 위치 코드 생성기
Blockly.JavaScript['agent_tp_pos'] = function(block) {
    const position = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_ATOMIC);
    const facing = block.getFieldValue('FACING');
    
    console.log('생성된 위치 코드:', position);
    console.log('바라보는 방향:', facing);
    
    if (!position) {
        console.log('위치 정보가 없음, 기본 텔레포트 실행');
        return `await new Promise(resolve => {
            socket.emit("tp");
            setTimeout(resolve, 150);
        });\n`;
    }
    
    const code = `await new Promise(resolve => {
        const pos = JSON.parse(${position});
        console.log('파싱된 위치 정보:', pos);
        socket.emit("tpPos", {
            x: pos.x, 
            y: pos.y, 
            z: pos.z, 
            facing: "${facing}",
            isAbsolute: pos.isAbsolute
        });
        setTimeout(resolve, 150);
    });\n`;
    
    console.log('생성된 최종 코드:', code);
    return code;
};

// 에이전트 슬롯 선택 명령 코드 생성기
Blockly.JavaScript['agent_set_slot'] = function(block) {
    const slot = Blockly.JavaScript.valueToCode(block, 'SLOT', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return `await new Promise(resolve => {
        socket.emit("setSlot", ${slot});
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 모든 아이템 버리기 명령 코드 생성기
Blockly.JavaScript['agent_drop_all'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("dropAll");
        setTimeout(resolve, 150);
    });\n`;
};

// 에이전트 슬롯 아이템 버리기 명령 코드 생성기
Blockly.JavaScript['agent_drop_slot'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("dropSlotItem");
        setTimeout(resolve, 150);
    });\n`;
};

// 아이템 줍기 코드 생성기
Blockly.JavaScript['agent_collect'] = function(block) {
    return `await new Promise(resolve => {
        socket.emit("collect");
        setTimeout(resolve, 150);
    });\n`;
};

// 경작 명령 코드 생성기
Blockly.JavaScript['agent_till'] = function(block) {
    const direction = block.getFieldValue('DIRECTION');
    return `await new Promise(resolve => {
        socket.emit("till", "${direction}");
        setTimeout(resolve, 150);
    });\n`;
};

// 채팅명령어 코드 생성기
Blockly.JavaScript['on_chat_command'] = function(block) {
    const command = block.getFieldValue('COMMAND');
    const blockId = block.id;
    const nextCode = Blockly.JavaScript.statementToCode(block, 'NEXT');
    
    socket.emit('updateExecutionCommand', { command, blockId });
    return nextCode;
};

// 커스텀 반복 명령 블록의 코드 생성기
Blockly.JavaScript['custom_repeat'] = function(block) {
    const times = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    let innerBlock = block.getInputTargetBlock('DO');
    let innerCode = '';
    
    while (innerBlock) {
        innerCode += Blockly.JavaScript[innerBlock.type](innerBlock);
        innerBlock = innerBlock.getNextBlock();
    }

    return `
        await (async () => {
            for (let i = 0; i < ${times}; i++) {
                if (shouldStop) {
                    console.log('실행이 중단되었습니다.');
                    return;
                }
                console.log('\\n=== 반복 실행:', i + 1, '===');
                ${innerCode}
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        })();
    `;
};

// 텍스트 출력 코드 생성기
Blockly.JavaScript['text_print'] = function(block) {
    const msg = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_NONE) || '\'\'';
    
    return `
        await (async () => {
            if (shouldStop) {
                console.log('실행이 중단되었습니다.');
                return;
            }
            await new Promise(resolve => {
                socket.emit('say', ${msg});
                setTimeout(resolve, 150);
            });
        })();
    `;
};

// 텍스트 결합 코드 생성기
Blockly.JavaScript['text_join'] = function(block) {
    const values = [];
    for (let i = 0; i < block.itemCount_; i++) {
        const valueCode = Blockly.JavaScript.valueToCode(block, 'ADD' + i,
            Blockly.JavaScript.ORDER_NONE) || '\'\'';
        values.push(valueCode);
    }
    return [values.join(' + \' \' + '), Blockly.JavaScript.ORDER_ADDITION];
};

// controls_if 블록의 코드 생성기 수정
Blockly.JavaScript['controls_if'] = function(block) {
    // 조건문과 실행 코드 생성
    let n = 0;
    let code = '', conditionCode;
    do {
        conditionCode = Blockly.JavaScript.valueToCode(block, 'IF' + n,
            Blockly.JavaScript.ORDER_NONE) || 'false';
        
        // DO 입력의 내부 블록들을 직접 처리
        let branchBlock = block.getInputTargetBlock('DO' + n);
        let branchCode = '';
        while (branchBlock) {
            branchCode += Blockly.JavaScript[branchBlock.type](branchBlock);
            branchBlock = branchBlock.getNextBlock();
        }
        
        code += (n == 0 ? 'if (' : 'else if (') + conditionCode + ') {\n' + branchCode + '}';
        ++n;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        // ELSE 입력의 내부 블록들을 직접 처리
        let elseBlock = block.getInputTargetBlock('ELSE');
        let elseCode = '';
        while (elseBlock) {
            elseCode += Blockly.JavaScript[elseBlock.type](elseBlock);
            elseBlock = elseBlock.getNextBlock();
        }
        code += ' else {\n' + elseCode + '}';
    }
    
    // 비동기 처리를 위해 async 함수로 감싸기
    return `
        await (async () => {
            ${code}
        })();
    `;
}; 