import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyId, LevelId } from "../constants";
import type { TowerGameObj, Wave } from "../types";
import { BASE_DRAW_COST, LEVEL_WAVES, MAX_HAND_SIZE, REDUCED_RANGE_TOWERS, ROUND_DRAW_NUM, SEEDS, TILE_SIZE } from "../constants";
import makeEnemy from "./Enemy";
import { store, gameStateAtom, challengesAtom, gameSpeedUIAtom, mapAtom } from "../store";
import drawCards from "../utils/drawCards";
import makeTower from "./Tower";
import setGameSpeed from "../utils/setGameSpeed";
import { fadeOutMusic, getMusic, playUISound } from "../utils/soundHelpers";

export default function makeWaveSpawner(k: KAPLAYCtx, levelId: LevelId, waypoints: Vec2[], opts?: { onWaveEnd?: () => void; onWaveStart?: () => void; }) {
    const level = LEVEL_WAVES[levelId];

    let spawnQueue: { id: EnemyId; time: number }[] = [];
    let timer = 0;
    let spawning = false;
    let enemyDeadCheck = true;
    let levelComplete = false;
    let waitingForNextWave = true;

    let scale = store.get(mapAtom).iconScale;

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

                    const bossInstance = makeEnemy(k, boss.id, waypoints, 0, undefined, boss.bossStops);
                    bossInstance.enterState("idle");

                    if (bossInstance && bossInstance.boss) {
                        const bossStop = bossInstance.path[bossInstance.boss.stopIndexes[bossInstance.boss.currentStopIndex + 1]];

                        if (bossInstance.boss.currentStopIndex + 1 < bossInstance.boss.stopIndexes.length - 2) {
                            const bossIcon = k.add([
                                k.sprite("boss icon"),
                                k.pos(bossStop),
                                k.anchor("center"),
                                k.scale(1),
                                {
                                    update() {
                                        bossIcon.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.1);
                                    }
                                },
                                "boss stop",
                            ]);
                        }

                    }
                }
                opts?.onWaveStart?.();
            },
            startNextWave() {
                if (spawner.waveIndex < 0) {
                    k.get("arrow").forEach(a => k.destroy(a));
                }

                if (k.get("boss").length) k.get("boss stop").forEach(b => k.destroy(b));

                spawner.waveIndex++;
                const wave = level.waves[spawner.waveIndex];
                spawnQueue = buildQueue(wave);
                timer = 0;
                spawning = true;

                store.set(gameStateAtom, prev => ({
                    ...prev,
                    waveActive: spawning,
                    waveNumber: spawner.waveIndex + 1
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
        scale = store.get(mapAtom).iconScale;

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

                    const currentMusic = getMusic();
                    if (currentMusic) fadeOutMusic(currentMusic);

                    playUISound(k, "level up");

                    let transitioning = false;

                    const complete = k.add([
                        k.pos(k.toScreen(k.getCamPos())),
                        k.text("Level Complete!", {
                            size: 16 * store.get(mapAtom).iconScale,
                            font: "free pixel"
                        }),
                        k.fixed(),
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

                                if (complete.timer <= 1 && !transitioning) {
                                    k.go("levelTransition", store.get(gameStateAtom).hero);
                                    transitioning = true;
                                }

                                if (complete.timer >= 0) complete.scale = complete.scale.add(k.vec2(k.dt() * 5));
                                else k.destroy(complete);

                                complete.pos = k.toScreen(k.getCamPos());
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

                if (boss) {
                    const bossStop = boss.path[boss.boss.stopIndexes[boss.boss.currentStopIndex + 1]];

                    if (boss.boss.currentStopIndex + 1 < boss.boss.stopIndexes.length - 2) {
                        const bossIcon = k.add([
                            k.sprite("boss icon"),
                            k.pos(bossStop),
                            k.anchor("center"),
                            k.scale(1),
                            {
                                update() {
                                    bossIcon.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.1);
                                }
                            },
                            "boss stop",
                        ]);
                    }

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
                            k.pos(k.toScreen(k.vec2(k.getCamPos().x + x, k.getCamPos().y + y))),
                            k.text(`Reward: +${reward}`, {
                                font: "free pixel",
                                size: 32 * scale
                            }),
                            k.color("#000000"),
                            k.opacity(1),
                            k.fixed(),
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
                        k.pos(k.toScreen(k.getCamPos())),
                        k.text(`Reward: +${reward}`, {
                            font: "free pixel",
                            size: 32 * scale
                        }),
                        k.opacity(1),
                        k.anchor("center"),
                        k.fixed(),
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

            makeEnemy(k, spawn.id, waypoints, 0);
        }

        if (spawning && spawnQueue.length === 0) {
            spawning = false;
            enemyDeadCheck = true;
        }

    });

    let waveTextPos = k.vec2(20 * scale, 15 * scale);
    let buttonPos = k.vec2(waveTextPos).add(k.vec2(160 * scale, 10 * scale));

    k.onUpdate(() => {
        waveTextPos = k.vec2(20 * scale, 15 * scale);
        buttonPos = k.vec2(waveTextPos).add(k.vec2(160 * scale, 10 * scale));
    });

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    offsets.forEach(([x, y]) => {
        const outline = k.add([
            k.pos(waveTextPos.x + x * scale, waveTextPos.y + y * scale),
            k.text("", {
                size: 20 * scale,
                font: "free pixel"
            }),
            k.color("#000000"),
            k.opacity(store.get(gameStateAtom).hideUI ? 0 : 1),
            k.fixed(),
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

                    outline.text = textStr;

                    outline.pos = waveTextPos.add(x * scale, y * scale);

                    outline.textSize = 20 * scale;
                    outline.opacity = store.get(gameStateAtom).hideUI ? 0 : 1;
                }
            }
        ]);
    });
    let opacity = store.get(gameStateAtom).hideUI ? 0 : 1;

    const waveText = k.add([
        k.pos(waveTextPos),
        k.color('#FFFFFF'),
        k.text("", {
            size: 20 * scale,
            font: "free pixel"
        }),
        k.opacity(opacity),
        k.fixed(),
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

                waveText.text = textStr;

                waveText.pos = waveTextPos;

                waveText.textSize = 20 * scale;

                waveText.opacity = store.get(gameStateAtom).hideUI ? 0 : 1;
            }
        }
    ]);

    const nextWaveButton = k.add([
        k.rect(100 * scale, 25 * scale, { radius: 2 * scale }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.area(),
        k.fixed(),
        k.color(85, 85, 85),
        k.z(1000),
        {
            update() {
                nextWaveButton.hidden = (!waitingForNextWave || levelComplete) ||
                    (
                        !store.get(gameStateAtom).challengeManager?.getChallenge() &&
                        store.get(challengesAtom).visible
                    );
                nextWaveButton.pos = buttonPos;
                nextWaveButton.width = 100 * scale;
                nextWaveButton.height = 25 * scale;
            }
        }
    ]);

    const outline = k.add([
        k.rect(100 * scale, 25 * scale, { radius: 2 * scale, fill: false }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.fixed(),
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
                outline.pos = buttonPos;
                outline.width = 100 * scale;
                outline.height = 25 * scale;
            }
        }
    ]);

    const buttonText = k.add([
        k.text("Start Wave", { size: 16 * scale, font: "free pixel" }),
        k.pos(buttonPos.x, buttonPos.y),
        k.fixed(),
        k.anchor("center"),
        k.z(1001),
        {
            update() {
                buttonText.hidden = (!waitingForNextWave || levelComplete) ||
                    (
                        !store.get(gameStateAtom).challengeManager?.getChallenge() &&
                        store.get(challengesAtom).visible
                    );
                buttonText.pos = k.vec2(buttonPos.x, buttonPos.y);

                buttonText.textSize = 16 * scale;
            }
        }
    ]);

    nextWaveButton.onHover(() => {
        k.setCursor("pointer");
        playUISound(k, "ui hover");
        nextWaveButton.color = k.rgb(144, 144, 144); // brighter green
    });

    nextWaveButton.onHoverEnd(() => {
        k.setCursor("default");
        nextWaveButton.color = k.rgb(85, 85, 85); // original color
    });

    nextWaveButton.onClick(() => {
        playUISound(k, "start wave");

        if (waitingForNextWave && !levelComplete) {
            waitingForNextWave = false;
            spawner.startNextWave();
        }
    });

    return spawner
}