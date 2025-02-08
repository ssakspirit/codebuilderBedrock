// 블록 정의
// 블록 타입 블록 정의
Blockly.Blocks['block_type'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("블록:")
            .appendField(new Blockly.FieldDropdown([
                ["돌", "stone"],          
                ["흙", "dirt"],          
                ["잔디", "grass"],         
                ["자갈", "gravel"],         
                ["모래", "sand"],         
                ["나무", "log"],         
                ["유리", "glass"],         
                ["벽돌", "brick_block"],         
                ["석재", "stone_brick"],         
                ["다이아몬드 블록", "diamond_block"],  
                ["금 블록", "gold_block"],       
                ["철 블록", "iron_block"],       
                ["석탄 블록", "coal_block"],      
                ["에메랄드 블록", "emerald_block"],   
                ["레드스톤 블록", "redstone_block"]    
            ]), "BLOCK_TYPE");
        this.setOutput(true, ["String", "BlockType"]);
        this.setColour('#7ABB55');
        this.setTooltip("설치할 블록의 종류를 선택합니다");
        this.setStyle('rounded_blocks');
    }
};

// 블록 설치 명령 블록 정의
Blockly.Blocks['set_block'] = {
    init: function() {
        this.appendValueInput("POSITION")
            .setCheck("Position")
            .appendField("블록 설치:");
        this.appendValueInput("BLOCK_TYPE")
            .setCheck(["Number", "BlockType"])
            .appendField("종류");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#7ABB55');
        this.setTooltip("지정된 위치에 선택한 블록을 설치합니다");
        this.setStyle('rounded_blocks');

        // 새도우 블록으로 위치와 블록 타입 설정
        const posInput = this.getInput('POSITION');
        if (posInput && !posInput.connection.targetConnection) {
            const coordBlock = this.workspace.newBlock('coordinate_pos');
            coordBlock.setShadow(true);
            coordBlock.initSvg();

            // X, Y, Z 값을 각각 0으로 설정
            ['X', 'Y', 'Z'].forEach(coord => {
                const numBlock = this.workspace.newBlock('math_number');
                numBlock.setShadow(true);
                numBlock.initSvg();
                numBlock.setFieldValue('0', 'NUM');
                coordBlock.getInput(coord).connection.connect(numBlock.outputConnection);
                numBlock.render();
            });

            posInput.connection.connect(coordBlock.outputConnection);
            coordBlock.render();
        }

        // 블록 타입 새도우 블록 설정
        const typeInput = this.getInput('BLOCK_TYPE');
        if (typeInput && !typeInput.connection.targetConnection) {
            const blockTypeBlock = this.workspace.newBlock('block_type');
            blockTypeBlock.setShadow(true);
            blockTypeBlock.initSvg();
            typeInput.connection.connect(blockTypeBlock.outputConnection);
            blockTypeBlock.render();
        }
    }
};

// 좌표 블록 정의
Blockly.Blocks['coordinate_pos'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck("Number")
            .appendField("~");
        this.appendValueInput("Y")
            .setCheck("Number")
            .appendField("~");
        this.appendValueInput("Z")
            .setCheck("Number")
            .appendField("~");
        this.setInputsInline(true);
        this.setOutput(true, "Position");
        this.setColour('#69b090');
        this.setTooltip("플레이어 기준의 상대 좌표를 지정합니다");
        this.setStyle('rounded_blocks');

        // 새도우 블록으로 X, Y, Z 값을 각각 0으로 설정
        ['X', 'Y', 'Z'].forEach(coord => {
            const input = this.getInput(coord);
            if (input && !input.connection.targetConnection) {
                const shadow = this.workspace.newBlock('math_number');
                shadow.setShadow(true);
                shadow.initSvg();
                shadow.setFieldValue('0', 'NUM');
                input.connection.connect(shadow.outputConnection);
                shadow.render();
            }
        });
    }
};

