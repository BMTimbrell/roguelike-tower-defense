import type { KAPLAYCtx, Vec2 } from "kaplay";
import { lifespan } from "../kaplayComponents/lifespan";
import { gameStateAtom, store } from "../store";

export function spawnExplosiveFireballParticles(k: KAPLAYCtx, pos: Vec2) {
    // Bright sparks
    for (let i = 0; i < 14; i++) {
        const angle = Math.random() * 360;
        const speed = k.rand(60, 160);

        const color: [number, number, number] = Math.random() < 0.4 ? [255, 180, 50] : [255, 92, 0];

        const particle = k.add([
            k.circle(2),
            k.color(...color),
            k.pos(pos),
            lifespan(k, 0.15),
            k.opacity(1),
        ]);

        const dir = k.Vec2.fromAngle(angle);

        particle.onUpdate(() => {
            const dt = k.dt() * store.get(gameStateAtom).timeScale;
            particle.pos = particle.pos.add(dir.scale(speed * dt));
            particle.opacity -= 3 * dt;
        });
    }

    //Smoke
    for (let i = 0; i < 6; i++) {
        const xOffset = k.randi(-4, 4);
        const yOffset = k.randi(-4, 4);
        const smoke = k.add([
            k.rect(4, 4),
            k.color(80, 80, 80),
            k.pos(pos.add(xOffset, yOffset)),
            k.scale(1),
            k.opacity(0.4),
            lifespan(k, 0.25),
        ]);

        smoke.onUpdate(() => {
            const dt = k.dt() * store.get(gameStateAtom).timeScale;
            smoke.scale = smoke.scale.add(k.vec2(2 * dt));
            smoke.opacity -= 4 * dt;
        });
    }
}

export function spawnFlameParticle(k: KAPLAYCtx, pos: Vec2) {
    const particle = k.add([
        k.circle(3),
        k.pos(pos),
        k.color(255, 180, 50),
        k.opacity(0.8),
        k.scale(1),
    ]);

    const velocity = k.vec2(
        k.rand(-8, 8),
        k.rand(-8, 8)
    );

    particle.onUpdate(() => {
        const dt = k.dt() * store.get(gameStateAtom).timeScale;
        particle.pos = particle.pos.add(velocity.scale(dt));

        particle.scale = particle.scale.add(k.vec2(dt));
        particle.opacity -= 2.5 * dt;

        if (particle.opacity <= 0) {
            k.destroy(particle);
        }
    });
}