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

// 아이템 타입 코드 생성기
Blockly.JavaScript.forBlock['item_type'] = function(block) {
    const itemType = block.getFieldValue('ITEM_TYPE');
    return [`"${itemType}"`, Blockly.JavaScript.ORDER_ATOMIC];
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
            // 위치 정보를 먼저 해결
            const positionData = ${position};
            const pos = JSON.parse(positionData);
            
            await new Promise(resolve => {
                console.log('🔨 setblock 이벤트 전송 준비');
                console.log('  위치:', pos);
                console.log('  블록 타입:', ${blockType});
                console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
                
                if (socket && socket.connected) {
                    socket.emit("setblock", {
                        x: pos.x,
                        y: pos.y,
                        z: pos.z,
                        blockType: ${blockType},
                        isAbsolute: pos.isAbsolute,
                        isCamera: pos.isCamera,
                        isFacing: pos.isFacing,
                        isLocal: pos.isLocal,
                        executingPlayer: window.currentExecutingPlayer
                    });
                    console.log('✅ setblock 이벤트 전송 완료');
                } else {
                    console.error('❌ 소켓이 연결되지 않아 setblock 전송 실패');
                }
                
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

// 바라보는 방향 기준 좌표 코드 생성기
Blockly.JavaScript['facing_pos'] = function(block) {
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const z = Blockly.JavaScript.valueToCode(block, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const posObj = `{"x": Number(${x}), "y": Number(${y}), "z": Number(${z}), "isAbsolute": false, "isFacing": true, "isLocal": true}`;
    return [`JSON.stringify(${posObj})`, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원
Blockly.JavaScript.forBlock['facing_pos'] = Blockly.JavaScript['facing_pos'];

// 카메라 상대 위치 블록 코드 생성기
Blockly.JavaScript['camera_pos'] = function(block) {
    const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const z = Blockly.JavaScript.valueToCode(block, 'Z', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const posObj = `{"x": Number(${x}), "y": Number(${y}), "z": Number(${z}), "isAbsolute": false, "isCamera": true}`;
    return [`JSON.stringify(${posObj})`, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원
Blockly.JavaScript.forBlock['camera_pos'] = Blockly.JavaScript['camera_pos'];


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
    
    console.log('생성된 위치 코드:', position);
    
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
            isAbsolute: pos.isAbsolute,
            isCamera: pos.isCamera || false,
            isLocal: pos.isLocal || false,
            isFacing: pos.isFacing || false,
            executingPlayer: window.currentExecutingPlayer
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

// 아이템 획득 코드 생성기
Blockly.JavaScript.forBlock['on_item_use'] = function(block) {
    const nextCode = Blockly.JavaScript.statementToCode(block, 'NEXT');
    return nextCode;
};

// 블록 설치 감지 코드 생성기
Blockly.JavaScript.forBlock['on_block_placed'] = function(block) {
    const nextCode = Blockly.JavaScript.statementToCode(block, 'NEXT');
    return nextCode;
};

// 블록 파괴 감지 코드 생성기
Blockly.JavaScript.forBlock['on_block_broken'] = function(block) {
    const nextCode = Blockly.JavaScript.statementToCode(block, 'NEXT');
    return nextCode;
};

// 플레이어 동작 감지 코드 생성기 (Hat 블록 - 코드 생성하지 않음)
Blockly.JavaScript.forBlock['on_player_travelled'] = function(block) {
    const nextCode = Blockly.JavaScript.statementToCode(block, 'NEXT');
    return nextCode;
};

// 아이템 받기 코드 생성기
Blockly.JavaScript['give_item'] = function(block) {
    const target = Blockly.JavaScript.valueToCode(block, 'TARGET', Blockly.JavaScript.ORDER_ATOMIC) || '"@s"';
    const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_ATOMIC) || '"apple"';
    const count = Blockly.JavaScript.valueToCode(block, 'COUNT', Blockly.JavaScript.ORDER_ATOMIC) || '1';
    
    return `
        await (async () => {
            if (shouldStop) {
                console.log('실행이 중단되었습니다.');
                return;
            }
            await new Promise(resolve => {
                const command = \`give \${${target}} \${${item}} \${${count}}\`;
                const commandData = {
                    command: command,
                    executingPlayer: window.currentExecutingPlayer
                };
                socket.emit("executeCommand", commandData);
                setTimeout(resolve, 150);
                console.log('아이템 지급 명령어:', command);
                if (window.currentExecutingPlayer) {
                    console.log('실행 플레이어:', window.currentExecutingPlayer);
                }
            });
        })();
    `;
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
                socket.emit('say', {
                    message: ${msg},
                    executingPlayer: window.currentExecutingPlayer
                });
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

// 블록 채우기 코드 생성기
Blockly.JavaScript['fill_blocks'] = function(block) {
    const startPos = Blockly.JavaScript.valueToCode(block, 'START_POS', Blockly.JavaScript.ORDER_ATOMIC) || '{"x":0, "y":0, "z":0, "isAbsolute":false}';
    const endPos = Blockly.JavaScript.valueToCode(block, 'END_POS', Blockly.JavaScript.ORDER_ATOMIC) || '{"x":0, "y":0, "z":0, "isAbsolute":false}';
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    const fillMode = block.getFieldValue('FILL_MODE');
    
    return `
        await (async () => {
            if (shouldStop) {
                console.log('실행이 중단되었습니다.');
                return;
            }
            await new Promise(async resolve => {
                const start = JSON.parse(${startPos});
                const end = JSON.parse(${endPos});
                
                // 카메라 위치 처리를 위한 prefix 결정
                let startPrefix, endPrefix;
                
                if (start.isFacing) {
                    startPrefix = '^';
                } else if (start.isCamera) {
                    // 카메라 위치는 서버에서 처리하도록 상대 좌표로 표시
                    startPrefix = '~';
                    console.log('🎯 시작점 카메라 위치 감지 - 서버에서 처리됩니다');
                } else if (start.isAbsolute) {
                    startPrefix = '';
                } else {
                    startPrefix = '~';
                }
                
                if (end.isFacing) {
                    endPrefix = '^';
                } else if (end.isCamera) {
                    // 카메라 위치는 서버에서 처리하도록 상대 좌표로 표시
                    endPrefix = '~';
                    console.log('🎯 끝점 카메라 위치 감지 - 서버에서 처리됩니다');
                } else if (end.isAbsolute) {
                    endPrefix = '';
                } else {
                    endPrefix = '~';
                }
                
                const command = \`fill \${startPrefix}\${start.x} \${startPrefix}\${start.y} \${startPrefix}\${start.z} \${endPrefix}\${end.x} \${endPrefix}\${end.y} \${endPrefix}\${end.z} \${${blockType}} ${fillMode}\`;
                socket.emit("fill", {
                    command: command,
                    startPos: start,
                    endPos: end,
                    blockType: ${blockType},
                    fillMode: '${fillMode}',
                    executingPlayer: window.currentExecutingPlayer
                });
                setTimeout(resolve, 150);
                console.log('블록 채우기:', command);
            });
        })();
    `;
};

// 블록 탐지 코드 생성기
Blockly.JavaScript['block_detect'] = function(block) {
    const position = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_ATOMIC) || '{"x":0, "y":0, "z":0, "isAbsolute":false}';
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    
    const code = `(await (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        const pos = JSON.parse(${position});
        
        console.log('🔍 블록 탐지 시작');
        console.log('  위치 정보:', pos);
        console.log('  실행 플레이어:', executingPlayer);
        
        // 좌표 접두사 결정
        let coordPrefix;
        if (pos.isFacing || pos.isLocal) {
            coordPrefix = '^';
            console.log('  → ^ 좌표 사용 (바라보는 방향 위치)');
        } else if (pos.isCamera) {
            // 카메라 위치는 서버에서 처리하도록 정보 전달
            coordPrefix = '~';
            console.log('  → 카메라 상대 위치 감지 - 서버로 전달');
        } else if (pos.isAbsolute) {
            coordPrefix = '';
            console.log('  → 절대 좌표 사용');
        } else {
            coordPrefix = '~';
            console.log('  → ~ 좌표 사용 (상대 좌표)');
        }
        
        const command = \`testforblock \${coordPrefix}\${pos.x} \${coordPrefix}\${pos.y} \${coordPrefix}\${pos.z} \${${blockType}}\`;
        console.log('🔍 명령어:', command);
        
        return new Promise(resolve => {
            // 기존 blockDetectResult 리스너들을 모두 제거
            socket.off('blockDetectResult');
            
            // 서버에서 블록 탐지 결과를 받는 리스너 설정
            const resultListener = (result) => {
                console.log('🔍 블록 탐지 결과 수신:', result);
                socket.off('blockDetectResult', resultListener);
                resolve(result);
            };
            socket.on('blockDetectResult', resultListener);
            
            // 명령어 실행 (위치 정보도 함께 전달)
            socket.emit("blockDetect", {
                command: command,
                position: pos,
                blockType: ${blockType},
                executingPlayer: executingPlayer
            });
            
            // 타임아웃 설정 (3초 후 실패로 간주)
            setTimeout(() => {
                console.log('🔍 블록 탐지 타임아웃');
                socket.off('blockDetectResult', resultListener);
                resolve(false);
            }, 3000);
        });
    })())`;
    
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원
Blockly.JavaScript.forBlock['block_detect'] = Blockly.JavaScript['block_detect'];

// 몹 타입 코드 생성기
Blockly.JavaScript['mob_type'] = function(block) {
    const mobType = block.getFieldValue('MOB_TYPE');
    return [`"${mobType}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

// 마법 타입 코드 생성기
Blockly.JavaScript['magic_type'] = function(block) {
    const magicType = block.getFieldValue('MAGIC_TYPE');
    return [`"${magicType}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원
Blockly.JavaScript.forBlock['mob_type'] = Blockly.JavaScript['mob_type'];
Blockly.JavaScript.forBlock['magic_type'] = Blockly.JavaScript['magic_type'];

// 대상 선택 코드 생성기
Blockly.JavaScript['target_selector'] = function(block) {
    const target = block.getFieldValue('TARGET');
    return [`"${target}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원
Blockly.JavaScript.forBlock['target_selector'] = Blockly.JavaScript['target_selector'];

// 몹 소환 코드 생성기
Blockly.JavaScript['mob_summon'] = function(block) {
    const mobType = Blockly.JavaScript.valueToCode(block, 'MOB_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"pig"';
    const position = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_ATOMIC) || '{"x":0, "y":0, "z":0, "isAbsolute":false}';
    
    return `(async () => {
        if (shouldStop) {
            console.log('실행이 중단되었습니다.');
            return;
        }
        await new Promise(resolve => {
            const pos = JSON.parse(${position});
            socket.emit("summon", {
                mobType: ${mobType},
                position: pos,
                executingPlayer: window.currentExecutingPlayer
            });
            setTimeout(resolve, 150);
            console.log('몹 소환 - 타입:', ${mobType}, '위치:', pos);
        });
    })();\n`;
}; 

// 원 모양 만들기 코드 생성기
Blockly.JavaScript['create_circle'] = function(block) {
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    const center = Blockly.JavaScript.valueToCode(block, 'CENTER', Blockly.JavaScript.ORDER_ATOMIC);
    const radius = Blockly.JavaScript.valueToCode(block, 'RADIUS', Blockly.JavaScript.ORDER_ATOMIC) || '5';
    const direction = block.getFieldValue('DIRECTION');
    const mode = block.getFieldValue('MODE');

    return `
    (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        const centerData = ${center};
        const centerPos = JSON.parse(centerData);
        const r = ${radius};
        const blockType = ${blockType};
        
        console.log('🔴 원 모양 생성 요청');
        console.log('  원본 중심:', centerPos);
        console.log('  반지름:', r);
        console.log('  방향:', '${direction}');
        console.log('  모드:', '${mode}');
        console.log('  블록 타입:', blockType);
        console.log('  실행 플레이어:', executingPlayer);
        
        // 상대좌표인 경우 클라이언트에서 미리 절대좌표로 변환
        let finalCenter = centerPos;
        if (centerPos.isAbsolute === false && !centerPos.isCamera && !centerPos.isLocal && executingPlayer && executingPlayer !== 'Unknown') {
            console.log('📍 상대좌표 감지 - 클라이언트에서 위치 조회 중...');
            
            // 플레이어 위치 조회 (player_position 블록과 동일한 로직)
            const playerPosition = await new Promise(resolve => {
                const resultListener = (result) => {
                    socket.off('playerPositionResult', resultListener);
                    resolve(result);
                };
                socket.on('playerPositionResult', resultListener);
                
                socket.emit("getPlayerPosition", { player: executingPlayer });
                
                setTimeout(() => {
                    socket.off('playerPositionResult', resultListener);
                    console.log('⏰ 플레이어 위치 조회 타임아웃 - 기본값 사용');
                    resolve({ x: 0, y: 0, z: 0 });
                }, 3000);
            });
            
            // 절대좌표로 변환
            finalCenter = {
                x: playerPosition.x + centerPos.x,
                y: playerPosition.y + centerPos.y,
                z: playerPosition.z + centerPos.z,
                isAbsolute: true
            };
            
            console.log('🎯 클라이언트에서 좌표 변환 완료:');
            console.log('  플레이어 위치:', playerPosition);
            console.log('  상대 오프셋:', centerPos);
            console.log('  최종 중심:', finalCenter);
        }
        
        console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
        
        // 서버로 원 생성 요청 전송
        if (socket && socket.connected) {
            socket.emit("createCircle", {
                center: finalCenter,
                radius: r,
                direction: '${direction}',
                mode: '${mode}',
                blockType: blockType,
                executingPlayer: executingPlayer
            });
            console.log('✅ 원 모양 생성 요청 전송 완료');
        } else {
            console.error('❌ 소켓 연결이 되어있지 않음');
        }
    })();\n`;
};

// 공 모양 만들기 코드 생성기
Blockly.JavaScript['create_sphere'] = function(block) {
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    const center = Blockly.JavaScript.valueToCode(block, 'CENTER', Blockly.JavaScript.ORDER_ATOMIC);
    const radius = Blockly.JavaScript.valueToCode(block, 'RADIUS', Blockly.JavaScript.ORDER_ATOMIC) || '5';
    const mode = block.getFieldValue('MODE');

    return `
    (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        const centerData = ${center};
        const centerPos = JSON.parse(centerData);
        const r = ${radius};
        const blockType = ${blockType};
        
        console.log('⚪ 공 모양 생성 요청');
        console.log('  원본 중심:', centerPos);
        console.log('  반지름:', r);
        console.log('  모드:', '${mode}');
        console.log('  블록 타입:', blockType);
        console.log('  실행 플레이어:', executingPlayer);
        
        // 상대좌표인 경우 클라이언트에서 미리 절대좌표로 변환
        let finalCenter = centerPos;
        if (centerPos.isAbsolute === false && !centerPos.isCamera && !centerPos.isLocal && executingPlayer && executingPlayer !== 'Unknown') {
            console.log('📍 상대좌표 감지 - 클라이언트에서 위치 조회 중...');
            
            const playerPosition = await new Promise(resolve => {
                const resultListener = (result) => {
                    socket.off('playerPositionResult', resultListener);
                    resolve(result);
                };
                socket.on('playerPositionResult', resultListener);
                
                socket.emit("getPlayerPosition", { player: executingPlayer });
                
                setTimeout(() => {
                    socket.off('playerPositionResult', resultListener);
                    console.log('⏰ 플레이어 위치 조회 타임아웃 - 기본값 사용');
                    resolve({ x: 0, y: 0, z: 0 });
                }, 3000);
            });
            
            finalCenter = {
                x: playerPosition.x + centerPos.x,
                y: playerPosition.y + centerPos.y,
                z: playerPosition.z + centerPos.z,
                isAbsolute: true
            };
            
            console.log('🎯 클라이언트에서 좌표 변환 완료 (구)');
        }
        
        console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
        
        // 서버로 구 생성 요청 전송
        if (socket && socket.connected) {
            socket.emit("createSphere", {
                center: finalCenter,
                radius: r,
                mode: '${mode}',
                blockType: blockType,
                executingPlayer: executingPlayer
            });
            console.log('✅ 공 모양 생성 요청 전송 완료');
        } else {
            console.error('❌ 소켓 연결이 되어있지 않음');
        }
    })();\n`;
};

// 반구 모양 만들기 코드 생성기
Blockly.JavaScript['create_hemisphere'] = function(block) {
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"stone"';
    const center = Blockly.JavaScript.valueToCode(block, 'CENTER', Blockly.JavaScript.ORDER_ATOMIC);
    const radius = Blockly.JavaScript.valueToCode(block, 'RADIUS', Blockly.JavaScript.ORDER_ATOMIC) || '5';
    const axis = block.getFieldValue('AXIS');
    const mode = block.getFieldValue('MODE');

    return `
    (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        const centerPos = JSON.parse(${center});
        const r = ${radius};
        const blockType = ${blockType};
        let finalCenter = centerPos;
        
        console.log('🌗 반구 모양 생성 요청 (최적화됨)');
        console.log('  중심:', centerPos);
        console.log('  반지름:', r);
        console.log('  축:', '${axis}');
        console.log('  모드:', '${mode}');
        console.log('  블록 타입:', blockType);
        console.log('  실행 플레이어:', executingPlayer);
        console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
        
        // 클라이언트에서 상대좌표 변환 (서버 지연 제거)
        if (centerPos.isAbsolute === false && !centerPos.isCamera && !centerPos.isLocal && executingPlayer && executingPlayer !== 'Unknown') {
            console.log('📍 클라이언트에서 상대좌표 변환 중...');
            const playerPosition = await new Promise(resolve => {
                const resultListener = (result) => {
                    socket.off('playerPositionResult', resultListener);
                    resolve(result);
                };
                socket.on('playerPositionResult', resultListener);
                socket.emit("getPlayerPosition", { player: executingPlayer });
            });
            
            finalCenter = {
                x: playerPosition.x + centerPos.x,
                y: playerPosition.y + centerPos.y,
                z: playerPosition.z + centerPos.z,
                isAbsolute: true
            };
            console.log('📍 변환된 절대 좌표:', finalCenter);
        }
        
        // 서버로 반구 생성 요청 전송
        if (socket && socket.connected) {
            socket.emit("createHemisphere", {
                center: finalCenter,
                radius: r,
                axis: '${axis}',
                mode: '${mode}',
                blockType: blockType,
                executingPlayer: executingPlayer
            });
            console.log('✅ 반구 모양 생성 요청 전송 완료');
        } else {
            console.error('❌ 소켓 연결이 되어있지 않음');
        }
    })();\n`;
};
// 플레이어 현재 위치 코드 생성기
Blockly.JavaScript['player_position'] = function(block) {
    const code = `(await (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        
        console.log('📍 플레이어 위치 조회 요청');
        console.log('  대상 플레이어:', executingPlayer);
        console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
        
        return new Promise(resolve => {
            // 서버에서 플레이어 위치 결과를 받는 리스너 설정
            const resultListener = (result) => {
                console.log('📍 플레이어 위치 결과 수신:', result);
                socket.off('playerPositionResult', resultListener);
                
                // 절대좌표 형식으로 반환
                const positionData = {
                    x: result.x || 0,
                    y: result.y || 0, 
                    z: result.z || 0,
                    isAbsolute: true
                };
                
                console.log('📍 반환할 위치 데이터:', positionData);
                resolve(JSON.stringify(positionData));
            };
            socket.on('playerPositionResult', resultListener);
            
            // 플레이어 위치 조회 요청
            if (socket && socket.connected) {
                socket.emit("getPlayerPosition", {
                    player: executingPlayer
                });
                console.log('✅ 플레이어 위치 조회 요청 전송 완료');
            } else {
                console.error('❌ 소켓 연결이 되어있지 않음');
                resolve(JSON.stringify({x: 0, y: 0, z: 0, isAbsolute: true}));
            }
            
            // 타임아웃 설정 (3초 후 기본값 반환)
            setTimeout(() => {
                console.log('📍 플레이어 위치 조회 타임아웃');
                socket.off('playerPositionResult', resultListener);
                resolve(JSON.stringify({x: 0, y: 0, z: 0, isAbsolute: true}));
            }, 3000);
        });
    })())`;
    
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

// forBlock 방식도 지원  
Blockly.JavaScript.forBlock['player_position'] = Blockly.JavaScript['player_position'];

// 선 모양 만들기 코드 생성기
Blockly.JavaScript['create_line'] = function(block) {
    const blockType = Blockly.JavaScript.valueToCode(block, 'BLOCK_TYPE', Blockly.JavaScript.ORDER_ATOMIC) || '"grass_block"';
    const start = Blockly.JavaScript.valueToCode(block, 'START', Blockly.JavaScript.ORDER_ATOMIC);
    const end = Blockly.JavaScript.valueToCode(block, 'END', Blockly.JavaScript.ORDER_ATOMIC);

    return `
    (async () => {
        const executingPlayer = window.currentExecutingPlayer || 'Unknown';
        const startPos = JSON.parse(${start});
        const endPos = JSON.parse(${end});
        const blockType = ${blockType};
        let finalStart = startPos;
        let finalEnd = endPos;
        
        console.log('📏 선 모양 생성 요청 (최적화됨)');
        console.log('  시작점:', startPos);
        console.log('  끝점:', endPos);
        console.log('  블록 타입:', blockType);
        console.log('  실행 플레이어:', executingPlayer);
        console.log('  소켓 연결 상태:', socket ? socket.connected : 'socket 없음');
        
        // 클라이언트에서 상대좌표 변환 (서버 지연 제거) - 카메라와 로컬 좌표는 서버에서 처리
        if (((startPos.isAbsolute === false && !startPos.isLocal && !startPos.isCamera) || 
             (endPos.isAbsolute === false && !endPos.isLocal && !endPos.isCamera)) && 
            executingPlayer && executingPlayer !== 'Unknown') {
            console.log('📍 클라이언트에서 상대좌표 변환 중...');
            const playerPosition = await new Promise(resolve => {
                const resultListener = (result) => {
                    socket.off('playerPositionResult', resultListener);
                    resolve(result);
                };
                socket.on('playerPositionResult', resultListener);
                socket.emit("getPlayerPosition", { player: executingPlayer });
            });
            
            // 시작점이 일반 상대좌표인 경우만 변환 (로컬과 카메라 좌표는 서버에서 처리)
            if (startPos.isAbsolute === false && !startPos.isLocal && !startPos.isCamera) {
                finalStart = {
                    x: playerPosition.x + startPos.x,
                    y: playerPosition.y + startPos.y,
                    z: playerPosition.z + startPos.z,
                    isAbsolute: true
                };
            }
            
            // 끝점이 일반 상대좌표인 경우만 변환 (로컬과 카메라 좌표는 서버에서 처리)
            if (endPos.isAbsolute === false && !endPos.isLocal && !endPos.isCamera) {
                finalEnd = {
                    x: playerPosition.x + endPos.x,
                    y: playerPosition.y + endPos.y,
                    z: playerPosition.z + endPos.z,
                    isAbsolute: true
                };
            }
            
            console.log('📍 변환된 시작점:', finalStart);
            console.log('📍 변환된 끝점:', finalEnd);
        }
        
        // 서버로 선 생성 요청 전송
        if (socket && socket.connected) {
            socket.emit("createLine", {
                start: finalStart,
                end: finalEnd,
                blockType: blockType,
                executingPlayer: executingPlayer
            });
            console.log('✅ 선 모양 생성 요청 전송 완료 (최적화됨)');
        } else {
            console.error('❌ 소켓 연결이 되어있지 않음');
        }
    })();\n`;
};