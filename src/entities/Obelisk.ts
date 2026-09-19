import type { Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import type { CorruptedTile, EnemyGameObj, ObeliskGameObj, ObeliskId, Tile, TowerBuff } from "../types";
import { HARD_HEALTH_MULT, OBELISKS, TILE_SIZE } from "../constants";
import healthBar from "../kaplayComponents/healthBar";
import { cachedSaveAtom, gameStateAtom, hoveredHellMapEntityAtom, store } from "../store";
import statusEffect from "../kaplayComponents/statusEffect";
import { captureTotemEffect } from "./Totem";
import { playSfx } from "../utils/soundHelpers";
import { tryShowTutorial } from "../utils/tutorialHelpers";

export default function makeObelisk(k: KAPLAYCtx, id: ObeliskId, pos: Vec2, tileGrid: Tile[][]) {
    const obeliskHealth = 600 * (store.get(gameStateAtom).difficulty === "hard" ? 1.2 : store.get(gameStateAtom).difficulty === "expert" ? 1.4 : 1);

    const obelisk: ObeliskGameObj = k.add([
        k.sprite(`${id} obelisk`, { anim: "idle" }),
        k.area({ shape: new k.Rect(k.vec2(0), 20, 20) }),
        k.anchor("center"),
        k.z(pos.y),
        k.rotate(0),
        statusEffect(),
        k.health(50, obeliskHealth),
        k.pos(pos.add(TILE_SIZE / 2)),
        {
            obeliskId: id,
            towerBuff: {
                type: "bonusDamage",
                multiplier: 0.2,
                element: OBELISKS[id].element
            } as TowerBuff,
            range: 4,
            statusImmunity: true,
            darkHarvestDamage: 0,
            //debuffDurationMultiplier: 1,
            isDying: false,
            killer: null,
            corruptedTiles: []
        },
        "obelisk",
        "targetable"
    ]);

    // totem tutorial
    const save = store.get(cachedSaveAtom);
    if (save) {
        tryShowTutorial("obelisk", save);
    }

    obelisk.onHurt(amount => {
        if (amount === undefined) return;

        if (!obelisk.has("healthBar")) {
            obelisk.use(healthBar(k, 2));
        }

        const prevDamageDealt = store.get(gameStateAtom).heroCharge.damageDealt;
        const damageDealt = prevDamageDealt + (obelisk.hp() > 0 ? amount : amount + obelisk.hp());
        const difficulty = store.get(gameStateAtom).difficulty;

        store.set(gameStateAtom, prev => ({
            ...prev,
            heroCharge: {
                ...prev.heroCharge,
                damageDealt,
                charge: Math.min((damageDealt) / prev.heroCharge.damageRequired / (difficulty === "hard" ? HARD_HEALTH_MULT : 1), 1)
            }
        }));
    });

    const obeliskRange = k.add([
        k.circle(obelisk.range * TILE_SIZE),
        k.color(255, 0, 0),
        k.opacity(0),
        k.outline(1),
        k.pos(obelisk.pos)
    ]);

    obelisk.onDestroy(() => {
        const satan = (k.get("satan-enemy") as EnemyGameObj[])[0];
        if (satan) {
            if (satan.state !== "roar") {
                satan.enterState("roar", ({ killer: obelisk.killer ?? k.get("tower")[0] }));
            }
        }

        k.destroy(obeliskRange);
    });

    obelisk.onCollideEnd("cursor", () => {
        obeliskRange.opacity = 0;
        store.set(hoveredHellMapEntityAtom, null);
    });

    obelisk.onCollide("cursor", () => {
        if (!obelisk.has("healthBar")) {
            obelisk.use(healthBar(k, 1));
        }

        obeliskRange.opacity = 0.2;

        store.set(hoveredHellMapEntityAtom, prev => ({
            ...prev,
            id,
            type: "obelisk",
            pos: { x: obelisk.screenPos()?.x ?? 0, y: obelisk.screenPos()?.y ?? 0 }
        }));

    });

    obelisk.onDeath(() => {
        if (obelisk.isDying) return;

        obelisk.isDying = true;

        obelisk.corruptedTiles.forEach(t => {
            tileGrid[t.y][t.x].blocked = false;
            k.get("corrupted tile").forEach(ct => {
                if (ct.pos.x / TILE_SIZE === t.x && ct.pos.y / TILE_SIZE === t.y) k.destroy(ct);
            });
        });

        playSfx(k, "rock smash", 1, obelisk.pos);

        obelisk.play("destroy");

        const goldEarned = 50;
        store.set(gameStateAtom, prev => ({
            ...prev,
            gold: prev.gold + goldEarned
        }));

        const handleUpdate = (obj: GameObj) => {
            const dt = k.dt() * store.get(gameStateAtom).timeScale;
            obj.opacity -= dt * 2;
            obj.pos = obj.pos.sub(0, dt * 3);

            if (obj.opacity <= 0) k.destroy(obj);
        };

        const coin = k.add([
            k.sprite("gold"),
            k.pos(obelisk.pos.sub(TILE_SIZE / 4, TILE_SIZE / 2)),
            k.opacity(1),
            k.z(999),
            {
                update() {
                    handleUpdate(coin);
                }
            }
        ]);

        const offsets = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
        ];

        const textPos = coin.pos.add(9, 0);
        const fontSize = 12;

        offsets.map(([x, y]) => {
            const outline = k.add([
                k.pos(textPos.x + x, textPos.y + y),
                k.color('#000000'),
                k.text(`${goldEarned}`, {
                    size: fontSize,
                    font: "free pixel"
                }),
                k.opacity(1),
                k.z(999),
                {
                    update() {
                        handleUpdate(outline);
                    }
                }
            ]);

        });

        const text = k.add([
            k.text(`${goldEarned}`, {
                size: fontSize,
                font: "free pixel"
            }),
            k.opacity(1),
            k.z(999),
            k.pos(textPos),
            {
                update() {
                    handleUpdate(text);
                }
            }
        ]);
    });

    obelisk.onAnimEnd(anim => {
        if (anim === "destroy") {

            if (obelisk.killer) {
                captureTotemEffect(k, obelisk, obelisk.killer, {
                    color: k.Color.fromHex(OBELISKS[obelisk.obeliskId].particleColor) as Color,
                    particleCount: 8,
                    duration: 0.65,
                });
                playSfx(k, "totem magic", 1, obelisk.pos);
                obelisk.killer.towerBuffs.push(obelisk.towerBuff);
            }

            k.destroy(obelisk);
            tileGrid[pos.y / TILE_SIZE][pos.x / TILE_SIZE].blocked = false;
        }
    });

    return obelisk;
}

export function corruptRandomTiles(
    k: KAPLAYCtx,
    obelisk: ObeliskGameObj,
    tileGrid: Tile[][]
) {
    const available: CorruptedTile[] = [];

    for (let y = 0; y < tileGrid.length; y++) {
        for (let x = 0; x < tileGrid[y].length; x++) {
            const tile = tileGrid[y][x];

            const tilePos = k.vec2(
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2
            );

            if (obelisk.pos.dist(tilePos) > obelisk.range * TILE_SIZE) {
                continue;
            }

            if (tile.blocked) continue;

            available.push({ tile, x, y });
        }
    }

    const amount = Math.min(3, available.length);

    for (let i = 0; i < amount; i++) {
        const index = Math.floor(Math.random() * available.length);
        const corrupted = available.splice(index, 1)[0];

        corrupted.tile.blocked = true;
        obelisk.corruptedTiles.push(corrupted);

        k.add([
            k.sprite("corrupted tile"),
            k.pos(corrupted.x * TILE_SIZE, corrupted.y * TILE_SIZE),
            "corrupted tile"
        ]);
    }

}