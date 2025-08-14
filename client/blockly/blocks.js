/**
 * 마인크래프트 에이전트 제어를 위한 Blockly 블록 정의
 * 에이전트 명령어, 좌표, 블록 타입 등 다양한 블록들을 정의합니다.
 * 
 * @fileoverview Blockly 커스텀 블록 정의
 * @author SteveCoding
 */

/**
 * 마인크래프트 블록 타입 목록
 * 카테고리별로 정리된 확장된 블록 리스트
 */
const MINECRAFT_BLOCKS = [
    // 기본 블록
    ["돌", "stone"],
    ["화강암", "granite"],
    ["연마된 화강암", "polished_granite"],
    ["섬록암", "diorite"],
    ["연마된 섬록암", "polished_diorite"],
    ["안산암", "andesite"],
    ["연마된 안산암", "polished_andesite"],
    ["흙", "dirt"],
    ["거친 흙", "coarse_dirt"],
    ["잔디", "grass_block"],
    ["자갈", "gravel"],
    ["모래", "sand"],
    ["붉은 모래", "red_sand"],
    
    // 나무 블록
    ["참나무 원목", "oak_log"],
    ["자작나무 원목", "birch_log"],
    ["가문비나무 원목", "spruce_log"],
    ["정글 나무 원목", "jungle_log"],
    ["아카시아 원목", "acacia_log"],
    ["짙은 참나무 원목", "dark_oak_log"],
    ["참나무 판자", "oak_planks"],
    ["자작나무 판자", "birch_planks"],
    ["가문비나무 판자", "spruce_planks"],
    ["정글 나무 판자", "jungle_planks"],
    ["아카시아 판자", "acacia_planks"],
    ["짙은 참나무 판자", "dark_oak_planks"],
    
    // 유리 블록
    ["유리", "glass"],
    ["흰색 유리", "white_stained_glass"],
    ["주황색 유리", "orange_stained_glass"],
    ["자홍색 유리", "magenta_stained_glass"],
    ["하늘색 유리", "light_blue_stained_glass"],
    ["노란색 유리", "yellow_stained_glass"],
    ["연두색 유리", "lime_stained_glass"],
    ["분홍색 유리", "pink_stained_glass"],
    ["회색 유리", "gray_stained_glass"],
    ["연회색 유리", "light_gray_stained_glass"],
    ["청록색 유리", "cyan_stained_glass"],
    ["보라색 유리", "purple_stained_glass"],
    ["파란색 유리", "blue_stained_glass"],
    ["갈색 유리", "brown_stained_glass"],
    ["초록색 유리", "green_stained_glass"],
    ["빨간색 유리", "red_stained_glass"],
    ["검은색 유리", "black_stained_glass"],
    
    // 양털 블록
    ["흰색 양털", "white_wool"],
    ["주황색 양털", "orange_wool"],
    ["자홍색 양털", "magenta_wool"],
    ["하늘색 양털", "light_blue_wool"],
    ["노란색 양털", "yellow_wool"],
    ["연두색 양털", "lime_wool"],
    ["분홍색 양털", "pink_wool"],
    ["회색 양털", "gray_wool"],
    ["연회색 양털", "light_gray_wool"],
    ["청록색 양털", "cyan_wool"],
    ["보라색 양털", "purple_wool"],
    ["파란색 양털", "blue_wool"],
    ["갈색 양털", "brown_wool"],
    ["초록색 양털", "green_wool"],
    ["빨간색 양털", "red_wool"],
    ["검은색 양털", "black_wool"],
    
    // 건축 블록
    ["벽돌", "bricks"],
    ["이끼 낀 조약돌", "mossy_cobblestone"],
    ["흑요석", "obsidian"],
    ["조약돌", "cobblestone"],
    ["이끼 낀 석재 벽돌", "mossy_stone_bricks"],
    ["갈라진 석재 벽돌", "cracked_stone_bricks"],
    ["조각된 석재 벽돌", "chiseled_stone_bricks"],
    ["석재 벽돌", "stone_bricks"],
    
    // 광물 블록
    ["석탄 블록", "coal_block"],
    ["철 블록", "iron_block"],
    ["금 블록", "gold_block"],
    ["다이아몬드 블록", "diamond_block"],
    ["에메랄드 블록", "emerald_block"],
    ["라피스라줄리 블록", "lapis_block"],
    ["레드스톤 블록", "redstone_block"],
    
    // 네더 블록
    ["네더랙", "netherrack"],
    ["영혼 모래", "soul_sand"],
    ["영혼 흙", "soul_soil"],
    ["네더 벽돌", "nether_bricks"],
    ["붉은 네더 벽돌", "red_nether_bricks"],
    ["네더 석영 광석", "nether_quartz_ore"],
    ["석영 블록", "quartz_block"],
    ["조각된 석영 블록", "chiseled_quartz_block"],
    ["석영 기둥", "quartz_pillar"],
    ["매끄러운 석영", "smooth_quartz"],
    
    // 엔드 블록
    ["엔드 돌", "end_stone"],
    ["엔드 돌 벽돌", "end_stone_bricks"],
    ["정제된 흑요석", "purpur_block"],
    ["정제된 흑요석 기둥", "purpur_pillar"],
    ["조각된 정제된 흑요석", "chiseled_purpur"],
    
    // 콘크리트 블록
    ["흰색 콘크리트", "white_concrete"],
    ["주황색 콘크리트", "orange_concrete"],
    ["자홍색 콘크리트", "magenta_concrete"],
    ["하늘색 콘크리트", "light_blue_concrete"],
    ["노란색 콘크리트", "yellow_concrete"],
    ["연두색 콘크리트", "lime_concrete"],
    ["분홍색 콘크리트", "pink_concrete"],
    ["회색 콘크리트", "gray_concrete"],
    ["연회색 콘크리트", "light_gray_concrete"],
    ["청록색 콘크리트", "cyan_concrete"],
    ["보라색 콘크리트", "purple_concrete"],
    ["파란색 콘크리트", "blue_concrete"],
    ["갈색 콘크리트", "brown_concrete"],
    ["초록색 콘크리트", "green_concrete"],
    ["빨간색 콘크리트", "red_concrete"],
    ["검은색 콘크리트", "black_concrete"],

    // 콘크리트 가루
    ["흰색 콘크리트 가루", "white_concrete_powder"],
    ["주황색 콘크리트 가루", "orange_concrete_powder"],
    ["자홍색 콘크리트 가루", "magenta_concrete_powder"],
    ["하늘색 콘크리트 가루", "light_blue_concrete_powder"],
    ["노란색 콘크리트 가루", "yellow_concrete_powder"],
    ["연두색 콘크리트 가루", "lime_concrete_powder"],
    ["분홍색 콘크리트 가루", "pink_concrete_powder"],
    ["회색 콘크리트 가루", "gray_concrete_powder"],
    ["연회색 콘크리트 가루", "light_gray_concrete_powder"],
    ["청록색 콘크리트 가루", "cyan_concrete_powder"],
    ["보라색 콘크리트 가루", "purple_concrete_powder"],
    ["파란색 콘크리트 가루", "blue_concrete_powder"],
    ["갈색 콘크리트 가루", "brown_concrete_powder"],
    ["초록색 콘크리트 가루", "green_concrete_powder"],
    ["빨간색 콘크리트 가루", "red_concrete_powder"],
    ["검은색 콘크리트 가루", "black_concrete_powder"],

    // 테라코타
    ["테라코타", "terracotta"],
    ["흰색 테라코타", "white_terracotta"],
    ["주황색 테라코타", "orange_terracotta"],
    ["자홍색 테라코타", "magenta_terracotta"],
    ["하늘색 테라코타", "light_blue_terracotta"],
    ["노란색 테라코타", "yellow_terracotta"],
    ["연두색 테라코타", "lime_terracotta"],
    ["분홍색 테라코타", "pink_terracotta"],
    ["회색 테라코타", "gray_terracotta"],
    ["연회색 테라코타", "light_gray_terracotta"],
    ["청록색 테라코타", "cyan_terracotta"],
    ["보라색 테라코타", "purple_terracotta"],
    ["파란색 테라코타", "blue_terracotta"],
    ["갈색 테라코타", "brown_terracotta"],
    ["초록색 테라코타", "green_terracotta"],
    ["빨간색 테라코타", "red_terracotta"],
    ["검은색 테라코타", "black_terracotta"],

    // 원목과 나무껍질
    ["참나무 나무껍질", "oak_wood"],
    ["자작나무 나무껍질", "birch_wood"],
    ["가문비나무 나무껍질", "spruce_wood"],
    ["정글 나무 나무껍질", "jungle_wood"],
    ["아카시아 나무껍질", "acacia_wood"],
    ["짙은 참나무 나무껍질", "dark_oak_wood"],
    ["벗겨진 참나무 원목", "stripped_oak_log"],
    ["벗겨진 자작나무 원목", "stripped_birch_log"],
    ["벗겨진 가문비나무 원목", "stripped_spruce_log"],
    ["벗겨진 정글 나무 원목", "stripped_jungle_log"],
    ["벗겨진 아카시아 원목", "stripped_acacia_log"],
    ["벗겨진 짙은 참나무 원목", "stripped_dark_oak_log"],

    // 특수 블록
    ["스펀지", "sponge"],
    ["젖은 스펀지", "wet_sponge"],
    ["책장", "bookshelf"],
    ["TNT", "tnt"],
    ["이끼 돌", "mossy_stone"],
    ["얼음", "ice"],
    ["단단한 얼음", "packed_ice"],
    ["푸른 얼음", "blue_ice"],
    ["눈 블록", "snow_block"],
    ["점토", "clay"],
    ["건초 더미", "hay_block"],
    ["슬라임 블록", "slime_block"],
    ["허니콤 블록", "honeycomb_block"],
    ["꿀 블록", "honey_block"],
    ["표적", "target"],
    ["자기석", "lodestone"],
    ["울는 흑요석", "crying_obsidian"],
    ["리스폰 정박기", "respawn_anchor"],

    // 광석류
    ["석탄 광석", "coal_ore"],
    ["심층 석탄 광석", "deepslate_coal_ore"],
    ["철 광석", "iron_ore"],
    ["심층 철 광석", "deepslate_iron_ore"],
    ["금 광석", "gold_ore"],
    ["심층 금 광석", "deepslate_gold_ore"],
    ["다이아몬드 광석", "diamond_ore"],
    ["심층 다이아몬드 광석", "deepslate_diamond_ore"],
    ["에메랄드 광석", "emerald_ore"],
    ["심층 에메랄드 광석", "deepslate_emerald_ore"],
    ["라피스라줄리 광석", "lapis_ore"],
    ["심층 라피스라줄리 광석", "deepslate_lapis_ore"],
    ["레드스톤 광석", "redstone_ore"],
    ["심층 레드스톤 광석", "deepslate_redstone_ore"],
    ["구리 광석", "copper_ore"],
    ["심층 구리 광석", "deepslate_copper_ore"],

    // 심층암 계열
    ["심층암", "deepslate"],
    ["조약돌 심층암", "cobbled_deepslate"],
    ["연마된 심층암", "polished_deepslate"],
    ["심층암 벽돌", "deepslate_bricks"],
    ["심층암 타일", "deepslate_tiles"],
    ["조각된 심층암", "chiseled_deepslate"]
];

