import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, Spell, TowerGameObj } from "../types";
import { gameStateAtom, store } from "../store";
import { ELEMENTS, TILE_SIZE } from "../constants";
import hurtEnemy from "./hurtEnemy";
import healthBar from "../kaplayComponents/healthBar";
import chillEffect from "../kaplayComponents/chillEffect";
import { lifespan } from "../kaplayComponents/lifespan";
import { waitScaled } from "./timerFunctions";
import { playSfx, playUISound } from "./soundHelpers";
import reroll from "./reroll";
import darkHarvestEffect from "../kaplayComponents/darkHarvestMark";
import { freezeTile } from "./freezeTile";
import { spellProgress } from "./checkUnlocks";

export function castSpell(k: KAPLAYCtx, spell: Spell, opts?: { target?: Vec2; tower?: TowerGameObj }) {

    const target = opts?.target;
    const tower = opts?.tower;

    switch (spell.effect) {
        case "heal":
            store.set(gameStateAtom, prev => ({
                ...prev,
                health: Math.min(prev.health + 1, prev.maxHealth)
            }));
            if (spell.uses) spell.uses--;
            break;

        case "gold":
            playUISound(k, "ui buy");

            store.set(gameStateAtom, prev => ({
                ...prev,
                gold: prev.gold + (spell.amount ?? 20)
            }));
            break;

        case "reroll":
            store.set(gameStateAtom, prev => ({
                ...prev,
                upgrades: prev.upgrades.filter(upgrade => upgrade !== spell)
            }))
            reroll(k);
            break;

        case "firestorm":
            playUISound(k, "roaring fire", 2);

            fireStorm(k, target ?? k.vec2(0));

            const damage = getAoeSpellDamage(20, store.get(gameStateAtom).waveNumber)

            spawnBurningGround(k, { target: target ?? k.vec2(0), range: 3 * TILE_SIZE, damage: damage * 0.1 });

            spellProgress();

            (k.get("targetable") as EnemyGameObj[]).forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * (spell.range ?? 3)) {
                    if (enemy.invincible) return;
                    ELEMENTS["Fire"].applyEffect?.(k, { target: enemy, chance: 100, damage: 0 });
                    hurtEnemy(k, { target: enemy, damage, element: "Fire", isCrit: false });
                }
            });
            break;

        case "toxicInfusion":
            if (tower) {
                const toxicInfusionDuration = 5;
                tower.selected = false;
                tower.towerBuffs.push(
                    {
                        type: "toxicInfusion",
                        timeLeft: toxicInfusionDuration
                    }
                );

                playUISound(k, "poison bubbles", 1);

                spellProgress();

                const bubbleLoop = k.loop(0.15, () => {
                    spawnPoisonBubble(k, tower.pos.add(tower.footprint.w * TILE_SIZE / 2, tower.footprint.h * TILE_SIZE / 2));
                });

                waitScaled(k, toxicInfusionDuration, () => bubbleLoop.cancel());
            }
            break;

        case "darkHarvest":
            playUISound(k, "dark magic", 2);
            spellProgress();

            k.get("targetable").forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * (spell.range ?? 3)) {
                    if (enemy.invincible) return;

                    const duration = 5;
                    const loop = k.loop(0.15, () => {
                        spawnDarkSoul(k, enemy.pos);
                    });

                    waitScaled(k, 0.2, () => loop.cancel());
                    const mark = enemy.has("darkHarvestMark");
                    if (mark) {
                        enemy.refreshMark();
                        return;
                    }
                    enemy.use(darkHarvestEffect(k, duration));
                    if (!enemy.has("healthBar")) {
                        enemy.use(healthBar(k, duration));
                    }
                }
            });
            break;

        case "blindingLight":
            blindingLight(k);

            const spellDuration = 6;

            playUISound(k, "holy", 2);

            spellProgress();

            (k.get("targetable") as EnemyGameObj[]).forEach(enemy => {
                if (enemy.invincible) return;

                ELEMENTS["Light"].applyEffect?.(k, { target: enemy, damage: 0, duration: 6 });
                if (!enemy.has("healthBar")) {
                    enemy.use(healthBar(k, spellDuration));
                }

            });

            const affectedTowers = (k.get("tower") as TowerGameObj[]).slice();

            affectedTowers.forEach(tower => {
                tower.stats.range += 2;
            });


            const moteLoop = k.loop(0.02, () => {
                spawnLightMote(k);
            });

            waitScaled(k, spellDuration, () => {
                affectedTowers.forEach(tower => {
                    tower.stats.range -= 2;
                });
                k.get("light mote").forEach(mote => k.destroy(mote));
                moteLoop.cancel();

            });

            spawnLightAura(k, spellDuration);

            break;

        case "arcticBlast":
            spawnArcticBlast(k, target ?? k.vec2(0));
            playSfx(k, "ice magic", 2);
            spellProgress();

            k.get("targetable").forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * (spell.range ?? 3)) {
                    if (enemy.invincible) return;

                    const chill = enemy.has("chill");
                    const stacks = 10;
                    if (chill) {
                        enemy.addChillStack(stacks, stacks, false);
                    } else if (!enemy.is("cactus")) {
                        enemy.use(chillEffect(k, 2, stacks, stacks));
                    }

                    hurtEnemy(k, {
                        target: enemy as EnemyGameObj,
                        damage: getAoeSpellDamage(20, store.get(gameStateAtom).waveNumber),
                        element: "Ice",
                        isCrit: false,
                        applyStatusEffects: false
                    });
                }
            });

            const { tileGrid } = store.get(gameStateAtom);

            for (let y = 0; y < tileGrid.length; y++) {
                for (let x = 0; x < tileGrid[y].length; x++) {
                    const tile = tileGrid[y][x];

                    if (!tile.hasWater) continue;

                    const pos = k.vec2(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2
                    );

                    if (pos.dist(target!) <= 2.5 * TILE_SIZE) {
                        freezeTile(k, { tile, x, y });
                    }
                }
            }

            break;

        case "overcharge":
            if (tower) {
                const overchargeDuration = 5;
                tower.selected = false;
                tower.towerBuffs.push(
                    {
                        type: "bonusDamage",
                        element: "Electric",
                        multiplier: 0.2,
                        timeLeft: overchargeDuration
                    },
                    {
                        type: "fireRate",
                        multiplier: 0.5,
                        timeLeft: overchargeDuration
                    }
                );

                playUISound(k, "electric shock", 0.5);

                spellProgress();

                const loop = k.loop(0.08, () => {
                    spawnElectricSpark(k, tower);
                });

                waitScaled(k, overchargeDuration, () => loop.cancel());
            }
            break;
        default: break;
    }
}

