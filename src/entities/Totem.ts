import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, TotemGameObj, TotemId } from "../types";
import { TOTEMS } from "../constants";
import { updateSpeed } from "./Enemy";

export default function makeTotem(k: KAPLAYCtx, id: TotemId, pos: Vec2) {
    const totem: TotemGameObj = k.add([
        k.rect(32, 32),
        k.pos(pos),
        {
            totemId: id,
            isCaptured: false,
            captureProgress: 0,
            captureTower: null,
            range: 4,
            requiredDamage: 5000,
            affectedEnemies: new Set<EnemyGameObj>(),
            enemyEffect: TOTEMS[id].enemyEffect,
            playerBuff: TOTEMS[id].playerBuff
        },
        "totem"
    ]);

    function captureTotem(totem: TotemGameObj) {
        totem.isCaptured = true;

        for (const enemy of totem.affectedEnemies) {
            removeTotemEffect(enemy, totem);
        }

        totem.affectedEnemies.clear();

        // applyPlayerBlessing(totem);
    }

    return totem;
}

export function addTotemEffect(enemy: EnemyGameObj, totem: TotemGameObj) {
    totem.affectedEnemies.add(enemy);
    enemy.totemEffects.add(totem);
    recalculateTotemStats(enemy);
}

export function removeTotemEffect(enemy: EnemyGameObj, totem: TotemGameObj) {
    totem.affectedEnemies.delete(enemy);
    enemy.totemEffects.delete(totem);
    recalculateTotemStats(enemy);
}


export function recalculateTotemStats(enemy: EnemyGameObj) {
    enemy.speedMultipliers.totem = 1;
    enemy.healthRegen = 0;

    for (const totem of enemy.totemEffects) {
        const effect = totem.enemyEffect;

        if (effect.type === "speed") {
            enemy.speedMultipliers.totem = effect.amount;
        }

        if (effect.type === "health") {
            enemy.healthRegen += effect.amount;
        }
    }

    updateSpeed.call(enemy);
}