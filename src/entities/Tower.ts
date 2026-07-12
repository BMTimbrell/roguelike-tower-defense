import type { KAPLAYCtx, Vec2 } from 'kaplay';
import { CURSE_CRIT, ELEMENTS, REDUCED_RANGE_TOWERS, TILE_SIZE, type TowerId } from '../constants';
import type { TowerGameObj, UnitEffects, TowerDef, SeedId, Tile, PathTile, RandomProjectiles, TimeData, ContinuousEffect, Charge, BuffType, Battery, EnemyGameObj, ElementName, Overheat } from '../types';
import { store, gameStateAtom, controlsAtom, cachedSaveAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';
import { TOWERS } from '../constants';
import makePlaceableOnGrid, { setBlockedTiles } from '../utils/makePlacementOnGrid';
import makeUnitCombat from '../utils/makeUnitCombat';
import setTowerUI from '../utils/setTowerUI';
import { enemyTargetResolver, pathTargetResolver, rotateVector, selectTarget } from '../utils/targetingHelpers';
import { getLavaTiles, makeLavaTile, rebuildLava } from '../utils/lavaHelpers';
import hurtEnemy from '../utils/hurtEnemy';
import calcDamage from '../utils/calcDamage';
import getBuffValue from '../utils/getBuffValue';
import isButtonDown from '../utils/isButtonDown';
import { waitScaled } from '../utils/timerFunctions';
import makeProjectile from './Projectile';
import { playSfx, playUISound } from '../utils/soundHelpers';
import { tryShowTutorial } from '../utils/tutorialHelpers';

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
            towerBuffs: [],
            upgrades: [],
            ...("effects" in TOWERS[towerId] ? { effects: TOWERS[towerId].effects as UnitEffects } : {}),
            ...("shootSound" in TOWERS[towerId] ? { shootSound: TOWERS[towerId].shootSound as string } : {}),
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
            ...("charge" in TOWERS[towerId] ? { charge: { ...(TOWERS[towerId].charge as Charge) } } : {}),
            ...("battery" in TOWERS[towerId] ? { battery: { ...(TOWERS[towerId].battery as Battery) } } : {}),
            ...("spread" in TOWERS[towerId] ? { spread: TOWERS[towerId].spread as number } : {}),
            ...("deathCharge" in TOWERS[towerId] ? { deathCharge: { ...(TOWERS[towerId].deathCharge as { current: number; required: number; }) } } : {}),
            ...("overheat" in TOWERS[towerId] ? { overheat: { ...(TOWERS[towerId].overheat as Overheat) } } : {}),
            disabledTimeLeft: 0
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
        resolveTarget: tower.targetType === "enemy" ? enemyTargetResolver(k, tower) : pathTargetResolver(k, tower.pathTiles, tower, name === "Chomper Tower" ? "nearest" : "random")
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

            playUISound(k, "ui buy");

            // upgrade tutorial
            const save = store.get(cachedSaveAtom);
            if (save) {
                tryShowTutorial("towerUpgrade", save);
            }

            // build tower challenge
            const challengeManager = store.get(gameStateAtom).challengeManager;

            challengeManager.handleEvent({
                type: "BUILD_TOWER",
                towerId,
                waveActive: store.get(gameStateAtom).waveActive
            });

            // lava
            if ((TOWERS[towerId] as Record<"lavaTiles", []>).lavaTiles) {
                tower.lavaTiles ??= getLavaTiles(k, tower.pos, tower.stats.range * TILE_SIZE, tower.tileGrid);
                tower.lavaTiles.forEach(pos => makeLavaTile(k, pos, tower));
                combat.gun.play("pouring");
            }

            if (towerId === "orbit") {
                const orbiter = k.add([
                    k.pos(tower.pos.x, tower.pos.y),
                    k.sprite("planet"),
                    k.anchor("center"),
                    {
                        angle: 0,
                        r: 80,
                        hitEnemies: new Set<EnemyGameObj>(),
                        speed: 2 * Math.PI,
                        towerId: tower.instanceId
                    },
                    "orbiter"
                ]);

                orbiter.onUpdate(() => {
                    const timeScale = store.get(gameStateAtom).timeScale;
                    orbiter.r = tower.stats.range * TILE_SIZE;
                    const fireRateBuff = getBuffValue(tower, "fireRate");
                    const fireRateMultiplier = tower.towerBuffs
                        .filter(b => b.type === "fireRate")
                        .reduce((acc, b) => acc * b.multiplier, 1);

                    if (tower.state === "disabled") {
                        orbiter.speed = 0;
                        return;
                    }

                    orbiter.speed = 2 * Math.PI / (((1 - fireRateBuff) * fireRateMultiplier) * tower.stats.fireInterval);
                    orbiter.angle += orbiter.speed * k.dt() * timeScale;

                    const cx = tower.pos.x + (tower.footprint.w * TILE_SIZE) / 2;
                    const cy = tower.pos.y + (tower.footprint.h * TILE_SIZE) / 2;

                    orbiter.pos.x = cx + Math.cos(orbiter.angle) * orbiter.r;
                    orbiter.pos.y = cy + Math.sin(orbiter.angle) * orbiter.r;

                    (k.get("enemy") as EnemyGameObj[]).forEach(enemy => {
                        if (orbiter.hitEnemies.has(enemy)) return;

                        if (enemy.pos.dist(orbiter.pos) < TILE_SIZE * 0.75 && store.get(gameStateAtom).waveActive) {
                            const damageMult = 1 + getBuffValue(tower, "damage");

                            const { isCrit, damage } = calcDamage({
                                bonusDamage: 0,
                                bonusCritChance: enemy.has("curse") ? CURSE_CRIT + (k.get("hero")[0]?.hasCurseBuff ? 10 : 0) : 0,
                                critChance: tower.stats.critChance + (getBuffValue(tower, "critChance") * 100),
                                critDamage: tower.stats.critDamage * (1 + getBuffValue(tower, "critDamage")),
                                damage: tower.stats.damage,
                                damageMultiplier: damageMult
                            });
                            orbiter.hitEnemies.add(enemy);
                            waitScaled(k, 1, () => orbiter.hitEnemies.delete(enemy));
                            hurtEnemy(k, {
                                target: enemy,
                                damage,
                                isCrit,
                                element: tower.element,
                                attacker: tower
                            });

                            playSfx(k, "smash", 1, enemy.pos);
                        }
                    });

                });

                tower.onDestroy(() => {
                    k.destroy(orbiter);
                });
            } else if (towerId === "phoenix") {

                const phoenix = k.add([
                    k.sprite("phoenix", { anim: "fly" }),
                    k.pos(tower.pos),
                    k.opacity(1),
                    k.anchor("center"),
                    k.rotate(0),
                    {
                        orbitAngle: 0,
                        r: 80,
                        speed: 2 * Math.PI,
                        fireTimer: 0,
                        towerId: tower.instanceId
                    },
                    "phoenix"
                ]);

                phoenix.onUpdate(() => {
                    const timeScale = store.get(gameStateAtom).timeScale;

                    phoenix.opacity = tower.state === "disabled" ? 0 : 1;

                    if (tower.state === "disabled") return;

                    // orbit speed
                    const fireRateBuff = getBuffValue(tower, "fireRate");
                    const fireRateMultiplier = tower.towerBuffs
                        .filter(b => b.type === "fireRate")
                        .reduce((acc, b) => acc * b.multiplier, 1);

                    const fireInterval = (((1 - fireRateBuff) * fireRateMultiplier) * tower.stats.fireInterval);

                    phoenix.speed =
                        2 * Math.PI /
                        fireInterval;

                    phoenix.orbitAngle += phoenix.speed * k.dt() * timeScale;

                    phoenix.angle = (phoenix.orbitAngle * 180) / Math.PI - 90;

                    phoenix.r = tower.stats.range * TILE_SIZE;

                    const cx =
                        tower.pos.x + (tower.footprint.w * TILE_SIZE) / 2;

                    const cy =
                        tower.pos.y + (tower.footprint.h * TILE_SIZE) / 2;

                    phoenix.pos.x =
                        cx + Math.cos(phoenix.orbitAngle) * phoenix.r;

                    phoenix.pos.y =
                        cy + Math.sin(phoenix.orbitAngle) * phoenix.r;

                    if (phoenix.fireTimer > fireInterval) phoenix.fireTimer = fireInterval;

                    if (phoenix.fireTimer > 0) {
                        phoenix.fireTimer -= k.dt() * timeScale;
                    }

                    if (phoenix.fireTimer <= 0 && store.get(gameStateAtom).waveActive) {

                        const enemies = k.get("enemy") as EnemyGameObj[];

                        const target = selectTarget(enemies, { ...tower, stats: { ...tower.stats, range: 3 } }, phoenix.pos);

                        if (!target) return;

                        phoenix.fireTimer += (fireInterval / 12);

                        const damageMult =
                            1 + getBuffValue(tower, "damage");

                        const { isCrit, damage } = calcDamage({
                            bonusDamage: 0,
                            bonusCritChance:
                                target.has("curse")
                                    ? CURSE_CRIT +
                                    (k.get("hero")[0]?.hasCurseBuff ? 10 : 0)
                                    : 0,
                            critChance:
                                tower.stats.critChance +
                                (getBuffValue(tower, "critChance") * 100),
                            critDamage:
                                tower.stats.critDamage *
                                (1 + getBuffValue(tower, "critDamage")),
                            damage: tower.stats.damage,
                            damageMultiplier: damageMult
                        });

                        const rotatedOffset = rotateVector(
                            k,
                            k.vec2(-15, 0),
                            phoenix.angle * Math.PI / 180
                        );

                        playSfx(k, TOWERS[towerId]?.shootSound, 1, phoenix.pos);

                        makeProjectile(k, {
                            id: "fireball",
                            pos: phoenix.pos.add(rotatedOffset),
                            target,
                            damage,
                            crit: isCrit,
                            angle: phoenix.pos.angle(target.pos),
                            element: "Fire",
                            homing: true,
                            turnSpeed: 6,
                            scale: 1,
                            splashRadius: 0,
                            owner: tower as TowerGameObj
                        });
                    }
                });

                tower.onDestroy(() => {
                    k.destroy(phoenix);
                });
            }

            if (k.get("hero").some(hero => hero.changeNormalElement)) {
                if (tower.element === "Normal") {
                    const elements = Object.keys(ELEMENTS).filter(e => e !== "Normal") as ElementName[];
                    const rand = k.randi(elements.length);
                    tower.element = elements[rand];
                }
            }

            if (k.get("hero").some(hero => hero.hasRangeBoost)) {
                const hero = k.get("hero")[0];

                if (tower.name !== "Farm Tower") {
                    const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                    const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                    if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                        const amount = REDUCED_RANGE_TOWERS.some(name => name === tower.name) ? 0.5 : 1;
                        tower.stats.range += amount;
                    }
                }
            }

            if (k.get("hero").some(hero => hero.hasToxicAura)) {
                const hero = k.get("hero")[0];

                const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                    tower.element = "Poison";
                }
            }

            if (k.get("hero").some(hero => hero.hasBlock)) {
                const hero = k.get("hero")[0];
                const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                    tower.hasBlock = true;
                }
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
        const timeScale = store.get(gameStateAtom).timeScale;
        if (!tower.placed) {
            const controls = store.get(controlsAtom);
            if (isButtonDown(k, controls, "cancel")) k.destroy(tower);
            return;
        }

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

            buff.timeLeft -= k.dt() * timeScale;

            if (buff.timeLeft <= 0) {
                delete buffs[type as BuffType];
                continue;
            }

            icon.opacity = Math.max(0.3, buff.timeLeft / 3);

            i++;
        }

        for (const type in tower.buffIcons) {
            if (!buffs[type as BuffType]) {
                k.destroy(tower.buffIcons[type as BuffType]);
                delete tower.buffIcons[type as BuffType];
            }
        }

        // non-song buffs
        for (let i = tower.towerBuffs.length - 1; i >= 0; i--) {
            const buff = tower.towerBuffs[i];

            buff.timeLeft -= k.dt() * timeScale;

            if (buff.timeLeft <= 0) {
                tower.towerBuffs.splice(i, 1);
            }
        }

        if (tower.disabledTimeLeft > 0) {
            tower.disabledTimeLeft -= k.dt() * timeScale;

            if (tower.disabledTimeLeft <= 0) {
                tower.enterState("active");
            }
        }

        tower.lastShotTime += k.dt() * timeScale;

        if (tower.charge && tower.lastShotTime > tower.charge.decayDelay) {
            tower.charge.currentCharge = Math.max(
                0,
                tower.charge.currentCharge - 0.5 * k.dt() * timeScale
            );
        }

        if (tower.overheat) {
            const heat = tower.overheat;

            if (!combat.isFiring() || tower.state === "disabled" || !store.get(gameStateAtom).waveActive)
                heat.current -= heat.decayPerSecond * k.dt() * timeScale;

            heat.current = k.clamp(
                heat.current,
                0,
                heat.max
            );

            if (heat.current >= heat.max) {
                heat.overheated = true;
            }

            if (
                heat.overheated &&
                heat.current <= heat.recoveryThreshold
            ) {
                heat.overheated = false;
            }
        }

        // disabled by enemy
        if (tower.state === "disabled") return;

        if (tower.timeData) {
            const td = tower.timeData;

            td.timeMultiplier = Math.min(
                td.maxMultiplier,
                td.timeMultiplier * Math.pow(td.growthPerSecond, k.dt() * timeScale)
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

