import type { GameObj, KAPLAYCtx, KEventController, Vec2 } from "kaplay";
import type { AttackContext, AttackTarget, DamageResult, EnemyGameObj, HeroGameObj, RandomProjectiles, TargetResolver, TowerGameObj } from "../types";
import { CURSE_CRIT, PROJECTILES, SCYTHE_MAX_KILL_STACKS, TILE_SIZE, TIME_TOWER_BASE_ANIM_SPEED, TOWER_RANGE_TOLERANCE, type ProjectileId } from "../constants";
import makeProjectile from "../entities/Projectile";
import { enemyTargetResolver, rotateVector, shortestAngleDiff } from "./targetingHelpers";
import { buildLightningSegments, drawLightning, resolveChain } from "./lightningHelpers";
import calcDamage from "./calcDamage";
import hurtEnemy from "./hurtEnemy";
import makePathEntity from "../entities/PathEntity";
import { gameStateAtom, store } from "../store";
import drawLaser, { renderLaser } from "./drawLaser";
import isEnemyOnRay from "./isEnemyOnRay";
import enemiesInCone from "./enemiesInCone";
import getBuffValue from "./getBuffValue";
import { lifespan } from "../kaplayComponents/lifespan";
import { waitScaled } from "./timerFunctions";
import { playSfx } from "./soundHelpers";

