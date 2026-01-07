import { atom, createStore } from "jotai";
import type { GameState } from "./types";

export const gameStateAtom = atom<GameState>({
    towers: [],
    selectedTower: null,
    gold: 500,
    maxTowerUpgrades: 5,
    upgrades: [],
    selectedUpgrade: null
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();