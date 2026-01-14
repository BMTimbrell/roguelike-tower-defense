import { atom, createStore } from "jotai";
import type { GameState } from "./types";

export const gameStateAtom = atom<GameState>({
    towers: [],
    selectedTower: null,
    nextTowerId: 0,
    gold: 100,
    maxTowerUpgrades: 5,
    upgrades: [],
    deck: {
        cards: [],
        drawCard: () => {},
        drawCost: 10
    },
    selectedUpgrade: null,
    mouseOverUI: false
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();