export default function makeUnitCombat(
    k: KAPLAYCtx,
    opts: {
        owner: TowerGameObj | HeroGameObj;
        stats: {
            damage: number;
            range: number;
            fireInterval: number;
            critChance: number;
            critDamage: number;
        };
        projectile: ProjectileId | null;
        gunSprite: string;
        gunOffset: Vec2;
        shootOffset: Vec2;
        anchorOffset: Vec2;
        resolveTarget: TargetResolver;
    }
) {
    let shootTimer = 0;
    let meleeHandle: GameObj | null = null;
    let meleeHead: GameObj | null = null;
    let activeBeam: GameObj | null = null;

    const gun = k.add([
        k.sprite(opts.gunSprite, { anim: "idle" }),
        k.pos(opts.owner.width / 2 + opts.gunOffset.x,
            opts.owner.height / 2 + opts.gunOffset.y),
        k.anchor(opts.anchorOffset),
        k.rotate(),
        k.opacity(1),
        {
            shootOffset: opts.shootOffset,
            anchorOffset: opts.anchorOffset
        },
        k.state("idle", ["idle", "meleeSwing"])
    ]);

    gun.animSpeed = store.get(gameStateAtom).timeScale;

    if (opts.owner.melee?.meleeHandleSprite && opts.owner.melee?.meleeHeadSprite) {
        const handleLength = opts.owner.melee?.handleLength;

        meleeHandle = gun.add([
            k.sprite(opts.owner.melee?.meleeHandleSprite),
            k.color(255, 255, 255),
            k.scale(1),
            k.opacity(1),
            k.pos(0),
            {
                update() {
                    if (!meleeHandle) return;

                    meleeHandle.opacity = opts.owner.opacity;
                    if (!opts.owner.placed) meleeHandle.use(k.color(opts.owner.color.r, opts.owner.color.g, opts.owner.color.b));
                }
            },
            k.anchor("right")
        ]);

        meleeHead = meleeHandle.add([
            k.sprite(opts.owner.melee?.meleeHeadSprite),
            k.scale(1),
            k.opacity(1),
            k.color(255, 255, 255),
            k.pos(-handleLength, 0),
            {
                update() {
                    if (!meleeHead) return;

                    meleeHead.opacity = opts.owner.opacity;
                    if (!opts.owner.placed) meleeHead.use(k.color(opts.owner.color.r, opts.owner.color.g, opts.owner.color.b));
                }
            },
            k.anchor(k.vec2(1 - (opts.owner.melee?.headOffset ?? 0), 0))
        ]);

    }

    opts.owner.onStateEnter("disabled", () => {
        destroyBeam();
    });

    const rangeCircle = k.add([
        k.pos(),
        k.color(255, 255, 255),
        k.circle(opts.stats.range * TILE_SIZE),
        k.outline(1),
        k.opacity(0.2),
        k.z(1)
    ]);

    const previewRangeCircle = k.add([
        k.pos(),
        k.opacity(0.5),
        k.z(1),
        {
            draw() {
                const selectedUI = store.get(gameStateAtom).selectedUI;
                if (selectedUI && "previewRange" in selectedUI && selectedUI.towerId === opts.owner.instanceId) {
                    const radius = (selectedUI?.previewRange ?? 0) * TILE_SIZE;

                    const segments = 48;

                    for (let i = 0; i < segments; i += 2) {
                        const a1 = (i / segments) * Math.PI * 2;
                        const a2 = ((i + 1) / segments) * Math.PI * 2;

                        k.drawLine({
                            p1: k.vec2(
                                Math.cos(a1) * radius,
                                Math.sin(a1) * radius
                            ),
                            p2: k.vec2(
                                Math.cos(a2) * radius,
                                Math.sin(a2) * radius
                            ),
                            width: 2,
                            color: k.rgb(88, 255, 97)
                        });
                    }
                }
            }
        }
    ]);

    gun.onAnimEnd(anim => {
        if (anim === "shoot" && !opts.owner.activeProjectile) {
            gun.play("idle");
        }
    });

    if (opts.owner.battery) {
        const barWidth = opts.owner.width * 0.8;
        let barPos = opts.owner.pos.add(opts.owner.width * 0.2, 0);

        // background
        const chargeBackground = k.add([
            k.pos(barPos),
            k.rect(barWidth, 4),
            k.color(k.Color.fromHex("#707070")),
            k.outline(1, k.Color.fromHex("#000000")),
            k.opacity(0),
            {
                update() {
                    barPos = opts.owner.pos.add(opts.owner.width * 0.2, 0);
                    chargeBackground.pos = barPos;
                    if (opts.owner.placed) chargeBackground.opacity = 1;
                }
            },
            k.z(9999)
        ]);

        // charge bar
        const chargeBar = k.add([
            k.pos(barPos),
            k.rect(0, 4),
            k.color(k.Color.fromHex("#5ba6a6")),
            k.z(99999999),
            k.opacity(0),
            {
                update() {
                    const chargeRatio = opts.owner.battery ? opts.owner.battery.charge / opts.owner.battery.maxCharge : 0;
                    barPos = opts.owner.pos.add(opts.owner.width * 0.2, 0);
                    chargeBar.pos = barPos;
                    chargeBar.width = barWidth * chargeRatio;
                    if (opts.owner.placed) chargeBar.opacity = 1;
                }
            }
        ]);

        opts.owner.onDestroy(() => {
            k.destroy(chargeBackground);
            k.destroy(chargeBar);
        });
    }

    if (opts.owner.deathCharge) {

        const barWidth = opts.owner.width * 0.8;
        let barPos = opts.owner.pos.add(opts.owner.width * 0.09, 0);

        // background
        const soulBackground = k.add([
            k.pos(barPos),
            k.rect(barWidth, 4),
            k.color(k.Color.fromHex("#3a2a4a")),
            k.outline(1, k.Color.fromHex("#000000")),
            k.opacity(0),
            k.z(9999),
            {
                update() {
                    barPos = opts.owner.pos.add(
                        opts.owner.width * 0.09,
                        0
                    );

                    soulBackground.pos = barPos;

                    if (opts.owner.placed) {
                        soulBackground.opacity = 1;
                    }
                }
            }
        ]);

        // fill bar
        const soulBar = k.add([
            k.pos(barPos),
            k.rect(0, 4),
            k.color(k.Color.fromHex("#9b6dff")),
            k.opacity(0),
            k.z(10000),
            {
                update() {

                    if (!opts.owner.deathCharge) return;

                    const ratio =
                        opts.owner.deathCharge.current /
                        opts.owner.deathCharge.required;

                    barPos = opts.owner.pos.add(
                        opts.owner.width * 0.09,
                        0
                    );

                    soulBar.pos = barPos;

                    soulBar.width = barWidth * ratio;

                    if (opts.owner.placed) {
                        soulBar.opacity = 1;
                    }
                }
            }
        ]);

        opts.owner.onDestroy(() => {
            k.destroy(soulBackground);
            k.destroy(soulBar);
        });
    }

    if (opts.owner.overheat) {

        const barWidth = opts.owner.width * 0.8;
        let barPos = opts.owner.pos.add(opts.owner.width * 0.1, -8);

        // background
        const heatBackground = k.add([
            k.pos(barPos),
            k.rect(barWidth, 4),
            k.color(k.Color.fromHex("#3b1f1f")),
            k.outline(1, k.Color.fromHex("#000000")),
            k.opacity(0),
            k.z(9999),
            {
                update() {
                    barPos = opts.owner.pos.add(
                        opts.owner.width * 0.1,
                        -8
                    );

                    heatBackground.pos = barPos;

                    if (opts.owner.placed) {
                        heatBackground.opacity = 1;
                    }
                }
            }
        ]);

        // fill
        const heatBar = k.add([
            k.pos(barPos),
            k.rect(0, 4),
            k.color(k.Color.fromHex("#ff5a36")),
            k.opacity(0),
            k.z(10000),
            {
                update() {

                    if (!opts.owner.overheat) return;

                    const ratio =
                        opts.owner.overheat.current /
                        opts.owner.overheat.max;

                    barPos = opts.owner.pos.add(
                        opts.owner.width * 0.1,
                        -8
                    );

                    heatBar.pos = barPos;

                    heatBar.width = k.lerp(
                        heatBar.width,
                        barWidth * ratio,
                        12 * k.dt()
                    );

                    if (opts.owner.placed) {
                        heatBar.opacity = 1;
                    }

                    // optional overheating color
                    if (opts.owner.overheat.overheated) {
                        const flash =
                            Math.sin(k.time() * 20) * 0.5 + 0.5;

                        heatBar.color = k.rgb(
                            255,
                            80 + flash * 100,
                            40
                        );
                        
                        if (gun.getCurAnim()?.name !== "overheated") gun.play("overheated");
                    } else if (ratio > 0.9) {
                        heatBar.color = k.rgb(248, 63, 39);
                        if (gun.getCurAnim()?.name !== "overheating") gun.play("overheating")
                    } else if (ratio > 0.6) {
                        heatBar.color = k.Color.fromHex("#ff5a36");
                        gun.play("heating");
                    } else if (ratio > 0.25) {
                        heatBar.color = k.rgb(255, 140, 60);
                        gun.play("idle");
                    } else {
                        gun.play("idle");
                        heatBar.color = k.rgb(255, 220, 120);
                    }
                }
            }
        ]);

        const thresholdMarker = k.add([
            k.pos(barPos),
            k.z(10001),
            {
                update() {
                    if (!opts.owner.overheat) return;

                    barPos = opts.owner.pos.add(
                        opts.owner.width * 0.1,
                        -8
                    );

                    thresholdMarker.pos = barPos;
                },

                draw() {
                    if (!opts.owner.overheat || !opts.owner.placed) return;

                    const thresholdX =
                        barWidth *
                        (
                            opts.owner.overheat.recoveryThreshold /
                            opts.owner.overheat.max
                        );

                    k.drawLine({
                        p1: k.vec2(thresholdX, 0),
                        p2: k.vec2(thresholdX, 4),
                        width: 2,
                        color: k.rgb(255, 255, 255),
                    });
                }
            }
        ]);

        opts.owner.onDestroy(() => {
            k.destroy(heatBackground);
            k.destroy(heatBar);
        });
    }

    let offDeath: KEventController | undefined;

    if (opts.owner.deathCharge) {
        offDeath = k.on("enemyDeath", "ghost", (tower, data) => {
            if (!tower.placed) return;

            const center = tower.pos.add(
                (tower.footprint.w * TILE_SIZE) / 2,
                (tower.footprint.h * TILE_SIZE) / 2
            );
            const payload = (data[0] ?? data) as { enemy: EnemyGameObj; pos: Vec2; soulClaimed: boolean; };

            const enemy = payload?.enemy;
            const pos = payload?.pos;

            if (
                !payload.soulClaimed &&
                center.dist(pos) <=
                tower.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE
            ) {
                payload.soulClaimed = true;

                const soul = k.add([
                    k.sprite("soul"),
                    k.anchor("center"),
                    k.pos(pos),
                    k.scale(enemy.boss ? 4 : enemy.hasLargeSoul ? 2 : 1),
                    lifespan(k, 10),
                    {
                        target: center,
                        speed: 150,

                        update() {
                            if (!tower.exists()) k.destroy(soul);

                            const prevDist = soul.pos.dist(soul.target);

                            const dir = soul.target.sub(soul.pos).unit();

                            soul.pos = soul.pos.add(
                                dir.scale(
                                    soul.speed *
                                    k.dt() *
                                    store.get(gameStateAtom).timeScale
                                )
                            );

                            const newDist = soul.pos.dist(soul.target);

                            if (newDist < 6 || newDist > prevDist) {
                                tower.deathCharge.current += enemy.boss ? 10 : enemy.damage > 1 ? 3 : 1;

                                tower.deathCharge.current = Math.min(
                                    tower.deathCharge.current,
                                    tower.deathCharge.required
                                );
                                k.destroy(soul);
                            }
                        }
                    }
                ]);
            }
        });
        opts.owner.onDestroy(() => {
            offDeath?.cancel();
        });
    }

    gun.onUpdate(() => {
        gun.pos = opts.owner.pos.add(
            opts.owner.width / 2 + opts.gunOffset.x,
            opts.owner.height / 2 + opts.gunOffset.y
        );
        gun.opacity = opts.owner.opacity;
        if (!opts.owner.placed) gun.use(k.color(opts.owner.color.r, opts.owner.color.g, opts.owner.color.b));
        rangeCircle.pos = opts.owner.pos.add((opts.owner.footprint.w * TILE_SIZE) / 2, (opts.owner.footprint.h * TILE_SIZE) / 2);
        rangeCircle.use(k.circle(opts.stats.range * TILE_SIZE));
        rangeCircle.hidden = !opts.owner.selected && !opts.owner.hovered;

        if (opts.owner.activeProjectile === null) gun.play("idle");

        const selectedUI = store.get(gameStateAtom).selectedUI;

        const isSelectedTower =
            selectedUI &&
            "towerId" in selectedUI &&
            selectedUI.towerId === opts.owner.instanceId;

        if (
            isSelectedTower &&
            "previewRange" in selectedUI
        ) {
            previewRangeCircle.hidden = false;

            previewRangeCircle.pos = rangeCircle.pos;
        } else {
            previewRangeCircle.hidden = true;
        }
    });

    function shoot(target: AttackTarget) {
        if (opts.owner.shootSound) playSfx(k, opts.owner.shootSound, 0.7);
        
        if (target.type === "enemy") {
            let enemy = target.enemy;
            let projectile = {
                id: opts.projectile ?? "basic",
                angle: gun.angle,
                target: enemy,
                homing: true,
                bonusDamage: 0,
                bonusCrit: 0
            };

            let element = opts.owner.element;
            let volley = false;

            if (opts.owner.randomProjectiles) {
                const projectiles: RandomProjectiles = opts.owner.randomProjectiles;
                const roll = k.randi(projectiles.length);
                const randomProjectile = projectiles[roll];
                projectile = {
                    ...projectile,
                    ...(randomProjectile.behaviors ? { behaviors: randomProjectile.behaviors } : {}),
                    bonusCrit: randomProjectile.behaviors?.critChance || 0,
                    id: randomProjectile.projectile
                };
                element = randomProjectile.element;
                volley = randomProjectile.volley ?? false;

                if (projectile.id === "shadowBlob") {
                    const maxHp = enemy?.maxHP() ?? 1;
                    const hp = enemy.hp() ?? 0;
                    const missingHealthPercent = 1 - hp / maxHp;

                    projectile.bonusDamage = opts.stats.damage * missingHealthPercent;
                }
            }

            const killBonus =
                opts.owner?.killStacks <= SCYTHE_MAX_KILL_STACKS
                    ? opts.owner.killStacks
                    : 0;

            if (opts.owner.charge) {
                opts.owner.charge.currentCharge = Math.min(
                    opts.owner.charge.currentCharge + opts.owner.charge.chargePerShot,
                    opts.owner.charge.maxCharge
                );
            }

            const ctx: AttackContext = {
                context: k,
                attacker: opts.owner,
                target,
                origin: gun.pos,
                gun: gun,
                damage: opts.stats.damage + (
                    opts.owner.timeData?.timeScaling?.damage ?
                        opts.owner.timeData.timeMultiplier ** opts.owner.timeData.timeScaling.damagePow - 1 : 0
                ) + killBonus,
                element,
                visualEffect: null,
                ...(meleeHead && meleeHandle ? {
                    meleeAttack: {
                        meleeHead,
                        meleeHandle,
                        swingAngle: opts.owner.melee.swingAngle,
                        startAngle: opts.owner.melee.startAngle
                    }
                } : {}),
                attackType: "projectile",
                ...(volley ? { volley: { volleyChance: 100 } } : {}),
                projectiles: opts.projectile ? [projectile] : []
            };

            opts.owner.effects?.forEach(e => e.firstEffect?.(ctx));

            if (ctx.attacker.battery && ctx.lightning) {
                ctx.lightning.maxChains = Math.floor(ctx.attacker.battery.charge / 20) + 1;
                ctx.lightning.range = Math.min(Math.floor(ctx.attacker.battery.charge / 20) + 1, 5);
                ctx.damage += ctx.attacker.battery.charge * 0.42;
            }
            const damageMult = 1 + getBuffValue(opts.owner as TowerGameObj, "damage");

            // laser ramp up charge damage
            let bonusDamage = 0;

            if (
                ctx.attackType === "ramp_laser" &&
                opts.owner.overheat
            ) {
                const heat = opts.owner.overheat;

                // const t = heat.current / heat.max;

                bonusDamage = heat.current * 0.3;
            }

            const { isCrit, damage } = calcDamage({
                bonusDamage,
                bonusCritChance: enemy.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
                critChance: opts.stats.critChance + (getBuffValue(opts.owner as TowerGameObj, "critChance") * 100),
                critDamage: opts.stats.critDamage * (1 + getBuffValue(opts.owner as TowerGameObj, "critDamage")),
                damage: ctx.damage,
                damageMultiplier: damageMult
            });

            const rotatedOffset = rotateVector(
                k,
                k.vec2(opts.shootOffset.x, opts.shootOffset.y),
                gun.angle * Math.PI / 180
            );

            ctx.origin = ctx.origin.add(rotatedOffset);

            executeAttack(k, ctx, { damage, isCrit });

            if (ctx.attacker.battery && ctx.lightning) {
                ctx.attacker.battery.charge = 0;
            }

            if (!ctx.projectiles) return;

            if (ctx.volley?.volleyChance && Math.random() < ctx.volley.volleyChance) {
                const base = ctx.projectiles[0];

                const volleyCount = ctx.volley.volleyCount ?? 3;
                const homingDelay = ctx.volley.homingDelay ?? 0.2;
                const volleyAngle = ctx.volley.volleyAngle ?? 45;
                const projectiles = [];

                for (let i = 0; i < volleyCount; i++) {
                    const offset = i - (volleyCount - 1) / 2;
                    const angleMult = volleyAngle * offset;

                    projectiles.push(
                        { ...base, angle: base.angle + angleMult, homingDelay, turnSpeed: 12 }
                    );
                }

                ctx.projectiles = [
                    ...projectiles
                ];
            }

            opts.owner.effects?.forEach(e => e.secondEffect?.(ctx));

            for (const p of ctx.projectiles) {
                const bonusDamage = p?.bonusDamage ?? 0;
                let bonusCrit = p?.bonusCrit ?? 0;
                const spread = opts.owner?.spread ?? 0;
                const finalAngle = p.angle + k.rand(-spread, spread);
                const dir = k.Vec2.fromAngle(finalAngle + 180);
                const right = k.vec2(-dir.y, dir.x);
                const spawnOffset = right.scale(k.rand(-5, 5));
                const homingDelay = p.homingDelay || (spread && 0.1) || 0;

                if (enemy.has("curse")) bonusCrit += 10;

                const { isCrit, damage } = calcDamage({
                    bonusDamage,
                    bonusCritChance: bonusCrit,
                    critChance: opts.stats.critChance + (getBuffValue(opts.owner as TowerGameObj, "critChance") * 100),
                    critDamage: opts.stats.critDamage * (1 + getBuffValue(opts.owner as TowerGameObj, "critDamage")),
                    damage: ctx.damage,
                    damageMultiplier: damageMult
                });

                if (isCrit && (opts.owner.fireIntervalBoost ?? 1) < 1) {
                    opts.owner.fireIntervalBoostTimer = 1;
                }

                const projectile = makeProjectile(k, {
                    id: p.id,
                    pos: ctx.origin.add(spawnOffset),
                    target: enemy,
                    damage: damage,
                    crit: isCrit,
                    angle: (PROJECTILES[p.id] as { noRotate: boolean }).noRotate && !spread ? 0 : finalAngle,
                    element: p?.element ?? ctx.element,
                    homing: p.homing,
                    homingDelay,
                    turnSpeed: p.turnSpeed,
                    behaviors: p?.behaviors,
                    splashRadius: PROJECTILES[p.id].splashRadius * (opts.owner.timeData?.timeScaling?.damage ? opts.owner.timeData.timeMultiplier : 1),
                    scale: (opts.owner.timeData?.timeScaling?.damage ? opts.owner.timeData.timeMultiplier : 1)
                });

                if (p.behaviors?.persistent) {
                    ctx.attacker.activeProjectile ??= projectile;
                }

                if (!ctx.attacker.priority) {
                    const resolveTarget = enemyTargetResolver(k, opts.owner);
                    enemy = (resolveTarget() as { type: "enemy", enemy: EnemyGameObj }).enemy;
                }
            }

        } else if (target.type === "point") {
            const ctx: AttackContext = {
                context: k,
                attacker: opts.owner,
                target,
                origin: gun.pos,
                gun: gun,
                damage: opts.stats.damage,
                element: opts.owner.element,
                visualEffect: null,
                attackType: "projectile",
                projectiles: []
            };

            opts.owner.effects?.forEach(e => e.firstEffect?.(ctx));
            opts.owner.effects?.forEach(e => e.secondEffect?.(ctx));
            const damageMult = 1 + getBuffValue(opts.owner as TowerGameObj, "damage");

            if (!ctx.isSummon) {
                makePathEntity(k, {
                    ownerId: opts.owner.instanceId,
                    from: opts.owner.pos.add((opts.owner.footprint.w * TILE_SIZE) / 2, (opts.owner.footprint.h * TILE_SIZE) / 2),
                    targetPos: target.pos,
                    damage: opts.stats.damage,
                    damageMultiplier: damageMult,
                    critChance: opts.stats.critChance + (getBuffValue(opts.owner as TowerGameObj, "critChance") * 100),
                    critDamage: opts.stats.critDamage * (1 + getBuffValue(opts.owner as TowerGameObj, "critDamage")),
                    element: opts.owner.element,
                    projectileId: opts.projectile ?? "basic"
                });
            }
        }
    }

    function update() {
        const dt = k.dt() * store.get(gameStateAtom).timeScale;
        const fireRateBuff = getBuffValue(opts.owner as TowerGameObj, "fireRate");
        const interval =
            opts.owner.stats.fireInterval *
            (opts.owner.timeData?.timeMultiplier ?? 1)
            * (1 - (opts.owner.charge?.currentCharge ?? 0))
            * (opts.owner.fireIntervalBoostTimer > 0 ? opts.owner.fireIntervalBoost ?? 1 : 1)
            * (1 - fireRateBuff);

        if (shootTimer > interval) shootTimer = interval;

        const anim = gun.getCurAnim();

        if (opts.owner.timeData && anim) {
            anim.speed =
                TIME_TOWER_BASE_ANIM_SPEED /
                (opts.owner.timeData.timeMultiplier ?? 1);
        }

        if (shootTimer > 0) {
            shootTimer -= dt;
        }

        if (!store.get(gameStateAtom).waveActive) {
            gun.angle = 0;
            return;
        }

        const target = opts.resolveTarget();

        if (target && opts.owner.canRotate) {
            const desired = gun.pos.angle(target.type === "enemy" ? target.enemy.pos : target.pos);
            const turnSpeed = 12;

            const diff = shortestAngleDiff(gun.angle, desired);
            gun.angle += diff * Math.min(1, turnSpeed * dt);

        } else gun.angle = 0;

        if (target && opts.owner.continuousEffect && target.type === "enemy") {
            const rotatedOffset = rotateVector(
                k,
                k.vec2(opts.shootOffset.x, opts.shootOffset.y),
                gun.angle * Math.PI / 180
            );

            const origin = gun.pos.add(rotatedOffset);
            spawnFlameParticles(k, origin, target.enemy, opts.stats.range * TILE_SIZE - origin.dist(rangeCircle.pos), opts.owner.continuousEffect);
        }

        // regular shooting
        while (
            shootTimer <= 0 &&
            target &&
            !opts.owner.activeProjectile &&
            !opts.owner.deathCharge &&
            !opts.owner.overheat
        ) {
            shootTimer += interval;

            if (opts.owner.canRotate) gun.angle = gun.pos.angle(target.type === "point" ? target.pos : target.enemy.pos);

            if (
                target.type === "point" &&
                k.get("pathEntity").filter(e => e.ownerId === opts.owner.instanceId).length >= (opts.owner.pathEntityLimit ?? 1)
            ) break;

            shoot(target);
            opts.owner.lastShotTime = 0;

            if (gun.getAnim("shoot")) gun.play("shoot");
        }


        // death charge shooting
        if (
            opts.owner.deathCharge &&
            opts.owner.deathCharge.current >= opts.owner.deathCharge.required &&
            target
        ) {
            opts.owner.deathCharge.current = 0;
            shoot(target);
            gun.play("shoot");
        }

        // beam weapon ramp up
        const wantsToFire = !!target;

        if (opts.owner.overheat) {
            const heat = opts.owner.overheat;

            if (
                target &&
                !opts.owner.deathCharge &&
                heat &&
                !heat.overheated
            ) {

                createBeam();

                while (shootTimer <= 0) {
                    shootTimer += interval;

                    shoot(target);
                }

                if (activeBeam && target.type === "enemy") {
                    const rotatedOffset = rotateVector(
                        k,
                        k.vec2(opts.shootOffset.x, opts.shootOffset.y),
                        gun.angle * Math.PI / 180
                    );

                    activeBeam.start = gun.pos.add(rotatedOffset);
                    activeBeam.end = target.enemy.pos;

                    const heat = opts.owner.overheat;

                    const t = heat
                        ? heat.current / heat.max
                        : 0;

                    activeBeam.width =
                        8 + Math.pow(t, 0.8) * 150;
                }
            } else {
                destroyBeam();
            }

            if (wantsToFire && !heat.overheated) {
                heat.current += heat.gainPerSecond * dt;
            } else {
                heat.current -= heat.decayPerSecond * dt;
            }

            heat.current = k.clamp(
                heat.current,
                0,
                heat.max
            );

            if (heat.current >= heat.max) {
                heat.overheated = true;
            }

            if (
                heat.overheated &&
                heat.current <= heat.recoveryThreshold
            ) {
                heat.overheated = false;
            }
        }
    }

    gun.onStateEnter("meleeSwing", ({
        dir,
        distance,
        swingTime,
        swingAngle,
        startAngle,
        handleLength
    }: {
        dir: Vec2;
        distance: number;
        swingTime: number;
        handleLength: number;
        swingAngle: number;
        startAngle: number;
    }) => {
        if (!meleeHandle || !meleeHead) return;

        gun.angle = dir.angle() + 180;
        gun.angle -= startAngle;

        const scaleX = distance / handleLength;

        meleeHandle.scale.x = scaleX;
        meleeHead.scale.x = 1 / scaleX;

        k.tween(
            gun.angle,
            gun.angle + swingAngle,
            swingTime,
            (a) => gun.angle = a,
            k.easings.easeOutBack
        );
    });

    return {
        gun,
        meleeHandle,
        meleeHead,
        rangeCircle,
        update,
        destroy() {
            opts.owner.activeProjectile && k.destroy(opts.owner.activeProjectile);
            k.destroy(gun)
            k.destroy(rangeCircle)
        },
    };

    function createBeam() {
        if (activeBeam) return;

        activeBeam = k.add([
            k.pos(0, 0),
            k.z(99999),
            {
                start: k.vec2(0),
                end: k.vec2(0),
                width: 12,

                draw() {
                    renderLaser(
                        k,
                        activeBeam?.start,
                        activeBeam?.end,
                        activeBeam?.width
                    );
                }
            }
        ]);
    }

    function destroyBeam() {
        if (!activeBeam) return;

        k.destroy(activeBeam);
        activeBeam = null;
    }
}

