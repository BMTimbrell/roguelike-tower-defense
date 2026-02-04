import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId, type ProjectileId, type TowerId } from "./constants";
import type { Vec2, GameObj, KAPLAYCtx } from "kaplay";

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
    applyEffect: ((k: KAPLAYCtx, target: GameObj) => void) | null;
    color: string;
};

export type ProjectileDef = {
    sprite: string;
    hitbox: { width: number; height: number };
    speed: number;
    splashRadius: number;
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
    gunOffset: { x: number; y: number };
    anchorOffset: { x: number; y: number };
    shootOffset: { x: number; y: number };
    projectile: ProjectileId;
};

export type UnitInstance = {
    instanceId: string;
    name: string;
    stats: TowerStats;
    element: ElementName;
    pos: Vec2;
    priority: TargetPriority;
    selected: boolean;
    hovered: boolean;
    placeable: boolean;
    placed: boolean;
};

export type TowerInstance = UnitInstance & {
    towerId: TowerId;
    cost: number;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
};

export type TowerGameObj = GameObj & TowerInstance;

export type HeroSkillDef = {
    id: string;
    name: string;
    description: string;
    apply: (hero: HeroGameObj) => void;
    icon?: string;
};

export type HeroDef = Omit<TowerDef, | 'cost' | 'description'> & {
    description?: string;
    skills: HeroSkillDef[];
};

export type HeroInstance = UnitInstance & {
    heroId: string;
    skills: HeroSkillDef[];
    level: number;
    canReposition: boolean;
};

export type HeroGameObj = GameObj & HeroInstance;

export type Upgrade = {
    stat: "damage" | "range" | "fireInterval" | "critChance" | "critDamage";
    name: "Damage" | "Range" | "Fire Rate" | "Crit Chance" | "Crit Damage";
    amount: number;
    cost: number;
    percentage: boolean;
    active?: boolean;
    used?: boolean;
    icon?: string;
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
    towerId: string;
    name: string;
    pos: Vec2;
    stats: TowerStats;
    priority: TargetPriority;
    element: ElementName;
    setPriority: (priority: TargetPriority) => void;
};

export type SelectedTowerUI = SelectedUnitUI & {
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
    level: number;
    skills: HeroSkillDef[];
    canReposition: boolean;
    reposition: () => void;
}

export type Deck = {
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type GameState = {
    towerButtons: TowerButton[];
    nextTowerId: number;
    selectedTower: SelectedTowerUI | SelectedHeroUI | null;
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