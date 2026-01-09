import { type MouseEventHandler } from "react";
import { TILE_SIZE } from "./constants";
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
    name: "Damage" | "Range" | "Fire rate" | "Crit chance" | "Crit damage";
    amount: number;
    cost: number;
    percentage: boolean;
    active?: boolean;
    used?: boolean;
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

export type SelectedTower = TowerBase & {
    towerId: string;
    pos: Vec2;
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
};

export type Tower = TowerBase & SelectedTower & {
    placed: boolean;
    placeable: boolean;
    selected: boolean;
    hovered: boolean;
    shoot?: (target: GameObj) => void;
    shootTimer: number;
};

export type GameState = {
    towers: TowerButton[];
    nextTowerId: number;
    selectedTower: SelectedTower | null;
    gold: number;
    maxTowerUpgrades: number;
    upgrades: Upgrade[];
    selectedUpgrade: Upgrade | null;
};