// 절대좌표 블록 정의
Blockly.Blocks['world_pos'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck("Number")
            .appendField("월드");
        this.appendValueInput("Y")
            .setCheck("Number");
        this.appendValueInput("Z")
            .setCheck("Number");
        this.setInputsInline(true);
        this.setOutput(true, "Position");
        this.setColour('#69b090');
        this.setTooltip("월드의 절대 좌표를 지정합니다");
        this.setStyle('rounded_blocks');

        // 새도우 블록으로 X, Y, Z 값을 각각 0으로 설정
        ['X', 'Y', 'Z'].forEach(coord => {
            const input = this.getInput(coord);
            if (input && !input.connection.targetConnection) {
                const shadow = this.workspace.newBlock('math_number');
                shadow.setShadow(true);
                shadow.initSvg();
                shadow.setFieldValue('0', 'NUM');
                input.connection.connect(shadow.outputConnection);
                shadow.render();
            }
        });
    }
};

// XML 툴박스 수정 부분을 DOMContentLoaded 이벤트 안으로 이동
document.addEventListener('DOMContentLoaded', function() {
    // 위치 블록 카테고리 수정
    const positionCategory = document.querySelector('category[name="위치"]');
    if (positionCategory) {
        positionCategory.innerHTML = `
            <block type="coordinate_pos">
                <value name="X">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
                <value name="Y">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
                <value name="Z">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
            <block type="world_pos">
                <value name="X">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
                <value name="Y">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
                <value name="Z">
                    <shadow type="math_number">
                        <field name="NUM">0</field>
                    </shadow>
                </value>
            </block>
        `;
    }

    // 반복 블록 카테고리 수정
    const toolbox = document.getElementById('toolbox');
    const basicCategory = toolbox.querySelector('category[name="반복"]');
    if (basicCategory) {
        const repeatBlock = basicCategory.querySelector('block[type="controls_repeat"]');
        if (repeatBlock) {
            repeatBlock.setAttribute('type', 'custom_repeat');
        }
    }
});

// 에이전트 관련 블록 정의
Blockly.Blocks['agent_move'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트")
            .appendField(new Blockly.FieldDropdown([
                ["앞으로", "forward"],
                ["뒤로", "back"],
                ["위로", "up"],
                ["아래로", "down"],
                ["왼쪽으로", "left"],
                ["오른쪽으로", "right"]
            ]), "DIRECTION");
        this.appendValueInput("DISTANCE")
            .setCheck("Number")
            .appendField("칸 이동하기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트를 지정된 방향으로 지정된 칸만큼 이동합니다");
        this.setStyle('agent_blocks');

        // 새도우 블록으로 기본값 1 설정
        const input = this.getInput('DISTANCE');
        if (input && !input.connection.targetConnection) {
            const shadow = this.workspace.newBlock('math_number');
            shadow.setShadow(true);
            shadow.initSvg();
            shadow.setFieldValue('1', 'NUM');
            input.connection.connect(shadow.outputConnection);
            shadow.render();
        }
    }
};

