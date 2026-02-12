import type { KAPLAYCtx, Vec2 } from "kaplay";
import { HEROES, TILE_SIZE, type HeroId } from "../constants";
import { gameStateAtom, store } from "../store";
import type { HeroGameObj, SelectedHeroUI, TargetPriority } from "../types";
import makeUnitCombat from "../utils/makeUnitCombat";
import makePlaceableOnGrid from "../utils/makePlacementOnGrid";
import { SKILLS } from "../constants";

export default function makeHero(k: KAPLAYCtx,
    opts: {
        heroId: HeroId
        pos: Vec2,
        tileGrid: boolean[][],

    }
): HeroGameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { heroId, pos, tileGrid } = opts;
    const {
        name,
        stats,
        baseSprite,
        gunSprite,
        element,
        gunOffset,
        anchorOffset,
        shootOffset,
        projectile
    } = HEROES[heroId];

    const hero = k.add([
        k.sprite(baseSprite),
        k.pos(pos),
        k.color("#FFFFFF"),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        {
            heroId,
            name,
            priority: "Most Progress",
            placed: false,
            placeable: false,
            selected: true,
            hovered: true,
            stats: { ...stats },
            canReposition: true,
            skillIds: [SKILLS[0].id, SKILLS[3].id, SKILLS[1].id, SKILLS[2].id],
            level: 1,
            element,
            effects: []
        },
        "tower",
        "hero",
        heroId
    ]) as HeroGameObj;

    hero.skillIds.forEach(sId => SKILLS.find(s => s.id === sId)?.apply(hero));

    const combat = makeUnitCombat(k, {
        owner: hero,
        stats: hero.stats,
        projectile,
        element,
        gunSprite,
        gunOffset: k.vec2(gunOffset.x, gunOffset.y),
        shootOffset: k.vec2(shootOffset.x, shootOffset.y),
        anchorOffset: k.vec2(anchorOffset.x, anchorOffset.y)
    });

    hero.onCollide("cursor", () => {
        hero.hovered = true;
    });

    hero.onCollideEnd("cursor", () => {
        hero.hovered = false;
    });

    hero.onDestroy(() => {
        const gridX = Math.floor(hero.pos.x / TILE_SIZE);
        const gridY = Math.floor(hero.pos.y / TILE_SIZE);
        tileGrid[gridY][gridX] = false;
        combat.destroy();
    });

    const placement = makePlaceableOnGrid(k, {
        obj: hero,
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
                    reposition: () => {
                        if (store.get(gameStateAtom).heroCanReposition) {
                            placement.tryReposition();
                        }
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
            if (combat.gun.angle > 90 || combat.gun.angle < -90) {
                hero.flipX = true;
            } else hero.flipX = false;
        }
    });

    return hero;
}