function fireStorm(k: KAPLAYCtx, pos: Vec2) {

    for (let i = 0; i < 30; i++) {
        k.add([
            k.sprite("flame particle"),
            k.pos(pos.add(k.rand(k.vec2(-40), k.vec2(40)))),
            lifespan(k, k.rand(0.25, 0.5)),
            k.scale(2),
            k.move(k.UP, k.rand(10, 30)),
            k.z(999)
        ]);
    }
}

function spawnArcticBlast(k: KAPLAYCtx, pos: Vec2) {
    // Expanding frost circle
    const ring = k.add([
        k.circle(10),
        k.pos(pos),
        k.color(180, 240, 255),
        k.opacity(0.5),
        k.anchor("center"),
        k.z(10),
        lifespan(k, 0.35)
    ]);

    k.tween(
        10,
        90,
        0.35,
        (v) => ring.radius = v,
        k.easings.easeOutQuad
    );

    k.tween(
        0.5,
        0,
        0.35,
        (v) => ring.opacity = v,
        k.easings.linear
    );

    // Ice shards
    for (let i = 0; i < 18; i++) {
        const angle = k.rand(0, 360);
        const distance = k.rand(40, 90);
        const dir = k.vec2(
            Math.cos(k.deg2rad(angle)),
            Math.sin(k.deg2rad(angle)),
        );


        const shard = k.add([
            k.sprite("icicle projectile"),
            k.pos(pos),
            k.anchor("center"),
            k.rotate(angle + 180),
            k.z(11),
            k.opacity(1),
            k.scale(0.5),
            lifespan(k, 0.35)
        ]);

        k.tween(
            k.vec2(0, 0),
            k.vec2(
                Math.cos(k.deg2rad(angle)) * distance,
                Math.sin(k.deg2rad(angle)) * distance
            ),
            0.35,
            (offset) => shard.pos = pos.add(offset),
            k.easings.easeOutQuad
        );

        k.tween(
            1,
            0,
            0.35,
            (v) => shard.opacity = v,
            k.easings.linear
        );

        k.tween(
            0,
            distance,
            0.35,
            (d) => {
                shard.pos = pos.add(dir.scale(d));
            },
            k.easings.easeOutQuad,
        );
    }

    // Snow particles
    for (let i = 0; i < 24; i++) {
        const snow = k.add([
            k.sprite("frost particle"),
            k.pos(pos.add(k.rand(k.vec2(-40), k.vec2(40)))),
            k.anchor("center"),
            k.z(12),
            k.scale(2),
            k.opacity(0.8),
            lifespan(k, 0.8)
        ]);

        k.tween(
            snow.pos.y,
            snow.pos.y - k.rand(20, 50),
            0.8,
            (y) => snow.pos.y = y,
            k.easings.easeOutQuad,
        );

        k.tween(
            0.8,
            0,
            0.8,
            (v) => snow.opacity = v
        );
    }
}

