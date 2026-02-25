import type { KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, ElementName, EnemyGameObj, HeroGameObj, TowerGameObj } from "../types";
import { CRIT_DAMAGE_NUMBER_SIZE, CURSE_CRIT, DAMAGE_NUMBER_SIZE, ELEMENTS, TILE_SIZE, TOWER_RANGE_TOLERANCE, type ProjectileId } from "../constants";
import makeProjectile from "../entities/Projectile";
import { rotateVector, selectTarget, shortestAngleDiff } from "./targetingHelpers";
import makeFloatingText from "../entities/FloatingText";
import { buildLightningSegments, drawLightning, resolveChain } from "./lightningHelpers";
import calcDamage from "./calcDamage";

export default function makeUnitCombat(
    k: KAPLAYCtx,
    opts: {
        owner: TowerGameObj | HeroGameObj
        stats: {
            damage: number
            range: number
            fireInterval: number
            critChance: number
            critDamage: number
        }
        projectile: ProjectileId | null
        element: ElementName
        gunSprite: string
        gunOffset: Vec2
        shootOffset: Vec2
        anchorOffset: Vec2
    }
) {
    let shootTimer = 0;

    const gun = k.add([
        k.sprite(opts.gunSprite, { anim: "idle" }),
        k.pos(),
        k.anchor(opts.anchorOffset),
        k.rotate(),
        k.opacity(1),
    ]);

    const rangeCircle = k.add([
        k.pos(),
        k.circle(opts.stats.range * TILE_SIZE),
        k.opacity(0.2),
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

    function shoot(target: EnemyGameObj) {

        const ctx: AttackContext = {
            attacker: opts.owner,
            target,
            origin: gun.pos,
            damage: opts.stats.damage,
            element: opts.element,
            aoeAttack: false,
            visualEffect: null,
            lightningAttack: false,
            projectiles: opts.projectile ? [{
                id: opts.projectile,
                angle: gun.angle,
                target,
                homing: true
            }] : []
        };

        opts.owner.effects?.forEach(e => e.firstEffect?.(ctx));

        const { isCrit, damage } = calcDamage({
            bonusDamage: 0,
            bonusCritChance: target.has("curse") ? CURSE_CRIT : 0,
            critChance: opts.stats.critChance,
            critDamage: opts.stats.critDamage,
            damage: ctx.damage
        });

        if (ctx.aoeAttack) {
            aoeAttack(k, ctx, { damage, isCrit });
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
            const { isCrit, damage } = calcDamage({
                bonusDamage,
                bonusCritChance: target.has("curse") ? CURSE_CRIT : 0,
                critChance: opts.stats.critChance,
                critDamage: opts.stats.critDamage,
                damage: ctx.damage
            });

            const projectile = makeProjectile(k, {
                id: p.id,
                pos: ctx.origin.add(rotatedOffset),
                target,
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

    }

    function update() {
        if (shootTimer > 0) {
            shootTimer -= k.dt();
        }

        const target = selectTarget(
            k.get("enemy") as EnemyGameObj[],
            opts.owner,
            rangeCircle.pos
        );

        if (target && opts.owner.canRotate) {
            const desired = gun.pos.angle(target.pos);
            const turnSpeed = 12;

            const diff = shortestAngleDiff(gun.angle, desired);
            gun.angle += diff * Math.min(1, turnSpeed * k.dt());
        } else gun.angle = 0;

        while (shootTimer <= 0 && target && !opts.owner.activeProjectile) {
            shootTimer += opts.stats.fireInterval;

            if (opts.owner.canRotate) gun.angle = gun.pos.angle(target.pos);

            shoot(target);
            gun.play("shoot");
        }
    }

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

        e.hurt(damage);

        makeFloatingText(k, {
            pos: e.pos,
            text: '' + damage,
            size: isCrit ? CRIT_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
            color: ELEMENTS[ctx.element].color
        });

        ELEMENTS[ctx.element].applyEffect?.(k, { target: e, damage });
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