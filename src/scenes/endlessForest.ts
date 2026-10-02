import type { KAPLAYCtx } from "kaplay";
import { generateForestMap } from "../utils/generateProceduralMap";
import initCam from "../utils/initCam";
import { ELEMENTS, MAX_HAND_SIZE, ROUND_DRAW_NUM, TILE_SIZE } from "../constants";
import onAction from "../utils/onAction";
import { cachedSaveAtom, controlsAtom, gameSpeedUIAtom, gameStateAtom, pauseMenuAtom, store } from "../store";
import generateFog from "../utils/generateFog";
import isButtonDown from "../utils/isButtonDown";
import { playMusic } from "../utils/soundHelpers";
import drawCards from "../utils/drawCards";
import makeFloatingText from "../entities/FloatingText";
import addTowers from "../utils/addTowers";
import { castSpell } from "../utils/spellHelpers";
import type { Card, TowerGameObj } from "../types";
import makeTower, { addSelectTowerListener, confirmTowerPlacement } from "../entities/Tower";
import { makeLavaManager } from "../utils/lavaHelpers";
import showLevelStats from "../utils/showLevelStats";
import makeEndlessWaveSpawner from "../entities/EndlessWaveSpawner";
import setGameSpeed from "../utils/setGameSpeed";
import makeHero from "../entities/Hero";
import { getSave, saveRun } from "../platform/save";
import makeChest from "../entities/makeChest";
import updateSkills from "../utils/updateSkills";
import { calcUpgradeCost } from "../utils/calcUpgradeCost";
import { setBlockedTiles } from "../utils/makePlacementOnGrid";

