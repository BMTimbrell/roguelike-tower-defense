import type { KAPLAYCtx } from "kaplay";
import makeFloatingText from "../entities/FloatingText";
import { CRIT_DAMAGE_NUMBER_SIZE, DAMAGE_NUMBER_SIZE, ELEMENTS, SCYTHE_MAX_KILL_STACKS, SMALL_DAMAGE_NUMBER_SIZE, TILE_SIZE, TOWER_RANGE_TOLERANCE } from "../constants";
import type { AttackContext, ElementName, EnemyGameObj, TowerGameObj } from "../types";
import spawnSummon from "../entities/Summon";
import { gameStateAtom, store } from "../store";
import { spawnPoisonCloud } from "./spellHelpers";

export default function hurtEnemy(k: KAPLAYCtx, opts: {
    target: EnemyGameObj;
    damage: number;
    element: ElementName;
    isCrit: boolean;
    ignoreArmour?: boolean;
    attacker?: TowerGameObj;
    statusDamage?: boolean;
    applyStatusEffects?: boolean;
    damageFromBuff?: boolean;
    zIndexBonus?: number;
}) {
    const { target, damage, element, isCrit, attacker, statusDamage, ignoreArmour, applyStatusEffects = true, damageFromBuff = false, zIndexBonus = 0 } = opts;

    if (target.invincible) return;

    const hasDarkHarvest = target.has("darkHarvestMark");

    const darkHarvestMarkDamageMult = hasDarkHarvest ? 1.5 : 1;

    let remainingDamage = Math.round(damage * darkHarvestMarkDamageMult);
    let effectiveDamage = Math.round(damage * darkHarvestMarkDamageMult);

    if (attacker) target.killer = attacker;

    if (target.armour && target.armour > 0 && !ignoreArmour) {
        // crits ignore reduced
        effectiveDamage = Math.round(damage * (isCrit ? 1 : 0.5));

        target.armour -= effectiveDamage;

        if (target.armour < 0) {
            remainingDamage = -target.armour;
            target.armour = 0;
        } else {
            remainingDamage = 0;
        }
    }

    if (target.shieldHp && target.state === "shield") {
        target.shieldHp -= remainingDamage;
        if (target.shieldHp < 0) target.hurt(-target.shieldHp);
    } else {
        target.hurt(remainingDamage);
        if (hasDarkHarvest) target.darkHarvestDamage += effectiveDamage;
    }

    if (attacker?.killStacks !== undefined && attacker.killStacks < SCYTHE_MAX_KILL_STACKS && target.hp() <= 0) {
        attacker.killStacks++;
        if (attacker.killStacks === 1) {
            k.add([
                k.pos(attacker.pos),
                k.text("" + attacker.killStacks, {
                    size: 12,
                    font: "free pixel"
                }),
                k.color(ELEMENTS[element].color),
                `killStackText${attacker.instanceId}`
            ]);
        } else {
            k.get(`killStackText${attacker.instanceId}`)[0].text = "" + attacker.killStacks;
        }
    }

    if (store.get(gameStateAtom).showDamageNumbers) {
        const offset = damageFromBuff ? k.vec2(k.rand(-6, 6), k.rand(-4, 4)) : k.vec2(0);
        makeFloatingText(k, {
            pos: target.pos.add(offset),
            text: '' + effectiveDamage,
            size: isCrit ? CRIT_DAMAGE_NUMBER_SIZE : statusDamage || damageFromBuff ? SMALL_DAMAGE_NUMBER_SIZE : DAMAGE_NUMBER_SIZE,
            color: ELEMENTS[element].color,
            zIndexBonus
        });
    }

    const challengeManager = store.get(gameStateAtom).challengeManager;
    challengeManager.handleEvent({
        type: "DEAL_DAMAGE",
        damageType: element,
        amount: damage
    });

    if (attacker?.towerBuffs.some(b => b.type === "toxicInfusion")) {
        spawnPoisonCloud(k, { damage: Math.max(1, Math.round(effectiveDamage * 0.25)), target: target.pos });
    }

    if (!statusDamage) {
        if (applyStatusEffects) {
            ELEMENTS[element].applyEffect?.(k, { target, damage: effectiveDamage });
        }

        if (!damageFromBuff && attacker) {
            // Bonus elemental damage
            for (const buff of attacker.towerBuffs) {
                if (buff.type === "bonusDamage") {
                    hurtEnemy(k, {
                        target,
                        damage: Math.max(1, Math.round(effectiveDamage * buff.multiplier)),
                        element: buff.element,
                        damageFromBuff: true,
                        isCrit: false,
                    });
                }
            }
        }
    }

    if (
        !target.stunResistance &&
        attacker?.name === "Hammer Tower" &&
        !target.isDying && Math.random() < effectiveDamage * 0.002 &&
        !(target.shieldHp && k.get("shield").length)
    ) {
        target.enterState("stunned");
    }

    // battery charge for battery tower
    const damageDealt = effectiveDamage;

    const batteries = k.get("tower").filter(t => t.battery);

    for (const b of batteries) {
        const dist = b.pos.dist(target.pos);

        if (dist <= b.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
            const stored = Math.max(1, damageDealt * b.battery.storePct);

            b.battery.charge = Math.min(
                b.battery.charge + stored,
                b.battery.maxCharge
            );
        }
    }

    const totem = k.get("totem").find(t => t.captureTower === attacker);

    if (totem) {
        totem.captureProgress += effectiveDamage;
    }

    // spawn ghost for necromancer
    const hero = k.get("hero")[0];
    if (
        hero?.placed &&
        hero.hasGhostSummon && target.hp() <= 0 &&
        hero.pos.add(TILE_SIZE / 2, TILE_SIZE / 2).dist(target.pos) <= hero.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE
    ) {
        const ghostCtx = {
            attacker: hero,
            damage: hero.stats.damage,
            element: hero.element,

            target: {
                type: "point",
                pos: target.pos,
                pathIndex: target.pathIndex + 1
            },

            context: k,
        } as AttackContext;

        const summon = spawnSummon(k, ghostCtx, "ghost", target.pos);
        summon.path = target.path;
    }
}