// 에이전트 회전 명령 블록
Blockly.Blocks['agent_turn'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 회전하기")
            .appendField(new Blockly.FieldDropdown([
                ["왼쪽으로", "left"],
                ["오른쪽으로", "right"]
            ]), "DIRECTION");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트를 지정된 방향으로 회전합니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 블록 파괴 명령 블록
Blockly.Blocks['agent_destroy'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트")
            .appendField(new Blockly.FieldDropdown([
                ["앞의", "forward"],
                ["뒤의", "back"],
                ["왼쪽의", "left"],
                ["오른쪽의", "right"],
                ["위의", "up"],
                ["아래의", "down"]
            ]), "DIRECTION")
            .appendField("블록 파괴하기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 지정된 방향의 블록을 파괴합니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 공격 명령 블록
Blockly.Blocks['agent_attack'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 공격하기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 앞의 대상을 공격합니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 블록 설치 명령 블록
Blockly.Blocks['agent_place'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트")
            .appendField(new Blockly.FieldDropdown([
                ["앞에", "forward"],
                ["뒤에", "back"],
                ["왼쪽에", "left"],
                ["오른쪽에", "right"],
                ["위에", "up"],
                ["아래에", "down"]
            ]), "DIRECTION")
            .appendField("블록 설치하기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 지정된 방향에 블록을 설치합니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 슬롯 선택 블록
Blockly.Blocks['agent_set_slot'] = {
    init: function() {
        this.appendValueInput("SLOT")
            .setCheck("Number")
            .appendField("에이전트 슬롯 선택");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트의 인벤토리 슬롯을 선택합니다");
        this.setStyle('agent_blocks');

        // 새도우 블록으로 기본값 1 설정
        const input = this.getInput('SLOT');
        if (input && !input.connection.targetConnection) {
            const shadow = this.workspace.newBlock('math_number');
            shadow.setShadow(true);
            shadow.initSvg();
            shadow.setFieldValue('1', 'NUM');
            input.connection.connect(shadow.outputConnection);
            shadow.render();
        }
    }
};

// 에이전트 모든 아이템 버리기 명령 블록
Blockly.Blocks['agent_drop_all'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 모든 아이템 버리기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 모든 아이템을 버립니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 선택 슬롯 아이템 버리기 명령 블록
Blockly.Blocks['agent_drop_slot'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 선택 슬롯 아이템 버리기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 선택된 슬롯의 아이템을 버립니다");
        this.setStyle('agent_blocks');
    }
};

// 아이템 줍기 블록 정의
Blockly.Blocks['agent_collect'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 아이템 줍기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 주변의 아이템을 주웁니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 경작 블록 정의
Blockly.Blocks['agent_till'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트")
            .appendField(new Blockly.FieldDropdown([
                ["앞의", "forward"],
                ["뒤의", "back"],
                ["왼쪽의", "left"],
                ["오른쪽의", "right"],
                ["위의", "up"],
                ["아래의", "down"]
            ]), "DIRECTION")
            .appendField("땅 경작하기");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트가 지정된 방향의 땅을 경작합니다");
        this.setStyle('agent_blocks');
    }
};

// 채팅명령어 블록 정의
Blockly.Blocks['on_chat_command'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("채팅명령어")
            .appendField(new Blockly.FieldTextInput("", function(newValue) {
                // 명령어 중복 검사
                const blocks = workspace.getTopBlocks(true);
                const eventBlocks = blocks.filter(block => 
                    block.type === 'on_chat_command' && 
                    block.id !== this.sourceBlock_.id
                );
                
                const isDuplicate = eventBlocks.some(block => 
                    block.getFieldValue('COMMAND') === newValue
                );
                
                if (isDuplicate) {
                    showNotification('이미 사용 중인 명령어입니다!');
                    return null; // 변경을 취소합니다
                }
                
                return newValue;
            }), "COMMAND")
            .appendField("입력 시");
        this.appendStatementInput('NEXT');
        this.setColour('#60A5FA');
        this.setTooltip("채팅창에 입력한 명령어로 코드를 실행합니다");
        this.setStyle('hat_blocks');
    }
};

// 에이전트 텔레포트 블록 정의
Blockly.Blocks['agent_tp_pos'] = {
    init: function() {
        this.appendValueInput("POSITION")
            .setCheck("Position")
            .appendField("에이전트가 텔레포트:");
        this.appendDummyInput()
            .appendField("바라보는 방향")
            .appendField(new Blockly.FieldDropdown([
                ["동쪽(+x)", "east"],
                ["서쪽(-x)", "west"],
                ["남쪽(+z)", "south"],
                ["북쪽(-z)", "north"]
            ]), "FACING");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트를 지정된 상대 좌표로 이동시키고 특정 방향을 보게 합니다");
        this.setStyle('agent_blocks');

        // 새도우 블록으로 좌표 기본값 설정
        const input = this.getInput('POSITION');
        if (input && !input.connection.targetConnection) {
            const coordBlock = this.workspace.newBlock('coordinate_pos');
            coordBlock.setShadow(true);
            coordBlock.initSvg();

            // X, Y, Z 값을 각각 0으로 설정
            ['X', 'Y', 'Z'].forEach(coord => {
                const numBlock = this.workspace.newBlock('math_number');
                numBlock.setShadow(true);
                numBlock.initSvg();
                numBlock.setFieldValue('0', 'NUM');
                coordBlock.getInput(coord).connection.connect(numBlock.outputConnection);
                numBlock.render();
            });

            input.connection.connect(coordBlock.outputConnection);
            coordBlock.render();
        }
    }
};

// 에이전트 생성 블록 정의
Blockly.Blocks['agent_spawn'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 생성");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트를 생성합니다");
        this.setStyle('agent_blocks');
    }
};

// 에이전트 플레이어에게 텔레포트 블록 정의
Blockly.Blocks['agent_tp'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("에이전트 플레이어에게 TP");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#D83B01');
        this.setTooltip("에이전트를 플레이어 위치로 이동합니다");
        this.setStyle('agent_blocks');
    }
};

// 커스텀 반복 명령 블록
Blockly.Blocks['custom_repeat'] = {
    init: function() {
        this.appendValueInput("TIMES")
            .setCheck("Number")
            .appendField("반복하기");
        this.appendStatementInput('DO');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#55833C');
        this.setTooltip("지정된 횟수만큼 명령을 반복합니다");
        this.setStyle('repeat_blocks');

        // 새도우 블록으로 기본값 4 설정
        const input = this.getInput('TIMES');
        if (input && !input.connection.targetConnection) {
            const shadow = this.workspace.newBlock('math_number');
            shadow.setShadow(true);
            shadow.initSvg();
            shadow.setFieldValue('4', 'NUM');
            input.connection.connect(shadow.outputConnection);
            shadow.render();
        }
    }
};

// 채팅창에 말하기 블록 수정
Blockly.Blocks['text_print'] = {
    init: function() {
        this.appendValueInput('TEXT')
            .setCheck(['String', 'Array'])  // String과 Array 모두 받을 수 있도록 설정
            .appendField("채팅창에 말하기");
        
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#60A5FA');
        this.setTooltip("채팅창에 지정된 메시지를 표시합니다");
        this.setStyle('hat_blocks');
    }
};

// text_join 블록 초기화 수정
Blockly.Blocks['text_join'] = {
    init: function() {
        this.setStyle('hat_blocks');  // 플레이어 카테고리와 같은 스타일 사용
        this.setColour('#60A5FA');    // 플레이어 카테고리와 같은 색상
        this.itemCount_ = 2;
        this.updateShape_();
        this.setOutput(true, 'String');
        this.setTooltip("여러 텍스트를 하나로 합칩니다");
    },

    mutationToDom: function() {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },

    domToMutation: function(xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },

    updateShape_: function() {
        // 첫 번째 입력값은 "텍스트 합치기:" 레이블과 함께
        if (this.getInput('ADD0')) {
            this.removeInput('ADD0');
        }
        this.appendValueInput('ADD0')
            .setCheck('String')
            .appendField('텍스트 합치기:');

        // 나머지 입력값들
        for (let i = 1; i < this.itemCount_; i++) {
            if (this.getInput('ADD' + i)) {
                this.removeInput('ADD' + i);
            }
            this.appendValueInput('ADD' + i)
                .setCheck('String')
                .appendField('더하기');
        }
    }
};

// 변수 블록 초기화 그림자 블록 추가
const originalVariableInit = Blockly.Blocks['variables_set'].init;
Blockly.Blocks['variables_set'].init = function() {
    originalVariableInit.call(this);
    // shadow 블록 추가
    const input = this.getInput('VALUE');
    if (input && !input.connection.targetConnection) {
        const shadow = this.workspace.newBlock('math_number');
        shadow.setShadow(true);
        shadow.initSvg();
        shadow.setFieldValue('0', 'NUM');
        input.connection.connect(shadow.outputConnection);
        shadow.render();
    }
}; 