export default function endlessForest(k: KAPLAYCtx) {
    k.scene("endlessForest", async () => {
        const save = await getSave();

        store.set(cachedSaveAtom, save);

        const seed = save?.run?.mode === "endless" ? save.run.endlessSeed : Math.floor(Math.random() * 2 ** 32);
        const { tileGrid, pathTiles, waypoints, chunks } = await generateForestMap(k, seed);

        // Compute screen bounds and save in store
        const mapWorldWidth = tileGrid[0].length * TILE_SIZE;
        const mapWorldHeight = tileGrid.length * TILE_SIZE;
        let zoom = initCam(k);

        showLevelStats(k);

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

        // playMusic(k, LEVEL_WAVES[wave].music);

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

        generateFog(k, mapWorldWidth, mapWorldHeight, chunks);

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

        const hero = makeHero(
            k,
            {
                heroId: store.get(gameStateAtom).hero?.heroId ?? "archer",
                pos: k.toWorld(k.mousePos()),
                tileGrid,
                pathTiles,
                level: store.get(gameStateAtom).hero?.level ?? 1
            }
        );

        hero.skillIds = store.get(gameStateAtom).hero?.skillIds ?? [];

        updateSkills(hero);

        let gold = 100;
        let upgrades: Card[] = drawCards(k, store.get(gameStateAtom).deck.cards, ROUND_DRAW_NUM);
        let waveNumber = 0;
        let luck = 1;
        let towerButtons = store.get(gameStateAtom).towerButtons.map(t => t.id);

        if (save?.run?.mode === "endless") {
            gold = save.run.gold;
            upgrades = save.run.hand;
            waveNumber = save.run.wave;
            luck = save.run.luck;
            towerButtons = save.run.towerButtons;

            if (save.run.hero.tileX >= 0 && save.run.hero.tileY >= 0) {
                k.add(hero);
                hero.pos = k.vec2(save.run.hero.tileX * TILE_SIZE, save.run.hero.tileY * TILE_SIZE);
                hero.placed = true;
                hero.opacity = 1;
                hero.sprite.opacity = 1;
                hero.selected = false;
                hero.hovered = false;
                if (hero.hasRangeBoost) hero.stats.range++;
                tileGrid[save.run.hero.tileY][save.run.hero.tileX].blocked = true;
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    heroButton: {
                        ...prev.heroButton,
                        visible: false
                    }
                }));
            }
        }

        store.set(gameStateAtom, prev => ({
            ...prev,
            scene: "endlessForest",
            seed,
            gold,
            tileGrid,
            waveNumber,
            selectedUI: null,
            bottomBarVisible: true,
            towerButtons: addTowers(k, towerButtons, tileGrid, pathTiles),
            upgrades,
            luck,
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
                }
            },
            handVersion: 0,
            hero,
            heroButton: {
                ...prev.heroButton,
                onClick: () => {
                    if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                    else {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            selectedUpgrade: null
                        }));
                        k.add(hero);
                    }
                }
            }
        }));

        addSelectTowerListener(k);
        makeLavaManager(k);

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
        } else throw new Error("Waypoints undefined");

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

        if (save?.run?.mode !== "endless") {
            await saveRun({
                mode: "endless",
                scene: "endlessForest",
                gold: store.get(gameStateAtom).gold,
                deck: store.get(gameStateAtom).deck.cards,
                hand: store.get(gameStateAtom).upgrades,
                health: store.get(gameStateAtom).health,
                maxHealth: store.get(gameStateAtom).maxHealth,
                hero: {
                    id: store.get(gameStateAtom).hero?.heroId ?? "archer",
                    level: store.get(gameStateAtom).hero?.level ?? 1,
                    skills: store.get(gameStateAtom).hero?.skillIds ?? [],
                    tileX: -1,
                    tileY: -1
                },
                heroCharge: store.get(gameStateAtom).heroCharge,
                nextTowerId: store.get(gameStateAtom).nextTowerId,
                towerButtons: store.get(gameStateAtom).towerButtons.map(tb => tb.id),
                wave: 0,
                endlessSeed: seed,
                mapChanges: {
                    destroyedTrees: [],
                    destroyedObelisks: [],
                    capturedTotems: []
                },
                luck: 100,
                chests: [],
                towers: []
            });
        } else {
            save.run.chests.forEach(chest => makeChest(k, k.vec2(chest.x, chest.y)));
            save.run.towers.forEach(t => {
                const tower = makeTower(k, {
                    towerId: t.towerId,
                    pos: k.vec2(t.tileX * TILE_SIZE, t.tileY * TILE_SIZE),
                    tileGrid,
                    pathTiles
                });

                tower.unlockedUpgradeSlots = t.unlockedUpgradeSlots;
                tower.upgradeCost = calcUpgradeCost(tower.cost, tower.unlockedUpgradeSlots);
                tower.upgrades = t.upgrades;
                tower.placed = true;
                tower.opacity = 1;
                tower.selected = false;
                tower.hovered = false;
                tower.instanceId = t.instanceId;
                tower.stats = t.stats;

                if (t.battery) {
                    tower.battery = t.battery;
                }

                if (t.killStacks) {
                    tower.killStacks = t.killStacks;
                    makeKillStackText(k, tower);
                }

                if (t.farmData) {
                    tower.farmData = t.farmData;
                    if (t.farmData.turnsRemaining) tower.gun?.play(`grow${3 - t.farmData.turnsRemaining}`);
                }

                setBlockedTiles({
                    footprint: tower.footprint,
                    gridX: t.tileX,
                    gridY: t.tileY,
                    tileGrid: tower.tileGrid,
                    blocked: true
                });

                confirmTowerPlacement(k, tower);

            });
        }

        makeEndlessWaveSpawner(k, { chunks, tileGrid, waypoints, seed, pathTiles });
    });
}

function makeKillStackText(
    k: KAPLAYCtx,
    tower: TowerGameObj
) {
    if (!tower.killStacks) return;

    k.add([
        k.pos(tower.pos),
        k.text("" + tower.killStacks, {
            size: 12,
            font: "free pixel"
        }),
        k.color(ELEMENTS[tower.element].color),
        `killStackText${tower.instanceId}`
    ]);
}