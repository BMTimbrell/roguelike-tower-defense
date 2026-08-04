import type { GameObj, KAPLAYCtx } from "kaplay";
import type { MapData, PathTile, Scene, Tile, TowerGameObj } from "../types";
import showLevelStats from "./showLevelStats";
import initCam from "./initCam";
import generateFog from "./generateFog";
import drawCards from "./drawCards";
import { cachedSaveAtom, challengesAtom, controlsAtom, gameSpeedUIAtom, gameStateAtom, pauseMenuAtom, store } from "../store";
import makeFloatingText from "../entities/FloatingText";
import { LEVEL_WAVES, MAX_HAND_SIZE, ROUND_DRAW_NUM, TILE_SIZE, type LevelId } from "../constants";
import { addSelectTowerListener } from "../entities/Tower";
import { makeLavaManager } from "./lavaHelpers";
import makeWaveSpawner from "../entities/WaveSpawner";
import updateSkills from "./updateSkills";
import { generateChallenges } from "./challengeHelpers";
import isButtonDown from "./isButtonDown";
import onAction from "./onAction";
import setGameSpeed from "./setGameSpeed";
import { playMusic } from "./soundHelpers";
import { getSave, saveRun } from "../platform/save";
import { castSpell } from "./spellHelpers";
import { freezeTile } from "./freezeTile";
import { saveMetaProgress } from "./checkUnlocks";

