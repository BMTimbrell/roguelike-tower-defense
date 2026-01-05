import type { KAPLAYCtx, GameObj } from 'kaplay';
import { TILE_SIZE, TOWER_RANGE_TOLERANCE } from '../constants';
import makeProjectile from './projectile';
import type { SelectedTower, Tower } from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';

export default function makeTower(
    k: KAPLAYCtx,
    {
        pos,
        name,
        placed,
        placeable,
        range,
        selected,
        hovered,
        fireInterval,
        shootTimer,
        cost,
        unlockedUpgradeSlots = 1,
        upgrades = [],
        upgradeCost = calcUpgradeCost(cost, unlockedUpgradeSlots)
    }: Tower
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
            name,
            placed,
            placeable,
            range,
            selected,
            hovered,
            fireInterval,
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
        makeProjectile(k, tower.pos.add(tower.width / 2, tower.height / 2), target);
    }

    tower.shoot = shoot;

    const rangeCircle = k.add([
        k.pos(tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2)),
        k.circle(tower.range * TILE_SIZE),
        k.color(255, 255, 255),
        k.opacity(0.2)
    ]);

    rangeCircle.onUpdate(() => {
        rangeCircle.hidden = !tower.selected;
    });

    const snapEvent = k.onCollide("tile", "cursor", tile => {
        tower.color = k.Color.fromHex(tile.blocked ? "#FF0000" : "#FFFFFF");

        tower.pos = tile.pos
        rangeCircle.pos = tower.pos.add(TILE_SIZE / 2, TILE_SIZE / 2);
        tower.placeable = !tile.blocked;
    });

    tower.onCollide("cursor", () => {
        tower.hovered = true;
    });

    tower.onCollideEnd("cursor", () => {
        tower.hovered = false;
    });

    tower.onDestroy(() => {
        snapEvent.cancel();
        k.destroy(rangeCircle);
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

            const tile = k.get("tile").find(tile => tile.pos.eq(tower.pos));
            if (tile) tile.blocked = true;

            snapEvent.cancel();
        } else if (tower.placed && tower.selected) {
            store.set(gameStateAtom, prev => ({
                ...prev,
                selectedTower: {
                    pos: tower.screenPos(),
                    name: tower.name,
                    range: tower.range,
                    fireInterval: tower.fireInterval,
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
            k.get("enemy").forEach(enemy => {
                if (enemy.pos.sub(0, enemy.height / 2).dist(rangeCircle.pos) <= tower.range * TILE_SIZE + TOWER_RANGE_TOLERANCE) {
                    if (tower.shootTimer <= 0) {
                        tower.shootTimer = tower.fireInterval;
                        tower.shoot?.(enemy);
                    }
                }
            });
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