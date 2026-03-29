import type { KAPLAYCtx, Vec2 } from 'kaplay';
import { ELEMENTS, TILE_SIZE, type TowerId } from '../constants';
import type { TowerGameObj, UnitEffects, TowerDef, SeedId, Tile, PathTile, RandomProjectiles, TimeData, ContinuousEffect, Charge, BuffType } from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';
import { TOWERS } from '../constants';
import makePlaceableOnGrid, { setBlockedTiles } from '../utils/makePlacementOnGrid';
import makeUnitCombat from '../utils/makeUnitCombat';
import setTowerUI from '../utils/setTowerUI';
import { enemyTargetResolver, pathTargetResolver } from '../utils/targetingHelpers';
import { getLavaTiles, makeLavaTile, rebuildLava } from '../utils/lavaHelpers';

export default function makeTower(
    k: KAPLAYCtx,
    opts: {
        towerId: TowerId
        pos: Vec2,
        tileGrid: Tile[][],
        pathTiles: PathTile[]
    }
): TowerGameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { towerId, pos, tileGrid, pathTiles } = opts;
    const {
        name,
        cost,
        stats,
        baseSprite,
        gunSprite,
        element,
        gunOffset,
        anchorOffset,
        shootOffset,
        projectile,
        canRotate,
        targetType,
        footprint,
        priority
    } = TOWERS[towerId];

    const tower: TowerGameObj = k.add([
        k.sprite(baseSprite),
        k.pos(pos),
        k.color("#FFFFFF"),
        k.area({
            shape: new k.Rect(k.vec2(0), footprint.w * TILE_SIZE, footprint.h * TILE_SIZE)
        }),
        k.opacity(0.5),
        {
            instanceId: `tower-${store.get(gameStateAtom).nextTowerId}`,
            towerId,
            name,
            cost,
            priority,
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            stats: { ...stats },
            unlockedUpgradeSlots: 0,
            tileGrid,
            pathTiles,
            footprint,
            lastShotTime: 0,
            upgrades: [],
            ...("effects" in TOWERS[towerId] ? { effects: TOWERS[towerId].effects as UnitEffects } : {}),
            ...("farmData" in TOWERS[towerId] ? {
                farmData: TOWERS[towerId].farmData as {
                    plantedSeed: SeedId | null;
                    turnsRemaining: 1 | 2 | 3 | null;
                },
            } : {}),
            ...("timeData" in TOWERS[towerId] ? {
                timeData: {
                    ...TOWERS[towerId].timeData as TimeData,
                    timeMultiplier: 1
                },
            } : {}),
            ...("randomProjectiles" in TOWERS[towerId] ? {
                randomProjectiles: TOWERS[towerId].randomProjectiles as RandomProjectiles
            } : {}),
            upgradeCost: calcUpgradeCost(cost, 0),
            element,
            canRotate,
            targetType,
            ...(targetType === "point" ? { pathEntityLimit: TOWERS[towerId]?.pathEntityLimit ?? 10 } : {}),
            ...("melee" in TOWERS[towerId] ? { melee: TOWERS[towerId]?.melee } : {}),
            ...("killStacks" in TOWERS[towerId] ? { killStacks: TOWERS[towerId].killStacks as number } : {}),
            ...("continuousEffect" in TOWERS[towerId] ? { continuousEffect: TOWERS[towerId].continuousEffect as ContinuousEffect } : {}),
            ...("charge" in TOWERS[towerId] ? { charge: TOWERS[towerId].charge as Charge } : {}),
            disabledUntil: 0
        },
        k.state("active", ["active", "disabled"]),
        "tower",
        towerId
    ]);

    const combat = makeUnitCombat(k, {
        owner: tower,
        stats: tower.stats,
        projectile,
        gunSprite,
        gunOffset: k.vec2(gunOffset.x, gunOffset.y),
        shootOffset: k.vec2(shootOffset.x, shootOffset.y),
        anchorOffset: k.vec2(anchorOffset.x, anchorOffset.y),
        resolveTarget: tower.targetType === "enemy" ? enemyTargetResolver(k, tower) : pathTargetResolver(k, tower.pathTiles, tower)
    });

    tower.gun ??= combat.gun;

    tower.onCollide("cursor", () => {
        tower.hovered = true;
    });

    tower.onCollideEnd("cursor", () => {
        tower.hovered = false;
    });

    tower.onDestroy(() => {
        if (tower.placed) {
            const gridX = Math.floor(tower.pos.x / TILE_SIZE);
            const gridY = Math.floor(tower.pos.y / TILE_SIZE);
            setBlockedTiles({
                footprint: tower.footprint,
                gridX,
                gridY,
                tileGrid: tower.tileGrid,
                blocked: false
            });
        }
        combat.destroy();

        if (tower.lavaTiles) {
            k.get("lava tile").forEach(l => {
                if (l.towerId === tower.instanceId) k.destroy(l);
            });
        }

        (k.get("tower") as TowerGameObj[]).forEach(t => {
            if (t.lavaTiles) {
                rebuildLava(k, t);
            }
        });

        for (const type in tower.buffIcons) {
            if (tower.buffs?.[type as BuffType]) {
                k.destroy(tower.buffIcons[type as BuffType]);
                delete tower.buffIcons[type as BuffType];
            }
        }

    });

    makePlaceableOnGrid(k, {
        obj: tower,
        tileGrid,
        tileSize: TILE_SIZE,
        canConfirm: () => store.get(gameStateAtom).gold >= (tower.cost * (k.get("hero")[0]?.discount ?? 1)),
        canCancel: () => true,
        onConfirm: () => {
            const discount = k.get("hero")[0]?.discount ?? 1;
            store.set(gameStateAtom, prev => ({
                ...prev,
                gold: prev.gold - (tower.cost * discount),
                selectedUI: null
            }));

            if ((TOWERS[towerId] as Record<"lavaTiles", []>).lavaTiles) {
                tower.lavaTiles ??= getLavaTiles(k, tower.pos, tower.stats.range * TILE_SIZE, tower.tileGrid);
                tower.lavaTiles.forEach(pos => makeLavaTile(k, pos, tower));
                combat.gun.play("pouring");
            }

            if (k.get("hero").some(hero => hero.changeNormalElement)) {
                k.get("tower").forEach(tower => {
                    if (tower.element === "Normal") {
                        const elements = Object.keys(ELEMENTS).filter(e => e !== "Normal");
                        const rand = k.randi(elements.length);
                        tower.element = elements[rand];
                    }
                });
            }

            if (k.get("hero").some(hero => hero.hasRangeBoost)) {
                const hero = k.get("hero")[0];

                k.get("tower").forEach(tower => {
                    if (tower === hero) return;

                    const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                    const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                    if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                        tower.stats.range++;
                    }
                });
            }

            if (k.get("hero").some(hero => hero.hasToxicAura)) {
                const hero = k.get("hero")[0];

                k.get("tower").forEach(tower => {
                    if (tower === hero) return;

                    const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                    const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                    if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                        tower.element = "Poison";
                    }
                });
            }

            if (k.get("hero").some(hero => hero.hasBlock)) {
                const hero = k.get("hero")[0];

                k.get("tower").forEach(tower => {
                    if (tower === hero) return;

                    const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                    const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                    if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                        tower.hasBlock = true;
                    }
                });
            }
        },
    });

    tower.onMouseDown("left", () => {
        if (tower.placed && tower.selected) {
            setTowerUI(k, (TOWERS[towerId] as TowerDef)?.farmData ? "farm" : "combat", tower);
        } else if (!k.get("tower").some(t => t.selected && t.placed)) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedUI: null
            }));
        }
    });

    tower.onUpdate(() => {
        if (!tower.placed) return;

        const buffs = tower.buffs ?? {};
        tower.buffIcons ??= {};

        let i = 0;

        for (const type in buffs) {
            const buff = buffs[type as BuffType];
            if (!buff) continue;

            let icon = tower.buffIcons[type as BuffType];

            if (!icon) {
                icon = k.add([
                    k.sprite(getBuffIcon(type as BuffType)),
                    k.pos(tower.pos),
                    k.scale(1),
                    k.opacity(1),
                    k.anchor("center"),
                ]);

                tower.buffIcons[type as BuffType] = icon;
            }

            icon.pos = tower.pos.add(i * 20, 0);

            if (buff.expiresAt < k.time()) delete buffs[type as BuffType];

            const timeLeft = buff.expiresAt - k.time();
            icon.opacity = Math.max(0.3, timeLeft / 3);

            i++;
        }

        for (const type in tower.buffIcons) {
            if (!buffs[type as BuffType]) {
                k.destroy(tower.buffIcons[type as BuffType]);
                delete tower.buffIcons[type as BuffType];
            }
        }

        if (tower.state === "disabled" && k.time() >= tower.disabledUntil) {
            tower.enterState("active");
        }

        tower.lastShotTime += k.dt();

        if (tower.charge && tower.lastShotTime > tower.charge.decayDelay) {
            tower.charge.currentCharge = Math.max(
                0,
                tower.charge.currentCharge - 0.5 * k.dt()
            );
        }

        if (tower.state === "disabled") return;

        if (tower.timeData) {
            const td = tower.timeData;

            td.timeMultiplier = Math.min(
                td.maxMultiplier,
                td.timeMultiplier * Math.pow(td.growthPerSecond, k.dt())
            );
        }

        combat.update();
    });

    tower.onStateEnter("disabled", () => {
        tower.color = k.rgb(150, 150, 150);
        combat.gun.use(k.color(150, 150, 150));
        if (combat.meleeHandle && combat.meleeHead) {
            combat.meleeHandle.use(k.color(150, 150, 150));
            combat.meleeHead.use(k.color(150, 150, 150));
        }

        combat.gun.play("idle");
        if (combat.gun.getCurAnim()?.speed) combat.gun.getCurAnim()!.speed = 0;

        if (!tower.lavaTiles) return;

        k.get("lava tile").forEach(l => {
            if (l.towerId === tower.instanceId) k.destroy(l);
        });
    });

    tower.onStateEnter("active", () => {
        tower.color = k.rgb(255, 255, 255);
        combat.gun.use(k.color(255, 255, 255));

        if (combat.meleeHandle && combat.meleeHead) {
            combat.meleeHandle.use(k.color(255, 255, 255));
            combat.meleeHead.use(k.color(255, 255, 255));
        }

        if (combat.gun.hasAnim("pouring")) combat.gun.play("pouring");
        else combat.gun.play("idle");

        if (!tower.lavaTiles) return;

        tower.lavaTiles.forEach(pos => makeLavaTile(k, pos, tower));
    });

    return tower;
}

export function addSelectTowerListener(k: KAPLAYCtx) {

    k.onMousePress("left", () => {
        const hoveredTower = k.get("tower").find(tower => tower.hovered);

        if (hoveredTower && !k.get("tower").some(t => t !== hoveredTower && t.pos.eq(hoveredTower.pos)) && hoveredTower.placed) {
            hoveredTower.selected = !hoveredTower.selected;
        }

        k.get("tower").forEach(tower => {
            if (tower.selected && tower.placed && tower !== hoveredTower) tower.selected = false;
        });
    });
}

function getBuffIcon(type: BuffType) {
    switch (type) {
        case "damage": return "buff damage";
        case "fireRate": return "buff fire rate";
        case "critChance": return "buff crit";
        case "critDamage": return "buff crit damage";
    }
}

