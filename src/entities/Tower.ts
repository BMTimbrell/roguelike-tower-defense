import type { KAPLAYCtx, GameObj, Vec2 } from 'kaplay';
import { TILE_SIZE, TOWER_RANGE_TOLERANCE, type TowerId } from '../constants';
import makeProjectile from './projectile';
import type { SelectedTowerUI, Upgrade, TargetPriority, TowerGameObj } from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';
import { TOWERS } from '../constants';
import makeFloatingText from './floatingText';

export default function makeTower(
    k: KAPLAYCtx,
    opts: {
        towerId: TowerId
        pos: Vec2,
        tileGrid: boolean[][],
        mapPosX: number,
        mapPosY: number
    }
): GameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { towerId, pos, tileGrid, mapPosX, mapPosY } = opts;
    const { name, cost, stats } = TOWERS[towerId];

    const tower = k.add([
        k.sprite("basic tower base"),
        k.pos(pos),
        k.color("#FFFFFF"),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        {
            instanceId: `tower-${store.get(gameStateAtom).nextTowerId}`,
            towerId,
            name,
            cost,
            priority: "Most Progress",
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            stats: { ...stats },
            shootTimer: 0,
            unlockedUpgradeSlots: 1,
            upgrades: [],
            upgradeCost: calcUpgradeCost(cost, 1)
        },
        "tower",
        towerId
    ]) as TowerGameObj;

    const gun = k.add([
        k.sprite("basic tower"),
        k.pos(tower.pos.add(tower.width / 2 + 2, tower. height / 2)),
        k.color("#FFFFFF"),
        k.anchor(k.vec2(2 / 32, 0)),
        k.rotate(),
        k.opacity(0.5),
        k.scale(1),
        {
            rot: 0,
            update() {
                gun.pos = tower.pos.add(tower.width / 2 + 2, tower. height / 2);
                gun.opacity = tower.opacity;
                console.log(gun.width)
            }
        },
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
        k.destroy(gun);
        const gridX = Math.floor((tower.pos.x - mapPosX) / TILE_SIZE);
        const gridY = Math.floor((tower.pos.y - mapPosY) / TILE_SIZE);
        tileGrid[gridY][gridX] = false;
    });

    tower.onMouseDown("right", () => {
        if (!tower.placed) {
            k.destroy(tower);
        }
    });

    tower.onMousePress("left", () => {
        if (!tower.placed && tower.placeable) {
            if (store.get(gameStateAtom).gold < tower.cost) {
                makeFloatingText(k, { 
                    text: "Not enough gold", 
                    color: '#FF0000', 
                    pos: tower.pos, 
                    size: 16 
                });
                return;
            }
            tower.use(k.color("#ffffff"));
            gun.use(k.color("#ffffff"));
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
                    towerId: tower.instanceId,
                    pos: tower.screenPos().scale(1 / k.getCamScale().x, 1 / k.getCamScale().y),
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
                                } as SelectedTowerUI
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
                    setPriority: (priority: TargetPriority) => {
                        tower.priority = priority;
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            selectedTower: {
                                ...prev.selectedTower,
                                priority: tower.priority
                            } as SelectedTowerUI
                        }));
                    },
                    sellTower: () => {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            gold: prev.gold + tower.cost / 2,
                            selectedTower: null
                        }));
                        k.destroy(tower);
                    }
                } as SelectedTowerUI
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

            const target = selectTarget(
                k.get("enemy"),
                tower,
                rangeCircle.pos,
            );

            if (target) {
                const desired = gun.pos.angle(target.pos);
                const turnSpeed = 12; // radians per second

                const diff = shortestAngleDiff(gun.angle, desired);
                gun.angle += diff * Math.min(1, turnSpeed * k.dt());
            } else gun.angle = 0;

            if (tower.shootTimer <= 0 && target) {
                tower.shootTimer = tower.stats.fireInterval;

                gun.angle = gun.pos.angle(target.pos);

                tower.shoot?.(target);
                // optional: gun.play("shoot")
            }
        } else {
            const mousePos = k.toWorld(k.mousePos());
            const gridX = Math.floor((mousePos.x - mapPosX) / TILE_SIZE);
            const gridY = Math.floor((mousePos.y - mapPosY) / TILE_SIZE);

            const blocked = tileGrid[gridY]?.[gridX] === true || tileGrid[gridY]?.[gridX] === undefined || false;
            tower.color = k.Color.fromHex(blocked ? "#FF0000" : "#FFFFFF");
            gun.color = k.Color.fromHex(blocked ? "#FF0000" : "#FFFFFF");

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
                if (e.pathIndex + e.segmentProgress > best.pathIndex + best.segmentProgress) best = e;
                break;

            case "Least Progress":
                if (e.pathIndex + e.segmentProgress < best.pathIndex + best.segmentProgress) best = e;
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

function shortestAngleDiff(a: number, b: number) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
}