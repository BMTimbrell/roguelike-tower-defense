import { type MouseEventHandler } from "react";
import { TILE_SIZE, type EnemyId } from "./constants";
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

type TowerBase = {
    name: string;
    cost: number;
    stats: {
        damage: number;
        range: number;
        fireInterval: number;
        critChance: number;
        critDamage: number;
    }
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
};

export type USlot = {
    unlocked: boolean;
    upgrade: Upgrade | null;
    highlighted: boolean;
    purchasable: boolean;
};

export type TowerButton = TowerBase & {
    onClick: MouseEventHandler<HTMLButtonElement>;
};

export type targetPriority = "Most Progress" | "Least Progress" | "Highest HP" | "Lowest HP";

export type SelectedTower = TowerBase & {
    towerId: string;
    pos: Vec2;
    priority: targetPriority;
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
    setPriority: (priority: targetPriority) => void;
    sellTower: () => void;
};

export type Tower = TowerBase & SelectedTower & {
    placed: boolean;
    placeable: boolean;
    selected: boolean;
    hovered: boolean;
    shoot?: (target: GameObj) => void;
    shootTimer: number;
};

export type Deck = {
    cards: Upgrade[];
    drawCard: () => void;
    drawCost: number;
};

export type GameState = {
    towers: TowerButton[];
    nextTowerId: number;
    selectedTower: SelectedTower | null;
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
    spawns: EnemySpawn[]
};

export type LevelWaves = {
    startDelay?: number;
    waves: Wave[];
};

export type EnemyConfig = {
    hp: number;
    damage: number;
    speed: number;
    sprite: string;
};