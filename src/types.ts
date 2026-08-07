import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId, type HeroId, type LevelId, type ProjectileId, type SkillId, type TowerId } from "./constants";
import type { Vec2, GameObj, KAPLAYCtx, HealthComp, SpriteComp, StateComp, RotateComp, PosComp, ZComp, OpacityComp, ButtonBinding, MouseButton, Key, AreaComp } from "kaplay";
import { frostAoeBurst } from "./utils/makeUnitCombat";
import type { StatusEffectComp } from "./kaplayComponents/statusEffect";
import type { ChallengeManager } from "./utils/challengeHelpers";

type LayerObj = {
    x: number;
    y: number;
    height: number;
    width: number;
    name?: string;
    properties?: {
        name: string;
        value: string;
    }[];
};

type Layer = {
    name: string;
    objects?: LayerObj[];
    data?: number[];
};

export type MapData = {
    tilewidth: typeof TILE_SIZE;
    tileheight: typeof TILE_SIZE;
    width: number;
    height: number;
    layers: Layer[];
};

export type Tile = {
    blocked: boolean;
    isPath: boolean;
    pathIndex?: number;
    hasTree?: boolean;
    hasCactus?: boolean;
    hasWater?: boolean;
    frozen?: boolean;
    iceSprite?: string;
    glowObj?: GameObj;
};

export type PathTile = {
    x: number;
    y: number;
    tile: Tile;
};

export type TowerStats = {
    damage: number;
    range: number;
    fireInterval: number;
    critChance: number;
    critDamage: number;
};

export type ElementName = "Normal" | "Fire" | "Ice" | "Electric" | "Light" | "Dark" | "Poison";
export type ElementDef = {
    description: string | null;
    applyEffect: ((k: KAPLAYCtx, ctx: EffectContext) => void) | null;
    color: string;
};

export type TowerBuff =
    | {
        type: "bonusDamage";
        element: ElementName;
        multiplier: number;
        timeLeft: number;
    }
    | {
        type: "toxicInfusion",
        timeLeft: 5
    }
    | {
        type: "fireRate";
        multiplier: number;
        timeLeft: number;
    }
    | {
        type: "range";
        number: number;
        timeLeft: number;
    };

export type SeedId = "chili" | "starfruit" | "nightshade";
export type Seed = Record<SeedId, {
    name: "Chili Pepper" | "Starfruit" | "Nightshade";
    growsInto: SeedId;
    turnsToGrow: 1 | 2 | 3;
}>;

export type StatusEffectResult = {
    icon: string;
    stacks?: number;
};

export type ProjectileDef = {
    sprite: string;
    homing: boolean;
    speed: number;
    splashRadius: number;
    anim?: string;
    noRotate?: boolean;
    splitDamage?: boolean;
    impactSound?: string;
};

export type RandomProjectiles = {
    projectile: ProjectileId;
    element: ElementName;
    behaviors?: ProjectileBehavior & { critChance?: number };
    volley?: boolean;
}[];

export type UnitEffects = {
    firstEffect?: (ctx: AttackContext) => void;
    secondEffect?: (ctx: AttackContext) => void;
}[];

export type TowerSource = "reward" | "starting" | "farm";

export type Footprint = {
    w: number;
    h: number;
};

export type TowerDef = {
    name: string;
    cost: number;
    stats: TowerStats;
    element: ElementName;
    description: string;
    sprite: string;
    gunSprite: string;
    baseSprite: string;
    shootSound?: string;
    gunOffset: { x: number; y: number; };
    anchorOffset: { x: number; y: number; };
    shootOffset: { x: number; y: number; };
    projectile: ProjectileId | null;
    randomProjectiles?: RandomProjectiles;
    effects?: UnitEffects;
    canRotate: boolean;
    source: TowerSource;
    farmData?: {
        plantedSeed: SeedId | null;
        turnsRemaining: 1 | 2 | 3 | null;
    };
    timeData?: TimeData;
    continuousEffect?: ContinuousEffect;
    targetType: "enemy" | "point";
    pathEntityLimit?: number;
    melee?: {
        meleeHandleSprite: string;
        meleeHeadSprite: string;
        handleLength: number;
        headOffset?: number;
        swingAngle: number;
        startAngle: number;
    };
    killStacks?: number;
    charge?: Charge;
    footprint: Footprint;
    lavaTiles?: Vec2[];
    priority: TargetPriority;
    battery?: Battery;
    spread?: number;
    deathCharge?: {
        current: number;
        required: number;
    };
    overheat?: Overheat;
};

