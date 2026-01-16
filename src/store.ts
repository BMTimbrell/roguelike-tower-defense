import { atom, createStore } from "jotai";
import type { GameState } from "./types";

export const gameStateAtom = atom<GameState>({
    towers: [],
    selectedTower: null,
    nextTowerId: 0,
    gold: 100000,
    maxTowerUpgrades: 5,
    upgrades: [],
    deck: {
        cards: [],
        drawCard: () => {},
        drawCost: 10
    },
    selectedUpgrade: null,
    mouseOverUI: false,
    reroll: {
        baseCost: 5,
        roll: () => null
    }
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();