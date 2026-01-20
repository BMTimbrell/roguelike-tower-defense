import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyId, LevelId } from "../constants";
import type { Wave } from "../types";
import { LEVEL_WAVES } from "../constants";
import makeEnemy from "./enemy";

export default function makeWaveSpawner(k: KAPLAYCtx, levelId: LevelId, waypoints: Vec2[]): GameObj {
    const level = LEVEL_WAVES[levelId];

    let waveIndex = -1;
    let spawnQueue: { id: EnemyId; time: number }[] = [];
    let timer = 0;
    let spawning = false;

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

    return k.add([
        "waveSpawner",
        {
            startNextWave() {
                waveIndex++;
                const wave = level.waves[waveIndex];
                spawnQueue = buildQueue(wave);
                timer = 0;
                spawning = true;
            },

            update() {
                if (!spawning) return;

                timer += k.dt();

                while (spawnQueue.length && spawnQueue[0].time <= timer) {
                    const spawn = spawnQueue.shift()!;
                    makeEnemy(k, spawn.id, waypoints);
                }

                if (spawning && spawnQueue.length === 0) {
                    spawning = false;
                    // now wait until all enemies dead before next wave
                }
            },
        },
    ]);
}