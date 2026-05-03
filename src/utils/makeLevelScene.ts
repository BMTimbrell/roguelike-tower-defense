import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { MapData, PathTile, Scene, Tile } from "../types";
import showLevelStats from "./showLevelStats";
import initCam from "./initCam";
import generateFog from "./generateFog";
import drawCards from "./drawCards";
import { challengesAtom, controlsAtom, gameStateAtom, pauseMenuAtom, store } from "../store";
import makeFloatingText from "../entities/FloatingText";
import getCamViewRect from "./getCamViewRect";
import { LEVEL_WAVES, MAX_HAND_SIZE, ROUND_DRAW_NUM, TILE_SIZE, type LevelId } from "../constants";
import reroll from "./reroll";
import { addSelectTowerListener } from "../entities/Tower";
import { makeLavaManager } from "./lavaHelpers";
import makeWaveSpawner from "../entities/WaveSpawner";
import updateSkills from "./updateSkills";
import { generateChallenges } from "./challengeHelpers";
import isButtonDown from "./isButtonDown";
import onAction from "./onAction";

export default function makeLevelScene(k: KAPLAYCtx, sceneName: Scene) {

    k.scene(sceneName, async ({ mapData, tileGrid, wave }: { mapData: MapData, tileGrid: Tile[][], pathTiles: PathTile[], wave: LevelId }) => {

        k.add([
            k.sprite(sceneName),
            k.pos(k.vec2(0)),
            sceneName,
            k.z(-100)
        ]);

        showLevelStats(k);

        // Compute screen bounds and save in store
        const mapWorldWidth = mapData.width * mapData.tilewidth;
        const mapWorldHeight = mapData.height * mapData.tileheight;
        let zoom = initCam(k);

        let dragActive = false;
        let lastTouchPos: Vec2 | null = null;

        // ---- Mouse ----
        onAction(k, "scroll", {
            onPress: () => dragActive = true,
            onRelease: () => dragActive = false,
        });

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

        onAction(k, "cancel", {
            onPress: () => {
                const hero = k.get("hero")[0];
                if (hero && !hero.placed) k.destroy(hero);
            }
        });

        // pause menu
        k.onButtonPress("pause", () => {
            store.set(pauseMenuAtom, prev => ({
                ...prev,
                visible: true,
                unPause: () => k.get("*").forEach(obj => obj.paused = false)
            }));
        });

        k.onUpdate(() => {
            const controls = store.get(controlsAtom);
            const speed = 400 * k.dt();
            const EDGE = 20;

            if (!dragActive) {
                // wasd
                if (isButtonDown(k, controls, "camLeft")) k.setCamPos(k.getCamPos().add(-speed, 0));
                if (isButtonDown(k, controls, "camRight")) k.setCamPos(k.getCamPos().add(speed, 0));
                if (isButtonDown(k, controls, "camUp")) k.setCamPos(k.getCamPos().add(0, -speed));
                if (isButtonDown(k, controls, "camDown")) k.setCamPos(k.getCamPos().add(0, speed));

                // --- Mouse Edge ---
                if (store.get(gameStateAtom).camMoveAtEdge) {
                    const m = k.mousePos();
                    const w = k.width();
                    const h = k.height();

                    if (m.x < EDGE) k.setCamPos(k.getCamPos().add(-speed, 0));
                    if (m.x > w - EDGE) k.setCamPos(k.getCamPos().add(speed, 0));
                    if (m.y < EDGE) k.setCamPos(k.getCamPos().add(0, -speed));
                    if (m.y > h - EDGE) k.setCamPos(k.getCamPos().add(0, speed));
                }
            }

            if (dragActive && isButtonDown(k, controls, "scroll")) {
                const d = k.mouseDeltaPos();
                k.setCamPos(k.getCamPos().sub(d));
            }
        });

        let viewW = k.width() / zoom;
        let viewH = k.height() / zoom;
        const scrollHeight = mapWorldHeight + 4 * TILE_SIZE;
        let minX = viewW / 2;
        let minY = viewH / 2 - 2 * TILE_SIZE;
        let maxX = mapWorldWidth - viewW / 2;
        let maxY = scrollHeight - viewH / 2;

        generateFog(k, mapWorldWidth, mapWorldHeight);

        k.onUpdate(() => {
            const p = k.getCamPos();
            const camX = viewW < mapWorldWidth ? k.clamp(p.x, minX, maxX) : mapWorldWidth / 2;
            const camY = viewH < scrollHeight ? k.clamp(p.y, minY, maxY) : scrollHeight / 2;
            k.setCamPos(k.vec2(camX, camY));

            if (store.get(pauseMenuAtom).visible) {
                k.get("*").forEach(obj => obj.paused = true);
            }
        });

        k.onResize(() => {
            zoom = initCam(k);
            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2 - 2 * TILE_SIZE;
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

                    store.get(gameStateAtom).challengeManager.handleEvent({
                        type: "DRAW_CARD"
                    });
                },
            },
            reroll: {
                ...prev.reroll,
                roll: () => reroll(k),
            },
            heroButton: {
                ...prev.heroButton,
                visible: true
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

        const icePoints = mapData.layers
            .find(layer => layer.name === "Ice Tiles")
            ?.objects
            ?.map(obj => {
                const x = Math.floor(obj.x / TILE_SIZE);
                const y = Math.floor(obj.y / TILE_SIZE);
                tileGrid[y][x].blocked = true;
                return {
                    x,
                    y,
                    used: false,
                    pending: false,
                    id: obj.name,
                    glowObj: null as null | GameObj
                };
            }) ?? [];

        function previewIce(count: number) {
            const available = icePoints.filter(p => !p.used && !p.pending);

            for (let i = 0; i < count && available.length > 0; i++) {
                const index = Math.floor(Math.random() * available.length);
                const point = available.splice(index, 1)[0];

                point.pending = true;

                const glow = k.add([
                    k.rect(TILE_SIZE, TILE_SIZE),
                    k.pos(point.x * TILE_SIZE, point.y * TILE_SIZE),
                    k.opacity(0.5),
                    k.color(200, 200, 255),
                    k.scale(1),
                    k.z(-1),
                    {
                        t: 5,
                        update() {
                            glow.t += k.dt() * 3;

                            // pulsing glow
                            glow.opacity = 0.3 + Math.sin(glow.t) * 0.2;
                            glow.scale = k.vec2(1 + Math.sin(glow.t) * 0.1);
                        }
                    },
                    "icePreview"
                ]);

                point.glowObj = glow;
            }
        }

        function spawnIce() {
            const pending = icePoints.filter(p => (p.pending) && !p.used);


            for (const point of pending) {
                point.used = true;
                point.pending = false;

                if (point.glowObj) k.destroy(point.glowObj);

                const ice = k.add([
                    k.sprite(`ice tile ${point.id}`),
                    k.pos(point.x * TILE_SIZE + TILE_SIZE / 2, point.y * TILE_SIZE + TILE_SIZE / 2),
                    k.z(-1),
                    k.anchor("center"),
                    k.opacity(0),
                    "iceTile",
                    {
                        add() {
                            k.tween(0, 1, 2, v => ice.opacity = v, k.easings.easeOutBounce);
                        }
                    }
                ]);

                tileGrid[point.y][point.x].blocked = false;
            }
        }

        let spawner: GameObj | null = null;
        if (waypoints) {
            spawner = makeWaveSpawner(k, wave, waypoints, {
                onWaveStart: () => {
                    previewIce((LEVEL_WAVES[wave] as { startingFreezeAmount?: number; }).startingFreezeAmount ?? 4);
                },
                onWaveEnd: () => {
                    spawnIce();
                    previewIce(((spawner?.waveIndex ?? 0) + 1) + ((LEVEL_WAVES[wave] as { startingFreezeAmount?: number; }).startingFreezeAmount ?? 4));

                    updateWindDirections((spawner?.waveIndex ?? 0) + 1);
                }

            });

            if (waypoints.length >= 2) {
                // --- Entrance arrow ---
                const start = waypoints[0];
                const next = waypoints[1];

                const startAngle = next.sub(start).angle();

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

        if (mapData.layers.find(layer => layer.name === "Trees")) {
            for (let y = 0; y < tileGrid.length; y++) {
                for (let x = 0; x < tileGrid[y].length; x++) {
                    const tile = tileGrid[y][x];

                    if (tile.hasTree) {
                        k.add([
                            k.sprite("tree"),
                            k.pos(x * TILE_SIZE, y * TILE_SIZE),
                            "tree",
                            {
                                tileX: x,
                                tileY: y
                            }
                        ]);
                    }
                }
            }
        }

        const windZones: GameObj[] = mapData.layers
            .find(layer => layer.name === "Wind")
            ?.objects
            ?.map(obj => {
                const baseDir = obj.properties?.find((p: any) => p.name === "direction")?.value;

                const wind = k.add([
                    k.rect(obj.width, obj.height),
                    k.pos(obj.x, obj.y),
                    k.area(),
                    k.opacity(0),
                    "wind",
                    {
                        baseDirection: baseDir,
                        direction: baseDir
                    }
                ]);

                makeWindVisual(k, wind);

                return wind;
            }) ?? [];

        function updateWindDirections(waveIndex: number) {
            for (const wind of windZones) {

                if (waveIndex % 2 === 0) {
                    wind.direction = wind.baseDirection;
                } else {
                    wind.direction = wind.baseDirection === "east" ? "west" : "east";
                }
            }
        }

        function makeWindVisual(k: KAPLAYCtx, wind: GameObj) {
            const tint = wind.direction === "east"
                ? k.color(120, 160, 200)
                : k.color(200, 230, 255);

            k.add([
                k.rect(wind.width, wind.height),
                k.pos(wind.pos),
                tint,
                k.opacity(0.15),
                k.z(9999)
            ]);

            k.loop(0.03, () => {
                const length = 12;
                const speed = 100;

                const isEast = wind.direction === "east";

                const yDrift = wind.direction === "east" ? 5 : -5;

                const particle = k.add([
                    k.rect(length, 3),
                    k.pos(
                        wind.pos.x + Math.random() * wind.width,
                        wind.pos.y + Math.random() * wind.height
                    ),
                    k.color(180, 220, 255),
                    k.outline(1, k.rgb(120, 160, 200)),
                    k.opacity(0.9),
                    {
                        update() {
                            particle.move(isEast ? speed : -speed, yDrift);
                            particle.opacity -= k.dt() * 1.5;

                            if (particle.opacity <= 0) k.destroy(particle);
                        }
                    }
                ]);
            });
        }

        if ((LEVEL_WAVES[wave] as { challenge: boolean }).challenge) {
            store.set(challengesAtom, prev => ({
                ...prev,
                visible: true,
                challenges: generateChallenges()
            }));
        }
    });

}