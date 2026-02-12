import type { Comp, GameObj, HealthComp, KAPLAYCtx, RectComp } from "kaplay";

export default function healthBar(k: KAPLAYCtx, duration: number): Comp {
    let timer = duration;

    return {
        id: "healthbar",

        require: ["health", "rect"],

        draw(this: GameObj<HealthComp | RectComp>) {
            k.drawRect({
                width: this.width,
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height + 7),
                color: k.Color.fromHex("#707070"),
                radius: 2
            });

            k.drawRect({
                width: this.width * (this.hp() / (this.maxHP() ?? 1)),
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height + 7),
                color: k.Color.fromHex("#5ba675"),
                radius: 2
            });

            k.drawRect({
                width: this.width,
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height + 7),
                outline: { color: k.Color.fromHex("#000000"), width: 1 },
                fill: false,
                radius: 2
            });
        },

        update(this: GameObj) {
            timer -= k.dt();
            if (timer <= 0) {
                this.unuse("healthbar");
            }
        },
    };
}