function aoeAttack(k: KAPLAYCtx, ctx: AttackContext, dmg: DamageResult) {
    const { isCrit, damage } = dmg;
    const visualEffect = ctx.visualEffect;

    if (visualEffect) visualEffect(k, ctx.origin, ctx.attacker.stats.range * TILE_SIZE);

    (k.get("enemy") as EnemyGameObj[]).forEach(e => {
        if (e.pos.dist(ctx.origin) > ctx.attacker.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) return;

        hurtEnemy(k, {
            target: e,
            damage,
            isCrit,
            element: ctx.element
        });
    });
}

export function frostAoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number) {
    aoeBurst(k, pos, radius, "frost particle");
}

export function flameAoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number) {
    aoeBurst(k, pos, radius, "flame particle");
}

export function electricAoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number) {
    aoeBurst(k, pos, radius, "electric particle");
}

export function aoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number, particle: string, duration: number = 0.5) {
    const baseCount = 8;
    const count = Math.min(
        baseCount + Math.floor(radius * 0.4),
        100
    );

    for (let i = 0; i < count; i++) {
        const angle = k.rand(0, Math.PI * 2);
        const dist = k.rand(TILE_SIZE, radius);

        const offset = k.vec2(
            Math.cos(angle),
            Math.sin(angle)
        ).scale(dist);

        const life = k.rand(duration / 2, duration);
        const startScale = k.rand(1, 2);

        const p = k.add([
            k.pos(pos.add(offset)),
            k.sprite(particle),
            k.anchor("center"),
            k.opacity(0.8),
            k.scale(startScale),
            lifespan(k, life),
            {
                time: 0,

                update() {
                    p.time += k.dt() * store.get(gameStateAtom).timeScale;
                    const t = p.time / life;

                    p.opacity = 0.8 * (1 - t);

                    p.scale = k.vec2(startScale * (1 - t));

                    p.pos.y -= 6 * k.dt() * store.get(gameStateAtom).timeScale;
                },
            },
        ]);
    }
}

