import type { KAPLAYCtx, Vec2 } from 'kaplay';
import { TILE_SIZE, type TowerId } from '../constants';
import type { SelectedTowerUI, Upgrade, TargetPriority, TowerGameObj } from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';
import { TOWERS } from '../constants';
import makePlaceableOnGrid from '../utils/makePlacementOnGrid';
import makeUnitCombat from '../utils/makeUnitCombat';
import calcFireInterval from '../utils/calcFireInterval';

export default function makeTower(
    k: KAPLAYCtx,
    opts: {
        towerId: TowerId
        pos: Vec2,
        tileGrid: boolean[][]
    }
): TowerGameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { towerId, pos, tileGrid } = opts;
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
        projectile
    } = TOWERS[towerId];

    const tower = k.add([
        k.sprite(baseSprite),
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
            unlockedUpgradeSlots: 1,
            upgrades: [],
            upgradeCost: calcUpgradeCost(cost, 1),
            element
        },
        "tower",
        towerId
    ]) as TowerGameObj;

    const combat = makeUnitCombat(k, {
        owner: tower,
        stats: tower.stats,
        projectile,
        element,
        gunSprite,
        gunOffset: k.vec2(gunOffset.x, gunOffset.y),
        shootOffset: k.vec2(shootOffset.x, shootOffset.y),
        anchorOffset: k.vec2(anchorOffset.x, anchorOffset.y)
    });

    tower.onCollide("cursor", () => {
        tower.hovered = true;
    });

    tower.onCollideEnd("cursor", () => {
        tower.hovered = false;
    });

    tower.onDestroy(() => {
        const gridX = Math.floor(tower.pos.x / TILE_SIZE);
        const gridY = Math.floor(tower.pos.y / TILE_SIZE);
        tileGrid[gridY][gridX] = false;
        combat.destroy();
    });

    makePlaceableOnGrid(k, {
        obj: tower,
        tileGrid,
        tileSize: TILE_SIZE,
        canConfirm: () => store.get(gameStateAtom).gold >= tower.cost,
        canCancel: () => true,
        onConfirm: () => {
            store.set(gameStateAtom, prev => ({
                ...prev,
                gold: prev.gold - tower.cost,
                selectedUI: null
            }));
        },
    });

    tower.onMouseDown("left", () => {
        if (tower.placed && tower.selected) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedUI: {
                    towerId: tower.instanceId,
                    pos: tower.screenPos().scale(1 / k.getCamScale().x, 1 / k.getCamScale().y),
                    priority: tower.priority,
                    name: tower.name,
                    stats: tower.stats,
                    cost: tower.cost,
                    unlockedUpgradeSlots: tower.unlockedUpgradeSlots,
                    upgrades: tower.upgrades,
                    upgradeCost: tower.upgradeCost,
                    element: tower.element,
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
                                selectedUI: {
                                    ...prev.selectedUI,
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
                                    const fireInterval = tower.stats.fireInterval;
                                    const newInterval = calcFireInterval(fireInterval, upgrade.amount);
                                    tower.stats.fireInterval = newInterval;
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
                            selectedUI: {
                                ...prev.selectedUI,
                                priority: tower.priority
                            } as SelectedTowerUI
                        }));
                    },
                    sellTower: () => {
                        store.set(gameStateAtom, prev => ({
                            ...prev,
                            gold: prev.gold + tower.cost / 2,
                            selectedUI: null
                        }));
                        k.destroy(tower);
                    }
                } as SelectedTowerUI
            }));
        } else if (!k.get("tower").some(t => t.selected && t.placed)) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedUI: null
            }));
        }
    });

    tower.onUpdate(() => {
        if (tower.placed) {
            combat.update();
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

