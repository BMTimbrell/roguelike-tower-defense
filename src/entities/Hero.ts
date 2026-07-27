import type { KAPLAYCtx, Vec2 } from "kaplay";
import { ELEMENTS, HEROES, REDUCED_RANGE_TOWERS, TILE_SIZE, type HeroId, type SkillId } from "../constants";
import { gameStateAtom, store } from "../store";
import type { HeroGameObj, PathTile, SelectedHeroUI, Song, TargetPriority, Tile, UnitEffects } from "../types";
import makeUnitCombat from "../utils/makeUnitCombat";
import makePlaceableOnGrid, { setBlockedTiles } from "../utils/makePlacementOnGrid";
import { SKILLS } from "../constants";
import { enemyTargetResolver, pathTargetResolver } from "../utils/targetingHelpers";
import { playUISound } from "../utils/soundHelpers";

export default function makeHero(k: KAPLAYCtx,
    opts: {
        heroId: HeroId;
        pos: Vec2;
        tileGrid: Tile[][];
        pathTiles: PathTile[];
        level: number;
    }
): HeroGameObj {
    k.get("tower").forEach(tower => tower.selected = false);

    const { heroId, pos, tileGrid, pathTiles, level } = opts;
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
        priority,
        targetType,
        levelUpOffset
    } = HEROES[heroId];

    const hero: HeroGameObj = k.make([
        k.pos(pos),
        k.color("#FFFFFF"),
        k.area({
            shape: new k.Rect(k.vec2(0), 32, 32)
        }),
        k.opacity(0.5),
        k.state("active", ["active", "disabled"]),
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
            towerBuffs: [],
            stats: { ...stats },
            canReposition: true,
            skillIds: heroId === "merchant" ?
                ["merchant-extra-income"] satisfies SkillId[] :
                heroId === "songstress" ? ["songstress-anthem-power"] satisfies SkillId[] :
                    heroId === "necromancer" ? ["summon-skeleton"] satisfies SkillId[] :
                        [] satisfies SkillId[],
            level,
            footprint: { w: 1, h: 1 },
            element,
            effects: [],
            canRotate,
            ...("shootSound" in HEROES[heroId] ? { shootSound: HEROES[heroId].shootSound as string } : {}),
            disabledUntil: 0,
            levelUpOffset,
            changeNormalElement: false,
            hasRangeBoost: false,
            hasBlock: false,
            goldRush: false,
            festeringToxins: false,
            volatileConcoction: false,
            hasToxicAura: false,
            hasDeadlyToxins: false,
            cripplingToxins: false,
            volatileConcoctionChance: 50,
            goldRushBoost: 2,
            heroIncomeMod: 1,
            freeCardDraw: false,
            fireIntervalBoost: 1,
            fireIntervalBoostTimer: 0,
            hasZombieSummon: false,
            hasSkeletonBuff: false,
            hasZombieBuff: false,
            hasGhostBuff: false,
            ...("melee" in HEROES[heroId] ? { melee: HEROES[heroId]?.melee } : {}),
            ...("effects" in HEROES[heroId] ? { effects: HEROES[heroId].effects as UnitEffects } : {}),
            ...("songs" in HEROES[heroId] ? { songs: HEROES[heroId].songs as Song[] } : {})
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
            gunSprite,
            gunOffset: k.vec2(gunOffset.x, gunOffset.y),
            shootOffset: k.vec2(shootOffset.x, shootOffset.y),
            anchorOffset: k.vec2(anchorOffset.x, anchorOffset.y),
            resolveTarget: hero.targetType === "enemy" ? enemyTargetResolver(k, hero) : pathTargetResolver(k, hero.pathTiles, hero, "nearest")
        });

        hero.onCollide("cursor", () => {
            hero.hovered = true;
        });

        hero.onCollideEnd("cursor", () => {
            hero.hovered = false;
        });

        hero.onStateEnter("active", () => {
            sprite.color = k.rgb(255, 255, 255);
            combat.gun.use(k.color(255, 255, 255));

            if (combat.meleeHandle && combat.meleeHead) {
                combat.meleeHandle.use(k.color(255, 255, 255));
                combat.meleeHead.use(k.color(255, 255, 255));
            }

            combat.gun.play("idle");
        });

        hero.onStateEnter("disabled", () => {
            sprite.color = k.rgb(150, 150, 150);
            combat.gun.use(k.color(150, 150, 150));
            if (combat.meleeHandle && combat.meleeHead) {
                combat.meleeHandle.use(k.color(150, 150, 150));
                combat.meleeHead.use(k.color(150, 150, 150));
            }

            combat.gun.play("idle");
            if (combat.gun.getCurAnim()?.speed) combat.gun.getCurAnim()!.speed = 0;
        });

        makePlaceableOnGrid(k, {
            obj: hero,
            heroSprite: sprite,
            tileGrid,
            tileSize: TILE_SIZE,
            canConfirm: () => true,
            canCancel: () => true,
            onConfirm: () => {
                hero.selected = false;
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: null,
                    heroButton: {
                        ...prev.heroButton,
                        visible: false
                    }
                }));

                playUISound(k, ((HEROES[heroId]) as { placementSound?: string })?.placementSound ?? "archer");

                if (hero.changeNormalElement) {
                    k.get("tower").forEach(tower => {
                        if (tower.element === "Normal") {
                            const elements = Object.keys(ELEMENTS).filter(e => e !== "Normal");
                            const rand = k.randi(elements.length);
                            tower.element = elements[rand];
                        }
                    });
                }

                if (hero.hasRangeBoost) {
                    k.get("tower").forEach(tower => {
                        if (tower.name === "Farm Tower") return;

                        const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                        const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                        if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                            // const amount = REDUCED_RANGE_TOWERS.some(name => name === tower.name) ? 0.5 : 1;
                            tower.stats.range++
                        }
                    });
                }

                if (hero.hasToxicAura) {
                    k.get("tower").forEach(tower => {
                        const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                        const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                        if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                            tower.element = "Poison";
                        }
                    });
                }

                if (hero.hasBlock) {
                    k.get("tower").forEach(tower => {
                        const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                        const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                        if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                            tower.hasBlock = true;
                        }
                    });
                }
            }
        });

        const mouseDown = hero.onMouseDown("left", () => {
            if (hero.placed && hero.selected) {
                store.set(gameStateAtom, prev => ({
                    ...prev,
                    selectedUI: {
                        heroId: hero.heroId,
                        pos: hero.screenPos(),
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

        const update = hero.onUpdate(() => {
            const timeScale = store.get(gameStateAtom).timeScale;
            if (hero.placed) {
                // non-song buffs
                for (let i = hero.towerBuffs.length - 1; i >= 0; i--) {
                    const buff = hero.towerBuffs[i];

                    buff.timeLeft -= k.dt() * timeScale;

                    if (buff.timeLeft <= 0) {
                        hero.towerBuffs.splice(i, 1);
                    }
                }

                if (hero.disabledTimeLeft > 0) {
                    hero.disabledTimeLeft -= k.dt() * timeScale;

                    if (hero.disabledTimeLeft <= 0) {
                        hero.enterState("active");
                    }
                }

                if (hero.fireIntervalBoostTimer > 0) {
                    hero.fireIntervalBoostTimer -= k.dt() * timeScale;
                } else hero.fireIntervalBoostTimer = 0;

                if (hero.state === "disabled") return;

                combat.update();

                sprite.angle = combat.gun.angle + 90;
            }
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
            update.cancel();
            mouseDown.cancel();
        });


    });

    return hero;
}