function executeAttack(k: KAPLAYCtx, ctx: AttackContext, dmg: DamageResult) {
    switch (ctx.attackType) {
        case "sniper_laser":
            sniperLaserAttack(k, ctx, dmg);
            break;

        case "piercing_laser":
            piercingLaserAttack(k, ctx, dmg);
            break;

        case "thunder":
            thunderAttack(k, ctx, dmg);
            break;

        case "blizzard":
            blizzardAttack(k, ctx, dmg);
            break;

        case "lightning":
            lightningAttack(k, ctx, dmg);
            break;

        case "aoe":
            aoeAttack(k, ctx, dmg);
            break;

        case "melee":
            meleeAttack(k, ctx, dmg);
            break;

        case "cone":
            coneAttack(k, ctx, dmg);
            break;

        case "ramp_laser":
            rampLaserAttack(k, ctx, dmg);
            break;
    }
}

function lightningAttack(k: KAPLAYCtx, ctx: AttackContext, dmg: DamageResult) {
    if (!ctx.target || ctx.target.type !== "enemy") return;
    const { damage, isCrit } = dmg;

    const maxChains = ctx.lightning?.maxChains ?? 3;
    const range = (ctx.lightning?.range ?? 5) * TILE_SIZE;

    const targets = resolveChain(k, {
        target: ctx.target.enemy,
        maxChains,
        range
    });

    const attacker = ctx.attacker;

    // if battery distribute damage
    const efficiency = !attacker.battery ? 1 : 1 + ((maxChains / targets.length) - 1);

    const finalDamage =
        Math.round(
            damage *
            efficiency *
            (ctx.lightning?.damageMult ?? 1)
        );

    targets.forEach(enemy => {
        hurtEnemy(k, {
            target: enemy,
            damage: finalDamage,
            isCrit,
            element: "Electric",
        });
    });

    const chargeRatio = attacker.battery ? attacker.battery.charge / attacker.battery.maxCharge : 0;

    const lightning = k.add([
        k.pos(0, 0),
        lifespan(k, 0.2),
        k.opacity(1),
        {
            segments: [] as Vec2[][],
            update() {
                lightning.segments = buildLightningSegments(k, [ctx.origin, ...targets.map(t => t.pos)]);
            },
            draw() {
                lightning.segments.forEach(points => drawLightning(k, points, !attacker.battery ? 2 : 1 + chargeRatio * 6));
            }
        }
    ]);
}

function meleeAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    opts: {
        damage: number;
        isCrit: boolean;
    }
) {
    if (!ctx.meleeAttack || ctx.target?.type !== "enemy") return;

    const { damage, isCrit } = opts;
    const { meleeAttack, element, origin, target, gun } = ctx;
    const { meleeHead, meleeHandle, swingAngle, startAngle } = ctx.meleeAttack;
    const { handleLength } = ctx.attacker.melee;

    if (!target) return;

    const { splashRadius, swingTime, onImpact } = meleeAttack;

    const dir = target.enemy.pos.sub(origin);
    const dist = dir.len();

    gun.enterState("meleeSwing", {
        dir,
        distance: dist - handleLength,
        swingTime: swingTime ?? 0.15,
        swingAngle,
        startAngle,
        handleLength
    });

    waitScaled(k, swingTime ?? 0.15, () => {
        if (splashRadius) {
            (k.get("enemy") as EnemyGameObj[]).forEach(e => {
                if (e.pos.dist(target.enemy.pos) < splashRadius * TILE_SIZE) hurtEnemy(k, {
                    target: e,
                    damage,
                    isCrit,
                    element,
                    attacker: ctx.attacker as TowerGameObj
                });
            });
        } else {
            hurtEnemy(k, { target: target.enemy, damage, isCrit, element, attacker: ctx.attacker as TowerGameObj });
        }
        if (meleeHandle && meleeHead) {
            meleeHandle.scale.x = 1;
            meleeHead.scale.x = 1;
        }
        gun.enterState("idle");
        if (onImpact) onImpact(k, target.enemy.pos);
    });
}

function sniperLaserAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target || ctx.target.type !== "enemy") return;

    const { damage, isCrit } = dmg;

    drawLaser(k, ctx.origin, ctx.target.enemy.pos, 24, 0.04);
    hurtEnemy(k, { target: ctx.target.enemy, damage, isCrit, element: ctx.element });
}

function piercingLaserAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target || ctx.target.type !== "enemy") return;

    const { damage, isCrit } = dmg;
    const dir = ctx.target.enemy.pos.sub(ctx.origin).unit();
    const range = ctx.origin.dist(ctx.target.enemy.pos);

    drawLaser(k, ctx.origin, ctx.target.enemy.pos, 106, 0.24);

    (k.get("enemy") as EnemyGameObj[]).forEach(e => {
        if (isEnemyOnRay(e, ctx.origin, dir, range, 10)) {
            hurtEnemy(k, { target: e, damage, isCrit, element: ctx.element });
        }
    });
}

function thunderAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target || ctx.target.type !== "enemy") return;

    const { damage, isCrit } = dmg;

    const stormCloud = k.add([
        k.sprite("thunder effect", { anim: "thunder" }),
        k.pos(ctx.target.enemy.pos),
        k.z(9999),
        k.anchor(k.vec2(0))
    ]);

    stormCloud.onAnimEnd(() => {
        k.destroy(stormCloud);
    });
    (k.get("enemy") as EnemyGameObj[]).forEach(e => {
        if (e.pos.dist(stormCloud.pos) < 1.2 * TILE_SIZE) {
            hurtEnemy(k, { target: e, damage, isCrit, element: ctx.element });
        }
    });
}

function blizzardAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target || ctx.target.type !== "enemy") return;

    const { damage, isCrit } = dmg;
    const enemy = ctx.target.enemy;

    for (let i = 0; i < 140; i++) {
        k.add([
            k.pos(enemy.pos.add(k.rand(-40, 40), k.rand(-60, 60))),
            k.sprite("snow"),
            k.move(
                k.vec2(k.rand(-80, -40), -10),
                k.rand(20, 80)
            ),
            lifespan(k, 0.6),
            k.z(9999),
            k.opacity(k.rand(0.5, 1)),
            k.scale(k.rand(0.5, 1.2)),
        ]);
    }

    (k.get("enemy") as EnemyGameObj[]).forEach(e => {
        if (e.pos.dist(enemy.pos ?? k.vec2(0)) < 2.5 * TILE_SIZE) {
            hurtEnemy(k, { target: e, damage, isCrit, element: ctx.element });
        }
    });
}

function coneAttack(k: KAPLAYCtx, ctx: AttackContext, dmg: DamageResult) {
    const { gun, element } = ctx;
    const { damage, isCrit } = dmg;
    const range = ctx.attacker.stats.range;

    const forward = k.vec2(
        Math.cos((gun.angle + 180) * Math.PI / 180),
        Math.sin((gun.angle + 180) * Math.PI / 180)
    );

    const enemies = enemiesInCone(
        k,
        ctx.origin,
        forward,
        range * TILE_SIZE - ctx.origin.dist(ctx.attacker.pos.add((ctx.attacker.footprint.w * TILE_SIZE) / 2)),
        20
    );

    enemies.forEach(e => {
        hurtEnemy(k, {
            target: e,
            damage,
            isCrit,
            element: element
        });
    });
}

