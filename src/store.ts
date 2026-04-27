import { atom, createStore } from "jotai";
import { type startingHeroUI, type GameState, type Rewards, type StartingOptions, type ShopChoiceButtons, type Shop, type Altar } from "./types";

export const gameStateAtom = atom<GameState>({
    towerButtons: [],
    selectedUI: null,
    waveActive: false,
    nextTowerId: 0,
    health: 15,
    maxHealth: 15,
    gold: 100,
    maxTowerUpgrades: 5,
    upgrades: [],
    sceneIndex: 0,
    level: 1,
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
    },
    difficulty: "hard",
    shops: ["shop", "altar"],
    towerCoins: 0
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
    visible: false,
    show: ["skills", "upgrades", "towers"],
    rewardIndex: 0,
    addSkill: () => {},
    addTower: () => {}
});

export const startingOptionsAtom = atom<StartingOptions>({
    visible: false,
    options: [],
    addLoadout: () => {}
});

export const selectHeroUIAtom = atom<startingHeroUI>({
    visible: false,
    options: [
        "archer", 
        "wizard", 
        "knight", 
        "assassin", 
        "merchant", 
        "witch", 
        "songstress",
        "necromancer"
    ],
    addHero: () => {}
});

export const shopChoiceUIAtom = atom<ShopChoiceButtons>({
    visible: false,
    buttons: [
        {
            name: "Shop",
            text: "Go to Shop",
            description: "Buy towers and upgrade cards.",
            onClick: () => {}
        },
        {
            name: "Altar",
            text: "Go to Altar",
            description: "Make offerings to recover HP, increase max HP, and cleanse your deck of unwanted cards.",
            onClick: () => {}
        }
    ]
});

export const shopAtom = atom<Shop>({
    visible: false,
    towers: [],
    upgrades: [],
    addTower: () => {},
    nextLevel: () => {}
});

export const altarAtom = atom<Altar>({
    visible: false,
    maxHPCost: 20,
    removeCardCost: 20,
    levelUpCost: 20,
    remainingUses: {
        maxHP: 3,
        removeCard: 3,
        levelUp: 1
    },
    levelUp: () => {}
});

export const store = createStore();