function spawnPoisonBubble(k: KAPLAYCtx, pos: Vec2) {
    const bubble = k.add([
        k.circle(k.rand(2, 5)),
        k.pos(pos.add(k.rand(k.vec2(-25, -10), k.vec2(25, 10)))),
        k.color(120, 255, 120),
        k.opacity(0.6),
        k.scale(1),
        k.anchor("center"),
        k.lifespan(1),
    ]);

    const start = bubble.pos.clone();

    k.tween(
        0,
        1,
        1,
        (t) => {
            bubble.pos = start.add(
                k.vec2(
                    k.rand(-8, 8) * t,
                    -25 * t,
                )
            );

            bubble.scale = k.vec2(1 + t * 0.5);
            bubble.opacity = 0.6 * (1 - t);
        },
        k.easings.linear,
    );
}

function blindingLight(k: KAPLAYCtx) {
    const flash = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.fixed(),
        k.color(255, 250, 220),
        k.opacity(0),
        k.z(1000),
    ]);

    k.tween(
        0,
        0.9,
        0.08,
        (v) => flash.opacity = v,
    );

    k.wait(0.08, () => {
        k.tween(
            0.9,
            0,
            0.2,
            (v) => flash.opacity = v,
        );

        k.wait(0.2, () => flash.destroy());
    });
}

export function spawnDarkHarvestEffect(k: KAPLAYCtx, enemy: EnemyGameObj) {
    for (let i = 0; i < 6; i++) {
        const angle = k.rand(0, 360);
        const distance = k.rand(40, 60);

        const startPos = enemy.pos.add(
            k.vec2(
                Math.cos(k.deg2rad(angle)) * distance,
                Math.sin(k.deg2rad(angle)) * distance,
            )
        );

        const particle = k.add([
            k.circle(3),
            k.pos(startPos),
            k.color(120, 0, 180),
            k.opacity(0.8),
            k.anchor("center"),
            k.lifespan(0.25),
            k.scale(1),
            k.z(999999),
        ]);

        k.tween(
            0,
            1,
            0.25,
            (t) => {
                particle.pos = startPos.lerp(enemy.pos, t);
                particle.scale = k.vec2(1 - t * 0.5);
                particle.opacity = 0.8 * (1 - t);
            },
            k.easings.easeOutQuad,
        );
    }
}

export function spawnDarkBurst(k: KAPLAYCtx, pos: Vec2) {
    for (let i = 0; i < 8; i++) {
        const angle = k.rand(0, 360);
        const dir = k.vec2(
            Math.cos(k.deg2rad(angle)),
            Math.sin(k.deg2rad(angle)),
        );

        const particle = k.add([
            k.circle(2),
            k.pos(pos),
            k.color(180, 80, 255),
            k.opacity(1),
            k.scale(2),
            k.anchor("center"),
            k.lifespan(0.2),
            k.z(999999)
        ]);

        k.tween(
            0,
            18,
            0.2,
            (d) => {
                particle.pos = pos.add(dir.scale(d));
                particle.opacity = 1 - d / 18;
            }
        );
    }
}

function spawnElectricSpark(k: KAPLAYCtx, tower: TowerGameObj) {
    const angle = k.rand(0, 360);
    const distance = k.rand(8, 18);

    const start = tower.pos.add(tower.footprint.w * TILE_SIZE / 2).add(
        k.vec2(
            Math.cos(k.deg2rad(angle)) * distance,
            Math.sin(k.deg2rad(angle)) * distance,
        )
    );

    const dir = tower.pos.sub(start).unit();

    const spark = k.add([
        k.sprite("electric particle"),
        k.pos(start),
        k.opacity(1),
        k.anchor("center"),
        k.lifespan(0.15),
        k.z(999),
    ]);

    k.tween(
        0,
        distance * 0.4,
        0.15,
        (d) => {
            spark.pos = start.add(dir.scale(d));
            spark.opacity = 1 - d / (distance * 0.4);
        }
    );
}

