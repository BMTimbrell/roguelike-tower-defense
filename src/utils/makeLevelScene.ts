import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { MapData, PathTile, Scene, Tile } from "../types";
import showLevelStats from "./showLevelStats";
import initCam from "./initCam";
import generateFog from "./generateFog";
import drawCards from "./drawCards";
import { gameStateAtom, store } from "../store";
import makeFloatingText from "../entities/FloatingText";
import getCamViewRect from "./getCamViewRect";
import { LEVEL_WAVES, MAX_HAND_SIZE, ROUND_DRAW_NUM, TILE_SIZE, type LevelId } from "../constants";
import reroll from "./reroll";
import { addSelectTowerListener } from "../entities/Tower";
import { makeLavaManager } from "./lavaHelpers";
import makeWaveSpawner from "../entities/WaveSpawner";
import updateSkills from "./updateSkills";

export default function makeLevelScene(k: KAPLAYCtx, sceneName: Scene) {

    k.scene(sceneName, async ({ mapData, tileGrid, pathTiles, wave }: { mapData: MapData, tileGrid: Tile[][], pathTiles: PathTile[], wave: LevelId }) => {

        k.add([
            k.sprite(sceneName),
            k.pos(k.vec2(0)),
            sceneName,
        ]);

        showLevelStats(k);

        // Compute screen bounds and save in store
        const mapWorldWidth = mapData.width * mapData.tilewidth;
        const mapWorldHeight = mapData.height * mapData.tileheight;
        let zoom = initCam(k);

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
        });

        k.onTouchMove(pos => {
            if (!dragActive || !lastTouchPos) return;
            const d = pos.sub(lastTouchPos);
            k.setCamPos(k.getCamPos().sub(d));
            lastTouchPos = pos;
        });


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
        const scrollHeight = mapWorldHeight + 2 * TILE_SIZE;
        let minX = viewW / 2;
        let minY = viewH / 2;
        let maxX = mapWorldWidth - viewW / 2;
        let maxY = scrollHeight - viewH / 2;

        generateFog(k, mapWorldWidth, mapWorldHeight);

        k.onUpdate(() => {
            const p = k.getCamPos();
            const camX = viewW < mapWorldWidth ? k.clamp(p.x, minX, maxX) : mapWorldWidth / 2;
            const camY = viewH < scrollHeight ? k.clamp(p.y, minY, maxY) : scrollHeight / 2;
            k.setCamPos(k.vec2(camX, camY));
        });

        k.onResize(() => {
            zoom = initCam(k);
            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2;
            maxX = mapWorldWidth - viewW / 2;
            maxY = scrollHeight - viewH / 2;
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

        const upgrades = drawCards(k, store.get(gameStateAtom).deck.cards, ROUND_DRAW_NUM);
        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: sceneName,
            gold: LEVEL_WAVES[wave].startingGold,
            // towerButtons: addTowers(k, ["crow", "ice", "lux"], tileGrid),
            bottomBarVisible: true,
            upgrades,
            deck: {
                ...prev.deck,
                drawCard: () => {
                    if (store.get(gameStateAtom).upgrades.length >= MAX_HAND_SIZE) {
                        makeFloatingText(k, {
                            text: "Hand is full",
                            color: '#FF0000',
                            pos: k.vec2(getCamViewRect(k).right - TILE_SIZE * 4, getCamViewRect(k).bottom - TILE_SIZE * 3.5),
                            size: 16
                        });
                        return;
                    }
                    const card = drawCards(k, store.get(gameStateAtom).deck.cards, 1)[0];
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gold: prev.gold - store.get(gameStateAtom).deck.drawCost,
                        upgrades: [...prev.upgrades, card],
                        deck: {
                            ...prev.deck,
                            drawCost: Math.min(40, prev.deck.drawCost + 10),
                        },
                    }));
                },
            },
            reroll: {
                ...prev.reroll,
                roll: () => reroll(k),
            }
        }));

        const hero = store.get(gameStateAtom).hero;
        if (hero) {
            updateSkills(hero);
        }

        addSelectTowerListener(k);
        makeLavaManager(k);

        // Waypoints for enemies
        const waypoints = mapData.layers
            .find(layer => layer.name === "Waypoints")
            ?.objects?.map(obj => k.vec2(obj.x + TILE_SIZE / 2, obj.y + TILE_SIZE / 2));

        if (waypoints) {
            makeWaveSpawner(k, wave, waypoints);

            if (waypoints.length >= 2) {
                // --- Entrance arrow ---
                const start = waypoints[0];
                const next = waypoints[1];

                const startAngle= next.sub(start).angle();

                const entranceArrow = k.add([
                    k.sprite("entrance arrow"),
                    k.pos(start.add(next.sub(start).unit().scale(TILE_SIZE + 4))),
                    k.rotate(startAngle),
                    k.anchor("center"),
                    k.scale(1),
                    {
                        update() {
                            entranceArrow.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.1);
                        }
                    },
                    "arrow",
                ]);

                // --- Exit arrow ---
                const end = waypoints[waypoints.length - 1];
                const prev = waypoints[waypoints.length - 2];

                const endAngle = end.sub(prev).angle();

                const exitArrow = k.add([
                    k.sprite("exit arrow"),
                    k.pos(end.add(prev.sub(end).unit().scale(TILE_SIZE + 4))),
                    k.rotate(endAngle),
                    k.anchor("center"),
                    k.scale(1),
                    {
                        update() {
                            exitArrow.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.1);
                        }
                    },
                    "arrow",
                ]);
            }
        } else throw new Error("Waypoints undefined");

    });

}