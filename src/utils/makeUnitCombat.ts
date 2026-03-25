import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, AttackTarget, DamageResult, ElementName, EnemyGameObj, HeroGameObj, RandomProjectiles, TargetResolver, TowerGameObj } from "../types";
import { CURSE_CRIT, PROJECTILES, SCYTHE_MAX_KILL_STACKS, TILE_SIZE, TIME_TOWER_BASE_ANIM_SPEED, TOWER_RANGE_TOLERANCE, type ProjectileId } from "../constants";
import makeProjectile from "../entities/Projectile";
import { enemyTargetResolver, rotateVector, shortestAngleDiff } from "./targetingHelpers";
import { buildLightningSegments, drawLightning, resolveChain } from "./lightningHelpers";
import calcDamage from "./calcDamage";
import hurtEnemy from "./hurtEnemy";
import makePathEntity from "../entities/PathEntity";
import { gameStateAtom, store } from "../store";
import drawLaser from "./drawLaser";
import isEnemyOnRay from "./isEnemyOnRay";
import enemiesInCone from "./enemiesInCone";

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

    const rangeCircle = k.add([
        k.pos(),
        k.circle(opts.stats.range * TILE_SIZE),
        k.opacity(0.2)
    ]);

    gun.onAnimEnd(anim => {
        if (anim === "shoot" && !opts.owner.activeProjectile) {
            gun.play("idle");
        }
    });

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
    });

    function shoot(target: AttackTarget) {

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
                target: enemy,
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

            const { isCrit, damage } = calcDamage({
                bonusDamage: 0,
                bonusCritChance: enemy.has("curse") ? CURSE_CRIT : 0,
                critChance: opts.stats.critChance,
                critDamage: opts.stats.critDamage,
                damage: ctx.damage
            });

            const rotatedOffset = rotateVector(
                k,
                k.vec2(opts.shootOffset.x, opts.shootOffset.y),
                gun.angle * Math.PI / 180
            );

            ctx.origin = ctx.origin.add(rotatedOffset);

            executeAttack(k, ctx, { damage, isCrit });

            if (!ctx.projectiles) return;

            if (ctx.volley?.volleyChance && Math.random() < ctx.volley.volleyChance) {
                const base = ctx.projectiles[0];

                const volleyCount = ctx.volley.volleyCount ?? 3;
                const homingDelay = ctx.volley.homingDelay ?? 0.2;
                const projectiles = [];
                const mid = Math.floor(volleyCount / 2);

                for (let i = 0; i < volleyCount; i++) {
                    const angleMult = 45 * (i - mid);

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

                if (enemy.has("curse")) bonusCrit += 10;

                const { isCrit, damage } = calcDamage({
                    bonusDamage,
                    bonusCritChance: bonusCrit,
                    critChance: opts.stats.critChance,
                    critDamage: opts.stats.critDamage,
                    damage: ctx.damage
                });

                if (isCrit && (opts.owner.fireIntervalBoost ?? 1) < 1) {
                    opts.owner.fireIntervalBoostTimer = 1;
                }

                const projectile = makeProjectile(k, {
                    id: p.id,
                    pos: ctx.origin,
                    target: enemy,
                    damage: damage,
                    crit: isCrit,
                    angle: p.angle,
                    element: p?.element ?? ctx.element,
                    homing: p.homing,
                    homingDelay: p.homingDelay,
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
                    enemy = (resolveTarget() as { type: "enemy", enemy: EnemyGameObj}).enemy;
                }
            }

        } else if (target.type === "point") {

            makePathEntity(k, {
                ownerId: opts.owner.instanceId,
                from: opts.owner.pos.add((opts.owner.footprint.w * TILE_SIZE) / 2, (opts.owner.footprint.h * TILE_SIZE) / 2),
                targetPos: target.pos,
                damage: opts.stats.damage,
                critChance: opts.stats.critChance,
                critDamage: opts.stats.critDamage,
                element: opts.owner.element,
                projectileId: opts.projectile ?? "basic"
            });
        }

    }

    function update() {
        const interval =
            opts.owner.stats.fireInterval *
            (opts.owner.timeData?.timeMultiplier ?? 1)
            * (1 - (opts.owner.charge?.currentCharge ?? 0))
            * (opts.owner.fireIntervalBoostTimer > 0 ? opts.owner.fireIntervalBoost ?? 1 : 1);

        if (shootTimer > interval) shootTimer = interval;

        const anim = gun.getCurAnim();

        if (opts.owner.timeData && anim) {
            anim.speed =
                TIME_TOWER_BASE_ANIM_SPEED /
                (opts.owner.timeData.timeMultiplier ?? 1);
        }

        if (shootTimer > 0) {
            shootTimer -= k.dt();
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
            gun.angle += diff * Math.min(1, turnSpeed * k.dt());

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

        while (shootTimer <= 0 && target && !opts.owner.activeProjectile) {
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

function aoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number, particle: string) {
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

        const life = k.rand(0.25, 0.45);
        const startScale = k.rand(1, 2);

        const p = k.add([
            k.pos(pos.add(offset)),
            k.sprite(particle),
            k.anchor("center"),
            k.opacity(0.8),
            k.scale(startScale),
            k.lifespan(life),
            {
                time: 0,

                update() {
                    p.time += k.dt();
                    const t = p.time / life;

                    p.opacity = 0.8 * (1 - t);

                    p.scale = k.vec2(startScale * (1 - t));

                    p.pos.y -= 6 * k.dt();
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
    }
}

function lightningAttack(k: KAPLAYCtx, ctx: AttackContext, dmg: DamageResult) {
    if (!ctx.target) return;
    const { damage, isCrit } = dmg;

    const maxChains = ctx.lightning?.maxChains ?? 3;
    const range = (ctx.lightning?.range ?? 5) * TILE_SIZE;

    const chain = resolveChain(k, {
        startPos: ctx.origin,
        target: ctx.target,
        damage: Math.round(damage * (ctx.lightning?.damageMult ?? 1)),
        isCrit,
        element: "Electric",
        maxChains,
        range,
    });

    const lightning = k.add([
        k.pos(0, 0),
        k.lifespan(0.2),
        k.opacity(1),
        {
            segments: [] as Vec2[][],
            update() {
                lightning.segments = buildLightningSegments(k, chain);
            },
            draw() {
                lightning.segments.forEach(points => drawLightning(k, points));
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
    if (!ctx.meleeAttack) return;

    const { damage, isCrit } = opts;
    const { meleeAttack, element, origin, target, gun } = ctx;
    const { meleeHead, meleeHandle, swingAngle, startAngle } = ctx.meleeAttack;
    const { handleLength } = ctx.attacker.melee;

    if (!target) return;

    const { splashRadius, swingTime, onImpact } = meleeAttack;

    const dir = target.pos.sub(origin);
    const dist = dir.len();

    gun.enterState("meleeSwing", {
        dir,
        distance: dist - handleLength,
        swingTime: swingTime ?? 0.15,
        swingAngle,
        startAngle,
        handleLength
    });

    k.wait(swingTime ?? 0.15, () => {
        if (splashRadius) {
            (k.get("enemy") as EnemyGameObj[]).forEach(e => {
                if (e.pos.dist(target.pos) < splashRadius * TILE_SIZE) hurtEnemy(k, {
                    target: e,
                    damage,
                    isCrit,
                    element,
                    attacker: ctx.attacker as TowerGameObj
                });
            });
        } else {
            hurtEnemy(k, { target, damage, isCrit, element, attacker: ctx.attacker as TowerGameObj });
        }
        if (meleeHandle && meleeHead) {
            meleeHandle.scale.x = 1;
            meleeHead.scale.x = 1;
        }
        gun.enterState("idle");
        if (onImpact) onImpact(k, target.pos);
    });
}

function sniperLaserAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target) return;

    const { damage, isCrit } = dmg;

    drawLaser(k, ctx.origin, ctx.target.pos, 24, 0.04);
    hurtEnemy(k, { target: ctx.target, damage, isCrit, element: ctx.element });
}

function piercingLaserAttack(
    k: KAPLAYCtx,
    ctx: AttackContext,
    dmg: DamageResult
) {
    if (!ctx.target) return;

    const { damage, isCrit } = dmg;
    const dir = ctx.target.pos.sub(ctx.origin).unit();
    const range = ctx.origin.dist(ctx.target.pos);

    drawLaser(k, ctx.origin, ctx.target.pos, 106, 0.24);

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
    if (!ctx.target) return;

    const { damage, isCrit } = dmg;

    const stormCloud = k.add([
        k.sprite("thunder effect", { anim: "thunder" }),
        k.pos(ctx.target.pos),
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
    if (!ctx.target) return;

    const { damage, isCrit } = dmg;

    for (let i = 0; i < 140; i++) {
        k.add([
            k.pos(ctx.target.pos.add(k.rand(-40, 40), k.rand(-60, 60))),
            k.sprite("snow"),
            k.move(
                k.vec2(k.rand(-80, -40), -10),
                k.rand(20, 80)
            ),
            k.lifespan(0.6),
            k.z(9999),
            k.opacity(k.rand(0.5, 1)),
            k.scale(k.rand(0.5, 1.2)),
        ]);
    }

    (k.get("enemy") as EnemyGameObj[]).forEach(e => {
        if (e.pos.dist(ctx.target?.pos ?? k.vec2(0)) < 2.5 * TILE_SIZE) {
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
            k.lifespan(life),
            {
                vel,
                time: 0,
                update() {
                    flame.time += k.dt();

                    flame.pos = flame.pos.add(flame.vel.scale(k.dt()));

                    const p = flame.time / life;

                    flame.opacity = 1 - p / 3;
                    flame.scale = k.vec2(1.4 * (1 - p / 2));

                    flame.pos.y -= 12 * k.dt();
                }
            }
        ]);
    }
}