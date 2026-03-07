import type { Upgrade, LevelWaves, EnemyConfig, TowerDef, ElementDef, ElementName, ProjectileDef, HeroDef, HeroSkillDefBase, TowerGameObj, Seed } from "./types";
import burnEffect from "./kaplayComponents/burnEffect";
import calcFireInterval from "./utils/calcFireInterval";
import poisonEffect from "./kaplayComponents/poisonEffect";
import chillEffect from "./kaplayComponents/chillEffect";
import chargeEffect from "./kaplayComponents/chargeEffect";
import curseEffect from "./kaplayComponents/curseEffect";
import { electricAoeBurst, flameAoeBurst, frostAoeBurst } from "./utils/makeUnitCombat";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const TILE_SIZE = 32;
export const TOWER_RANGE_TOLERANCE = 5;
export const MAX_TOWER_UPGRADES = 5;
export const FOG_Z = 900;
export const MAX_HAND_SIZE = 6;
export const ROUND_DRAW_NUM = 3;
export const DAMAGE_NUMBER_SIZE = 14;
export const SMALL_DAMAGE_NUMBER_SIZE = 11;
export const CRIT_DAMAGE_NUMBER_SIZE = 22;
export const DAMAGE_NUMBER_COLOR = "#fffb00";
export const CRIT_DAMAGE_NUMBER_COLOR = "#ff0000";
export const CHARGE_DAMAGE_REQUIRED = 80;
export const CHILL_PERCENT = 6;
export const MAX_CHILL_STACKS = 5;
export const ICE_DAMAGE_PER_STACK = 10;
export const MAX_CHARGE_STACKS = 5;
export const STUN_PERCENTAGES = [5, 10, 30, 50, 60];
export const STUN_DURATION = 1;
export const CURSE_CRIT = 10;
export const TIME_TOWER_BASE_ANIM_SPEED = 30;
export const SCYTHE_MAX_KILL_STACKS = 70;
export const UPGRADES: Upgrade[] = [{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 2,
    cost: 1,
    percentage: false
},
{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 5,
    cost: 2,
    percentage: false
},
{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "damage",
    name: "Damage",
    icon: "sprites/damage-icon.png",
    amount: 8,
    cost: 3,
    percentage: false
},
{
    stat: "range",
    name: "Range",
    icon: "sprites/range-icon.png",
    amount: 1,
    cost: 1,
    percentage: false
},
{
    stat: "range",
    name: "Range",
    icon: "sprites/range-icon.png",
    amount: 3,
    cost: 2,
    percentage: false
},
{
    stat: "range",
    name: "Range",
    icon: "sprites/range-icon.png",
    amount: 5,
    cost: 3,
    percentage: false
},
{
    stat: "fireInterval",
    name: "Fire Rate",
    icon: "sprites/firerate-icon.png",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire Rate",
    icon: "sprites/firerate-icon.png",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire Rate",
    icon: "sprites/firerate-icon.png",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit Chance",
    icon: "sprites/critchance-icon.png",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit Chance",
    icon: "sprites/critchance-icon.png",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit Chance",
    icon: "sprites/critchance-icon.png",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit Damage",
    icon: "sprites/critdamage-icon.png",
    amount: 50,
    cost: 1,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit Damage",
    icon: "sprites/critdamage-icon.png",
    amount: 120,
    cost: 2,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit Damage",
    icon: "sprites/critdamage-icon.png",
    amount: 180,
    cost: 3,
    percentage: true
}] as const;

export const LEVEL_WAVES = {
    level1: {
        startDelay: 120,
        waves: [
            {
                spawns: [
                    { id: "slime", count: 5, interval: 1 },
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "skeleton", count: 5, interval: 1 },
                    { id: "slime", count: 5, interval: 0.75 }
                ],
                reward: 100
            },
            {
                spawns: [
                    { id: "skeleton", count: 5, interval: 1 },
                    { id: "slime", count: 5, interval: 0.75 }
                ],
                reward: 200
            }
        ],
    },

    level2: {
        startDelay: 30,
        waves: [
            {
                spawns: [{ id: "slime", count: 5, interval: 0.4 }],
                reward: 50
            }
        ],
    },
} as const satisfies Record<string, LevelWaves>;

export type LevelId = keyof typeof LEVEL_WAVES;

export const ENEMIES = {
    slime: {
        hp: 10,
        damage: 1,
        speed: 50,
        sprite: "slime"
    },
    skeleton: {
        hp: 35,
        damage: 1,
        speed: 50,
        sprite: "skeleton"
    }
} as const satisfies Record<string, EnemyConfig>;

