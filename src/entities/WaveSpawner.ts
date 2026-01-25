import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyId, LevelId } from "../constants";
import type { Wave } from "../types";
import { LEVEL_WAVES } from "../constants";
import makeEnemy from "./enemy";
import { store, gameStateAtom } from "../store";
import screenPos from "../utils/screenPos";

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
        {
            startNextWave() {
                waveIndex++;
                const wave = level.waves[waveIndex];
                spawnQueue = buildQueue(wave);
                timer = 0;
                spawning = true;
            }
        }
    ]);

    spawner.onUpdate(() => {

        if (!spawning) {
            // wave complete
            if (enemyDeadCheck && !k.get("enemy").length && !levelComplete) {

                if (waveIndex === level.waves.length - 1) {
                    levelComplete = true;
                    return;
                }

                enemyDeadCheck = false;
                if (waveIndex >= 0) store.set(gameStateAtom, prev => ({
                    ...prev,
                    gold: prev.gold + level.waves[waveIndex].reward
                }));

                nextWaveTimer = level.startDelay;
                waitingForNextWave = true;
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