/**
 * 마인크래프트 몹 타입 목록
 * 카테고리별로 정리된 몹 리스트
 */
const MINECRAFT_MOBS = [
    // 우호적 몹
    ["소", "cow"],
    ["돼지", "pig"],
    ["양", "sheep"],
    ["닭", "chicken"],
    ["토끼", "rabbit"],
    ["늑대", "wolf"],
    ["고양이", "cat"],
    ["말", "horse"],
    ["당나귀", "donkey"],
    ["노새", "mule"],
    ["라마", "llama"],
    ["상인 라마", "trader_llama"],
    ["오실롯", "ocelot"],
    ["여우", "fox"],
    ["곰", "polar_bear"],
    ["판다", "panda"],
    ["박쥐", "bat"],
    ["오징어", "squid"],
    ["발광 오징어", "glow_squid"],
    ["코드", "cod"],
    ["연어", "salmon"],
    ["열대어", "tropical_fish"],
    ["복어", "pufferfish"],
    ["돌고래", "dolphin"],
    ["거북이", "turtle"],
    ["아홀로틀", "axolotl"],
    ["개구리", "frog"],
    ["올챙이", "tadpole"],
    ["앵무새", "parrot"],
    ["벌", "bee"],
    ["철골렘", "iron_golem"],
    ["눈골렘", "snow_golem"],
    ["주민", "villager"],
    ["떠돌이 상인", "wandering_trader"],
    
    // 중립적 몹
    ["좀비 피글린", "zombie_piglin"],
    ["엔더맨", "enderman"],
    ["거미", "spider"],
    ["피글린", "piglin"],
    ["피글린 브루트", "piglin_brute"],
    ["염소", "goat"],
    
    // 적대적 몹
    ["좀비", "zombie"],
    ["허스크", "husk"],
    ["좀비 주민", "zombie_villager"],
    ["드라운드", "drowned"],
    ["스켈레톤", "skeleton"],
    ["스트레이", "stray"],
    ["위더 스켈레톤", "wither_skeleton"],
    ["크리퍼", "creeper"],
    ["마녀", "witch"],
    ["슬라임", "slime"],
    ["마그마 큐브", "magma_cube"],
    ["엔더마이트", "endermite"],
    ["실버피시", "silverfish"],
    ["가디언", "guardian"],
    ["엘더 가디언", "elder_guardian"],
    ["셜커", "shulker"],
    ["팬텀", "phantom"],
    ["조케이", "jockey"],
    ["약탈자", "pillager"],
    ["소환사", "evoker"],
    ["변명자", "vindicator"],
    ["파괴수", "ravager"],
    ["위더", "wither"],
    ["엔더드래곤", "ender_dragon"],
    ["블레이즈", "blaze"],
    ["가스트", "ghast"],
    ["호글린", "hoglin"],
    ["좀글린", "zoglin"],
    ["스트라이더", "strider"],
    ["위더링", "wither_skeleton"],
    ["바스크", "vex"],
    ["워든", "warden"],
    ["알레이", "allay"],
    
    // 보스 몹
    ["엔더드래곤", "ender_dragon"],
    ["위더", "wither"],
    ["엘더 가디언", "elder_guardian"],
    ["워든", "warden"]
];

