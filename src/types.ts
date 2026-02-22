import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId, type HeroId, type ProjectileId, type SkillId, type TowerId } from "./constants";
import type { Vec2, GameObj, KAPLAYCtx, HealthComp, SpriteComp, StateComp, TimerComp, RotateComp, PosComp } from "kaplay";

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

export type UnitEffects = {
    firstEffect?: (ctx: AttackContext) => void;
    secondEffect?: (ctx: AttackContext) => void;
}[];

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
    effects?: UnitEffects;
    canRotate: boolean;
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
};

export type TowerInstance = UnitInstance & {
    instanceId: string;
    towerId: TowerId;
    cost: number;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
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

export type HeroDef = Omit<TowerDef, 'cost'>;
export type HeroInstance = UnitInstance & {
    heroId: HeroId;
    skillIds: SkillId[];
    level: number;
    canReposition: boolean;
};

export type HeroGameObj = GameObj & HeroInstance;

export type EnemyGameObj = GameObj<
    HealthComp | 
    SpriteComp | 
    StateComp | 
    TimerComp | 
    RotateComp | 
    PosComp> & {
    path: Vec2[];
    pathIndex: number;
    segmentStart: Vec2;
    segmentProgress: number;
    baseSpeed: number;
    speed: number;
    damage: number;
    isDying: boolean;
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

export type TargetPriority = "Most Progress" | "Least Progress" | "Highest HP" | "Lowest HP";

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

export type SelectedHeroUI = SelectedUnitUI & {
    heroId: string;
    level: number;
    skillIds: SkillId[];
    canReposition: boolean;
    reposition: () => void;
}

export type Deck = {
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type Scene = "level1" | "levelTransition" | "mainMenu";

export type GameState = {
    towerButtons: TowerButton[];
    nextTowerId: number;
    selectedUI: SelectedTowerUI | SelectedHeroUI | null;
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
};

export type AttackContext = {
    attacker: TowerGameObj | HeroGameObj;
    target?: EnemyGameObj;
    origin: Vec2;

    damage: number;
    element: ElementName;

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
        element?: ElementName;
    }[];

    aoeAttack: boolean;
    lightningAttack: boolean;

    archer?: {
        volleyChance?: number;
    };
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
    persistent?: {
        owner: TowerGameObj;
        state: "flying" | "attached" | "returning";
        origin: Vec2;
    }
};

export type Rewards = {
    skills: SkillId[];
    visible: boolean;
};

export type StartingOptions = {
    visible: boolean;
    options: { ids: TowerId[]; upgrades: Upgrade[] }[];
    addTowers: (ids: TowerId[]) => void;
};