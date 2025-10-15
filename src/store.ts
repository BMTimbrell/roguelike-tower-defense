import { atom, createStore } from "jotai";

export const towerMenuAtom = atom({
    visible: false,
    buttons: []
});

export const mapAtom = atom({
    xPos: 0,
    width: 0
});

export const store = createStore();