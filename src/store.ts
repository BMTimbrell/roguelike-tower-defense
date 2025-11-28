import { atom, createStore } from "jotai";
import type { gameState } from "./types";

export const gameStateAtom = atom<gameState>({
    towers: [],
    selectedTower: null
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();