export default function makeLevelScene(k: KAPLAYCtx, sceneName: Scene) {

    k.scene(sceneName, async ({ mapData, tileGrid, wave, pathTiles }: { mapData: MapData, tileGrid: Tile[][], wave: LevelId, pathTiles: PathTile[] }) => {

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

        // k.onKeyPress("l", () => {
        //     store.set(gameStateAtom, prev => ({
        //         ...prev,
        //         hideUI: !store.get(gameStateAtom).hideUI
        //     }));
        // });

        // ---- Mouse ----
        onAction(k, "scroll", {
            onPress: () => dragActive = true,
            onRelease: () => dragActive = false,
        });

        playMusic(k, LEVEL_WAVES[wave].music);

        onAction(k, "cancel", {
            onPress: () => {
                const hero = k.get("hero")[0];
                const selectedUpgrade = store.get(gameStateAtom).selectedUpgrade;
                if (hero && !hero.placed) k.destroy(hero);
                else if (selectedUpgrade && "type" in selectedUpgrade && selectedUpgrade.type === "spell") {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        selectedUpgrade: null
                    }));
                }
            }
        });

        for (let i = 0; i < 10; i++) {
            onAction(k, `card${i + 1}`, {
                onPress: () => {
                    const upgrade = store.get(gameStateAtom).upgrades[i];
                    if (upgrade) {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            selectedUpgrade: upgrade
                        }));
                    }
                }
            });
        }

        // pause menu
        k.onButtonPress("pause", () => {
            store.set(pauseMenuAtom, prev => ({
                ...prev,
                visible: true,
                unPause: () => k.get("*").forEach(obj => obj.paused = false),
                mainMenu: () => {
                    store.set(pauseMenuAtom, prev => ({ ...prev, visible: false }));
                    k.go("mainMenu");
                }
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
        let minY = viewH / 2 - 3 * TILE_SIZE;
        let maxX = mapWorldWidth - viewW / 2;
        let maxY = scrollHeight - viewH / 2;

        generateFog(k, mapWorldWidth, mapWorldHeight);

        k.onUpdate(() => {
            const p = k.getCamPos();
            const camX = viewW < mapWorldWidth ? k.clamp(p.x, minX, maxX) : mapWorldWidth / 2;
            const camY = viewH < scrollHeight ? k.clamp(p.y, minY, maxY) : scrollHeight / 2;
            k.setCamPos(k.vec2(camX, camY));

            if (store.get(pauseMenuAtom).visible) {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: null
                }));
                k.get("*").forEach(obj => obj.paused = true);
            }
        });

        k.onResize(() => {
            zoom = initCam(k);
            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2 - 3 * TILE_SIZE;
            maxX = mapWorldWidth - viewW / 2;
            maxY = scrollHeight - viewH / 2;
        });

        k.onScroll(delta => {
            zoom -= delta.y * 0.001;
            zoom = k.clamp(zoom, 1, 3);
            k.setCamScale(k.vec2(zoom));

            viewW = k.width() / zoom;
            viewH = k.height() / zoom;
            minX = viewW / 2;
            minY = viewH / 2 - 3 * TILE_SIZE;
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
            tileGrid,
            waveNumber: 1,
            selectedUI: null,
            bottomBarVisible: true,
            upgrades,
            luck: 1,
            deck: {
                ...prev.deck,
                drawCard: () => {
                    if (store.get(gameStateAtom).upgrades.length >= MAX_HAND_SIZE) {
                        const deckRect = store.get(gameStateAtom).deck.pos;

                        if (deckRect) {

                            makeFloatingText(k, {
                                text: "Hand is full",
                                color: '#FF0000',
                                pos: k.vec2(deckRect.left - 10,
                                    deckRect.top - 60),
                                fixed: true,
                                size: k.width() > 1800 ? 32 : k.width() > 1400 ? 20 : 16
                            });
                        }

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
            handVersion: 0,
            heroButton: {
                ...prev.heroButton,
                visible: true
            }
        }));

        const hero = store.get(gameStateAtom).hero;
        if (hero) {
            updateSkills(hero);
        }

        await saveRun({
            deck: store.get(gameStateAtom).deck.cards,
            scene: sceneName,
            towerCoins: store.get(gameStateAtom).towerCoins,
            hero: {
                id: store.get(gameStateAtom).hero?.heroId ?? "archer",
                level: store.get(gameStateAtom).hero?.level ?? 1,
                skills: store.get(gameStateAtom).hero?.skillIds ?? []
            },
            sceneIndex: store.get(gameStateAtom).sceneIndex,
            level: store.get(gameStateAtom).level,
            health: store.get(gameStateAtom).health,
            maxHealth: store.get(gameStateAtom).maxHealth,
            shops: store.get(gameStateAtom).shops,
            heroCharge: store.get(gameStateAtom).heroCharge,
            difficulty: store.get(gameStateAtom).difficulty,
            nextTowerId: store.get(gameStateAtom).nextTowerId,
            towerButtons: store.get(gameStateAtom).towerButtons.map(tb => tb.id),
            mapData,
            tileGrid,
            wave,
            pathTiles
        });

        await saveMetaProgress();

        addSelectTowerListener(k);
        makeLavaManager(k);


        const save = await getSave();
        if (save) {
            store.set(cachedSaveAtom, save);
        }

        k.onClick(() => {
            if (!k.isMousePressed("left")) return;

            const spell = store.get(gameStateAtom).selectedUpgrade;
            if (!spell || !("type" in spell) || spell.type !== "spell" || !store.get(gameStateAtom).waveActive) return;

            if (spell.target === "point") {
                castSpell(k, spell, { target: k.toWorld(k.mousePos()) });
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUpgrade: null,
                    upgrades: prev.upgrades.filter(u => u !== spell),
                }));
            } else if (spell.target === "tower") {
                const tower = (k.get("tower") as TowerGameObj[]).find(t => t.hovered);
                if (!tower) return; // invalid target
                castSpell(k, spell, { tower });
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUpgrade: null,
                    upgrades: prev.upgrades.filter(u => u !== spell),
                }));
            }
        });

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
                tileGrid[y][x].iceSprite = obj.name;
                tileGrid[y][x].hasWater = true;
                return {
                    x,
                    y,
                    pending: false
                };
            }) ?? [];

        function previewIce(count: number) {
            const available = icePoints.filter(p => !tileGrid[p.y][p.x].frozen && !p.pending);

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

                tileGrid[point.y][point.x].glowObj = glow;
            }
        }

        function spawnIce() {
            const pending = icePoints.filter(p => (p.pending) && !tileGrid[p.y][p.x].frozen);


            for (const point of pending) {
                point.pending = false;

                const tile = tileGrid[point.y][point.x];

                freezeTile(k, { tile, x: point.x, y: point.y });

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

                    k.get("chimney").forEach((chimney, index) => {
                        if (spawner?.waveIndex + 1 === index) chimney.opacity = 1;
                        else chimney.opacity = 0;
                    });
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
                                tileY: y,
                                tile
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
                            particle.opacity -= k.dt() * store.get(gameStateAtom).timeScale * 1.5;

                            if (particle.opacity <= 0) k.destroy(particle);
                        }
                    }
                ]);
            });
        }

        // chimneys
        mapData.layers
            .find(layer => layer.name === "Chimneys")
            ?.objects
            ?.map((obj, index) => {
                k.add([
                    k.sprite("chimney"),
                    k.pos(k.vec2(obj.x, obj.y).add(TILE_SIZE / 2, TILE_SIZE / 2)),
                    k.opacity(index === 0 ? 1 : 0),
                    "chimney",
                    k.anchor("center")
                ]);
            });

        if ((LEVEL_WAVES[wave] as { challenge: boolean }).challenge) {
            store.set(challengesAtom, prev => ({
                ...prev,
                visible: true,
                challenges: generateChallenges()
            }));
        }

        store.set(gameSpeedUIAtom, prev => ({
            ...prev,
            visible: true,
            buttons: [
                {
                    icon: "sprites/play-icon.png",
                    onClick: () => setGameSpeed(k, 1),
                    width: 16
                },
                {
                    icon: "sprites/fast-forward-icon.png",
                    onClick: () => setGameSpeed(k, 2),
                    width: 16
                },
                {
                    icon: "sprites/fast-fast-forward-icon.png",
                    onClick: () => setGameSpeed(k, 3),
                    width: 25
                }
            ]
        }));

        for (let i = 0; i < 3; i++) {
            onAction(k, `speed${i + 1}x`, {
                onPress: () => {
                    store.set(gameSpeedUIAtom, prev => ({
                        ...prev,
                        activeIndex: i,
                    }));

                    setGameSpeed(k, i + 1);
                }
            });
        }

    });
}