export function generateRandomSpells(amount: number, arr: Spell[]) {
    if (!arr.length) return [];
    const result = new Set<Spell>();

    const spellPool = arr.map(spell => {
        const copy = { ...spell };

        if (copy.effect === "gold") {
            const amounts = [20, 30, 40, 50, 60];
            copy.amount = amounts[Math.floor(Math.random() * amounts.length)];
            copy.description = `Gain ${copy.amount} gold`;
        } else if (copy.effect === "heal") {
            const uses = [1, 1, 2, 2, 3];
            copy.uses = uses[Math.floor(Math.random() * uses.length)];
        }

        return copy;
    });

    while (result.size < Math.min(amount, spellPool.length)) {
        const index = Math.floor(Math.random() * spellPool.length);
        result.add(spellPool[index]);
    }
    return [...result];
}

export function spawnPoisonCloud(k: KAPLAYCtx, opts: { damage: number; target: Vec2; }) {
    const { damage, target } = opts;
    const duration = 3;

    const radius = Math.min(96, 40 + Math.sqrt(damage) * 3);

    const cloud = k.add([
        k.pos(target),
        k.circle(radius),
        k.opacity(0),
        k.anchor("center"),
        k.scale(1),
        lifespan(k, duration),
        "poisonCloud"
    ]);

    const interval = Math.max(0.03, 0.12 - radius / 1000);

    const emitter = k.loop(interval, () => {
        const dist = Math.sqrt(k.rand()) * radius;
        const angle = k.rand(0, 360);

        const offset = k.vec2(
            Math.cos(angle) * dist,
            Math.sin(angle) * dist,
        );

        spawnCloudPuff(k, cloud.pos.add(offset));
    });

    waitScaled(k, duration, () => emitter.cancel());

    cloud.onUpdate(() => {
        cloud.scale = k.vec2(1 + Math.sin(k.time() * 3) * 0.05);
    });

    const bubbleLoop = k.loop(0.15, () => {
        spawnPoisonBubble(k, cloud.pos);
    });

    waitScaled(k, duration, () => bubbleLoop.cancel());

    let tick = 0;

    cloud.onUpdate(() => {
        const tickRate = 0.25;

        tick += k.dt() * store.get(gameStateAtom).timeScale;

        while (tick >= tickRate) {
            tick -= tickRate;

            const enemies = k.get("targetable") as EnemyGameObj[];
            for (const enemy of enemies) {
                if (enemy.pos.dist(target) <= radius) {
                    hurtEnemy(k, {
                        target: enemy,
                        damage,
                        element: "Poison",
                        isCrit: false
                    });
                }
            }
        }
    });

}

function spawnCloudPuff(k: KAPLAYCtx, pos: Vec2) {
    const puff = k.add([
        k.circle(k.rand(8, 16)),
        k.pos(pos),
        k.color(70, 180, 70),
        k.opacity(0.4),
        k.scale(1),
        k.anchor("center"),
        k.lifespan(0.8),
    ]);

    const start = puff.pos.clone();

    k.tween(0, 1, 0.8, (t) => {
        puff.scale = k.vec2(1 + t * 1.5);
        puff.opacity = 0.4 * (1 - t);
        puff.pos = start.add(
            k.vec2(
                k.rand(-5, 5) * t,
                -15 * t,
            )
        );
    });
}

function getAoeSpellDamage(base: number, wave: number) {
    let damage = base;

    for (let i = 2; i <= wave; i++) {
        let growth = 0;

        if (i <= 3) growth = 0.3;
        else if (i <= 9) growth = 0.4;
        else growth = 0.3;

        damage *= 1 + growth;
    }

    return Math.round(damage);
}

function spawnLightMote(k: KAPLAYCtx) {
    const pos = k.vec2(
        k.rand(0, k.width()),
        k.rand(0, k.height())
    );

    const outer = k.add([
        k.circle(k.rand(3, 6)),
        k.pos(pos),
        k.anchor("center"),
        k.color(255, 210, 80),
        k.opacity(0.35),
        k.scale(1),
        k.lifespan(2),
        "light mote"
    ]);

    const inner = k.add([
        k.circle(1.5),
        k.pos(pos),
        k.anchor("center"),
        k.color(255, 255, 220),
        k.opacity(0.8),
        k.lifespan(2),
        "light mote"
    ]);

    const speed = k.rand(10, 25);

    outer.onUpdate(() => {
        outer.move(0, -speed);
        inner.move(0, -speed);

        const pulse = 1 + Math.sin(k.time() * 8) * 0.2;
        outer.scale = k.vec2(pulse);
    });
}