/**
 * 마인크래프트 마법/엔티티 목록
 * 소환 가능한 마법과 특수 엔티티들
 */
const MAGIC_SPELLS = [
    // 투사체/마법
    ["화살", "arrow"],
    ["번개", "lightning_bolt"],
    ["파이어볼", "fireball"],
    ["작은 파이어볼", "small_fireball"],
    ["드래곤 파이어볼", "dragon_fireball"],
    ["눈덩이", "snowball"],
    ["엔더 펄", "ender_pearl"],
    ["경험치 구슬", "experience_orb"],
    ["플레이어", "player"],
    ["갑옷 거치대", "armor_stand"],
    
    // 특수 엔티티
    ["보트", "boat"],
    ["트롤리", "minecart"],
    ["상자가 든 트롤리", "chest_minecart"],
    ["화약이 든 트롤리", "tnt_minecart"],
    ["화로가 든 트롤리", "furnace_minecart"],
    ["깔때기가 든 트롤리", "hopper_minecart"],
    ["아이템", "item"],
    ["떨어지는 블록", "falling_block"],
    ["그림", "painting"],
    ["아이템 프레임", "item_frame"],
    ["발광 아이템 프레임", "glow_item_frame"],
    
    // 폭발물
    ["TNT", "tnt"],
    ["크리퍼 폭발", "creeper"],
    ["엔드 크리스탈", "end_crystal"],
    
    // 이동 수단
    ["말", "horse"],
    ["돼지", "pig"],
    ["스트라이더", "strider"],
    
    // 환경 효과
    ["구름", "area_effect_cloud"],
    ["가스트 파이어볼", "ghast_fireball"],
    ["샬커 총알", "shulker_bullet"],
    ["위더 두개골", "wither_skull"],
    ["위더 스컬 (위험)", "wither_skull_dangerous"],
    
    // 특수 마법
    ["순간이동", "enderman"],
    ["투명화", "potion"],
    ["치유", "splash_potion"],
    ["지속 물약", "lingering_potion"],
    
    // 소환진/의식
    ["마법진", "evoker_fangs"],
    ["베쓰", "vex"],
    ["위더 소환", "wither"],
    ["철골렘 소환", "iron_golem"],
    ["눈골렘 소환", "snow_golem"]
];