export type EnemyId = keyof typeof ENEMIES;

export const TOWERS = {
    basic: {
        name: "Basic Tower",
        gunSprite: "basic tower",
        baseSprite: "basic tower base",
        sprite: "basic-tower-sprite.png",
        description: "A weak but cheap tower",
        cost: 45,
        stats: {
            damage: 4,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 2, y: 0 },
        anchorOffset: { x: 4 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "basic",
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    fire: {
        name: "Fire Tower",
        gunSprite: "fire tower",
        baseSprite: "fire tower base",
        sprite: "fire-tower-sprite.png",
        description: "A tower that shoots fireballs at enemies",
        cost: 60,
        stats: {
            damage: 5,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Fire",
        gunOffset: { x: 3, y: 0 },
        anchorOffset: { x: 6 / 32, y: 0 },
        shootOffset: { x: -25, y: 0 },
        projectile: "fireball",
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    slime: {
        name: "Slime Tower",
        gunSprite: "slime tower",
        baseSprite: "slime tower base",
        sprite: "slime-tower-sprite.png",
        description: "Shoots balls of slime that have a 50% chance to bounce between targets",
        cost: 75,
        stats: {
            damage: 3,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Poison",
        gunOffset: { x: -4, y: 0 },
        anchorOffset: { x: -6 / 32, y: 0 },
        shootOffset: { x: -15, y: 0 },
        projectile: "slimeball",
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.bounces ??= 100;
                    projectile.behaviors.bounceChance ??= 0.5;
                    projectile.behaviors.bounceRange ??= 4 * TILE_SIZE;
                    projectile.behaviors.bounceDamageMultiplier ??= 1;
                });
            }
        }],
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    ice: {
        name: "Ice Tower",
        gunSprite: "ice tower",
        baseSprite: "ice tower base",
        sprite: "ice-tower-sprite.png",
        description: "Emits a frost that damages all enemies in range",
        cost: 80,
        stats: {
            damage: 2,
            range: 2.5,
            fireInterval: 1,
            critChance: 5,
            critDamage: 100
        },
        element: "Ice",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "aoe";
                ctx.visualEffect = frostAoeBurst;
            }
        }],
        canRotate: false,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    lightning: {
        name: "Lightning Tower",
        gunSprite: "lightning tower",
        baseSprite: "lightning tower base",
        sprite: "lightning-tower-sprite.png",
        description: "Fires lightning stikes that hit up to 3 targets at once",
        cost: 90,
        stats: {
            damage: 4,
            range: 3,
            fireInterval: 1,
            critChance: 5,
            critDamage: 100
        },
        element: "Electric",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "lightning";
            }
        }],
        canRotate: false,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    lux: {
        name: "Lux Tower",
        gunSprite: "lux tower",
        baseSprite: "lux tower base",
        sprite: "lux-tower-sprite.png",
        description: "Fires small orbs of light in quick succession",
        cost: 70,
        stats: {
            damage: 3,
            range: 3,
            fireInterval: 0.375,
            critChance: 5,
            critDamage: 100
        },
        element: "Light",
        gunOffset: { x: -1 / 2, y: -1 / 2 },
        anchorOffset: { x: -1 / 32, y: -1 / 32 },
        shootOffset: { x: -20, y: 0 },
        projectile: "lightOrb",
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    crow: {
        name: "Crow Tower",
        gunSprite: "crow tower",
        baseSprite: "crow tower base",
        sprite: "crow-tower-sprite.png",
        description: "A shadowy crow follows and attacks enemies in range",
        cost: 75,
        stats: {
            damage: 6,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Dark",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "crow",
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.persistent = {
                        owner: ctx.attacker as TowerGameObj,
                        state: "flying",
                        origin: ctx.origin
                    };
                });
            }
        }],
        canRotate: false,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    bomb: {
        name: "Bomb Tower",
        gunSprite: "bomb tower",
        baseSprite: "bomb tower base",
        sprite: "bomb-tower-sprite.png",
        description: "Shoots bombs that explodes, dealing splash damage",
        cost: 90,
        stats: {
            damage: 8,
            range: 5,
            fireInterval: 1.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Fire",
        gunOffset: { x: -1, y: 0 },
        anchorOffset: { x: -2 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "bomb",
        canRotate: true,
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.animOnDestroy = "explode";
                });
            }
        }],
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    farm: {
        name: "Farm Tower",
        gunSprite: "farm tower",
        baseSprite: "farm tower base",
        sprite: "farm-tower-sprite.png",
        description: "You reap what you sow!",
        cost: 60,
        stats: {
            damage: 999,
            range: 0,
            fireInterval: 0,
            critChance: 100,
            critDamage: 500
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: false,
        effects: [],
        farmData: {
            plantedSeed: null,
            turnsRemaining: null
        },
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    nightshade: {
        name: "Nightshade Tower",
        gunSprite: "nightshade tower",
        baseSprite: "nightshade tower base",
        sprite: "basic-tower-sprite.png",
        description: "Shoots shadowy blobs that absorb life, dealing bonus damage based on the enemy's missing health",
        cost: 60,
        stats: {
            damage: 4,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Dark",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "shadowBlob",
        canRotate: true,
        effects: [{
            secondEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    const maxHp = ctx.target?.maxHP() ?? 1;
                    const hp = ctx.target?.hp() ?? 0;
                    const missingHealthPercent = 1 - hp / maxHp;

                    projectile.bonusDamage = ctx.damage * missingHealthPercent;
                });
            }
        }],
        source: "farm",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    chili: {
        name: "Chili Pepper Tower",
        gunSprite: "chili tower",
        baseSprite: "plant tower base",
        sprite: "basic-tower-sprite.png",
        description: "Deals fire damage to all enemies in range",
        cost: 60,
        stats: {
            damage: 6,
            range: 2.5,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 100
        },
        element: "Fire",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: false,
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "aoe";
                ctx.visualEffect = flameAoeBurst;
            }
        }],
        source: "farm",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    starfruit: {
        name: "Starfruit Tower",
        gunSprite: "starfruit tower",
        baseSprite: "plant tower base",
        sprite: "basic-tower-sprite.png",
        description: "Shoots a volley of 3 stars",
        cost: 60,
        stats: {
            damage: 5,
            range: 4,
            fireInterval: 1,
            critChance: 5,
            critDamage: 100
        },
        element: "Light",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "star",
        canRotate: false,
        effects: [{
            firstEffect(ctx) {
                if (ctx.projectiles.length === 0) return;

                ctx.volley ??= {};
                ctx.volley.volleyChance ??= 100;
            }
        }],
        source: "farm",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    time: {
        name: "Time Tower",
        gunSprite: "time tower",
        baseSprite: "time tower base",
        sprite: "time-tower-sprite.png",
        description: "Fire rate decreases with time",
        cost: 60,
        stats: {
            damage: 4,
            range: 3,
            fireInterval: 0.15,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 2, y: 0 },
        anchorOffset: { x: 4 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "basic",
        canRotate: true,
        timeData: {
            maxMultiplier: 10,
            growthPerSecond: 1.1,
            timeScaling: {
                interval: true,
                damage: false,
                damagePow: 1
            }
        },
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    toilet: {
        name: "Toilet Tower",
        gunSprite: "toilet tower",
        baseSprite: "toilet tower base",
        sprite: "toilet-tower-sprite.png",
        description: "Spits poop on the path",
        cost: 50,
        stats: {
            damage: 5,
            range: 3,
            fireInterval: 2,
            critChance: 5,
            critDamage: 100
        },
        element: "Poison",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "poop",
        canRotate: false,
        source: "starting",
        targetType: "point",
        pathEntityLimit: 30,
        footprint: {
            w: 1,
            h: 1
        }
    },
    questionMark: {
        name: "? Tower",
        gunSprite: "questionMark tower",
        baseSprite: "questionMark tower base",
        sprite: "questionMark-tower-sprite.png",
        description: "Shoots random projectiles",
        cost: 80,
        stats: {
            damage: 4,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 2, y: 0 },
        anchorOffset: { x: 4 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "basic",
        randomProjectiles: [
            {
                projectile: "slimeball",
                element: "Poison",
                behaviors: {
                    bounces: 100,
                    bounceChance: 0.5,
                    bounceRange: 4 * TILE_SIZE,
                    bounceDamageMultiplier: 1
                }
            },
            {
                projectile: "bomb",
                element: "Fire",
                behaviors: {
                    animOnDestroy: "explode"
                }
            },
            {
                projectile: "arrow",
                element: "Normal",
                behaviors: {
                    distanceDamageMultiplier: 0,
                    distanceDamageCap: 0.5
                }
            },
            {
                projectile: "fireball",
                element: "Fire"
            },
            {
                projectile: "star",
                element: "Light",
                volley: true
            },
            {
                projectile: "poop",
                element: "Poison"
            },
            {
                projectile: "lightOrb",
                element: "Light"
            },
            {
                projectile: "shadowBlob",
                element: "Dark"
            },
            {
                projectile: "basic",
                element: "Normal"
            },
            {
                projectile: "icicle",
                element: "Ice",
                behaviors: {
                    critChance: 45
                }
            }
        ],
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    hammer: {
        name: "Hammer Tower",
        gunSprite: "hammer tower",
        baseSprite: "hammer tower base",
        sprite: "hammer-tower-sprite.png",
        description: "Smash enemies with a hammer, dealing damage in a small area",
        cost: 70,
        stats: {
            damage: 30,
            range: 1.5,
            fireInterval: 2,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: false,
        source: "starting",
        targetType: "enemy",
        melee: {
            meleeHandleSprite: "hammer handle",
            meleeHeadSprite: "hammer head",
            handleLength: 7,
            swingAngle: 90
        },
        effects: [{
            firstEffect(ctx) {
                if (!ctx.meleeAttack) return;

                ctx.attackType = "melee";

                ctx.meleeAttack = {
                    ...ctx.meleeAttack,
                    splashRadius: 1.3,
                    swingTime: 0.25,
                    onImpact(k, impactPos) {
                        const smashEffect = k.add([
                            k.sprite("smash effect", { anim: "smash" }),
                            k.anchor("center"),
                            k.pos(impactPos)
                        ]);

                        smashEffect.onAnimEnd(() => {
                            k.destroy(smashEffect);
                        });
                    }
                };
            }
        }],
        footprint: {
            w: 1,
            h: 1
        }
    },
    icicle: {
        name: "Icicle Tower",
        gunSprite: "icicle tower",
        baseSprite: "icicle tower base",
        sprite: "icicle-tower-sprite.png",
        description: "Shoots icicles. This tower has a high crit chance",
        cost: 75,
        stats: {
            damage: 5,
            range: 3,
            fireInterval: 0.75,
            critChance: 50,
            critDamage: 100
        },
        element: "Ice",
        gunOffset: { x: 2, y: 0 },
        anchorOffset: { x: 4 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "icicle",
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    snowball: {
        name: "Snowball Tower",
        gunSprite: "snowball tower",
        baseSprite: "snowball tower base",
        sprite: "snowball-tower-sprite.png",
        description: "Shoots giant snowballs that deal splash damage",
        cost: 250,
        stats: {
            damage: 20,
            range: 5,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 100
        },
        element: "Ice",
        gunOffset: { x: 5, y: -1 },
        anchorOffset: { x: 10 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: "snowball",
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.animOnDestroy = "explode";
                });
            }
        }]
    },
    shadowBall: {
        name: "Shadow Ball Tower",
        gunSprite: "shadow ball tower",
        baseSprite: "shadow ball tower base",
        sprite: "shadow-ball-tower-sprite.png",
        description: "Shoots a dark, shadowy blob that deals splash damage and has a 50% chance to bounce between enemies",
        cost: 300,
        stats: {
            damage: 12,
            range: 5,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 100
        },
        element: "Dark",
        gunOffset: { x: 5, y: -1 },
        anchorOffset: { x: 10 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: "shadowBall",
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.bounces ??= 100;
                    projectile.behaviors.bounceChance ??= 0.5;
                    projectile.behaviors.bounceRange ??= 4 * TILE_SIZE;
                    projectile.behaviors.bounceDamageMultiplier ??= 1;
                });
            }
        }]
    },
    sludgeBomb: {
        name: "Sludge Bomb Tower",
        gunSprite: "sludge bomb tower",
        baseSprite: "sludge bomb tower base",
        sprite: "sludge-bomb-tower-sprite.png",
        description: "Shoots a giant ball of sludge that deals splash damage",
        cost: 225,
        stats: {
            damage: 20,
            range: 5,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 100
        },
        element: "Poison",
        gunOffset: { x: 5, y: -1 },
        anchorOffset: { x: 10 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: "sludgeBomb",
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.animOnDestroy = "explode";
                });
            }
        }]
    },
    sniper: {
        name: "Sniper Tower",
        gunSprite: "sniper tower",
        baseSprite: "sniper tower base",
        sprite: "sniper-tower-sprite.png",
        description: "Deals devastating damage to targets at a great range",
        cost: 350,
        stats: {
            damage: 70,
            range: 8,
            fireInterval: 3,
            critChance: 5,
            critDamage: 100
        },
        element: "Light",
        gunOffset: { x: 10, y: -1 },
        anchorOffset: { x: 20 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: null,
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "sniper_laser";
            }
        }]
    },
    laserCanon: {
        name: "Laser Cannon Tower",
        gunSprite: "laser cannon tower",
        baseSprite: "laser cannon tower base",
        sprite: "laser-cannon-tower-sprite.png",
        description: "Shoots a giant laser beam that damages all enemies in its path",
        cost: 300,
        stats: {
            damage: 30,
            range: 5,
            fireInterval: 2.5,
            critChance: 5,
            critDamage: 100
        },
        element: "Light",
        gunOffset: { x: 5, y: -1 },
        anchorOffset: { x: 10 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 1 },
        projectile: null,
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "piercing_laser";
            }
        }]
    },
    balloon: {
        name: "Balloon Tower",
        gunSprite: "balloon tower",
        baseSprite: "balloon tower base",
        sprite: "balloon-tower-sprite.png",
        description: "Mechanical arms rub a giant balloon, zapping all enemies in range",
        cost: 250,
        stats: {
            damage: 8,
            range: 3,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 100
        },
        element: "Electric",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: false,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "aoe";
                ctx.visualEffect = electricAoeBurst;
            }
        }]
    },
    beeHive: {
        name: "Beehive Tower",
        gunSprite: "beehive tower",
        baseSprite: "beehive tower base",
        sprite: "beehive-tower-sprite.png",
        description: "Sends out a swarm of bees that follow the target dealing damage in a small area",
        cost: 200,
        stats: {
            damage: 12,
            range: 5,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Poison",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "bees",
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.persistent = {
                        owner: ctx.attacker as TowerGameObj,
                        state: "flying",
                        origin: ctx.origin
                    };
                });
            }
        }],
        canRotate: false,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        }
    },
    storm: {
        name: "Storm Tower",
        gunSprite: "storm tower",
        baseSprite: "storm tower base",
        sprite: "storm-tower-sprite.png",
        description: "Summons storm clouds that damage enemies in a small area",
        cost: 350,
        stats: {
            damage: 80,
            range: 7,
            fireInterval: 4,
            critChance: 5,
            critDamage: 100
        },
        element: "Electric",
        gunOffset: { x: 10, y: -1 },
        anchorOffset: { x: 20 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: null,
        canRotate: false,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "thunder";
            }
        }]
    },
    frostBallista: {
        name: "Frost Ballista Tower",
        gunSprite: "frost ballista tower",
        baseSprite: "frost ballista tower base",
        sprite: "frost-ballista-tower-sprite.png",
        description: "Shoots a giant frozen arrow that deals increased damage depending on distance travelled (up to 100%)",
        cost: 180,
        stats: {
            damage: 15,
            range: 6,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 100
        },
        element: "Ice",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "frostArrow",
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.distanceDamageMultiplier ??= 0;
                    projectile.behaviors.damagePerTile = 0.1;
                    projectile.behaviors.distanceDamageCap = 1;
                });
            }
        }]
    },
    skull: {
        name: "Skull Tower",
        gunSprite: "skull tower",
        baseSprite: "skull tower base",
        sprite: "skull-tower-sprite.png",
        description: "Shoots ghostly skulls that have bonus crit chance when targeting low health enemies",
        cost: 225,
        stats: {
            damage: 15,
            range: 5,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 100
        },
        element: "Dark",
        gunOffset: { x: 0, y: 2 },
        anchorOffset: { x: 0, y: 4 / 64 },
        shootOffset: { x: -25, y: 0 },
        projectile: "ghostlySkull",
        canRotate: true,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    const maxHp = ctx.target?.maxHP() ?? 1;
                    const hp = ctx.target?.hp() ?? 0;
                    const missingHealthPercent = 1 - hp / maxHp;

                    projectile.bonusCrit = 100 * missingHealthPercent * 0.8;
                });
            }
        }]
    },
    timeCannon: {
        name: "Time Cannon Tower",
        gunSprite: "time cannon tower",
        baseSprite: "time cannon tower base",
        sprite: "time-cannon-tower-sprite.png",
        description: "Fire rate decreases with time, but damage and splash radius increases",
        cost: 250,
        stats: {
            damage: 1,
            range: 5,
            fireInterval: 0.25,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 5, y: 0 },
        anchorOffset: { x: 10 / 64, y: 0 },
        shootOffset: { x: -40, y: 0 },
        projectile: "basicSplash",
        canRotate: true,
        timeData: {
            maxMultiplier: 8,
            growthPerSecond: 1.025,
            timeScaling: {
                interval: true,
                damage: true,
                damagePow: 2
            }
        },
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        }
    },
    scythe: {
        name: "Scythe Tower",
        gunSprite: "scythe tower",
        baseSprite: "scythe tower base",
        sprite: "scythe-tower-sprite.png",
        description: `Reap enemies' souls, gaining +1 damage per enemy killed (up to +${SCYTHE_MAX_KILL_STACKS})`,
        cost: 300,
        stats: {
            damage: 30,
            range: 2.5,
            fireInterval: 2,
            critChance: 5,
            critDamage: 100
        },
        element: "Dark",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: false,
        source: "reward",
        targetType: "enemy",
        melee: {
            meleeHandleSprite: "scythe handle",
            meleeHeadSprite: "scythe head",
            handleLength: 23,
            headOffset: 15 / 32,
            swingAngle: 130
        },
        killStacks: 0,
        effects: [{
            firstEffect(ctx) {
                if (!ctx.meleeAttack) return;

                ctx.attackType = "melee";

                ctx.meleeAttack = {
                    ...ctx.meleeAttack,
                    splashRadius: 2,
                    swingTime: 0.25,
                    onImpact(k, impactPos) {
                        k.add([
                            k.sprite("slash effect", { width: 32, height: 64 }),
                            k.anchor("center"),
                            k.rotate(ctx.gun.angle + 180),
                            k.opacity(1),
                            k.scale(2),
                            k.lifespan(0.25),
                            k.pos(impactPos)
                        ]);
                    }
                };
            }
        }],
        footprint: {
            w: 2,
            h: 2
        }
    },
    god: {
        name: "God Tower",
        gunSprite: "god tower",
        baseSprite: "god tower base",
        sprite: "god-tower-sprite.png",
        description: "Shoots 8 angels at the enemy",
        cost: 300,
        stats: {
            damage: 5,
            range: 6,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 100
        },
        element: "Light",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "angel",
        canRotate: false,
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                if (ctx.projectiles.length === 0) return;

                ctx.volley ??= {};
                ctx.volley.volleyChance ??= 100;
                ctx.volley.volleyCount ??= 8;
                ctx.volley.homingDelay ??= 0.4;
            }
        }]
    },
    mine: {
        name: "Mine Tower",
        gunSprite: "mine tower",
        baseSprite: "mine tower base",
        sprite: "mine-tower-sprite.png",
        description: "Places mines on the path",
        cost: 200,
        stats: {
            damage: 10,
            range: 3,
            fireInterval: 2,
            critChance: 5,
            critDamage: 100
        },
        element: "Fire",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "mine",
        canRotate: false,
        source: "reward",
        targetType: "point",
        pathEntityLimit: 30,
        footprint: {
            w: 2,
            h: 2
        }
    },
} as const satisfies Record<string, TowerDef>;

