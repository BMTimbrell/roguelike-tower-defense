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
    tilewidth: number;
    tileheight: number;
    width: number;
    height: number;
    layers: layer[];
};