import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyId, LevelId } from "../constants";
import type { TowerGameObj, Wave } from "../types";
import { BASE_DRAW_COST, LEVEL_WAVES, MAX_HAND_SIZE, ROUND_DRAW_NUM, SEEDS } from "../constants";
import makeEnemy from "./Enemy";
import { store, gameStateAtom } from "../store";
import screenPos from "../utils/screenPos";
import drawCards from "../utils/drawCards";
import makeTower from "./Tower";

export default function makeWaveSpawner(k: KAPLAYCtx, levelId: LevelId, waypoints: Vec2[]): GameObj {
    const level = LEVEL_WAVES[levelId];

    let waveIndex = -1;
    let spawnQueue: { id: EnemyId; time: number }[] = [];
    let timer = 0;
    let spawning = false;
    let enemyDeadCheck = true;
    let levelComplete = false;
    let nextWaveTimer: number = level.startDelay;
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
        k.timer(),
        {
            add() {
                if ("boss" in level && level.boss) {
                    const boss = level.boss as {
                        id: EnemyId;
                        bossStops: number[];
                    };

                    const bossInstance = makeEnemy(k, boss.id, waypoints, 0, undefined, boss.bossStops);
                    bossInstance.enterState("idle");
                }
            },
            startNextWave() {
                if (waveIndex < 0) {
                    k.get("arrow").forEach(a => k.destroy(a));
                }

                waveIndex++;
                const wave = level.waves[waveIndex];
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
                    bossInstance.boss.reachedStop = false;
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

                if (waveIndex === level.waves.length - 1 || ("boss" in level && !boss && !normalEnemiesAlive)) {
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

                if (waveIndex >= 0) {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        gold: prev.gold + (level.waves[waveIndex].reward * incomeMod),
                        deck: {
                            ...prev.deck,
                            drawCost: BASE_DRAW_COST
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

                nextWaveTimer = level.startDelay;
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
                        } else {
                            e.gun.play(`grow${3 - e.farmData.turnsRemaining}`);
                        }
                    }
                });
            }

            if (waitingForNextWave) {
                nextWaveTimer -= k.dt();

                if (nextWaveTimer <= 0) {
                    waitingForNextWave = false;
                    spawner.startNextWave();
                }
            }

            return;
        }

        timer += k.dt();

        while (spawnQueue.length && spawnQueue[0].time <= timer) {
            const spawn = spawnQueue.shift()!;
            makeEnemy(k, spawn.id, waypoints);
        }

        if (spawning && spawnQueue.length === 0) {
            spawning = false;
            enemyDeadCheck = true;
        }

    });

    const waveTextPos = k.vec2(20, 15);
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
                if (spawning) {
                    waveText.use(k.text(`Wave: ${waveIndex + 1}/${level.waves.length}`, {
                        size: 20,
                        font: "free pixel"
                    }));
                } else if (waitingForNextWave) {
                    waveText.use(k.text(
                        `Wave: ${waveIndex + 1}/${level.waves.length}  Next Wave In: ${Math.ceil(nextWaveTimer)} (Enter to skip)`,
                        { size: 20, font: "free pixel" }
                    ));
                }

                waveText.pos = screenPos(k, waveTextPos);
            }
        }
    ]);

    k.onKeyPress("enter", () => {
        if (waitingForNextWave && !levelComplete) {
            waitingForNextWave = false;
            nextWaveTimer = 0;
            spawner.startNextWave();
        }
    });

    return spawner;
}