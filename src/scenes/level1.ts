import type { KAPLAYCtx } from "kaplay";
import makeEnemy from "../entities/enemy";
import makeTower, { toggleTowerSelection } from "../entities/Tower";
import type { mapData } from "../types";
import { mapAtom, store, gameStateAtom } from "../store";
import getMapScreenBounds from "../utils/getMapScreenBounds";
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from "../constants";

export default function level1(k: KAPLAYCtx) {
    k.scene("level1", async () => {
        const mapData: mapData = await (await fetch("data/level1.json")).json();

        const mapPosX = (VIRTUAL_WIDTH - mapData.width * mapData.tilewidth) / 2;
        const mapPosY = (VIRTUAL_HEIGHT - mapData.height * mapData.tileheight) / 2;
        k.add([
            k.sprite("level1"),
            k.pos(k.vec2(mapPosX, mapPosY)),
            "level1"
        ]);

        let mapBounds = getMapScreenBounds(k, mapData);

        store.set(mapAtom, {
            x: mapBounds.x,
            y: mapBounds.y,
            width: mapBounds.width,
            height: mapBounds.height,
            scale: mapBounds.scale
        });

        k.onResize(() => {
            mapBounds = getMapScreenBounds(k, mapData);
            store.set(mapAtom, {
                x: mapBounds.x,
                y: mapBounds.y,
                width: mapBounds.width,
                height: mapBounds.height,
                scale: mapBounds.scale
            });
        });

        mapData.layers.find(layer => layer.name === "Ground")?.data?.forEach((tile, index) => {
            k.add([
                k.pos(k.vec2(mapPosX + (index % mapData.width) * mapData.tilewidth, mapPosY + (Math.floor(index / mapData.width)) * mapData.tileheight)),
                k.area({ shape: new k.Rect(k.vec2(0), mapData.tilewidth, mapData.tileheight) }),
                "tile",
                {
                    blocked: tile !== 1
                }
            ]);
        });

        const cursor = k.add([
            "cursor",
            k.pos(k.mousePos()),
            k.area({
                shape: new k.Rect(k.vec2(0), 1, 1)
            })
        ]);

        cursor.onUpdate(() => {
            cursor.pos = k.mousePos();
        });

        store.set(gameStateAtom, prev => ({
            ...prev,
            towers: [...prev.towers, {
                name: "Basic Tower",
                onClick: () => makeTower(k, k.mousePos())
            }]
        }));

        toggleTowerSelection(k);

        const waypoints = mapData.layers.find(
            layer => layer.name === "Waypoints"
        )?.objects?.map(obj => k.vec2(mapPosX + obj.x + mapData.tilewidth / 2, mapPosY + obj.y + mapData.tileheight / 2));

        if (waypoints) {
            makeEnemy(k, waypoints);
        } else throw new Error("waypoints undefined");

    });
}