export type TowerId = keyof typeof TOWERS;

export const HEROES = {
    archer: {
        name: "Archer",
        sprite: "archer-hero-sprite.png",
        description: "A ranged hero that excels at taking down enemies from afar.",
        gunSprite: "archer",
        baseSprite: "archer base",
        stats: {
            damage: 12,
            range: 5,
            fireInterval: 1,
            critChance: 10,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 9 / 32, y: 9 / 32 },
        shootOffset: { x: 0, y: -5 },
        projectile: "arrow",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    },
    wizard: {
        name: "Wizard",
        sprite: "archer-hero-sprite.png",
        description: "A ranged hero that excels at taking down enemies from afar.",
        gunSprite: "archer",
        baseSprite: "archer base",
        stats: {
            damage: 8,
            range: 5,
            fireInterval: 1,
            critChance: 10,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: "arrow",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        }
    }
} as const satisfies Record<string, HeroDef>;

export type HeroId = keyof typeof HEROES;

export const ELEMENTS: Record<ElementName, ElementDef> = {
    Normal: {
        description: null,
        applyEffect: null,
        color: "#FFFFFF"
    },

    Fire: {
        description: "Fire attacks have a 20% chance to burn enemies, dealing 1% max HP damage per second",
        applyEffect: (k, { target }) => {
            const duration = 5;
            if (k.randi(100) < 20) {
                const burn = target.has("burn");
                if (burn) {
                    target.refreshBurn();
                    return;
                }
                target.use(burnEffect(k, duration));
            }
        },
        color: "#FF4500"
    },

    Ice: {
        description: `Ice attacks apply a stack of chill (up to ${MAX_CHILL_STACKS}) + 1 bonus stack for every ${ICE_DAMAGE_PER_STACK} damage dealt. Each stack reduces enemy speed by ${CHILL_PERCENT}%`,
        applyEffect: (k, { target, damage }) => {
            const chill = target.has("chill");
            const stacks = 1 + Math.floor(damage / ICE_DAMAGE_PER_STACK);
            const duration = 2;
            if (chill) {
                target.addChillStack(stacks);
                return;
            }
            target.use(chillEffect(k, duration, stacks));
        },
        color: "#00FFFF"
    },

    Electric: {
        description: `Electric attacks add charge stacks to enemies (up to ${MAX_CHARGE_STACKS}). ` +
            `Enemies have an electric damage % chance to be stunned for ${STUN_DURATION}s based on their charge stacks (${STUN_PERCENTAGES.join("%, ")}%)`,
        applyEffect: (k, { target, damage }) => {
            const charge = target.has("charge");

            if (charge) {
                target.addChargeStack()

                const stacks = target.getChargeStacks();
                const baseChance = STUN_PERCENTAGES[stacks - 1] ?? 0;

                const stunChance = (baseChance / 100 * damage) / 100;

                if (Math.random() < stunChance) {
                    target.enterState("stunned");
                    target.unuse("charge");
                }
                return;
            }

            const duration = 2;
            target.use(chargeEffect(k, duration));
        },
        color: "#FFFF00"
    },

    Light: {
        description: "Light attacks blind enemies, preventing them from hitting towers",
        applyEffect: (k,) => {
            // Apply light effect to target
        },
        color: "#ffff97"
    },

    Dark: {
        description: "Dark attacks apply curse to enemies. Cursed enemies can't be healed and have an extra 10% chance to receive critical hits",
        applyEffect: (k, { target }) => {
            const duration = 2;
            const curse = target.has("curse");
            if (curse) {
                target.refreshCurse();
                return;
            }
            target.use(curseEffect(k, duration));
        },
        color: "#800080"
    },

    Poison: {
        description: "Poison attacks add poison stacks (up to 5) to enemies dealing damage equal to number of stacks every 5 seconds. Poison keeps ticking until the enemy dies or is healed",
        applyEffect: (k, { target }) => {
            const poison = target.has("poison");
            if (poison) {
                target.addPoisonStack();
                return;
            }
            target.use(poisonEffect(k));
        },
        color: "#00FF00"
    }
} as const;

