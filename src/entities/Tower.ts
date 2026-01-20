import type { KAPLAYCtx, GameObj, Vec2 } from 'kaplay';
import { TILE_SIZE, TOWER_RANGE_TOLERANCE } from '../constants';
import makeProjectile from './projectile';
import type { SelectedTower, targetPriority, Tower, Upgrade } from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';

export default function makeTower(
    k: KAPLAYCtx,
    {
        pos,
        name,
        stats,
        shootTimer,
        cost,
        unlockedUpgradeSlots = 1,
        upgrades = [],
        upgradeCost = calcUpgradeCost(cost, unlockedUpgradeSlots)
    }: Tower,
    tileGrid: boolean[][],
    mapPosX: number,
    mapPosY: number
): GameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const tower = k.add([
        k.rect(32, 32),
        k.pos(pos),
        k.color(255, 255, 255),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        {
            towerId: `tower-${store.get(gameStateAtom).nextTowerId}`,
            name,
            priority: "Most Progress",
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            stats,
            shootTimer,
            cost,
            unlockedUpgradeSlots,
            upgrades,
            upgradeCost
        } as Tower,
        "tower",
        name
    ]);

    function shoot(target: GameObj) {
        const roll = Math.random();
        const critChance = tower.stats.critChance / 100;

        const willCrit = roll < critChance;

        const damage = willCrit
            ? tower.stats.damage * (1 + tower.stats.critDamage / 100)
            : tower.stats.damage;
        makeProjectile(k, { pos: tower.pos.add(tower.width / 2, tower.height / 2), target, damage: damage, crit: willCrit });
    }

    tower.shoot = shoot;

    const rangeCircle = k.add([
        k.pos(tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2)),
        k.circle(tower.stats.range * TILE_SIZE),
        k.color(255, 255, 255),
        k.opacity(0.2)
    ]);

    rangeCircle.onUpdate(() => {
        rangeCircle.hidden = !tower.selected && !tower.hovered;
        rangeCircle.use(k.circle(tower.stats.range * TILE_SIZE));
    });

    tower.onCollide("cursor", () => {
        tower.hovered = true;
    });

    tower.onCollideEnd("cursor", () => {
        tower.hovered = false;
    });

    tower.onDestroy(() => {
        k.destroy(rangeCircle);
        const gridX = Math.floor((tower.pos.x - mapPosX) / TILE_SIZE);
        const gridY = Math.floor((tower.pos.y - mapPosY) / TILE_SIZE);
        tileGrid[gridY][gridX] = false;
    });

    tower.onMouseDown("right", () => {
        if (!tower.placed) {
            k.destroy(tower);
        }
    });

    tower.onMouseDown("left", () => {
        if (!tower.placed && tower.placeable) {
            tower.placed = true;
            tower.selected = false;
            tower.opacity = 1;
            store.set(gameStateAtom, prev => ({
                ...prev,
                gold: prev.gold - tower.cost,
                selectedTower: null
            }));

            // Mark tile as blocked
            const gridX = Math.floor((tower.pos.x - mapPosX) / TILE_SIZE);
            const gridY = Math.floor((tower.pos.y - mapPosY) / TILE_SIZE);
            tileGrid[gridY][gridX] = true;
        } else if (tower.placed && tower.selected) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedTower: {
                    towerId: tower.towerId,
                    pos: tower.screenPos(),
                    priority: tower.priority,
                    name: tower.name,
                    stats: tower.stats,
                    cost: tower.cost,
                    unlockedUpgradeSlots: tower.unlockedUpgradeSlots,
                    upgrades: tower.upgrades,
                    upgradeCost: tower.upgradeCost,
                    addUpgradeSlot: () => {
                        if (store.get(gameStateAtom).gold >= tower.upgradeCost) {
                            tower.unlockedUpgradeSlots++;

                            store.set(gameStateAtom, prev => ({
                                ...prev,
                                gold: prev.gold - tower.upgradeCost
                            }));

                            tower.upgradeCost = calcUpgradeCost(tower.cost, tower.unlockedUpgradeSlots);
                            store.set(gameStateAtom, prev => ({
                                ...prev,
                                selectedTower: {
                                    ...prev.selectedTower,
                                    unlockedUpgradeSlots: tower.unlockedUpgradeSlots,
                                    upgradeCost: tower.upgradeCost
                                } as SelectedTower
                            }));
                        }
                    },
                    setUpgrades: (upgrades: Upgrade[]) => {
                        tower.upgrades = upgrades;
                        tower.upgrades.forEach(upgrade => {
                            if (upgrade.active && !upgrade.used) {
                                if (upgrade.stat === "fireInterval") {
                                    tower.stats.fireInterval /= 1 + upgrade.amount / 100;
                                    tower.stats.fireInterval = Math.max(0.05, tower.stats.fireInterval);
                                } else if (upgrade.stat === "critChance" || upgrade.stat === "critDamage" || !upgrade.percentage) {
                                    tower.stats[upgrade.stat] += upgrade.amount;
                                } else {
                                    tower.stats[upgrade.stat] += Math.max(1, Math.round(tower.stats[upgrade.stat] * (upgrade.amount / 100)));
                                }
                                upgrade.used = true;
                            }
                        });
                        return tower.stats;
                    },
                    setPriority: (priority: targetPriority) => {
                        tower.priority = priority;
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            selectedTower: {
                                ...prev.selectedTower,
                                priority: tower.priority
                            } as SelectedTower
                        }));
                    },
                    sellTower: () => {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            gold: prev.gold + tower.cost / 2,
                            selectedTower: null
                        }));
                        k.destroy(tower)
                    }
                } as SelectedTower
            }));
        } else if (!k.get("tower").some(t => t.selected && t.placed)) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedTower: null
            }));
        }
    });

    tower.onUpdate(() => {
        if (tower.placed) {
            tower.shootTimer -= k.dt();

            if (tower.shootTimer <= 0) {
                const target = selectTarget(
                    k.get("enemy"),
                    tower,
                    rangeCircle.pos,
                );

                if (target) {
                    tower.shootTimer = tower.stats.fireInterval;
                    tower.shoot?.(target);
                }
            }
        } else {
            const mousePos = k.mousePos();
            const gridX = Math.floor((mousePos.x - mapPosX) / TILE_SIZE);
            const gridY = Math.floor((mousePos.y - mapPosY) / TILE_SIZE);

            const blocked = tileGrid[gridY]?.[gridX] || false;
            tower.color = k.Color.fromHex(blocked ? "#FF0000" : "#FFFFFF");

            tower.pos = k.vec2(mapPosX + gridX * TILE_SIZE, mapPosY + gridY * TILE_SIZE);
            rangeCircle.pos = tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2);
            tower.placeable = !blocked;
        }
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

function selectTarget(
    enemies: GameObj[],
    tower: GameObj,
    rangePos: Vec2,
): GameObj | null {

    let best: GameObj | null = null

    for (const e of enemies) {
        if (e.pos.dist(rangePos) > tower.stats.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
            continue;
        }

        if (!best) {
            best = e;
            continue;
        }

        switch (tower.priority) {
            case "Most Progress":
                if (e.pathIndex > best.pathIndex + e.segmentProgress) best = e;
                break;

            case "Least Progress":
                if (e.pathIndex + e.segmentProgress < best.pathIndex) best = e;
                break;

            case "Highest HP":
                if (e.hp() > best.hp()) best = e;
                break;

            case "Lowest HP":
                if (e.hp() < best.hp()) best = e;
                break;
        }
    }

    return best;
}