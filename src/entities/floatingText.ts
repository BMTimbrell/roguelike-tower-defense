import type { Vec2, KAPLAYCtx } from 'kaplay';

type floatingTextParams = {
    color?: string; 
    text: string; 
    pos: Vec2;
    size?: number
};

export default function makeFloatingText(k: KAPLAYCtx, { text, pos, color = "#FF0000", size }: floatingTextParams) {
    const life = 0.5;

    const fText = k.add([
        k.pos(pos),
        k.color(color),
        k.lifespan(life),
        k.text(text, {
            size,
            font: "sans-serif"
        }),
        k.opacity(1),
        k.scale(1),
        "fText"
    ]);

    let time = 0;

    fText.onUpdate(() => {
        const dt = k.dt();
        time += dt;

        // fText.opacity -= (dt / life) * 0.8;

        const t = Math.min(time / life, 1);

        const pulse = Math.sin(t * Math.PI);
        const pulseScale = k.lerp(1, 1.3, pulse);
        const ease = k.easings.easeInQuad(t);
        const shrinkScale = k.lerp(1.0, 0.5, ease);

        const scale = new k.Vec2(pulseScale * shrinkScale);
        fText.opacity = k.lerp(1.0, 0.25, ease);
        fText.scale = scale;

        fText.move(0, -250 * dt);
    });

}