export const PROJECTILES = {
    basic: {
        sprite: "basic projectile",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    fireball: {
        sprite: "fireball",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    lightOrb: {
        sprite: "light orb",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    crow: {
        sprite: "crow",
        homing: true,
        speed: 200,
        splashRadius: 0,
        anim: "fly"
    },
    arrow: {
        sprite: "arrow",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    flamingArrow: {
        sprite: "flaming arrow",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    slimeball: {
        sprite: "slimeball",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    bomb: {
        sprite: "bomb",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
    shadowBlob: {
        sprite: "shadow blob",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    star: {
        sprite: "star",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    poop: {
        sprite: "poop",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    icicle: {
        sprite: "icicle projectile",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    snowball: {
        sprite: "snowball",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
    shadowBall: {
        sprite: "shadow ball",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
    sludgeBomb: {
        sprite: "sludge bomb",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
    bees: {
        sprite: "bees",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
    frostArrow: {
        sprite: "frost arrow",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    ghostlySkull: {
        sprite: "ghostly skull",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    basicSplash: {
        sprite: "basic projectile",
        homing: true,
        speed: 300,
        splashRadius: 0.2
    },
    angel: {
        sprite: "angel",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    mine: {
        sprite: "mine",
        homing: true,
        speed: 200,
        splashRadius: 1.5
    },
} as const satisfies Record<string, ProjectileDef>;

export type ProjectileId = keyof typeof PROJECTILES;

export const SKILLS = [
    {
        id: "range+1",
        heroIds: ["wizard"],
        name: "Range +1",
        description: "Increase range by 1 tile",
        apply: hero => {
            hero.stats.range += 1;
        },
        icon: "sprites/range-icon.png"
    },
    {
        id: "damage+20%",
        heroIds: ["archer", "wizard"],
        name: "Damage +20%",
        description: "Increase damage by 20%",
        apply: hero => {
            hero.stats.damage += Math.round(hero.stats.damage * 0.2);
        },
        icon: "sprites/damage-icon.png"
    },
    {
        id: "crit-chance+20%",
        heroIds: ["archer", "wizard"],
        name: "Crit Chance +20%",
        description: "Increase crit chance by 20%",
        apply: hero => {
            hero.stats.critChance += 20;
        },
        icon: "sprites/critchance-icon.png"
    },
    {
        id: "crit-damage+20%",
        heroIds: ["archer", "wizard"],
        name: "Crit Damage +50%",
        description: "Increase crit damage by 50%",
        apply: hero => {
            hero.stats.critDamage += 50;
        },
        icon: "sprites/critdamage-icon.png"
    },
    {
        id: "fire-rate+20%",
        heroIds: ["archer", "wizard"],
        name: "Fire Rate +20%",
        description: "Increase fire rate by 20%",
        apply: hero => {
            const fireInterval = hero.stats.fireInterval;
            const newFireInterval = calcFireInterval(fireInterval, 20);
            hero.stats.fireInterval = newFireInterval;
        },
        icon: "sprites/firerate-icon.png"
    },
    {
        id: "archer-volley",
        heroIds: ["archer"],
        name: "Volley",
        description: "25% chance to shoot a volley of 3 arrows",
        apply: hero => {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.projectiles.length === 0) return;

                    ctx.volley ??= {};
                    ctx.volley.volleyChance ??= 0;
                    ctx.volley.volleyChance += 0.25;
                }
            });
        },
        icon: "sprites/volley-skill-icon3.png"
    },
    {
        id: "range+2",
        heroIds: ["archer"],
        name: "Range +2",
        description: "Increase range by 2 tiles",
        apply: hero => {
            hero.stats.range += 2;
        },
        icon: "sprites/range-icon.png"
    },
    {
        id: "archer-bounce",
        heroIds: ["archer"],
        name: "Bouncing Shot",
        description: "Arrows bounce to nearby enemies, dealing 50% damage on bounce",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        projectile.behaviors ??= {};
                        projectile.behaviors.bounces ??= 1;
                        projectile.behaviors.bounceRange ??= 4 * TILE_SIZE;
                        projectile.behaviors.bounceDamageMultiplier ??= 0.5;
                    });
                }
            });
        },
        icon: "sprites/bounce-skill-icon2.png"
    },
    {
        id: "archer-flaming-shot",
        heroIds: ["archer"],
        name: "Flaming Shot",
        description: "50% chance to fire a flaming arrow that deals 50% bonus damage",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        if (Math.random() < 0.5) return;

                        projectile.bonusDamage = ctx.damage * 0.5;
                        projectile.element = "Fire";
                        projectile.id = "flamingArrow";
                    });
                }
            });
        },
        icon: "sprites/flaming-arrow-icon2.png"
    },
    {
        id: "archer-bounce-plus",
        heroIds: ["archer"],
        requires: ["archer-bounce"],
        name: "Bounce +1",
        description: "Increase arrow bounce by 1",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        if (projectile.behaviors?.bounces) projectile.behaviors.bounces += 1;
                    });
                }
            });
        },
        icon: "sprites/bounce-skill-icon2.png"
    },
    {
        id: "archer-volley-plus",
        heroIds: ["archer"],
        requires: ["archer-volley"],
        name: "Volley +25%",
        description: "Increase chance of volley by 25%",
        apply: hero => {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.projectiles.length === 0) return;

                    ctx.volley ??= {};
                    ctx.volley.volleyChance ??= 0;
                    ctx.volley.volleyChance += 0.25;
                }
            });
        },
        icon: "sprites/volley-skill-icon3.png"
    },
    {
        id: "archer-range-damage",
        heroIds: ["archer"],
        name: "Range Damage",
        description: "Arrows do increased damage based on distance travelled (capping at +50%)",
        apply: hero => {
            hero.effects?.push({
                secondEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        projectile.behaviors ??= {};
                        projectile.behaviors.distanceDamageMultiplier ??= 0;
                        projectile.behaviors.distanceDamageCap = 0.5;
                    });
                }
            });
        },
        icon: "sprites/range-damage-skill-icon.png"
    }
] as const satisfies HeroSkillDefBase[];

export type SkillId = typeof SKILLS[number]["id"];

export const SEEDS: Seed = {
    chili: {
        name: "Chili Pepper",
        growsInto: "chili",
        turnsToGrow: 2
    },
    starfruit: {
        name: "Starfruit",
        growsInto: "starfruit",
        turnsToGrow: 3
    },
    nightshade: {
        name: "Nightshade",
        growsInto: "nightshade",
        turnsToGrow: 1
    }
};