import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyId, LevelId } from "../constants";
import type { TowerGameObj, Wave } from "../types";
import { BASE_DRAW_COST, LEVEL_WAVES, MAX_HAND_SIZE, REDUCED_RANGE_TOWERS, ROUND_DRAW_NUM, SEEDS, TILE_SIZE } from "../constants";
import makeEnemy from "./Enemy";
import { store, gameStateAtom, challengesAtom, gameSpeedUIAtom } from "../store";
import screenPos from "../utils/screenPos";
import drawCards from "../utils/drawCards";
import makeTower from "./Tower";
import setGameSpeed from "../utils/setGameSpeed";

export default function makeWaveSpawner(k: KAPLAYCtx, levelId: LevelId, waypoints: Vec2[], opts?: { onWaveEnd?: () => void; onWaveStart?: () => void; }) {
    const level = LEVEL_WAVES[levelId];

    let spawnQueue: { id: EnemyId; time: number }[] = [];
    let timer = 0;
    let spawning = false;
    let enemyDeadCheck = true;
    let levelComplete = false;
    let waitingForNextWave = true;

    function buildQueue(wave: Wave) {
        const queue = [];
        let t = 0;

        for (const group of wave.spawns) {
            for (let i = 0; i < group.count; i++) {
                queue.push({ id: group.id, time: t });
                t += group.interval;
            }
        }

        return queue;
    }

    const spawner = k.add([
        "waveSpawner",
        {
            waveIndex: -1,
            add() {
                if ("boss" in level && level.boss) {
                    const boss = level.boss as {
                        id: EnemyId;
                        bossStops: number[];
                    };

                    const bossInstance = makeEnemy(k, boss.id, waypoints, 0, 1, undefined, boss.bossStops);
                    bossInstance.enterState("idle");
                }
                opts?.onWaveStart?.();
            },
            startNextWave() {
                if (spawner.waveIndex < 0) {
                    k.get("arrow").forEach(a => k.destroy(a));
                }

                spawner.waveIndex++;
                const wave = level.waves[spawner.waveIndex];
                spawnQueue = buildQueue(wave);
                timer = 0;
                spawning = true;

                store.set(gameStateAtom, prev => ({
                    ...prev,
                    waveActive: spawning
                }));

                (k.get("tower") as TowerGameObj[]).forEach(t => {
                    if (t.timeData) t.timeData.timeMultiplier = 1;
                    if (t.charge) t.charge.currentCharge = 0;
                });

                const bossInstance = k.get("boss")[0];

                if (bossInstance) {
                    bossInstance.boss.currentStopIndex++;
                    bossInstance.boss.reachedStopIndex = false;
                    bossInstance.enterState("move");
                }
            }
        }
    ]);

    spawner.onUpdate(() => {

        if (!spawning) {
            // wave complete
            const enemies = k.get("enemy");
            const normalEnemiesAlive = enemies.some(e => !e.boss);
            const boss = k.get("boss")[0];

            if (
                enemyDeadCheck &&
                !normalEnemiesAlive &&
                (!boss || boss?.boss.reachedStopIndex) &&
                !levelComplete
            ) {

                store.set(gameStateAtom, prev => ({
                    ...prev,
                    waveActive: false
                }));

                if (spawner.waveIndex === level.waves.length - 1 || ("boss" in level && !boss && !normalEnemiesAlive)) {
                    levelComplete = true;
                    const complete = k.add([
                        k.pos(k.getCamPos()),
                        k.text("Level Complete!", {
                            size: 16,
                            font: "free pixel"
                        }),
                        k.stay(),
                        {
                            update() {
                                setGameSpeed(k, 1);
                                store.set(gameSpeedUIAtom, prev => ({
                                    ...prev,
                                    visible: false,
                                    activeIndex: 0
                                }));

                                complete.timer -= k.dt();
                                if (complete.timer <= 1) {
                                    k.go("levelTransition", store.get(gameStateAtom).hero);
                                    complete.pos = k.getCamPos();
                                }
                                if (complete.timer >= 0) complete.scale = complete.scale.add(k.vec2(k.dt() * 5));
                                else k.destroy(complete);
                            },
                            timer: 1.5
                        },
                        k.anchor("center"),
                        k.scale(1),
                        k.color("#FFFFFF"),
                        k.z(999999),
                    ]);
                    return;
                }

                enemyDeadCheck = false;
                const incomeMod = k.get("hero")[0]?.incomeMod ?? 1;
                const freeCardDraw = k.get("hero")[0]?.freeCardDraw ?? false;

                if (spawner.waveIndex >= 0) {
                    opts?.onWaveEnd?.();
                    const reward = Math.round(level.waves[spawner.waveIndex].reward * incomeMod);
                    const duration = 1;

                    const offsets = [
                        [-1, 0],
                        [1, 0],
                        [0, -1],
                        [0, 1]
                    ];

                    offsets.forEach(([x, y]) => {
                        const outline = k.add([
                            k.pos(k.getCamPos().x + x, k.getCamPos().y + y),
                            k.text(`Reward: +${reward}`, {
                                font: "free pixel"
                            }),
                            k.color("#000000"),
                            k.opacity(1),
                            "textOutline",
                            k.anchor("center"),
                            {
                                time: 0,
                                update() {
                                    outline.time += k.dt() * store.get(gameStateAtom).timeScale;
                                    const t = Math.min(rewardText.time / duration, 1);

                                    const eased = 1 - Math.pow(t, 3);
                                    outline.opacity = eased;

                                    if (t >= duration) {
                                        k.destroy(outline);
                                    }
                                }
                            }
                        ]);
                    });

                    const rewardText = k.add([
                        k.pos(k.getCamPos()),
                        k.text(`Reward: +${reward}`, {
                            font: "free pixel"
                        }),
                        k.opacity(1),
                        k.anchor("center"),
                        {
                            time: 0,
                            update() {
                                rewardText.time += k.dt() * store.get(gameStateAtom).timeScale;
                                const t = Math.min(rewardText.time / duration, 1);

                                const eased = 1 - Math.pow(t, 3);
                                rewardText.opacity = eased;

                                if (t >= duration) {
                                    k.destroy(rewardText);
                                }
                            }
                        }
                    ]);

                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gold: prev.gold + (Math.round(level.waves[spawner.waveIndex].reward * incomeMod)),
                        deck: {
                            ...prev.deck,
                            drawCost: freeCardDraw ? 0 : BASE_DRAW_COST
                        }

                    }));
                    const deck = store.get(gameStateAtom).deck.cards;
                    const cardsInHand = store.get(gameStateAtom).upgrades.length;
                    const cardsToDraw = Math.min(ROUND_DRAW_NUM, MAX_HAND_SIZE - cardsInHand);
                    if (cardsToDraw > 0) {
                        const cards = drawCards(k, deck, cardsToDraw);
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            upgrades: [
                                ...prev.upgrades,
                                ...cards
                            ]
                        }));
                    }
                }

                k.get("tower").forEach(tower => {
                    tower.buffs = null;
                });

                waitingForNextWave = true;

                k.get("pathEntity").forEach(e => k.destroy(e));
                k.get("summon").forEach(s => s.enterState("die"));
                k.get("puddle").forEach(p => k.destroy(p));

                (k.get("tower") as TowerGameObj[]).forEach(e => {

                    if (e.farmData?.turnsRemaining) {
                        e.farmData.turnsRemaining--;

                        if (e.farmData.turnsRemaining <= 0) {
                            const plant = makeTower(k, {
                                towerId: SEEDS[e.farmData.plantedSeed ?? "nightshade"].growsInto,
                                pos: e.pos,
                                tileGrid: e.tileGrid,
                                pathTiles: e.pathTiles
                            });

                            k.destroy(e);
                            plant.placed = true;
                            plant.opacity = 1;
                            plant.selected = false;
                            plant.hovered = false;

                            if (k.get("hero").some(hero => hero.hasRangeBoost)) {
                                const hero = k.get("hero")[0];

                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    const amount = REDUCED_RANGE_TOWERS.some(name => name === plant.name) ? 0.5 : 1;
                                    plant.stats.range += amount;
                                }
                            }

                            if (k.get("hero").some(hero => hero.hasToxicAura)) {
                                const hero = k.get("hero")[0];

                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    plant.element = "Poison";
                                }
                            }

                            if (k.get("hero").some(hero => hero.hasBlock)) {
                                const hero = k.get("hero")[0];
                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    plant.hasBlock = true;
                                }
                            }
                        } else {
                            e.gun.play(`grow${3 - e.farmData.turnsRemaining}`);
                        }
                    }
                });
            }

            return;
        }

        timer += k.dt() * store.get(gameStateAtom).timeScale;

        while (spawnQueue.length && spawnQueue[0].time <= timer) {
            const spawn = spawnQueue.shift()!;

            makeEnemy(k, spawn.id, waypoints, 0, spawner.waveIndex + 1);
        }

        if (spawning && spawnQueue.length === 0) {
            spawning = false;
            enemyDeadCheck = true;
        }

    });

    const waveTextPos = k.vec2(20, 15);

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    offsets.forEach(([x, y]) => {
        const outline = k.add([
            k.pos(waveTextPos.x + x, waveTextPos.y + y),
            k.text("", {
                size: 20,
                font: "free pixel"
            }),
            k.color("#000000"),
            k.z(999),
            {
                update() {
                    let textStr = "";

                    if (spawner.waveIndex < 0) {
                        textStr = `Wave: 1/${level.waves.length}`;
                    } else if (spawning) {
                        textStr = `Wave: ${spawner.waveIndex + 1}/${level.waves.length}`;
                    } else if (waitingForNextWave) {
                        textStr = `Wave: ${Math.min(spawner.waveIndex + 2, level.waves.length)}/${level.waves.length}`;
                    } else {
                        textStr = `Wave: ${spawner.waveIndex + 1}/${level.waves.length}`;
                    }

                    outline.use(k.text(textStr, {
                        size: 20,
                        font: "free pixel"
                    }));

                    outline.pos = screenPos(k, waveTextPos).add(x, y);
                }
            }
        ]);
    });

    const waveText = k.add([
        k.pos(waveTextPos),
        k.color('#FFFFFF'),
        k.text("", {
            size: 20,
            font: "free pixel"
        }),
        k.z(999),
        {
            update() {
                let textStr = "";

                if (spawner.waveIndex < 0) {
                    textStr = `Wave: 1/${level.waves.length}`;
                } else if (spawning) {
                    textStr = `Wave: ${spawner.waveIndex + 1}/${level.waves.length}`;
                } else if (waitingForNextWave) {
                    textStr = `Wave: ${Math.min(spawner.waveIndex + 2, level.waves.length)}/${level.waves.length}`;
                } else {
                    textStr = `Wave: ${spawner.waveIndex + 1}/${level.waves.length}`;
                }

                waveText.use(k.text(textStr, {
                    size: 20,
                    font: "free pixel"
                }));

                waveText.pos = screenPos(k, waveTextPos);
            }
        }
    ]);

    const buttonPos = k.vec2(waveTextPos).add(k.vec2(160, 10));

    const nextWaveButton = k.add([
        k.rect(100, 25, { radius: 2 }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.area(),
        k.color(85, 85, 85),
        k.z(1000),
        {
            update() {
                nextWaveButton.hidden = (!waitingForNextWave || levelComplete) ||
                    (
                        !store.get(gameStateAtom).challengeManager?.getChallenge() &&
                        store.get(challengesAtom).visible
                    );
                nextWaveButton.pos = screenPos(k, buttonPos);
            }
        }
    ]);

    const outline = k.add([
        k.rect(100, 25, { radius: 2, fill: false }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.opacity(0.5),
        k.z(1001),
        k.outline(1, k.rgb(255, 255, 255)),
        {
            update() {
                outline.hidden = (!waitingForNextWave || levelComplete) ||
                    (
                        !store.get(gameStateAtom).challengeManager?.getChallenge() &&
                        store.get(challengesAtom).visible
                    );
                outline.pos = screenPos(k, buttonPos);
            }
        }
    ]);

    const buttonText = k.add([
        k.text("Start Wave", { size: 16, font: "free pixel" }),
        k.pos(buttonPos.x, buttonPos.y),
        k.anchor("center"),
        k.z(1001),
        {
            update() {
                buttonText.hidden = (!waitingForNextWave || levelComplete) ||
                    (
                        !store.get(gameStateAtom).challengeManager?.getChallenge() &&
                        store.get(challengesAtom).visible
                    );
                buttonText.pos = screenPos(k, k.vec2(buttonPos.x, buttonPos.y));
            }
        }
    ]);

    nextWaveButton.onHover(() => {
        k.setCursor("pointer");
        nextWaveButton.color = k.rgb(144, 144, 144); // brighter green
    });

    nextWaveButton.onHoverEnd(() => {
        k.setCursor("default");
        nextWaveButton.color = k.rgb(85, 85, 85); // original color
    });

    nextWaveButton.onClick(() => {
        if (waitingForNextWave && !levelComplete) {
            waitingForNextWave = false;
            spawner.startNextWave();
        }
    });

    return spawner
}