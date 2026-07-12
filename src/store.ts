import { atom, createStore } from "jotai";
import { type startingHeroUI, type GameState, type Rewards, type StartingOptions, type ShopChoiceButtons, type Shop, type Altar, type ChallengeDef, type PauseMenu, type Controls, type MainMenu, type GameSpeedUI, type HeroProgression, type AudioState, type TutorialId, type SaveData } from "./types";
import { ChallengeManager } from "./utils/challengeHelpers";

export const gameStateAtom = atom<GameState>({
    context: null,
    towerButtons: [],
    selectedUI: null,
    waveActive: false,
    waveNumber: 0,
    nextTowerId: 0,
    health: 15,
    maxHealth: 15,
    hideUI: false,
    luck: 1,
    gold: 100,
    maxTowerUpgrades: 5,
    upgrades: [],
    sceneIndex: 0,
    gameOver: false,
    level: 1,
    deck: {
        cards: [],
        drawCard: () => { },
        drawCost: 10
    },
    selectedUpgrade: null,
    handVersion: 0,
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
    difficulty: "normal",
    shops: ["shop", "altar"],
    towerCoins: 0,
    challengeManager: new ChallengeManager(),
    camMoveAtEdge: true,
    showDamageNumbers: true,
    timeScale: 1
});

export const chestAtom = atom({
    visible: false
});

export const mapAtom = atom({
    iconScale: 1,
    fontScale: 1
});

export const rewardsAtom = atom<Rewards>({
    skills: [],
    visible: false,
    show: ["skills", "upgrades", "towers"],
    rewardIndex: 0,
    addSkill: () => { },
    addTower: () => { }
});

export const startingOptionsAtom = atom<StartingOptions>({
    visible: false,
    options: [],
    addLoadout: () => { }
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
    addHero: () => { }
});

export const shopChoiceUIAtom = atom<ShopChoiceButtons>({
    visible: false,
    buttons: [
        {
            name: "Shop",
            text: "Go to Shop",
            description: "Buy towers and upgrade cards.",
            onClick: () => { }
        },
        {
            name: "Altar",
            text: "Go to Altar",
            description: "Make offerings to recover HP, increase max HP, and cleanse your deck of unwanted cards.",
            onClick: () => { }
        }
    ]
});

export const shopAtom = atom<Shop>({
    visible: false,
    towers: [],
    upgrades: [],
    addTower: () => { },
    nextLevel: () => { }
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
    levelUp: () => { }
});

export const challengesAtom = atom({
    visible: false,
    challenges: [] as ChallengeDef[]
});

export const pauseMenuAtom = atom<PauseMenu>({
    visible: false,
    unPause: () => { },
    mainMenu: () => { }
});

export const controlsAtom = atom<Controls>({
    getButton: () => { return { keyboard: "" } },
    setButton: () => { }
});

export const mainMenuAtom = atom<MainMenu>({
    visible: false,
    startGame: () => { }
});

export const gameSpeedUIAtom = atom<GameSpeedUI>({
    visible: false,
    activeIndex: 0,
    buttons: [
        {
            icon: "sprites/play-icon.png",
            onClick: () => { },
            width: 16
        },
        {
            icon: "sprites/fast-forward-icon.png",
            onClick: () => { },
            width: 16
        },
        {
            icon: "sprites/fast-fast-forward-icon.png",
            onClick: () => { },
            width: 25
        }
    ]
});

export const heroProgressionAtom = atom<HeroProgression>({
    unlocked: ["archer", "wizard"],
    progress: {
        kills: 0,
        towerCoinsSpent: 0,
        completedLevels: {
            forest: [],
            snow: [],
            desert: [],
            lava: []
        }
    }
});

export const audioAtom = atom<AudioState>({
    masterVolume: 1,
    sfxVolume: 1,
    musicVolume: 1,
    uiVolume: 1,
    muted: false
});

export const cachedSaveAtom = atom<SaveData | null>(null);

export const activeTutorialAtom = atom<TutorialId | null>(null);

export const store = createStore();