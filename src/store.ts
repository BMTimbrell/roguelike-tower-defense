import { atom, createStore } from "jotai";
import type { GameState } from "./types";

export const gameStateAtom = atom<GameState>({
    towerButtons: [],
    selectedUI: null,
    nextTowerId: 0,
    health: 10,
    gold: 200,
    maxTowerUpgrades: 5,
    upgrades: [],
    deck: {
        cards: [],
        drawCard: () => {},
        drawCost: 10
    },
    selectedUpgrade: null,
    reroll: {
        cost: 5,
        baseCost: 5,
        roll: () => null
    },
    heroCanReposition: true,
    bottomBarVisible: true,
    hero: null
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();