export type Overheat = {
    current: number;
    max: number;
    gainPerSecond: number;
    decayPerSecond: number;
    overheated: boolean;
    recoveryThreshold: number;
};

export type Charge = {
    currentCharge: number;
    maxCharge: number;
    chargePerShot: number;
    decayDelay: number;
};

export type Battery = {
    charge: number;
    storePct: number;
    maxCharge: number;
};

export type UnitInstance = {
    name: string;
    stats: TowerStats;
    element: ElementName;
    priority: TargetPriority;
    selected: boolean;
    hovered: boolean;
    placeable: boolean;
    placed: boolean;
    effects?: UnitEffects;
    canRotate: boolean;
    targetType: "enemy" | "point" | null;
    pathEntityLimit?: number;
    footprint: Footprint;
    chargeStacks?: Charge;
    towerBuffs: TowerBuff[];
};

export type TimeData = {
    maxMultiplier: number;
    growthPerSecond: number;
    timeScaling: {
        damage: boolean;
        damagePow: number;
        interval: boolean;
    };
};

export type ContinuousEffect = "flame particle";
export type BuffType = "damage" | "fireRate" | "critChance" | "critDamage";
export type Buffs = Partial<Record<BuffType, {
    value: number;
    timeLeft: number;
}>>;
export type Song = { type: BuffType; value: number; duration: number; };
export type Summon = {
    name: string;
    sprite: string;
    damageMult: number;
    attackSpeedMult: number;
    speed: number;
    maxAttacks: number;
    shootSound?: string;
};

export type TowerInstance = UnitInstance & {
    instanceId: string;
    towerId: TowerId;
    cost: number;
    continuousEffect?: ContinuousEffect;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
    farmData?: {
        plantedSeed: SeedId | null;
        turnsRemaining: 1 | 2 | 3 | null;
    };
    timeData?: TimeData & {
        timeMultiplier: number;
    };
    tileGrid: Tile[][];
    pathTiles: PathTile[];
    randomProjectiles?: RandomProjectiles;
    killStacks?: number;
    lavaTiles?: Vec2[];
    buffs?: Buffs;
    spread?: number;
    deathCharge?: {
        current: number;
        required: number;
    };
    overheat?: Overheat;
};

export type TowerGameObj = GameObj & TowerInstance;

export type HeroSkillDefBase = {
    id: string;
    heroIds: HeroId[];
    requires?: string[];
    name: string;
    description: string;
    apply: (hero: HeroGameObj) => void;
    icon: string;
};

export type HeroSkillDef = Omit<HeroSkillDefBase, "requires"> & {
    requires?: SkillId[];
};

export type HeroDef = Omit<TowerDef, 'cost' | "farmData" | "source"> & {
    levelUpOffset: { x: number; y: number; };
    songs?: Song[];
    placementSound?: string;
};
export type HeroInstance = UnitInstance & {
    heroId: HeroId;
    skillIds: SkillId[];
    level: number;
    canReposition: boolean;
    tileGrid: Tile[][];
    pathTiles: PathTile[];
    levelUpOffset: { x: number; y: number; };
    songs?: Song[];
};

export type HeroGameObj = GameObj & HeroInstance;

export type EnemyGameObj = GameObj<
    HealthComp |
    SpriteComp |
    StateComp |
    RotateComp |
    PosComp |
    ZComp |
    StatusEffectComp |
    OpacityComp |
    AreaComp
