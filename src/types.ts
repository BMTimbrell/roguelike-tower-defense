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
};

export type Upgrade = {
    stat: string;
    amount: number;
    cost: number;
    percentage: boolean;
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
    range: number;
    fireInterval: number;
    pos: Vec2;
    upgrades: Upgrade[];
    unlockedUpgradeSlots: number;
    upgradeCost: number;
    addUpgradeSlot: () => void;
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
    selectedTower: SelectedTower | null;
    gold: number;
    maxTowerUpgrades: number;
    upgrades: Upgrade[];
    selectedUpgrade: Upgrade | null;
};