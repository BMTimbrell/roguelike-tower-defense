import type { KAPLAYCtx, Vec2 } from "kaplay";
import { HEROES, TILE_SIZE, type HeroId, type SkillId } from "../constants";
import { gameStateAtom, store } from "../store";
import type { HeroGameObj, PathTile, SelectedHeroUI, TargetPriority, Tile } from "../types";
import makeUnitCombat from "../utils/makeUnitCombat";
import makePlaceableOnGrid, { setBlockedTiles } from "../utils/makePlacementOnGrid";
import { SKILLS } from "../constants";
import { enemyTargetResolver, pathTargetResolver } from "../utils/targetingHelpers";

export default function makeHero(k: KAPLAYCtx,
    opts: {
        heroId: HeroId
        pos: Vec2,
        tileGrid: Tile[][],
        pathTiles: PathTile[]
    }
): HeroGameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { heroId, pos, tileGrid, pathTiles } = opts;
    const {
        name,
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
    } = HEROES[heroId];

    const priority: TargetPriority = "Most Progress";

    const hero: HeroGameObj = k.make([
        k.pos(pos),
        k.color("#FFFFFF"),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        {
            heroId,
            name,
            priority,
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            tileGrid,
            pathTiles,
            targetType,
            stats: { ...stats },
            canReposition: true,
            skillIds: [] satisfies SkillId[],
            level: 1,
            footprint: { w: 1, h: 1},
            element,
            effects: [],
            canRotate
        },
        "tower",
        "hero",
        heroId
    ]);

    hero.onAdd(() => {
        const sprite = hero.add([
            k.sprite(baseSprite),
            k.color("#FFFFFF"),
            k.anchor("center"),
            k.rotate(90),
            k.opacity(0.5),
            k.pos(TILE_SIZE / 2, TILE_SIZE / 2)
        ]);

        hero.width = sprite.width;
        hero.height = sprite.height;

        hero.skillIds.forEach(sId => SKILLS.find(s => s.id === sId)?.apply(hero));

        const combat = makeUnitCombat(k, {
            owner: hero,
            stats: hero.stats,
            projectile,
            element,
            gunSprite,
            gunOffset: k.vec2(gunOffset.x, gunOffset.y),
            shootOffset: k.vec2(shootOffset.x, shootOffset.y),
            anchorOffset: k.vec2(anchorOffset.x, anchorOffset.y),
            resolveTarget: hero.targetType === "enemy" ? enemyTargetResolver(k, hero) : pathTargetResolver(k, hero.pathTiles, hero)
        });

        hero.onCollide("cursor", () => {
            hero.hovered = true;
        });

        hero.onCollideEnd("cursor", () => {
            hero.hovered = false;
        });

        hero.onDestroy(() => {
            if (hero.placed) {
                const gridX = Math.floor(hero.pos.x / TILE_SIZE);
                const gridY = Math.floor(hero.pos.y / TILE_SIZE);
                setBlockedTiles({
                    footprint: hero.footprint,
                    gridX,
                    gridY,
                    tileGrid: hero.tileGrid,
                    blocked: false
                });
            }

            combat.destroy();
        });

        const placement = makePlaceableOnGrid(k, {
            obj: hero,
            heroSprite: sprite,
            tileGrid,
            tileSize: TILE_SIZE,
            canConfirm: () => true,
            canCancel: () => false,
            onConfirm: () => {
                hero.selected = false;
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: null
                }));
            },
        });

        hero.onMouseDown("left", () => {
            if (hero.placed && hero.selected) {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: {
                        heroId: hero.heroId,
                        pos: hero.screenPos().scale(1 / k.getCamScale().x, 1 / k.getCamScale().y),
                        priority: hero.priority,
                        name: hero.name,
                        stats: hero.stats,
                        element: hero.element,
                        setPriority: (priority: TargetPriority) => {
                            hero.priority = priority;
                            store.set(gameStateAtom, prev => ({
                                ...prev,
                                selectedUI: {
                                    ...prev.selectedUI,
                                    priority: hero.priority
                                } as SelectedHeroUI
                            }));
                        },
                        skillIds: hero.skillIds,
                        level: hero.level
                    } as SelectedHeroUI
                }));
            } else if (!k.get("tower").some(t => t.selected && t.placed)) {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: null
                }));
            }
        });

        hero.onUpdate(() => {
            if (hero.placed) {
                combat.update();
                // if (combat.gun.angle > 90 || combat.gun.angle < -90) {
                //     hero.flipX = true;
                // } else hero.flipX = false;
                sprite.angle = combat.gun.angle + 90;
            }
        });
    });

    return hero;
}