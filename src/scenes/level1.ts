import type { KAPLAYCtx, Vec2 } from "kaplay";
import makeTower, { addSelectTowerListener } from "../entities/Tower";
import type { MapData } from "../types";
import { mapAtom, store, gameStateAtom } from "../store";
import { TILE_SIZE, TOWERS, FOG_Z } from "../constants";
import generateDeck from "../utils/generateDeck";
import drawCards from "../utils/drawCards";
import reroll from "../utils/reroll";
import showLevelStats from "../utils/showLevelStats";
import makeWaveSpawner from "../entities/WaveSpawner";

export default function level1(k: KAPLAYCtx) {
    k.scene("level1", async () => {
        const mapData: MapData = await (await fetch("data/level1.json")).json();

        k.add([
            k.sprite("level1"),
            k.pos(k.vec2(0)),
            "level1",
        ]);

        showLevelStats(k);

        // Compute screen bounds and save in store
        const mapPosX = 0;
        const mapPosY = 0;
        const mapWorldWidth = mapData.width * mapData.tilewidth;
        const mapWorldHeight = mapData.height * mapData.tileheight;
        let zoom = k.width() < 800 ? 1 : 2;
        k.setCamScale(zoom);

        let dragActive = false;
        let lastTouchPos: Vec2 | null = null;

        // ---- Mouse ----
        k.onMousePress("middle", () => dragActive = true);
        k.onMouseRelease("middle", () => dragActive = false);

        // ---- Touch ----
        k.onTouchStart(pos => {
            dragActive = true;
            lastTouchPos = pos;
        })

        k.onTouchEnd(() => {
            dragActive = false;
            lastTouchPos = null;
        })

        k.onTouchMove(pos => {
            if (!dragActive || !lastTouchPos) return;
            const d = pos.sub(lastTouchPos);
            k.setCamPos(k.getCamPos().sub(d));
            lastTouchPos = pos;
        })


        k.onUpdate(() => {
            const speed = 400 * k.dt();
            const EDGE = 20;

            if (!dragActive) {
                // wasd
                if (k.isKeyDown("a")) k.setCamPos(k.getCamPos().add(-speed, 0));
                if (k.isKeyDown("d")) k.setCamPos(k.getCamPos().add(speed, 0));
                if (k.isKeyDown("w")) k.setCamPos(k.getCamPos().add(0, -speed));
                if (k.isKeyDown("s")) k.setCamPos(k.getCamPos().add(0, speed));

                // --- Mouse Edge ---
                const m = k.mousePos();
                const w = k.width();
                const h = k.height();

                if (m.x < EDGE) k.setCamPos(k.getCamPos().add(-speed, 0));
                if (m.x > w - EDGE) k.setCamPos(k.getCamPos().add(speed, 0));
                if (m.y < EDGE) k.setCamPos(k.getCamPos().add(0, -speed));
                if (m.y > h - EDGE) k.setCamPos(k.getCamPos().add(0, speed));
            }

            if (dragActive && k.isMouseDown("middle")) {
                const d = k.mouseDeltaPos();
                k.setCamPos(k.getCamPos().sub(d));
            }
        });

        let viewW = k.width() / zoom;
        let viewH = k.height() / zoom;
        let minX = viewW / 2;
        let minY = viewH / 2;
        let maxX = mapWorldWidth - viewW / 2;
        let maxY = mapWorldHeight - viewH / 2;

        k.add([
            k.sprite("fog", { width: 512, height: mapWorldHeight }),
            k.pos(-512, 0),
            k.opacity(0.85),
            k.z(FOG_Z)
        ]);

        k.add([
            k.sprite("fog", { width: 512, height: mapWorldHeight }),
            k.pos(mapWorldWidth, 0),
            k.opacity(0.85),
            k.z(FOG_Z)
        ]);

        k.add([
            k.sprite("fog", { width: mapWorldWidth, height: 512 }),
            k.pos(0, -512),
            k.opacity(0.85),
            k.z(FOG_Z)
        ]);

        k.add([
            k.sprite("fog", { width: mapWorldWidth, height: 512 }),
            k.pos(0, mapWorldHeight),
            k.opacity(0.85),
            k.z(FOG_Z)
        ]);

        k.onUpdate(() => {
            const p = k.getCamPos();
            k.setCamPos(
                k.vec2(
                    k.clamp(p.x, minX, maxX),
                    k.clamp(p.y, minY, maxY),
                )
            );
        });

        store.set(mapAtom, {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            scale: k.getCamScale().x,
        });

        k.onResize(() => {
            zoom = k.width() < 800 ? 1 : 2;
            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2;
            maxX = mapWorldWidth - viewW / 2;
            maxY = mapWorldHeight - viewH / 2;
            k.setCamScale(k.width() < 800 ? 1 : 2);
            store.set(mapAtom, {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                scale: k.getCamScale().x,
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
            k.pos(k.toWorld(k.mousePos())),
            k.area({
                shape: new k.Rect(k.vec2(0), 1, 1)
            })
        ]);

        cursor.onUpdate(() => {
            cursor.pos = k.toWorld(k.mousePos());
        });

        // Deck and upgrades setup
        const deck = generateDeck(k);
        const upgrades = drawCards(k, deck, 3);
        store.set(gameStateAtom, prev => ({
            ...prev,
            towerButtons: [
                ...prev.towerButtons,
                {
                    ...TOWERS["basic"],
                    onClick: () => {
                        const unplacedTower = k.get("tower").find(t => !t.placed);
                        if (unplacedTower) k.destroy(unplacedTower);
                        else makeTower(
                            k,
                            {
                                towerId: "basic",
                                pos: k.toWorld(k.mousePos()),
                                mapPosX,
                                mapPosY,
                                tileGrid
                            }
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
            ?.objects?.map(obj => k.vec2(obj.x + TILE_SIZE / 2, obj.y + TILE_SIZE / 2));

        if (waypoints) {
            makeWaveSpawner(k, "level1", waypoints);
        } else throw new Error("Waypoints undefined");
    });
}