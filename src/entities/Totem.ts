import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, TotemGameObj, TotemId } from "../types";
import { TILE_SIZE, TOTEMS } from "../constants";
import { updateSpeed } from "./Enemy";
import { hoveredTotemAtom, store } from "../store";

export default function makeTotem(k: KAPLAYCtx, id: TotemId, pos: Vec2) {
    const totem: TotemGameObj = k.add([
        k.sprite(`${id} totem`, { anim: "enemy" }),
        k.area({ shape: new k.Rect(k.vec2(0), 20, 20) }),
        k.anchor("center"),
        k.z(pos.y),
        k.pos(pos.add(TILE_SIZE / 2)),
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

    const barWidth = totem.width * 0.5;
    const barPos = totem.pos.add(totem.width * 0.5, totem.height);

    const captureBarBackground = k.add([
        k.pos(barPos),
        k.rect(barWidth + 2, 4),
        k.color(k.Color.fromHex("#707070")),
        k.outline(1, k.Color.fromHex("#000000")),
        k.opacity(0),
        {
            update() {
                captureBarBackground.pos = totem.pos.add(-totem.width / 4, -totem.height / 2);
                if (totem.captureTower && totem.captureProgress < 100) captureBarBackground.opacity = 1;
                else captureBarBackground.opacity = 0;
            }
        },
        k.z(9999)
    ]);

    const captureBar = k.add([
        k.pos(barPos),
        k.rect(0, 2),
        k.color(k.Color.fromHex("#46d85e")),
        k.z(99999999),
        k.opacity(0),
        {
            update() {
                const captureRatio =
                    Math.min(totem.captureProgress / 100, 1);
                captureBar.pos = totem.pos.add(-totem.width / 4 + 1, -totem.height / 2 + 1);
                captureBar.width = barWidth * captureRatio;
                if (totem.captureTower && totem.captureProgress < 100) {
                    captureBar.opacity = 1;
                } else captureBar.opacity = 0;
            }
        }
    ]);

    const totemRange = k.add([
        k.circle(totem.range * TILE_SIZE),
        k.color(255, 0, 0),
        k.opacity(0),
        k.outline(1),
        k.pos(totem.pos)
    ]);

    totem.onCollide("cursor", () => {
        totemRange.opacity = 0.2;
        store.set(hoveredTotemAtom, prev => ({
            ...prev,
            id,
            pos: { x: totem.screenPos().x, y: totem.screenPos().y }
        }));
    });

    totem.onCollideEnd("cursor", () => {
        totemRange.opacity = 0;
        store.set(hoveredTotemAtom, null);
    });

    const points = [k.vec2(-TILE_SIZE, 0), k.vec2(0, -TILE_SIZE), k.vec2(TILE_SIZE, 0), k.vec2(0, TILE_SIZE)];
    let bondBeam: GameObj | null = null;

    points.forEach(point => {
        const p = k.add([
            k.sprite("tower placement icon"),
            k.pos(totem.pos.add(point)),
            k.anchor("center"),
            k.opacity(1),
            k.scale(1),
            {
                update() {
                    p.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.1);

                    if (totem.captureTower) {
                        p.opacity = 0;
                        if (!bondBeam) {
                            bondBeam = k.add([
                                k.sprite("flame totem orb", { anim: "appear" }),
                                k.pos(totem.pos),
                                k.anchor("center"),
                                k.rotate(0),
                                k.z(99999999999)
                            ]);

                            bondBeam.onAnimEnd(() => {
                                if (!bondBeam || !totem.captureTower) return;
                                bondBeam.frame++;
                                bondBeam.angle = totem.pos.sub(totem.captureTower.pos.add(totem.captureTower.footprint.w * TILE_SIZE / 2)).angle();
                                bondBeam.width = totem.pos.dist(totem.captureTower.pos.add(totem.captureTower.footprint.w * TILE_SIZE / 2)) * 2;
                            });
                        }

                    } else {
                        p.opacity = 1;
                        if (bondBeam) k.destroy(bondBeam);
                        bondBeam = null;
                    }
                }
            }
        ]);
    });

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