function spawnFlameParticles(
    k: KAPLAYCtx,
    origin: Vec2,
    target: EnemyGameObj,
    range: number,
    sprite: string
) {

    const forward = target.pos.sub(origin).unit();

    const coneAngle = 20;
    const half = coneAngle / 2;

    const dist = range;
    const t = Math.min(dist / range, 1);

    const minParticles = 4;
    const maxParticles = 20;

    const particleCount = Math.floor(
        minParticles + (maxParticles - minParticles) * t
    );

    for (let i = 0; i < particleCount; i++) {

        const angleOffset = k.rand(-half, half) * Math.PI / 180;

        const dir = rotateVector(k, forward, angleOffset);

        const life = k.rand(
            0.25,
            0.4
        );

        const speed = (dist / life);

        const vel = dir.scale(speed);

        const flame = k.add([
            k.sprite(sprite),
            k.pos(origin),
            k.anchor("center"),
            k.opacity(1),
            k.scale(k.rand(0.8, 1.4)),
            lifespan(k, life),
            {
                vel,
                time: 0,
                update() {
                    flame.time += k.dt() * store.get(gameStateAtom).timeScale;

                    flame.pos = flame.pos.add(flame.vel.scale(k.dt() * store.get(gameStateAtom).timeScale));

                    const p = flame.time / life;

                    flame.opacity = 1 - p / 3;
                    flame.scale = k.vec2(1.4 * (1 - p / 2));

                    flame.pos.y -= 12 * k.dt() * store.get(gameStateAtom).timeScale;
                }
            }
        ]);
    }
}

function rampLaserAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target || ctx.target.type !== "enemy") return;

    const { damage, isCrit } = dmg;

    hurtEnemy(k, { target: ctx.target.enemy, damage, isCrit, element: ctx.element });
}