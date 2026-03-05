import { atom, createStore } from "jotai";
import type { GameState, Rewards, StartingOptions } from "./types";

export const gameStateAtom = atom<GameState>({
    towerButtons: [],
    selectedUI: null,
    waveActive: false,
    nextTowerId: 0,
    health: 10,
    gold: 1000,
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
        roll: () => null,
        rerollCount: 0
    },
    heroCanReposition: true,
    scene: "mainMenu",
    hero: null,
    heroButton: {
        visible: true,
        onClick: () => null
    },
    heroCharge: {
        charge: 0,
        damageDealt: 0,
        damageRequired: 0
    }
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const rewardsAtom = atom<Rewards>({
    skills: [],
    visible: false
});

export const startingOptionsAtom = atom<StartingOptions>({
    visible: false,
    options: [],
    addLoadout: () => {}
});

export const store = createStore();