> & {
    path: Vec2[];
    pathIndex: number;
    segmentStart: Vec2;
    segmentProgress: number;
    baseSpeed: number;
    speed: number;
    damage: number;
    isDying: boolean;
    armour: number;
    shellBroken: boolean;
    maxArmour: number;
    healer?: {
        amount: number;
        range: number;
    };
    goldDropped: number;
    chestValue: number;
    shootSound?: string;
    healTickRate?: number;
    spawnOnDeath?: {
        id: "slime" |
        "spiderling" |
        "spider" |
        "armouredSlime" |
        "giantSlime" |
        "bee" |
        "snowmanHead" |
        "iceSlime" |
        "giantSnowmanHead" |
        "penguin" |
        "giantPenguin" |
        "locust";
        amount: number;
        offset?: number;
    };
    attacker?: {
        projectile?: ProjectileId;
        attackRange: number;
        attackCooldown: number;
        canAttack: boolean;
    };
    invincible: boolean;
    invincibleDuration: number;
    invincibleTimer: number;
    invincibleCooldown: number;
    stunResistance: boolean;
    stunResistanceDuration: number;
    stunResistanceTimer: number;
    speedBooster?: {
        amount: number;
        range: number;
    };
    speedMultipliers: {
        chill: number;
        boost: number;
        wind: number;
        ice: number;
    };
    debuffDurationMultiplier: number;
    spawnArmourOnDeath?: {
        amount: number;
        range: number;
    };
    boss?: {
        stopIndexes: number[];
        currentStopIndex: number;
        reachedStopIndex: boolean;
        presentDropIndex: number;
        bossMechanic?: "escape" | "shield";
    };
    darkHarvestDamage: number;
    spawnIce?: boolean;
    presentDrops?: {
        segment: number;
        segmentProgress: number;
        enemies: { id: presentSpawns; amount: number; }[];
    }[];
    checkpointTimer?: number;
    checkpointDuration?: number;
    hasLargeSoul?: boolean;
    shieldHp?: number;
    maxShieldHp?: number;
    shieldSprite?: string;
};

export type Upgrade = {
    stat: "damage" | "range" | "fireInterval" | "critChance" | "critDamage";
    name: "Damage" | "Range" | "Fire Rate" | "Crit Chance" | "Crit Damage";
    amount: number;
    cost: number;
    percentage: boolean;
    active?: boolean;
    used?: boolean;
    icon?: string;
    animationDelay?: number;
    markedForDeletion?: boolean;
};

export type SpellName = "Firestorm" | "Arctic Blast" | "Overcharge" | "Heal" | "Dark Harvest" | "Blinding Light" | "Gold" | "Reroll" | "Toxic Infusion";

export type Spell = {
    type: "spell";

    effect:
    | "firestorm"
    | "toxicInfusion"
    | "arcticBlast"
    | "overcharge"
    | "heal"
    | "darkHarvest"
    | "blindingLight"
    | "gold"
    | "reroll";

    name: SpellName;
    description: string;
    amount?: number;
    icon?: string;
    active?: boolean;
    used?: boolean;
    animationDelay?: number;
    target: "point" | "none" | "tower" | "auto-consume";
    range?: number;
    markedForDeletion?: boolean;
    uses?: number;
};

export type Card = Upgrade | Spell;

export type USlot = {
    unlocked: boolean;
    upgrade: Upgrade | null;
    highlighted: boolean;
    purchasable: boolean;
};

export type TowerButton = Pick<TowerDef, 'name' | 'cost' | 'stats' | 'element' | 'sprite' | 'description'> & {
    id: TowerId;
    onClick: MouseEventHandler<HTMLButtonElement>;
};

export type TargetPriority = "Most Progress" | "Least Progress" | "Highest HP" | "Lowest HP" | "Closest" | "Furthest" | null;

export type SelectedUnitUI = {
    name: string;
    pos: Vec2;
    stats: TowerStats;
    priority: TargetPriority;
    element: ElementName;
    setPriority: (priority: TargetPriority) => void;
};

export type SelectedTowerUI = SelectedUnitUI & {
    towerId: string;
    cost: number;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
    addUpgradeSlot: () => void;
    setUpgrades: (upgrades: Upgrade[]) => {
        damage: number;
        range: number;
        fireInterval: number;
        critChance: number;
        critDamage: number;
    };
    sellTower: () => void;
    previewRange?: number | null;
};

export type SelectedFarmTowerUI = Pick<SelectedTowerUI, "towerId" | "cost" | "name" | "pos" | "sellTower" | "element"> & {
    plantedSeed: SeedId | null;
    turnsRemaining: 1 | 2 | 3 | null;
    availableSeeds: ["nightshade", "chili", "starfruit"];
    plantSeed: (id: SeedId) => void;
};

export type SelectedHeroUI = SelectedUnitUI & {
    heroId: string;
    level: number;
    skillIds: SkillId[];
    canReposition: boolean;
    reposition: () => void;
};