function spawnLightAura(k: KAPLAYCtx, duration: number) {
    const overlay = k.add([
        k.rect(k.width(), k.height()),
        k.pos(0, 0),
        k.fixed(),
        k.color(255, 230, 150),
        k.opacity(0.08),
        k.z(999),
    ]);

    waitScaled(k, duration, () => {
        k.destroy(overlay);
    });
}

function spawnDarkSoul(k: KAPLAYCtx, pos: Vec2) {
    const outer = k.add([
        k.circle(k.rand(2, 4)),
        k.pos(pos.add(k.rand(k.vec2(-12, -6), k.vec2(12, 6)))),
        k.color(90, 20, 140),
        k.opacity(0.35),
        k.anchor("center"),
        k.scale(1),
        k.lifespan(0.9),
        k.z(999),
    ]);

    const inner = k.add([
        k.circle(1),
        k.pos(outer.pos.clone()),
        k.color(220, 120, 255),
        k.opacity(0.9),
        k.anchor("center"),
        k.lifespan(0.9),
        k.z(1000),
    ]);

    const start = outer.pos.clone();
    const drift = k.rand(-8, 8);

    k.tween(0, 1, 0.9, (t) => {
        const offset = k.vec2(
            Math.sin(t * Math.PI * 2) * drift * 0.3,
            -20 * t,
        );

        outer.pos = start.add(offset);
        inner.pos = outer.pos.clone();

        outer.opacity = 0.35 * (1 - t);
        inner.opacity = 0.9 * (1 - t);

        outer.scale = k.vec2(1 + t * 0.3);
    });
}

function spawnBurningGround(k: KAPLAYCtx, opts: { target: Vec2; range: number; damage: number; }) {
    const { target, range, damage } = opts;

    const fire = k.add([
        k.pos(target),
        lifespan(k, 3),
        {
            tick: 0,
            tickRate: 0.25,
            range,
            damage
        },
        "burningGround"
    ]);

    fire.onUpdate(() => {
        fire.tick -= k.dt() * store.get(gameStateAtom).timeScale;

        if (fire.tick <= 0) {
            fire.tick += fire.tickRate;

            (k.get("enemy") as EnemyGameObj[]).forEach(enemy => {
                if (enemy.invincible) return;

                if (enemy.pos.dist(fire.pos) <= fire.range) {
                    hurtEnemy(k, {
                        target: enemy,
                        damage,
                        element: "Fire",
                        isCrit: false,
                    });
                }
            });
        }

        const particlesPerSecond = 40;
        if (Math.random() < particlesPerSecond * k.dt() * store.get(gameStateAtom).timeScale) {

            k.add([
                k.sprite("flame particle"),
                k.pos(
                    fire.pos.add(
                        k.vec2(k.rand(-range, range), k.rand(-range, range))
                    )
                ),
                k.anchor("center"),
                lifespan(k, k.rand(0.3, 0.6)),
                k.move(k.UP, k.rand(10, 20)),
                k.scale(k.rand(1.5, 2.5)),
                k.z(5),
            ]);
        }
    });

    const trees = (k.get("tree") as GameObj[]).filter(tree =>
        tree.pos.dist(fire.pos) <= range
    );

    trees.forEach(tree => {
        if (!tree.burning) {
            tree.burning = true;

            let particleTimer = 0;

            tree.onUpdate(() => {
                if (!tree.burning) return;

                particleTimer += k.dt() * store.get(gameStateAtom).timeScale;

                while (particleTimer >= 0.08) {
                    particleTimer -= 0.08;
                    const burnOffset = 6;

                    k.add([
                        k.sprite("flame particle"),
                        k.pos(tree.pos.add(TILE_SIZE / 2, TILE_SIZE / 2 + burnOffset).add(k.rand(k.vec2(-6), k.vec2(6)))),
                        k.anchor("center"),
                        lifespan(k, k.rand(0.3, 0.6)),
                        k.move(k.UP, k.rand(10, 20)),
                    ]);
                }
            });

            const treeBurnTime = 4;

            waitScaled(k, treeBurnTime, () => {
                tree.tile.blocked = false;

                tree.destroy();
            });
        }
    });

}