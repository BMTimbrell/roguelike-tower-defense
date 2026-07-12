import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { EnemyGameObj, Spell, TowerGameObj } from "../types";
import { gameStateAtom, store } from "../store";
import { ELEMENTS, TILE_SIZE } from "../constants";
import poisonEffect from "../kaplayComponents/poisonEffect";
import hurtEnemy from "./hurtEnemy";
import healthBar from "../kaplayComponents/healthBar";
import chillEffect from "../kaplayComponents/chillEffect";
import { lifespan } from "../kaplayComponents/lifespan";
import { waitScaled } from "./timerFunctions";
import { playSfx, playUISound } from "./soundHelpers";
import reroll from "./reroll";

export function castSpell(k: KAPLAYCtx, spell: Spell, opts?: { target?: Vec2; tower?: TowerGameObj }) {

    const target = opts?.target;
    const tower = opts?.tower;

    switch (spell.effect) {
        case "heal":
            store.set(gameStateAtom, prev => ({
                ...prev,
                health: Math.min(prev.health + 1, prev.maxHealth)
            }));
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

            (k.get("enemy") as EnemyGameObj[]).forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * 3) {
                    if (enemy.invincible) return;
                    ELEMENTS["Fire"].applyEffect?.(k, { target: enemy, chance: 100, damage: 0 });
                    hurtEnemy(k, { target: enemy, damage: 10 * store.get(gameStateAtom).waveNumber, element: "Fire", isCrit: false });
                }
            });
            break;

        case "plagueBomb":
            plagueBomb(k, target ?? k.vec2(0));
            playUISound(k, "poison bubbles", 0.5);

            k.get("enemy").forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * 3) {
                    if (enemy.invincible) return;
                    const poison = enemy.has("poison");
                    const ignoreLimit = true;
                    if (poison) {
                        enemy.addPoisonStack(10, ignoreLimit);
                    } else {
                        enemy.use(poisonEffect(k, 10, ignoreLimit));
                    }

                    hurtEnemy(k, {
                        target: enemy as EnemyGameObj,
                        damage: 10 * store.get(gameStateAtom).waveNumber,
                        element: "Poison",
                        isCrit: false,
                        applyStatusEffects: false
                    });
                }
            });
            break;

        case "darkHarvest":
            playUISound(k, "ghosts");
            for (const enemy of (k.get("enemy") as EnemyGameObj[])) {
                if (enemy.has("curse")) {
                    const MAX_DAMAGE = 80 + store.get(gameStateAtom).waveNumber * 20;

                    spawnDarkHarvestEffect(k, enemy);


                    waitScaled(k, 0.25, () => {
                        spawnDarkBurst(k, enemy.pos);

                        hurtEnemy(k, {
                            target: enemy,
                            damage: Math.round(Math.min((enemy.maxHP() || 100) * 0.8, MAX_DAMAGE)),
                            element: "Dark",
                            isCrit: false,
                        });

                        enemy.unuse("curse");
                    });
                }
            }
            break;

        case "blindingLight":
            blindingLight(k);

            playUISound(k, "flash", 2);

            (k.get("enemy") as EnemyGameObj[]).forEach(enemy => {
                if (enemy.invincible) return;

                ELEMENTS["Light"].applyEffect?.(k, { target: enemy, damage: 0, duration: 6 });
                if (!enemy.has("healthBar")) {
                    enemy.use(healthBar(k, 6));
                }

            });
            break;

        case "arcticBlast":
            spawnArcticBlast(k, target ?? k.vec2(0));
            playSfx(k, "ice magic", 2);
            k.get("enemy").forEach(enemy => {
                if (enemy.pos.dist(target ?? k.vec2(0, 0)) <= TILE_SIZE * 3) {
                    if (enemy.invincible) return;

                    const chill = enemy.has("chill");
                    if (chill) {
                        enemy.addChillStack(5);
                    } else {
                        enemy.use(chillEffect(k, 2, 5));
                    }

                    hurtEnemy(k, {
                        target: enemy as EnemyGameObj,
                        damage: 5 * store.get(gameStateAtom).waveNumber,
                        element: "Ice",
                        isCrit: false,
                        applyStatusEffects: false
                    });
                }
            });
            break;

        case "overcharge":
            if (tower) {
                const overchargeDuration = 4;
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

                const loop = k.loop(0.08, () => {
                    spawnElectricSpark(k, tower);
                });

                waitScaled(k, overchargeDuration, () => loop.cancel());
            }
            break;
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

async function plagueBomb(k: KAPLAYCtx, pos: Vec2) {
    for (let i = 0; i < 40; i++) {
        const offset = k.vec2(
            k.rand(-40, 40),
            k.rand(-40, 40),
        );

        const cloud = k.add([
            k.circle(k.rand(8, 16)),
            k.pos(pos.add(offset)),
            k.color(70, 180, 70),
            k.opacity(0.45),
            k.scale(1),
            k.anchor("center"),
            k.lifespan(0.5),
        ]);

        const startPos = cloud.pos.clone();

        k.tween(
            0,
            1,
            0.8,
            (t) => {
                cloud.scale = k.vec2(1 + t * 1.5);
                cloud.opacity = 0.45 * (1 - t);
                cloud.pos = startPos.add(
                    k.vec2(
                        k.rand(-5, 5) * t,
                        -15 * t,
                    )
                );
            },
            k.easings.linear,
        );
    }

    for (let i = 0; i < 10; i++) {
        k.wait(i * 0.05, () => {
            spawnPoisonBubble(k, pos);
        });
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

function spawnDarkHarvestEffect(k: KAPLAYCtx, enemy: EnemyGameObj) {
    for (let i = 0; i < 6; i++) {
        const angle = k.rand(0, 360);
        const distance = k.rand(20, 35);

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
            k.z(999),
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

function spawnDarkBurst(k: KAPLAYCtx, pos: Vec2) {
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
            k.z(999)
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
            const amounts = [10, 20, 30, 40, 50];
            copy.amount = amounts[Math.floor(Math.random() * amounts.length)];
            copy.description = `Gain ${copy.amount} gold`;
        }

        return copy;
    });

    while (result.size < Math.min(amount, spellPool.length)) {
        const index = Math.floor(Math.random() * spellPool.length);
        result.add(spellPool[index]);
    }
    return [...result];
}