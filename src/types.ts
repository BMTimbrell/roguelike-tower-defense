import { type MouseEventHandler } from "react";
import { TILE_SIZE } from "./constants";

type layerObj = {
    x: number;
    y: number;
    height: number;
    width: number;
};

type layer = {
    name: string;
    objects?: layerObj[];
    data?: number[];
};

export type mapData = {
    tilewidth: typeof TILE_SIZE;
    tileheight: typeof TILE_SIZE;
    width: number;
    height: number;
    layers: layer[];
};

export type tower = {
    name: string;
    onClick: MouseEventHandler<HTMLDivElement>;
} | null;

export type gameState = {
    towers: tower[];
    selectedTower: tower;
};