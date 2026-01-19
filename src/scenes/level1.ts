import type { KAPLAYCtx } from "kaplay";
import makeEnemy from "../entities/enemy";
import makeTower, { addSelectTowerListener } from "../entities/tower";
import type { MapData, Tower } from "../types";
import { mapAtom, store, gameStateAtom } from "../store";
import getMapScreenBounds from "../utils/getMapScreenBounds";
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, TILE_SIZE } from "../constants";
import generateDeck from "../utils/generateDeck";
import drawCards from "../utils/drawCards";
import reroll from "../utils/reroll";

export default function level1(k: KAPLAYCtx) {
    k.scene("level1", async () => {
        const mapData: MapData = await (await fetch("data/level1.json")).json();

        const mapPosX = (VIRTUAL_WIDTH - mapData.width * mapData.tilewidth) / 2;
        const mapPosY = (VIRTUAL_HEIGHT - mapData.height * mapData.tileheight) / 2;

        k.add([
            k.sprite("level1"),
            k.pos(k.vec2(mapPosX, mapPosY)),
            "level1",
        ]);

        k.add([
            k.sprite("gold"),
            k.scale(2),
            k.pos(20),
            "gold"
        ]);

        const goldText = k.add([
            k.pos(38, 19),
            k.color('#FFFFFF'),
            k.text('' + store.get(gameStateAtom).gold, {
                size: 20,
                font: "free pixel"
            }),
            k.z(999),
            "gold value",
        ]);

        goldText.onUpdate(() => goldText.use(k.text('' + store.get(gameStateAtom).gold, {
            size: 20,
            font: "free pixel"
        })));

        // Compute screen bounds and save in store
        let mapBounds = getMapScreenBounds(k, mapData);
        store.set(mapAtom, {
            x: mapBounds.x,
            y: mapBounds.y,
            width: mapBounds.width,
            height: mapBounds.height,
            scale: mapBounds.scale,
        });

        k.onResize(() => {
            mapBounds = getMapScreenBounds(k, mapData);
            store.set(mapAtom, {
                x: mapBounds.x,
                y: mapBounds.y,
                width: mapBounds.width,
                height: mapBounds.height,
                scale: mapBounds.scale,
            });
        });

        // Generate tile grid for placement logic
        const tileGrid: boolean[][] = [];
        mapData.layers.find(layer => layer.name === "Ground")?.data?.forEach((tile, index) => {
            const x = index % mapData.width;
            const y = Math.floor(index / mapData.width);
            if (!tileGrid[y]) tileGrid[y] = [];
            tileGrid[y][x] = tile !== 1;
        });

        const cursor = k.add([
            "cursor",
            k.pos(k.mousePos()),
            k.area({
                shape: new k.Rect(k.vec2(0), 1, 1)
            })]);

        cursor.onUpdate(() => {
            cursor.pos = k.mousePos();
        });

        // Deck and upgrades setup
        const deck = generateDeck(k);
        const upgrades = drawCards(k, deck, 3);
        store.set(gameStateAtom, prev => ({
            ...prev,
            towers: [
                ...prev.towers,
                {
                    name: "Basic Tower",
                    cost: 50,
                    stats: {
                        damage: 4,
                        range: 3,
                        fireInterval: 0.75,
                        critChance: 5,
                        critDamage: 100,
                    },
                    onClick: () => {
                        const unplacedTower = k.get("tower").find(t => !t.placed);
                        if (unplacedTower) k.destroy(unplacedTower);
                        else makeTower(
                            k,
                            {
                                name: "Basic Tower",
                                pos: k.mousePos(),
                                placed: false,
                                placeable: false,
                                stats: {
                                    damage: 4,
                                    range: 3,
                                    fireInterval: 0.75,
                                    critChance: 5,
                                    critDamage: 100,
                                },
                                selected: true,
                                shootTimer: 0,
                                cost: 50,
                            } as Tower,
                            tileGrid,
                            mapPosX,
                            mapPosY
                        );

                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            nextTowerId: prev.nextTowerId + 1,
                            selectedTower: null,
                        }));
                    },
                },
            ],
            upgrades,
            deck: {
                ...prev.deck,
                cards: deck,
                drawCard: () => {
                    const card = drawCards(k, deck, 1)[0];
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gold: prev.gold - store.get(gameStateAtom).deck.drawCost,
                        upgrades: [...prev.upgrades, card],
                        deck: {
                            ...prev.deck,
                            drawCost: Math.min(160, prev.deck.drawCost * 2),
                        },
                    }));
                },
            },
            reroll: {
                ...prev.reroll,
                roll: () => reroll(k),
            },
        }));

        addSelectTowerListener(k);

        // Waypoints for enemies
        const waypoints = mapData.layers
            .find(layer => layer.name === "Waypoints")
            ?.objects?.map(obj => k.vec2(mapPosX + obj.x + TILE_SIZE / 2, mapPosY + obj.y + TILE_SIZE / 2));

        if (waypoints) {
            makeEnemy(k, waypoints);
        } else throw new Error("Waypoints undefined");
    });
}