// 마인크래프트 아이템 목록
const MINECRAFT_ITEMS = [
    // 도구류
    ["나무 검", "wooden_sword"],
    ["돌 검", "stone_sword"],
    ["철 검", "iron_sword"],
    ["금 검", "golden_sword"],
    ["다이아몬드 검", "diamond_sword"],
    ["네더라이트 검", "netherite_sword"],
    
    ["나무 도끼", "wooden_axe"],
    ["돌 도끼", "stone_axe"],
    ["철 도끼", "iron_axe"],
    ["금 도끼", "golden_axe"],
    ["다이아몬드 도끼", "diamond_axe"],
    ["네더라이트 도끼", "netherite_axe"],
    
    ["나무 곡괭이", "wooden_pickaxe"],
    ["돌 곡괭이", "stone_pickaxe"],
    ["철 곡괭이", "iron_pickaxe"],
    ["금 곡괭이", "golden_pickaxe"],
    ["다이아몬드 곡괭이", "diamond_pickaxe"],
    ["네더라이트 곡괭이", "netherite_pickaxe"],
    
    ["나무 삽", "wooden_shovel"],
    ["돌 삽", "stone_shovel"],
    ["철 삽", "iron_shovel"],
    ["금 삽", "golden_shovel"],
    ["다이아몬드 삽", "diamond_shovel"],
    ["네더라이트 삽", "netherite_shovel"],
    
    ["나무 괭이", "wooden_hoe"],
    ["돌 괭이", "stone_hoe"],
    ["철 괭이", "iron_hoe"],
    ["금 괭이", "golden_hoe"],
    ["다이아몬드 괭이", "diamond_hoe"],
    ["네더라이트 괭이", "netherite_hoe"],
    
    // 갑옷류
    ["가죽 투구", "leather_helmet"],
    ["가죽 흉갑", "leather_chestplate"],
    ["가죽 바지", "leather_leggings"],
    ["가죽 신발", "leather_boots"],
    
    ["체인 투구", "chainmail_helmet"],
    ["체인 흉갑", "chainmail_chestplate"],
    ["체인 바지", "chainmail_leggings"],
    ["체인 신발", "chainmail_boots"],
    
    ["철 투구", "iron_helmet"],
    ["철 흉갑", "iron_chestplate"],
    ["철 바지", "iron_leggings"],
    ["철 신발", "iron_boots"],
    
    ["금 투구", "golden_helmet"],
    ["금 흉갑", "golden_chestplate"],
    ["금 바지", "golden_leggings"],
    ["금 신발", "golden_boots"],
    
    ["다이아몬드 투구", "diamond_helmet"],
    ["다이아몬드 흉갑", "diamond_chestplate"],
    ["다이아몬드 바지", "diamond_leggings"],
    ["다이아몬드 신발", "diamond_boots"],
    
    ["네더라이트 투구", "netherite_helmet"],
    ["네더라이트 흉갑", "netherite_chestplate"],
    ["네더라이트 바지", "netherite_leggings"],
    ["네더라이트 신발", "netherite_boots"],
    
    // 음식류
    ["사과", "apple"],
    ["황금 사과", "golden_apple"],
    ["마법이 부여된 황금 사과", "enchanted_golden_apple"],
    ["빵", "bread"],
    ["생 돼지고기", "porkchop"],
    ["구운 돼지고기", "cooked_porkchop"],
    ["생 쇠고기", "beef"],
    ["스테이크", "cooked_beef"],
    ["생 닭고기", "chicken"],
    ["구운 닭고기", "cooked_chicken"],
    ["생 양고기", "mutton"],
    ["구운 양고기", "cooked_mutton"],
    ["생 대구", "cod"],
    ["구운 대구", "cooked_cod"],
    ["생 연어", "salmon"],
    ["구운 연어", "cooked_salmon"],
    ["감자", "potato"],
    ["구운 감자", "baked_potato"],
    ["당근", "carrot"],
    ["황금 당근", "golden_carrot"],
    
    // 재료류
    ["나무막대", "stick"],
    ["실", "string"],
    ["가죽", "leather"],
    ["종이", "paper"],
    ["책", "book"],
    ["화약", "gunpowder"],
    ["레드스톤 가루", "redstone"],
    ["글로우스톤 가루", "glowstone_dust"],
    ["엔더 펄", "ender_pearl"],
    ["블레이즈 막대", "blaze_rod"],
    ["블레이즈 가루", "blaze_powder"],
    ["마그마 크림", "magma_cream"],
    ["슬라임볼", "slime_ball"],
    ["프리즈머린 조각", "prismarine_shard"],
    ["프리즈머린 크리스털", "prismarine_crystals"],
    
    // 포션류
    ["물병", "water_bottle"],
    ["일반 포션", "potion"],
    ["투척용 포션", "splash_potion"],
    ["잔류형 포션", "lingering_potion"],
    ["회복 포션", "healing_potion"],
    ["힘 포션", "strength_potion"],
    ["속도 포션", "swiftness_potion"],
    ["화염 저항 포션", "fire_resistance_potion"],
    ["재생 포션", "regeneration_potion"],
    ["야간 투시 포션", "night_vision_potion"],
    
    // 기타 아이템
    ["활", "bow"],
    ["화살", "arrow"],
    ["석탄", "coal"],
    ["목탄", "charcoal"],
    ["다이아몬드", "diamond"],
    ["에메랄드", "emerald"],
    ["철 주괴", "iron_ingot"],
    ["금 주괴", "gold_ingot"],
    ["지도", "map"],
    ["나침반", "compass"],
    ["시계", "clock"],
    ["낚시대", "fishing_rod"],
    ["양동이", "bucket"],
    ["물 양동이", "water_bucket"],
    ["용암 양동이", "lava_bucket"],
    ["우유", "milk_bucket"],
    ["안장", "saddle"],
    ["리드", "lead"],
    ["이름표", "name_tag"]
];

