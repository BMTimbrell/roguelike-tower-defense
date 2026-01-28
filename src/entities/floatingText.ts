import type { Vec2, KAPLAYCtx } from 'kaplay';

export default function makeFloatingText(k: KAPLAYCtx, opts: {
    color?: string;
    text: string;
    pos: Vec2;
    size?: number;
}) {
    const { text, pos, color = "#fffb00", size } = opts;
    const life = 0.5;

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    const outlines = offsets.map(([x, y]) =>
        k.add([
            k.pos(pos.x + x, pos.y + y),
            k.text(text, {
                size,
                font: "free pixel"
            }),
            k.color("#000000"),
            k.opacity(1),
            k.lifespan(life),
            k.scale(1),
            "fTextOutline",
            k.z(999999)
        ])
    );

    const fText = k.add([
        k.pos(pos),
        k.color(color),
        k.lifespan(life),
        k.text(text, {
            size,
            font: "free pixel"
        }),
        k.opacity(1),
        k.scale(1),
        k.z(999999)
    ]);

    let time = 0;

    const all = [fText, ...outlines];

    fText.onUpdate(() => {
        const dt = k.dt();
        time += dt;

        const t = Math.min(time / life, 1);

        const pulse = Math.sin(t * Math.PI);
        const pulseScale = k.lerp(1, 1.3, pulse);
        const ease = k.easings.easeInQuad(t);
        const shrinkScale = k.lerp(1.0, 0.5, ease);
        const opacityScale = k.lerp(1.0, 0.25, ease);
        const scale = k.vec2(pulseScale * shrinkScale);

        fText.scale = scale;
        fText.opacity = opacityScale;

        for (const a of all) {
            a.scale = scale;
            a.opacity = opacityScale;
            a.move(0, -250 * dt);
        }
    });

}