import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, AttackTarget, ElementName, EnemyGameObj, HeroGameObj, RandomProjectiles, TargetResolver, TowerGameObj } from "../types";
import { CURSE_CRIT, TILE_SIZE, TIME_TOWER_BASE_ANIM_SPEED, TOWER_RANGE_TOLERANCE, type ProjectileId } from "../constants";
import makeProjectile from "../entities/Projectile";
import { rotateVector, shortestAngleDiff } from "./targetingHelpers";
import { buildLightningSegments, drawLightning, resolveChain } from "./lightningHelpers";
import calcDamage from "./calcDamage";
import hurtEnemy from "./hurtEnemy";
import makePathEntity from "../entities/PathEntity";
import { gameStateAtom, store } from "../store";

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
        element: ElementName;
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
        k.pos(),
        k.anchor(opts.anchorOffset),
        k.rotate(),
        k.opacity(1),
        k.state("idle", ["idle", "tracking", "meleeSwing"])
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
            k.anchor("right")
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
        rangeCircle.pos = opts.owner.pos.add(TILE_SIZE / 2, TILE_SIZE / 2);
        rangeCircle.use(k.circle(opts.stats.range * TILE_SIZE));
        rangeCircle.hidden = !opts.owner.selected && !opts.owner.hovered;

        if (opts.owner.activeProjectile === null) gun.play("idle");
    });

    function shoot(target: AttackTarget) {

        if (target.type === "enemy") {
            const enemy = target.enemy;
            let projectile = {
                id: opts.projectile ?? "basic",
                angle: gun.angle,
                target: enemy,
                homing: true,
                bonusDamage: 0,
                bonusCrit: 0
            };

            let element = opts.element;
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

            const ctx: AttackContext = {
                attacker: opts.owner,
                target: enemy,
                origin: gun.pos,
                damage: opts.stats.damage,
                element,
                aoeAttack: false,
                visualEffect: null,
                lightningAttack: false,
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

            if (ctx.aoeAttack) {
                aoeAttack(k, ctx, { damage, isCrit });
            }

            if (ctx.meleeAttack) {
                meleeAttack(k, ctx, {
                    damage,
                    isCrit
                });
            }

            if (ctx.target && ctx.lightningAttack) {
                const chain = resolveChain(k, {
                    startPos: ctx.origin,
                    target: ctx.target,
                    damage,
                    isCrit,
                    element: ctx.element,
                    maxChains: 3,
                    range: TILE_SIZE * 5
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

            if (!ctx.projectiles) return;

            if (ctx.volley?.volleyChance && Math.random() < ctx.volley.volleyChance) {
                const base = ctx.projectiles[0];

                ctx.projectiles = [
                    { ...base, angle: base.angle - 45, homingDelay: 0.2, turnSpeed: 12 },
                    { ...base, angle: base.angle, homingDelay: 0.1, turnSpeed: 12 },
                    { ...base, angle: base.angle + 45, homingDelay: 0.2, turnSpeed: 12 },
                ];
            }

            opts.owner.effects?.forEach(e => e.secondEffect?.(ctx));

            const rotatedOffset = rotateVector(
                k,
                k.vec2(opts.shootOffset.x, opts.shootOffset.y),
                gun.angle * Math.PI / 180
            );

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

                const projectile = makeProjectile(k, {
                    id: p.id,
                    pos: ctx.origin.add(rotatedOffset),
                    target: enemy,
                    damage: damage,
                    crit: isCrit,
                    angle: p.angle,
                    element: p?.element ?? ctx.element,
                    homing: p.homing,
                    homingDelay: p.homingDelay,
                    turnSpeed: p.turnSpeed,
                    behaviors: p?.behaviors
                });

                if (p.behaviors?.persistent) {
                    ctx.attacker.activeProjectile ??= projectile;
                }
            }

        } else if (target.type === "point") {

            makePathEntity(k, {
                ownerId: opts.owner.instanceId,
                from: opts.owner.pos.add(TILE_SIZE / 2, TILE_SIZE / 2),
                targetPos: target.pos,
                damage: opts.stats.damage,
                critChance: opts.stats.critChance,
                critDamage: opts.stats.critDamage,
                element: opts.element
            });
        }

    }

    function update() {
        const interval =
            opts.owner.stats.fireInterval *
            (opts.owner.timeData?.intervalMultiplier ?? 1);

        const anim = gun.getCurAnim();

        if (opts.owner.timeData && anim) {
            anim.speed =
                TIME_TOWER_BASE_ANIM_SPEED /
                (opts.owner.timeData.intervalMultiplier ?? 1);
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

        while (shootTimer <= 0 && target && !opts.owner.activeProjectile) {
            shootTimer += interval;

            if (opts.owner.canRotate) gun.angle = gun.pos.angle(target.type === "point" ? target.pos : target.enemy.pos);

            if (
                target.type === "point" &&
                k.get("pathEntity").filter(e => e.ownerId === opts.owner.instanceId).length >= (opts.owner.pathEntityLimit ?? 1)
            ) break;

            shoot(target);
            if (gun.getAnim("shoot")) gun.play("shoot");
        }
    }

    function meleeAttack(
        k: KAPLAYCtx,
        ctx: AttackContext,
        opts: {
            damage: number;
            isCrit: boolean;
        }
    ) {
        const { damage, isCrit } = opts;
        const { meleeAttack, element, origin, target } = ctx;
        const { handleLength } = ctx.attacker.melee;

        if (!target) return;
        if (!meleeAttack) return;
        const { splashRadius, swingTime, onImpact } = meleeAttack;

        const dir = target.pos.sub(origin);
        const dist = dir.len();

        gun.enterState("meleeSwing", {
            dir,
            distance: dist - handleLength,
            swingTime: swingTime ?? 0.15,
            handleLength
        });

        k.wait(swingTime ?? 0.15, () => {
            if (splashRadius) {
                (k.get("enemy") as EnemyGameObj[]).forEach(e => {
                    if (e.pos.dist(target.pos) < splashRadius * TILE_SIZE) hurtEnemy(k, { target: e, damage, isCrit, element });
                });
            } else {
                hurtEnemy(k, { target, damage, isCrit, element });
            }
            if (meleeHandle && meleeHead) {
                meleeHandle.scale.x = 1;
                meleeHead.scale.x = 1;
            }
            gun.enterState("idle");
            onImpact(k, target.pos);
        });
    }

    gun.onStateEnter("meleeSwing", ({
        dir,
        distance,
        swingTime,
        handleLength
    }: {
        dir: Vec2;
        distance: number;
        swingTime: number;
        handleLength: number;
    }) => {
        if (!meleeHandle || !meleeHead) return;

        gun.angle = dir.angle() + 180;
        gun.angle -= 90;

        const scaleX = distance / handleLength;

        meleeHandle.scale.x = scaleX;
        meleeHead.scale.x = 1 / scaleX;

        k.tween(
            gun.angle,
            gun.angle + 90,
            swingTime,
            (a) => gun.angle = a,
            k.easings.easeOutBack
        );
    });

    return {
        gun,
        rangeCircle,
        update,
        destroy() {
            opts.owner.activeProjectile && k.destroy(opts.owner.activeProjectile);
            k.destroy(gun)
            k.destroy(rangeCircle)
        },
    };
}

function aoeAttack(k: KAPLAYCtx, ctx: AttackContext, opts: { isCrit: boolean; damage: number; }) {
    const { isCrit, damage } = opts;
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

        const frost = k.add([
            k.pos(pos.add(offset)),
            k.sprite("frost particle"),
            k.opacity(0.8),
            k.scale(startScale),
            k.lifespan(life),
            {
                time: 0,

                update() {
                    frost.time += k.dt();
                    const t = frost.time / life;

                    frost.opacity = 0.8 * (1 - t);

                    frost.scale = k.vec2(startScale * (1 - t));

                    frost.pos.y -= 6 * k.dt();
                },
            },
        ]);
    }
}

export function flameAoeBurst(k: KAPLAYCtx, pos: Vec2, radius: number) {
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

        const flame = k.add([
            k.pos(pos.add(offset)),
            k.sprite("flame particle"),
            k.opacity(0.8),
            k.scale(startScale),
            k.lifespan(life),
            {
                time: 0,

                update() {
                    flame.time += k.dt();
                    const t = flame.time / life;

                    flame.opacity = 0.8 * (1 - t);

                    flame.scale = k.vec2(startScale * (1 - t));

                    flame.pos.y -= 6 * k.dt();
                },
            },
        ]);
    }
}