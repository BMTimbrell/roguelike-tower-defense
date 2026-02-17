import type { Comp, GameObj, HealthComp, KAPLAYCtx, RotateComp, SpriteComp } from "kaplay";

export default function healthBar(k: KAPLAYCtx, duration: number): Comp {
    let timer = duration;

    return {
        id: "healthbar",

        require: ["health", "sprite", "rotate"],

        draw(this: GameObj<HealthComp | SpriteComp | RotateComp>) {
            k.pushTransform();
            k.pushRotate(-this.angle);

            k.drawRect({
                width: this.width,
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height),
                color: k.Color.fromHex("#707070"),
                radius: 2
            });

            k.drawRect({
                width: this.width * (this.hp() / (this.maxHP() ?? 1)),
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height),
                color: k.Color.fromHex("#5ba675"),
                radius: 2
            });

            k.drawRect({
                width: this.width,
                height: 4,
                pos: k.vec2(0).sub(this.width / 2, this.height),
                outline: { color: k.Color.fromHex("#000000"), width: 1 },
                fill: false,
                radius: 2
            });

            k.popTransform();
        },

        update(this: GameObj) {
            timer -= k.dt();

            if (timer <= 0 || this.isDying) {
                this.unuse("healthbar");
            }
        },
    };
}