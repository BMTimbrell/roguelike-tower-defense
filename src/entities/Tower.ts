import type { KAPLAYCtx, Vec2 } from 'kaplay';
import { TILE_SIZE, type TowerId } from '../constants';
import type { TargetPriority, TowerGameObj, UnitEffects, TowerDef, SeedId, Tile, PathTile, RandomProjectiles} from '../types';
import { store, gameStateAtom } from '../store';
import { calcUpgradeCost } from '../utils/calcUpgradeCost';
import { TOWERS } from '../constants';
import makePlaceableOnGrid from '../utils/makePlacementOnGrid';
import makeUnitCombat from '../utils/makeUnitCombat';
import setTowerUI from '../utils/setTowerUI';
import { enemyTargetResolver, pathTargetResolver } from '../utils/targetingHelpers';

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
        targetType
    } = TOWERS[towerId];

    const priority: TargetPriority = "Most Progress";

    const tower: TowerGameObj = k.add([
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
            priority,
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            stats: { ...stats },
            unlockedUpgradeSlots: 0,
            tileGrid,
            pathTiles,
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
                    ...TOWERS[towerId].timeData as { maxMultiplier: number; growthPerSecond: number; },
                    intervalMultiplier: 1
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
        },
        "tower",
        towerId
    ]);

    const combat = makeUnitCombat(k, {
        owner: tower,
        stats: tower.stats,
        projectile,
        element,
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
            tileGrid[gridY][gridX].blocked = false;
        }
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

        if (tower.timeData) {
            const td = tower.timeData;

            td.intervalMultiplier = Math.min(
                td.maxMultiplier,
                td.intervalMultiplier * Math.pow(td.growthPerSecond, k.dt())
            );
        }

        combat.update();
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

