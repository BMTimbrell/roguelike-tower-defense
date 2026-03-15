import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId, type HeroId, type ProjectileId, type SkillId, type TowerId } from "./constants";
import type { Vec2, GameObj, KAPLAYCtx, HealthComp, SpriteComp, StateComp, TimerComp, RotateComp, PosComp, ZComp } from "kaplay";
import { frostAoeBurst } from "./utils/makeUnitCombat";

type LayerObj = {
    x: number;
    y: number;
    height: number;
    width: number;
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
};

export type Charge = {
    currentCharge: number;
    maxCharge: number;
    chargePerShot: number;
    decayDelay: number;
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

export type HeroDef = Omit<TowerDef, 'cost' | "farmData" | "source">;
export type HeroInstance = UnitInstance & {
    heroId: HeroId;
    skillIds: SkillId[];
    level: number;
    canReposition: boolean;
    tileGrid: Tile[][];
    pathTiles: PathTile[];
};

export type HeroGameObj = GameObj & HeroInstance;

export type EnemyGameObj = GameObj<
    HealthComp |
    SpriteComp |
    StateComp |
    TimerComp |
    RotateComp |
    PosComp |
    ZComp
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
    maxArmour: number;
    healer?: {
        amount: number;
        range: number;
    };
    healTickRate?: number;
    spawnOnDeath?: {
        id: "slime",
        amount: number;
    };
    attacker?: {
        projectile?: ProjectileId;
        attackRange: number;
        attackCooldown: number;
        canAttack: boolean;
    };
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
};

export type USlot = {
    unlocked: boolean;
    upgrade: Upgrade | null;
    highlighted: boolean;
    purchasable: boolean;
};

export type TowerButton = Pick<TowerDef, 'name' | 'cost' | 'stats' | 'element' | 'sprite' | 'description'> & {
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

export type Deck = {
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type Scene = "level1" | "level1-2" | "levelTransition" | "mainMenu";

export type GameState = {
    towerButtons: TowerButton[];
    nextTowerId: number;
    selectedUI: SelectedUI;
    gold: number;
    health: number;
    maxTowerUpgrades: number;
    upgrades: Upgrade[];
    deck: Deck;
    selectedUpgrade: Upgrade | null;
    reroll: {
        cost: number;
        baseCost: number;
        roll: () => void;
        rerollCount: number;
    };
    heroCanReposition: boolean;
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
    waveActive: boolean;
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
    startDelay: number;
    waves: Wave[];
};

export type EnemyConfig = {
    hp: number;
    damage: number;
    speed: number;
    sprite: string;
    armour?: number;
    healer?: {
        amount: number;
        range: number;
    };
    spawnOnDeath?: {
        id: "slime";
        amount: number;
    };
    attacker?: {
        projectile?: ProjectileId;
        attackRange: number;
        attackCooldown: number;
        canAttack: boolean;
    };
};

export type AttackContext = {
    attacker: TowerGameObj | HeroGameObj;
    gun: GameObj;
    target?: EnemyGameObj;
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
        maxChains: number;
        range: number;
    };

    volley?: {
        volleyChance?: number;
        volleyCount?: number;
        homingDelay?: number;
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
    }
};

export type EffectContext = {
    target: GameObj;
    damage: number;
};

export type ProjectileBehavior = {
    bounces?: number;
    bounceRange?: number;
    bounceDamageMultiplier?: number;
    bounceChance?: number;
    distanceDamageMultiplier?: number;
    distanceDamageCap?: number;
    damagePerTile?: number;
    persistent?: {
        owner: TowerGameObj;
        state: "flying" | "attached" | "returning";
        origin: Vec2;
    };
    animOnDestroy?: string;
};

export type Rewards = {
    skills: SkillId[];
    visible: boolean;
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

export type AttackType = "projectile" | "lightning" | "sniper_laser" | "piercing_laser" | "cone" | "aoe" | "melee" | "thunder" | "blizzard";

export type DamageResult = {
    damage: number;
    isCrit: boolean;
};