/**
 * 검색 가능한 드롭다운 필드 클래스
 * Blockly의 기본 FieldDropdown을 확장하여 검색 기능을 추가합니다.
 */
class FieldSearchableDropdown extends Blockly.FieldDropdown {
    constructor(options) {
        super(options);
        this.allOptions_ = options;
        this.filteredOptions_ = options;
        this.selectedIndex_ = 0;
    }

    /**
     * 드롭다운 메뉴를 표시할 때 검색 입력 필드를 추가합니다.
     */
    showEditor_() {
        // 기본 드롭다운을 숨기고 커스텀 UI 생성
        const div = Blockly.DropDownDiv.getContentDiv();
        div.innerHTML = '';
        
        // 검색 입력 필드 생성
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '블록 검색... (↑↓ 키로 선택)';
        searchInput.className = 'blocklySearchInput';
        searchInput.style.cssText = `
            width: 280px;
            padding: 8px 12px;
            margin-bottom: 8px;
            border: 2px solid #4285f4;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            box-sizing: border-box;
            outline: none;
        `;
        
        // 옵션 컨테이너 생성
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'blocklyOptionsContainer';
        optionsContainer.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
        `;
        
        div.appendChild(searchInput);
        div.appendChild(optionsContainer);
        
        // 초기 옵션 표시
        this.renderOptions_(optionsContainer, this.allOptions_);
        
        // 이벤트 리스너 추가
        searchInput.addEventListener('input', (e) => {
            this.filterOptions_(e.target.value, optionsContainer);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown_(e, optionsContainer);
        });
        
        // 포커스 설정
        setTimeout(() => {
            searchInput.focus();
            searchInput.select();
        }, 100);
        
        // 드롭다운 표시
        Blockly.DropDownDiv.showPositionedByField(this, this.onHide_.bind(this));
    }

    /**
     * 옵션들을 렌더링합니다.
     * @param {Element} container - 옵션을 표시할 컨테이너
     * @param {Array} options - 표시할 옵션 배열
     */
    renderOptions_(container, options) {
        container.innerHTML = '';
        this.filteredOptions_ = options;
        this.selectedIndex_ = 0;
        
        if (options.length === 0) {
            const noResults = document.createElement('div');
            noResults.textContent = '검색 결과가 없습니다';
            noResults.style.cssText = 'padding: 12px; color: #666; text-align: center; font-style: italic;';
            container.appendChild(noResults);
            return;
        }
        
        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'blocklyMenuItem';
            optionDiv.textContent = option[0];
            optionDiv.dataset.value = option[1];
            optionDiv.dataset.index = index;
            
            const baseStyle = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
                user-select: none;
            `;
            
            optionDiv.style.cssText = baseStyle + (index === 0 ? 'background-color: #e3f2fd;' : '');
            
            // 마우스 이벤트
            optionDiv.addEventListener('mouseenter', () => {
                this.setSelectedIndex_(container, index);
            });
            
            optionDiv.addEventListener('click', () => {
                this.selectOption_(option[1]);
            });
            
            container.appendChild(optionDiv);
        });
    }

    /**
     * 검색어에 따라 옵션을 필터링합니다.
     * @param {string} searchTerm - 검색어
     * @param {Element} container - 옵션 컨테이너
     */
    filterOptions_(searchTerm, container) {
        const filteredOptions = this.allOptions_.filter(option => 
            option[0].toLowerCase().includes(searchTerm.toLowerCase()) ||
            option[1].toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderOptions_(container, filteredOptions);
    }

    /**
     * 키보드 이벤트를 처리합니다.
     * @param {Event} e - 키보드 이벤트
     * @param {Element} container - 옵션 컨테이너
     */
    handleKeydown_(e, container) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.setSelectedIndex_(container, Math.min(this.selectedIndex_ + 1, this.filteredOptions_.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setSelectedIndex_(container, Math.max(this.selectedIndex_ - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (this.filteredOptions_.length > 0) {
                    this.selectOption_(this.filteredOptions_[this.selectedIndex_][1]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                Blockly.DropDownDiv.hide();
                break;
        }
    }

    /**
     * 선택된 인덱스를 설정합니다.
     * @param {Element} container - 옵션 컨테이너
     * @param {number} index - 새로운 선택 인덱스
     */
    setSelectedIndex_(container, index) {
        this.selectedIndex_ = index;
        
        // 모든 옵션의 선택 상태 초기화
        const options = container.querySelectorAll('.blocklyMenuItem');
        options.forEach((option, i) => {
            option.style.backgroundColor = i === index ? '#e3f2fd' : '';
        });
        
        // 선택된 옵션이 보이도록 스크롤
        if (options[index]) {
            options[index].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * 옵션을 선택합니다.
     * @param {string} value - 선택된 값
     */
    selectOption_(value) {
        this.setValue(value);
        Blockly.DropDownDiv.hide();
    }

    /**
     * 드롭다운이 숨겨질 때 호출됩니다.
     */
    onHide_() {
        // 정리 작업이 필요한 경우 여기에 추가
    }
}

/**
 * 블록 타입 선택 블록
 * 마인크래프트에서 설치할 수 있는 다양한 블록 타입을 드롭다운으로 제공합니다.
 */
Blockly.Blocks['block_type'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("블록:")
            .appendField(new FieldSearchableDropdown(MINECRAFT_BLOCKS), "BLOCK_TYPE");
        this.setOutput(true, ["String", "BlockType"]);
        this.setColour('#7ABB55');
        this.setTooltip("설치할 블록의 종류를 선택합니다 (검색 가능)");
        this.setStyle('rounded_blocks');
    }
};

// 아이템 타입 블록 정의
Blockly.Blocks['item_type'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("아이템:")
            .appendField(new FieldSearchableDropdown(MINECRAFT_ITEMS), "ITEM_TYPE");
        this.setOutput(true, ["String", "ItemType"]);
        this.setColour('#7ABB55');
        this.setTooltip("사용할 아이템의 종류를 선택합니다 (검색 가능)");
        this.setStyle('rounded_blocks');
    }
};

// 좌표 블록 정의
Blockly.Blocks['coordinate_pos'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck(["Number", "Variable"])
            .appendField("~");
        this.appendValueInput("Y")
            .setCheck(["Number", "Variable"])
            .appendField("~");
        this.appendValueInput("Z")
            .setCheck(["Number", "Variable"])
            .appendField("~");
        this.setInputsInline(true);
        this.setOutput(true, "Position");
        this.setTooltip("플레이어 기준의 상대 좌표를 지정합니다");
        this.setStyle('rounded_blocks');
        this.setColour('#69b090');
    }
};

// 절대좌표 블록 정의
Blockly.Blocks['world_pos'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck(["Number", "Variable"])
            .appendField("월드");
        this.appendValueInput("Y")
            .setCheck(["Number", "Variable"]);
        this.appendValueInput("Z")
            .setCheck(["Number", "Variable"]);
        this.setInputsInline(true);
        this.setOutput(true, "Position");
        this.setTooltip("월드의 절대 좌표를 지정합니다");
        this.setStyle('rounded_blocks');
        this.setColour('#69b090');
    }
};

// 바라보는 방향 기준 좌표 블록 정의  
Blockly.Blocks['facing_pos'] = {
    init: function() {
        this.appendValueInput("X")
            .setCheck(["Number", "Variable"])
            .appendField("^");
        this.appendValueInput("Y")
            .setCheck(["Number", "Variable"])
            .appendField("^");
        this.appendValueInput("Z")
            .setCheck(["Number", "Variable"])
            .appendField("^");
        this.setInputsInline(true);
        this.setOutput(true, "Position");
        this.setColour('#69b090');
        this.setTooltip("바라보는 방향 기준의 상대 좌표를 지정합니다 (좌우/위아래/전후)");
    }
};

// 블록 설치 명령 블록 정의
Blockly.Blocks['set_block'] = {
    init: function() {
        this.appendValueInput("POSITION")
            .setCheck("Position")
            .appendField("블록 설치:");
        this.appendValueInput("BLOCK_TYPE")
            .setCheck(["String", "BlockType"])
            .appendField("종류");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#7ABB55');
        this.setTooltip("지정된 위치에 선택한 블록을 설치합니다");
        this.setStyle('rounded_blocks');
    }
};

// 블록 채우기 명령 블록 정의
Blockly.Blocks['fill_blocks'] = {
    init: function() {
        this.appendValueInput("START_POS")
            .setCheck("Position")
            .appendField("블록 채우기: 시작 좌표");
        this.appendValueInput("END_POS")
            .setCheck("Position")
            .appendField("끝 좌표");           
        this.appendValueInput("BLOCK_TYPE")
            .setCheck(["String", "BlockType"])
            .appendField("채울 블록");
        this.appendDummyInput()
            .appendField("채우기 옵션")
            .appendField(new Blockly.FieldDropdown([
                ["기본", "replace"],
                ["속이 비게", "hollow"],
                ["테두리만", "outline"],
                ["겹치기", "keep"],
                ["파괴", "destroy"]
            ]), "FILL_MODE");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#7ABB55');
        this.setTooltip('지정된 영역을 블록으로 채웁니다');
    }
};

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

// 아이템 획득 블록 정의
Blockly.Blocks['on_item_use'] = {
    init: function() {
        this.appendValueInput('ITEM')
            .setCheck(['String', 'ItemType'])
            .appendField("아이템");
        this.appendDummyInput()
            .appendField("획득시");
        this.appendStatementInput('NEXT');
        this.setColour('#60A5FA');
        this.setTooltip("특정 아이템을 인벤토리에 획득했을 때 코드를 실행합니다");
        this.setStyle('hat_blocks');
    }
};

// 블록 설치 감지 블록 정의
Blockly.Blocks['on_block_placed'] = {
    init: function() {
        this.appendValueInput('BLOCK')
            .setCheck(['String', 'BlockType'])
            .appendField("블록");
        this.appendDummyInput()
            .appendField("설치시");
        this.appendStatementInput('NEXT');
        this.setColour('#7ABB55');
        this.setTooltip("특정 블록을 설치했을 때 코드를 실행합니다");
        this.setStyle('block_hat_blocks');
    }
};

// 블록 파괴 감지 블록 정의
Blockly.Blocks['on_block_broken'] = {
    init: function() {
        this.appendValueInput('BLOCK')
            .setCheck(['String', 'BlockType'])
            .appendField("블록");
        this.appendDummyInput()
            .appendField("파괴시");
        this.appendStatementInput('NEXT');
        this.setColour('#7ABB55');
        this.setTooltip("특정 블록을 파괴했을 때 코드를 실행합니다");
        this.setStyle('block_hat_blocks');
    }
};

// 대상 선택 블록 정의
Blockly.Blocks['target_selector'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("대상:")
            .appendField(new Blockly.FieldDropdown([
                ["자신 (@s)", "@s"],
                ["가장 가까운 플레이어 (@p)", "@p"], 
                ["모든 플레이어 (@a)", "@a"],
                ["랜덤 플레이어 (@r)", "@r"],
                ["모든 엔티티 (@e)", "@e"]
            ]), "TARGET");
        this.setOutput(true, "String");
        this.setColour('#764bbc');
        this.setTooltip("명령어 대상을 선택합니다");
    }
};

// 아이템 받기 블록 정의
Blockly.Blocks['give_item'] = {
    init: function() {
        this.appendValueInput('TARGET')
            .setCheck('String')
            .appendField("아이템 주기: 대상");
        this.appendValueInput('ITEM')
            .setCheck(['String', 'ItemType'])
            .appendField("아이템");
        this.appendValueInput('COUNT')
            .setCheck('Number')
            .appendField("개수");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#764bbc');
        this.setTooltip("플레이어에게 특정 아이템을 지정된 개수만큼 줍니다 (예: @s, @a, @p 또는 플레이어명)");
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

// 블록 탐지 블록 정의
Blockly.Blocks['block_detect'] = {
    init: function() {
        this.appendValueInput("POSITION")
            .setCheck("Position")
            .appendField("블록 탐지:");
        this.appendValueInput("BLOCK_TYPE")
            .setCheck(["String", "BlockType"])
            .appendField("위치:");
        this.setOutput(true, "Boolean");
        this.setColour('#7ABB55');
        this.setTooltip("지정된 위치에 특정 블록이 있는지 확인합니다");
        this.setStyle('rounded_blocks');
    }
};

// 몹 타입 선택 블록 정의
Blockly.Blocks['mob_type'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("몹:")
            .appendField(new FieldSearchableDropdown(MINECRAFT_MOBS), "MOB_TYPE");
        this.setOutput(true, ["String", "MobType"]);
        this.setTooltip("소환할 몹의 종류를 선택합니다 (검색 가능)");
        this.setStyle('rounded_blocks');
        this.setColour('#764bbc');
    }
};

// 마법 타입 선택 블록 정의
Blockly.Blocks['magic_type'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("마법:")
            .appendField(new FieldSearchableDropdown(MAGIC_SPELLS), "MAGIC_TYPE");
        this.setOutput(true, ["String", "MagicType"]);
        this.setTooltip("소환할 마법/엔티티의 종류를 선택합니다 (검색 가능)");
        this.setStyle('rounded_blocks');
        this.setColour('#764bbc');
    }
};

// 몹 소환 블록 정의
Blockly.Blocks['mob_summon'] = {
    init: function() {
        this.appendValueInput("MOB_TYPE")
            .setCheck(["String", "MobType"])
            .appendField("소환");
        this.appendValueInput("POSITION")
            .setCheck("Position")
            .appendField("위치");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip("지정된 위치에 몹을 소환합니다");
        this.setStyle('rounded_blocks');
        this.setColour('#764bbc');
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

// 원 모양 만들기 블록 정의
Blockly.Blocks['create_circle'] = {
    init: function() {
        this.appendValueInput('BLOCK_TYPE')
            .setCheck(['String', 'BlockType'])
            .appendField("원 모양 만들기:");
        this.appendValueInput('CENTER')
            .setCheck('Position')
            .appendField("중심");
        this.appendValueInput('RADIUS')
            .setCheck('Number')
            .appendField("반지름");
        this.appendDummyInput()
            .appendField("방향")
            .appendField(new Blockly.FieldDropdown([
                ["x 좌표", "x"],
                ["y 좌표", "y"], 
                ["z 좌표", "z"]
            ]), "DIRECTION");
        this.appendDummyInput()
            .appendField("모드타입")
            .appendField(new Blockly.FieldDropdown([
                ["외곽선", "outline"],
                ["채우기", "fill"]
            ]), "MODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#ec7505');
        this.setTooltip("지정된 중심점과 반지름으로 원을 만듭니다");
    }
};

// 공 모양 만들기 블록 정의
Blockly.Blocks['create_sphere'] = {
    init: function() {
        this.appendValueInput('BLOCK_TYPE')
            .setCheck(['String', 'BlockType'])
            .appendField("공 모양 만들기:");
        this.appendValueInput('CENTER')
            .setCheck('Position')
            .appendField("중심");
        this.appendValueInput('RADIUS')
            .setCheck('Number')
            .appendField("반지름");
        this.appendDummyInput()
            .appendField("모드타입")
            .appendField(new Blockly.FieldDropdown([
                ["외곽선", "outline"],
                ["채우기", "fill"]
            ]), "MODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#ec7505');
        this.setTooltip("지정된 중심점과 반지름으로 3D 구를 만듭니다");
        this.setInputsInline(false); // 세로로 정렬
    }
};

// 반구 모양 만들기 블록 정의
Blockly.Blocks['create_hemisphere'] = {
    init: function() {
        this.appendValueInput('BLOCK_TYPE')
            .setCheck(['String', 'BlockType'])
            .appendField("반구 모양 만들기:");
        this.appendValueInput('CENTER')
            .setCheck('Position')
            .appendField("중심");
        this.appendValueInput('RADIUS')
            .setCheck('Number')
            .appendField("반지름");
        this.appendDummyInput()
            .appendField("방향")
            .appendField(new Blockly.FieldDropdown([
                ["+x", "x"],
                ["-x", "-x"],
                ["+y", "y"],
                ["-y", "-y"],
                ["+z", "z"],
                ["-z", "-z"]
            ]), "AXIS");
        this.appendDummyInput()
            .appendField("모드타입")
            .appendField(new Blockly.FieldDropdown([
                ["외곽선", "outline"],
                ["채우기", "fill"]
            ]), "MODE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#ec7505');
        this.setTooltip("지정된 중심점, 반지름, 방향으로 반구를 만듭니다");
        this.setInputsInline(false); // 세로로 정렬
    }
};

// 플레이어 현재 위치 블록 정의
Blockly.Blocks['player_position'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("플레이어 현재 위치");
        this.setOutput(true, 'Position');
        this.setColour('#60A5FA');
        this.setTooltip('플레이어의 현재 위치를 절대좌표로 반환합니다');
        this.setHelpUrl('');
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

 