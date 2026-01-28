import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId, type TowerId } from "./constants";
import type { Vec2, GameObj } from "kaplay";

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

export type TowerDef = {
    name: string;
    cost: number;
    stats: TowerStats;
    sprite: string;
};

export type TowerInstance = TowerDef & {
    instanceId: string;
    towerId: TowerId;
    pos: Vec2;
    priority: TargetPriority;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
    selected: boolean;
    placeable: boolean;
    placed: boolean;
    hovered: boolean;
    shootTimer: number;
    shoot?: (target: GameObj) => void;
};

export type TowerGameObj = GameObj & TowerInstance;

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

export type TowerButton = TowerDef & {
    onClick: MouseEventHandler<HTMLButtonElement>;
};

export type TargetPriority = "Most Progress" | "Least Progress" | "Highest HP" | "Lowest HP";

export type SelectedTowerUI = Omit<TowerInstance, 
    | "selected"
    | "placed"
    | "hovered"
    | "placeable"
    | "shootTimer"
    | "shoot"
> & {
    addUpgradeSlot: () => void;
    setUpgrades: (upgrades: Upgrade[]) => {
        damage: number;
        range: number;
        fireInterval: number;
        critChance: number;
        critDamage: number;
    };
    setPriority: (priority: TargetPriority) => void;
    sellTower: () => void;
};

export type Deck = {
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type GameState = {
    towerButtons: TowerButton[];
    nextTowerId: number;
    selectedTower: SelectedTowerUI | null;
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