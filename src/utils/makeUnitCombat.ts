import type { GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { AttackContext, ElementName, HeroGameObj, TowerGameObj } from "../types";
import { TILE_SIZE, type ProjectileId } from "../constants";
import makeProjectile from "../entities/Projectile";
import { rotateVector, selectTarget, shortestAngleDiff } from "./targetingHelpers";

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
        projectile: ProjectileId
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
        if (anim === "shoot") {
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
    });

    function shoot(target: GameObj) {
        const damage = opts.stats.damage;

        const ctx: AttackContext = {
            attacker: opts.owner,
            target,
            origin: gun.pos,
            damage,
            element: opts.element,
            projectiles: [{
                id: opts.projectile,
                angle: gun.angle,
                target,
                homing: true
            }]
        };

        opts.owner.effects?.forEach(e => e.onAttack(ctx));

        const rotatedOffset = rotateVector(
            k,
            k.vec2(opts.shootOffset.x, opts.shootOffset.y),
            gun.angle * Math.PI / 180
        );

        for (const p of ctx.projectiles) {
            const roll = Math.random();
            const willCrit = roll < opts.stats.critChance / 100;

            makeProjectile(k, {
                id: p.id,
                pos: ctx.origin.add(rotatedOffset),
                target,
                damage: ctx.damage * (1 + (willCrit ? opts.stats.critDamage / 100 : 0)),
                crit: willCrit,
                angle: p.angle,
                element: ctx.element,
                homing: p.homing,
                homingDelay: p.homingDelay,
                turnSpeed: p.turnSpeed,
                behaviors: p?.behaviors
            });
        }

    }

    function update() {
        shootTimer -= k.dt();

        const target = selectTarget(
            k.get("enemy"),
            opts.owner,
            rangeCircle.pos
        );

        if (target) {
            const desired = gun.pos.angle(target.pos);
            const turnSpeed = 12;

            const diff = shortestAngleDiff(gun.angle, desired);
            gun.angle += diff * Math.min(1, turnSpeed * k.dt());
        } else gun.angle = 0;

        if (shootTimer <= 0 && target) {
            shootTimer = opts.stats.fireInterval;

            gun.angle = gun.pos.angle(target.pos);

            shoot(target);
            gun.play("shoot");
        }
    }

    return {
        gun,
        rangeCircle,
        update,
        destroy() {
            k.destroy(gun)
            k.destroy(rangeCircle)
        },
    };
}