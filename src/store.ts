import { atom, createStore } from "jotai";

export const towerMenuAtom = atom({
    visible: false,
    buttons: []
});

export const mapAtom = atom({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
    scale: 1
});

export const store = createStore();