import type { Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, TotemGameObj, TotemId, TowerGameObj } from "../types";
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
            requiredDamage: 10,
            affectedEnemies: new Set<EnemyGameObj>(),
            enemyEffect: TOTEMS[id].enemyEffect,
            playerBuff: TOTEMS[id].playerBuff
        },
        "totem"
    ]);

    totem.onUpdate(() => {
        if (totem.captureProgress >= totem.requiredDamage && !totem.isCaptured) {
            captureTotem(totem);
        }

        if (!totem.captureTower) {
            totem.isCaptured = false;
            totem.captureProgress = 0;
        }
    });

    function captureTotem(totem: TotemGameObj) {
        totem.isCaptured = true;
        totem.play("tower");

        for (const enemy of totem.affectedEnemies) {
            removeTotemEffect(enemy, totem);
        }

        totem.affectedEnemies.clear();

        applyPlayerBlessing(totem);

        if (totem.captureTower) captureTotemEffect(k, totem, totem.captureTower);
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
                if (totem.captureTower && totem.captureProgress < totem.requiredDamage) captureBarBackground.opacity = 1;
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
                    Math.min(totem.captureProgress / totem.requiredDamage, 1);
                captureBar.pos = totem.pos.add(-totem.width / 4 + 1, -totem.height / 2 + 1);
                captureBar.width = barWidth * captureRatio;
                if (totem.captureTower && totem.captureProgress < totem.requiredDamage) {
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
        if (!totem.isCaptured) {
            totemRange.opacity = 0.2;
        }

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
                        totem.play("enemy");
                    }

                    if (!totem.captureTower || totem.isCaptured) {
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

function applyPlayerBlessing(totem: TotemGameObj) {


    totem.playerBuff.buffs.forEach(buff => {
        if (totem.captureTower) totem.captureTower.towerBuffs.push(buff);
    });
}

type TotemPowerEffectOptions = {
    color?: Color;
    particleCount?: number;
    duration?: number;
};

export function captureTotemEffect(
    k: KAPLAYCtx,
    totem: TotemGameObj,
    tower: TowerGameObj,
    options: TotemPowerEffectOptions = {},
) {
    const {
        color = k.Color.fromHex(TOTEMS[totem.totemId].particleColor) as Color,
        particleCount = 8,
        duration = 0.65,
    } = options;

    const start = totem.pos;

    const end = tower.pos.add(tower.footprint.w * TILE_SIZE / 2);

    // --------------------------------------------------
    // 1. BURST FROM TOTEM
    // --------------------------------------------------

    createTotemBurst(k, start, color);

    // --------------------------------------------------
    // 2. TRANSFER PARTICLES
    // --------------------------------------------------

    for (let i = 0; i < particleCount; i++) {
        const delay = i * 0.055 + k.rand(0, 0.08);

        k.wait(delay, () => {
            createTransferParticle(
                k,
                start,
                end,
                color,
                duration + k.rand(-0.1, 0.1),
            );
        });
    }

    // --------------------------------------------------
    // 3. TOWER IMPACT
    // --------------------------------------------------

    k.wait(duration + (particleCount - 1) * 0.055, () => {
        createTowerImpact(k, end, color);
    });
}

function createTotemBurst(
    k: KAPLAYCtx,
    pos: Vec2,
    color: Color,
) {
    // Expanding ring
    const ring = k.add([
        k.circle(5),
        k.pos(pos),
        k.color(color),
        k.anchor("center"),
        k.opacity(0.8),
        k.z(999),
        k.scale(0.5),
        {
            life: 0.35,
            maxScale: 4,
        },
    ]);

    ring.onUpdate(() => {
        ring.life -= k.dt();

        const progress = 1 - ring.life / 0.35;

        ring.scale = k.vec2(
            0.5 + progress * ring.maxScale,
        );

        ring.opacity = 0.8 * (1 - progress);

        if (ring.life <= 0) {
            ring.destroy();
        }
    });

    // Outward particles
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 + k.rand(-0.2, 0.2);
        const speed = k.rand(30, 65);

        const particle = k.add([
            k.rect(k.rand(2, 4), k.rand(2, 4)),
            k.pos(pos),
            k.color(color),
            k.opacity(1),
            k.anchor("center"),
            k.z(999),
            {
                velocity: k.vec2(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                ),
                life: k.rand(0.25, 0.4),
            },
        ]);

        particle.onUpdate(() => {
            particle.life -= k.dt();

            particle.move(
                particle.velocity.scale(k.dt()),
            );

            particle.velocity = particle.velocity.scale(
                Math.pow(0.05, k.dt()),
            );

            particle.opacity = Math.max(
                0,
                particle.life / 0.4,
            );

            if (particle.life <= 0) {
                particle.destroy();
            }
        });
    }
}

function quadraticBezier(
    start: Vec2,
    control: Vec2,
    end: Vec2,
    t: number,
): Vec2 {
    const inv = 1 - t;

    return start.scale(inv * inv)
        .add(control.scale(2 * inv * t))
        .add(end.scale(t * t));
}

function createTransferParticle(
    k: KAPLAYCtx,
    start: Vec2,
    end: Vec2,
    color: Color,
    duration: number,
) {
    const direction = end.sub(start).unit();

    const perpendicular = k.vec2(
        -direction.y,
        direction.x,
    );

    const distance = start.dist(end);

    const curveAmount = Math.min(70, distance * 0.35);

    const control = start
        .add(end)
        .scale(0.5)
        .add(
            perpendicular.scale(
                k.rand(-curveAmount, curveAmount),
            ),
        );

    const particle = k.add([
        k.circle(k.rand(2, 3)),
        k.pos(start),
        k.color(color),
        k.z(999),
        k.opacity(1),
        k.anchor("center"),
        {
            elapsed: 0,
            duration,
            start,
            control,
            end,
            trailTimer: 0,
        },
    ]);

    particle.onUpdate(() => {
        particle.elapsed += k.dt();
        particle.trailTimer += k.dt();

        let t = Math.min(
            particle.elapsed / particle.duration,
            1,
        );

        t = t * t * (3 - 2 * t);

        particle.pos = quadraticBezier(
            particle.start,
            particle.control,
            particle.end,
            t,
        );

        // Small fading trail
        if (particle.trailTimer >= 0.05) {
            particle.trailTimer = 0;

            createTrailParticle(
                k,
                particle.pos.clone(),
                color,
            );
        }

        particle.opacity =
            t > 0.8
                ? 1 - (t - 0.8) / 0.2
                : 1;

        if (particle.elapsed >= particle.duration) {
            particle.destroy();
        }
    });
}

function createTrailParticle(
    k: KAPLAYCtx,
    pos: Vec2,
    color: Color,
) {
    const particle = k.add([
        k.circle(k.rand(1, 2)),
        k.pos(pos),
        k.color(color),
        k.scale(1),
        k.z(999),
        k.opacity(0.5),
        k.anchor("center"),
        {
            life: 0.18,
        },
    ]);

    particle.onUpdate(() => {
        particle.life -= k.dt();

        particle.opacity =
            0.5 * (particle.life / 0.18);

        particle.scale = k.vec2(
            particle.life / 0.18,
        );

        if (particle.life <= 0) {
            particle.destroy();
        }
    });
}

function createTowerImpact(
    k: KAPLAYCtx,
    pos: Vec2,
    color: Color,
) {
    // Flash
    const flash = k.add([
        k.circle(5),
        k.pos(pos),
        k.color(color),
        k.opacity(0.9),
        k.z(999),
        k.anchor("center"),
        k.scale(0.5),
        {
            life: 0.3,
        },
    ]);

    flash.onUpdate(() => {
        flash.life -= k.dt();

        const progress = 1 - flash.life / 0.3;

        flash.scale = k.vec2(
            0.5 + progress * 3,
        );

        flash.opacity =
            0.9 * (1 - progress);

        if (flash.life <= 0) {
            flash.destroy();
        }
    });

    // Impact burst
    for (let i = 0; i < 12; i++) {
        const angle = k.rand(0, Math.PI * 2);
        const speed = k.rand(30, 80);

        const particle = k.add([
            k.circle(k.rand(1, 3)),
            k.pos(pos),
            k.color(color),
            k.z(999),
            k.opacity(1),
            k.anchor("center"),
            {
                velocity: k.vec2(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                ),
                life: k.rand(0.2, 0.35),
            },
        ]);

        particle.onUpdate(() => {
            particle.life -= k.dt();

            particle.move(
                particle.velocity.scale(k.dt()),
            );

            particle.velocity = particle.velocity.scale(
                Math.pow(0.05, k.dt()),
            );

            particle.opacity =
                particle.life / 0.35;

            if (particle.life <= 0) {
                particle.destroy();
            }
        });
    }
}