export type SelectedUI = SelectedTowerUI | SelectedHeroUI | SelectedFarmTowerUI | null;

type rect = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

export type Deck = {
    pos?: rect;
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type Scene = "level1" |
    "level1-2" |
    "levelTransition" |
    "mainMenu" |
    "level2" |
    "level2-2" |
    "level3" |
    "level4" |
    "level4-2" |
    "level5" |
    "level5-2" |
    "level6" |
    "desert1" |
    "desert1-2" |
    "desert2" |
    "desert2-2" |
    "desert3" |
    "hell1" |
    "hell1-2" |
    "hell2" |
    "hell2-2" |
    "hell3";

export type Scenes = Scene[][];

export type GameState = {
    world: 1 | 2;
    context: KAPLAYCtx | null;
    hideUI: boolean;
    towerButtons: TowerButton[];
    nextTowerId: number;
    selectedUI: SelectedUI;
    luck: number;
    gold: number;
    health: number;
    maxHealth: number;
    maxTowerUpgrades: number;
    upgrades: Card[];
    deck: Deck;
    selectedUpgrade: Card | null;
    scene: Scene;
    hero: HeroGameObj | null;
    heroButton: {
        visible: boolean;
        onClick: () => void;
    };
    heroCharge: {
        damageDealt: number;
        charge: number;
        damageRequired: number;
    };
    handVersion: number;
    waveActive: boolean;
    waveNumber: number;
    sceneIndex: number;
    level: number;
    difficulty: "normal" | "hard" | "expert";
    shops: ("shop" | "altar")[];
    towerCoins: number;
    challengeManager: ChallengeManager;
    camMoveAtEdge: boolean;
    showDamageNumbers: boolean;
    timeScale: number;
    gameOver: boolean;
    tileGrid: Tile[][];
};

export type ShopChoiceButtons = {
    visible: boolean;
    buttons: { name: "Shop" | "Altar"; text: "Go to Shop" | "Go to Altar", onClick: () => void; description: string }[];
};

export type Shop = {
    visible: boolean;
    towers: TowerId[];
    upgrades: Upgrade[];
    nextLevel: () => void;
    addTower: (id: TowerId) => void;
};

export type Altar = {
    visible: boolean;
    maxHPCost: 20;
    removeCardCost: 20;
    levelUpCost: 20;
    remainingUses: {
        maxHP: number;
        removeCard: number;
        levelUp: number;
    };
    levelUp: () => void;
};

export type EnemySpawn = {
    id: EnemyId;
    count: number;
    interval: number;
};

export type Wave = {
    spawns: EnemySpawn[];
    reward: number;
};

export type LevelWaves = {
    startingGold: number;
    startDelay: number;
    waves: Wave[];
    boss?: {
        id: EnemyId;
        bossStops: number[];
    };
    startingFreezeAmount?: number;
    shop?: boolean;
    challenge?: boolean;
    music: string;
};

export type EnemyConfig = {
    hp: number;
    damage: number;
    speed: number;
    sprite: string;
    hasLargeSoul?: boolean;
    armour?: number;
    healer?: {
        amount: number;
        range: number;
    };
    deathSound?: string;
    spawnOnDeath?: {
        id: "slime" |
        "spiderling" |
        "spider" |
        "armouredSlime" |
        "giantSlime" |
        "bee" |
        "snowmanHead" |
        "iceSlime" |
        "giantSnowmanHead" |
        "penguin" |
        "giantPenguin" |
        "locust";
        amount: number;
        offset?: number;
    };
    shootSound?: string;
    shieldSound?: string;
    attacker?: {
        projectile?: ProjectileId;
        attackRange: number;
        attackCooldown: number;
        canAttack: boolean;
    };
    invincibleDuration?: number;
    invincibleCooldown?: number;
    speedBooster?: {
        amount: number;
        range: number;
    };
    spawnArmourOnDeath?: {
        amount: number;
        range: number;
    };
    isBoss?: boolean;
    spawnIce?: boolean;
    presentDrops?: {
        segment: number;
        segmentProgress: number;
        enemies: { id: presentSpawns; amount: number; }[];
    }[];
    checkpointTimer?: number;
    goldDropped: number;
    bossMechanic?: "shield" | "escape";
    shieldSprite?: string;
    shieldHp?: number;
    chestValue: number;
    noDestroyOnDieAnimation?: boolean;
    onDeath?: (k: KAPLAYCtx, enemy: EnemyGameObj) => void;
    breakShell?: {
        speedMultiplier: number;
        animation: string;
    }
};

export type presentSpawns =
    "iceSlime" |
    "penguin" |
    "snowman" |
    "polarBear" |
    "giantIceSlime" |
    "giantPenguin" |
    "giantSnowman" |
    "giantPolarBear" |
    "giantPolarBearJockey";

export type AttackContext = {
    context: KAPLAYCtx;
    attacker: TowerGameObj | HeroGameObj;
    gun: GameObj;
    target?: AttackTarget;
    origin: Vec2;

    damage: number;
    element: ElementName;

    attackType: AttackType;

    projectiles: {
        id: ProjectileId;
        angle: number;
        target?: EnemyGameObj;
        homing: boolean;
        angleOffset?: number;
        homingDelay?: number;
        turnSpeed?: number;
        behaviors?: ProjectileBehavior;
        bonusDamage?: number;
        bonusCrit?: number;
        element?: ElementName;
    }[];

    visualEffect: typeof frostAoeBurst | null;
    lightning?: {
        damageMult?: number;
        maxChains: number;
        range: number;
    };

    volley?: {
        volleyChance?: number;
        volleyCount?: number;
        homingDelay?: number;
        volleyAngle?: number;
    };

    meleeAttack?: {
        onImpact?: (k: KAPLAYCtx, impactPos: Vec2) => void;
        splashRadius?: number;
        swingTime?: number;
        meleeHead: GameObj;
        meleeHandle: GameObj;
        headOffset?: number;
        swingAngle: number;
        startAngle: number;
    },

    isSummon?: boolean;
};

export type EffectContext = {
    target: GameObj;
    damage: number;
    chance?: number;
    duration?: number;
};

export type ProjectileBehavior = {
    bounces?: number;
    bounceRange?: number;
    bounceDamageMultiplier?: number;
    bounceChance?: number;
    distanceScaling?: number;
    distanceScalingCap?: number;
    persistent?: {
        owner: TowerGameObj;
        state: "flying" | "attached" | "returning";
        origin: Vec2;
    };
    animOnDestroy?: string;
    attach?: {
        ticks: number;
        interval: number;
        offset: number;
        infectionLevel?: number;
        sound?: string;
    };
    splash?: {
        radius: number;
        damageMult: number;
    };
    trailEffect?: "flame";
    impactEffect?: "explosiveFireball";
};

export type Rewards = {
    skills: SkillId[];
    addSkill: (id: SkillId) => void;
    addTower: (id: TowerId) => void;
    visible: boolean;
    show: ["skills", "upgrades", "towers"],
    rewardIndex: number;
};

export type startingHeroUI = {
    visible: boolean;
    options: HeroId[];
    addHero: (id: HeroId) => void;
};

export type StartingOptions = {
    visible: boolean;
    options: { ids: TowerId[]; upgrades: Upgrade[] }[];
    addLoadout: (ids: TowerId[], upgrades: Upgrade[]) => void;
};

export type AttackTarget =
    | { type: "enemy"; enemy: EnemyGameObj }
    | { type: "point"; pos: Vec2; pathIndex?: number };

export type TargetResolver = () => AttackTarget | null;

export type AttackType = "projectile" |
    "lightning" |
    "sniper_laser" |
    "piercing_laser" |
    "cone" |
    "aoe" |
    "melee" |
    "thunder" |
    "blizzard" |
    "ramp_laser";

export type DamageResult = {
    damage: number;
    isCrit: boolean;
};

export type GameEvent =
    | { type: "BUILD_TOWER"; towerId: TowerId; waveActive: boolean }
    | { type: "DRAW_CARD" }
    | { type: "DEAL_DAMAGE"; damageType: ElementName; amount: number };

export type ChallengeDef = {
    id: string;
    description: string;

    type: "progress" | "restriction";

    params?: Record<string, any>;

    // for progress challenges
    target?: number;

    // rules triggered by events
    conditions: Condition[];

    reward: number;
};

type Condition = {
    event: GameEvent["type"];
    where?: Record<string, any>;
    increment?: number | "amount";
    fail?: boolean;
};

export type ChallengeState = {
    def: ChallengeDef;
    progress: number;
    failed: boolean;
    completed: boolean;
};

export type PauseMenu = {
    visible: boolean;
    mainMenu: () => void;
    unPause: () => void;
};

export type Controls = {
    getButton: (action: string) => ButtonBinding;
    setButton: (action: string, key: Key | MouseButton, type: "keyboard" | "mouse") => void;
};

export type MainMenu = {
    visible: boolean;
    startGame: () => void;

};

export type GameSpeedUI = {
    visible: boolean;
    activeIndex: number;
    buttons: [
        {
            icon: string;
            onClick: () => void;
            width: number;
        },
        {
            icon: string;
            onClick: () => void;
            width: number;
        },
        {
            icon: string;
            onClick: () => void;
            width: number;
        }
    ];
};

export type AttachedZapOpts = {
    enemy: EnemyGameObj;
    damage: number;
    ticks: number;
    interval: number;
    element: ElementName;
    attacker: TowerGameObj;
};

export type HeroProgression = {
    unlocked: HeroId[];
    progress: {
        kills: number;
        towerCoinsSpent: number;
        completedLevels: {
            forest: "normal"[],
            snow: "normal" | "hard"[];
            desert: "normal"[];
            lava: "normal" | "hard"[];
        };
    };
};

export type AudioState = {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    uiVolume: number;
    muted: boolean;
};

export type SettingsSave = {
    volumes: {
        masterVolume: number,
        sfxVolume: number,
        musicVolume: number,
        uiVolume: number
    },
    camMoveAtEdge: boolean;
    showDamageNumbers: boolean;
    buttons: Record<string, { mouse?: MouseButton, keyboard?: Key }>;
    fullscreen?: boolean;
};

export type TutorialId =
    | "towerUpgrade"
    | "armour"
    | "heroCharge";

export type SeenTutorials =
    Partial<Record<TutorialId, number>>;

export type MetaSave = {
    unlockedHeroes: HeroId[];
    seenTutorials: SeenTutorials;
    spellsCast: number;
    levelsWithoutLivesLost: number;
    bossesKilled: number;
    chestsOpened: number;
    enemiesPoisoned: number;
    campaignLevelsCompleted: number;

    completedCampaigns: {
        world: 1 | 2;
        difficulty: "normal" | "hard" | "expert";
    }[];
};

export type RunSave = {
    deck: Upgrade[];
    scene: Scene;
    towerCoins: number;
    hero: {
        id: HeroId;
        level: number;
        skills: SkillId[];
    };
    sceneIndex: number;
    level: number;
    health: number;
    maxHealth: number;
    shops: ("shop" | "altar")[];
    heroCharge: {
        damageDealt: number;
        charge: number;
        damageRequired: number;
    };
    difficulty: "normal" | "hard" | "expert";
    nextTowerId: number;
    towerButtons: TowerId[];
    mapData: MapData;
    tileGrid: Tile[][];
    wave: LevelId;
    pathTiles: PathTile[];
    world?: 1 | 2;
};

export type SaveData = {
    version: number;

    settings: SettingsSave;

    meta: MetaSave;

    run?: RunSave;
};

export type SaveDataV1 = Omit<SaveData, "meta"> & {
    meta: Pick<MetaSave, "unlockedHeroes">;
};

export type SaveDataV2 = Omit<SaveData, "meta"> & {
    meta: Pick<MetaSave, "unlockedHeroes" | "seenTutorials">;
};

export type SaveDataV3 = SaveData;

export type MetaProgress = {
    spellsCast: number;
    levelsWithoutLivesLost: number;
    bossesKilled: number;
    chestsOpened: number;
    enemiesPoisoned: number;
    campaignLevelsCompleted: number;

    completedCampaigns: {
        world: 1 | 2;
        difficulty: "normal" | "hard" | "expert";
    }[];

    unlockedHeroes: HeroId[];
};

export type Requirement = {
    type: "spells_cast" | "complete_level_no_loss" | "boss_kills" | "chests_opened" | "poison_enemies" | "complete_level";
    amount: number;
};

export type UnlockToast = { icon: string; name: string; }[];

export type World = {
    scenes: Scenes;
    wavePrefix: "world1" | "world2";
};