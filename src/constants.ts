import type { Upgrade, LevelWaves, EnemyConfig, TowerDef, ElementDef, ElementName, ProjectileDef, HeroDef, HeroSkillDefBase, TowerGameObj, Seed, Scenes, Summon, EnemyGameObj } from "./types";
import burnEffect from "./kaplayComponents/burnEffect";
import calcFireInterval from "./utils/calcFireInterval";
import poisonEffect from "./kaplayComponents/poisonEffect";
import chillEffect from "./kaplayComponents/chillEffect";
import chargeEffect from "./kaplayComponents/chargeEffect";
import curseEffect from "./kaplayComponents/curseEffect";
import { electricAoeBurst, flameAoeBurst, frostAoeBurst } from "./utils/makeUnitCombat";
import blindEffect from "./kaplayComponents/blindEffect";
import { gameStateAtom, store } from "./store";
import applySongBuff from "./utils/applySongBuff";
import spawnSummon from "./entities/Summon";
import hurtEnemy from "./utils/hurtEnemy";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const TILE_SIZE = 32;
export const TOWER_RANGE_TOLERANCE = 5;
export const MAX_TOWER_UPGRADES = 5;
export const FOG_Z = 900;
export const MAX_HAND_SIZE = 10;
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
export const CHARGE_DAMAGE_PER_STACK = 10;
export const POISON_DAMAGE_PER_STACK = 10;
export const MAX_CHARGE_STACKS = 8;
export const MAX_POISON_STACKS = 5;
export const STUN_PERCENT = 3;
export const STUN_DURATION = 1;
export const CURSE_CRIT = 10;
export const TIME_TOWER_BASE_ANIM_SPEED = 30;
export const SCYTHE_MAX_KILL_STACKS = 60;
export const REDUCED_RANGE_TOWERS = [
    "Chili Pepper Tower",
    "Ice Tower",
    "Balloon Tower",
    "Lava Tower",
    "Hammer Tower",
    "Scythe Tower"
];
export const BASE_REROLL_COST = 5;
export const BASE_DRAW_COST = 10;
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
    amount: 10,
    cost: 1,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit Chance",
    icon: "sprites/critchance-icon.png",
    amount: 25,
    cost: 2,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit Chance",
    icon: "sprites/critchance-icon.png",
    amount: 40,
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
    amount: 140,
    cost: 2,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit Damage",
    icon: "sprites/critdamage-icon.png",
    amount: 260,
    cost: 3,
    percentage: true
}] as const;

export const LEVEL_WAVES = {
    "level1-1": {
        startingGold: 100,
        startDelay: 120,
        waves: [
            {
                spawns: [
                    { id: "slime", count: 5, interval: 1 }
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "skeleton", count: 3, interval: 1 },
                    { id: "slime", count: 5, interval: 0.75 }
                ],
                reward: 100
            },
            // {
            //     spawns: [
            //         { id: "armouredSkeleton", count: 3, interval: 1 },
            //         { id: "skeleton", count: 6, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 }
            //     ],
            //     reward: 200
            // },
            // {
            //     spawns: [
            //         { id: "armouredSkeleton", count: 5, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "giantSlime", count: 1, interval: 1 },
            //         { id: "skeleton", count: 10, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 }
            //     ],
            //     reward: 300
            // },
            // {
            //     spawns: [
            //         { id: "armouredSkeleton", count: 8, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "giantSlime", count: 1, interval: 1 },
            //         { id: "skeleton", count: 10, interval: 1 },
            //         { id: "giantSkeleton", count: 1, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "armouredSkeleton", count: 8, interval: 1 },
            //         { id: "giantSlime", count: 1, interval: 1 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "giantSkeleton", count: 1, interval: 1},
            //         { id: "fairy", count: 1, interval: 1 },
            //     ],
            //     reward: 0
            // }
        ],
    },

    "level1-2": {
        startingGold: 100,
        startDelay: 120,
        waves: [
            {
                spawns: [
                    { id: "bee", count: 5, interval: 1 }
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "orc", count: 1, interval: 1.5 },
                    { id: "bee", count: 5, interval: 1 }
                ],
                reward: 100
            },
            // {
            //     spawns: [
            //         { id: "armouredOrc", count: 1, interval: 1.5 },
            //         { id: "orc", count: 3, interval: 1.5 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "bee", count: 10, interval: 1 },
            //     ],
            //     reward: 200
            // },
            // {
            //     spawns: [
            //         { id: "armouredOrc", count: 3, interval: 2 },
            //         { id: "giantBee", count: 1, interval: 2 },
            //         { id: "bee", count: 5, interval: 1 },
            //         { id: "orc", count: 8, interval: 1.4 },
            //         { id: "fairy", count: 1, interval: 1 }
            //     ],
            //     reward: 300
            // },
            // {
            //     spawns: [
            //         { id: "armouredOrc", count: 7, interval: 1.5 },
            //         { id: "fairy", count: 1, interval: 1 },
            //         { id: "giantBee", count: 1, interval: 1 },
            //         { id: "orc", count: 10, interval: 1 },
            //         { id: "giantOrc", count: 1, interval: 1.5 },
            //         { id: "armouredOrc", count: 7, interval: 1.5 },
            //         { id: "giantBee", count: 1, interval: 2 },
            //         { id: "bee", count: 10, interval: 1},
            //         { id: "giantOrc", count: 1, interval: 2},
            //         { id: "fairy", count: 1, interval: 1 },
            //     ],
            //     reward: 0
            // }
        ],
    },

    "level2-1": {
        startingGold: 150,
        startDelay: 120,
        waves: [
            {
                spawns: [
                    { id: "slime", count: 10, interval: 1 },
                    { id: "skeleton", count: 3, interval: 1 }
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "slime", count: 20, interval: 0.5 },
                    { id: "skeleton", count: 10, interval: 1 }
                ],
                reward: 100
            },
            {
                spawns: [
                    { id: "armouredSkeleton", count: 10, interval: 1 },
                    { id: "fairy", count: 1, interval: 1 },
                    { id: "skeleton", count: 12, interval: 1 },
                    { id: "fairy", count: 1, interval: 1 }
                ],
                reward: 200
            },
            {
                spawns: [
                    { id: "ghost", count: 3, interval: 2 },
                    { id: "armouredSkeleton", count: 8, interval: 1.5 },
                    { id: "fairy", count: 1, interval: 3 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "skeleton", count: 15, interval: 0.5 },
                    { id: "fairy", count: 1, interval: 1 }
                ],
                reward: 300
            },
            {
                spawns: [
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "armouredSkeleton", count: 10, interval: 1 },
                    { id: "fairy", count: 1, interval: 1 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "skeleton", count: 10, interval: 0.75 },
                    { id: "ghost", count: 2, interval: 2 },
                    { id: "redFairy", count: 1, interval: 1 },
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "armouredSkeleton", count: 5, interval: 1 },
                    { id: "ghost", count: 3, interval: 2 },
                    { id: "skeleton", count: 5, interval: 0.75 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "skeleton", count: 5, interval: 0.75 },
                    { id: "fairy", count: 1, interval: 1 }
                ],
                reward: 400
            },
            {
                spawns: [
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "armouredSkeleton", count: 10, interval: 1 },
                    { id: "redFairy", count: 1, interval: 1 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "ghost", count: 10, interval: 1 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "redFairy", count: 1, interval: 1 },
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "armouredSkeleton", count: 3, interval: 1 },
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "armouredSkeleton", count: 3, interval: 1 },
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "skeleton", count: 5, interval: 0.5 },
                    { id: "giantSkeleton", count: 1, interval: 1 },
                    { id: "skeleton", count: 5, interval: 0.5 },
                    { id: "giantSlime", count: 1, interval: 1 },
                    { id: "skeleton", count: 5, interval: 0.5 },
                    { id: "redFairy", count: 1, interval: 1 }
                ],
                reward: 500
            }
        ],
    },

    "level2-2": {
        startingGold: 150,
        startDelay: 30,
        waves: [
            {
                spawns: [
                    { id: "orc", count: 2, interval: 1 },
                    { id: "bee", count: 5, interval: 0.5 },
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "orc", count: 8, interval: 1.5 },
                    { id: "bee", count: 20, interval: 0.5 },
                ],
                reward: 100
            },
            {
                spawns: [
                    { id: "armouredOrc", count: 8, interval: 1.5 },
                    { id: "fairy", count: 1, interval: 1 },
                    { id: "orc", count: 10, interval: 1.5 },
                    { id: "fairy", count: 1, interval: 1 }
                ],
                reward: 200
            },
            {
                spawns: [
                    { id: "spider", count: 3, interval: 2 },
                    { id: "armouredOrc", count: 8, interval: 2 },
                    { id: "giantBee", count: 1, interval: 2 },
                    { id: "orc", count: 10, interval: 0.75 },
                    { id: "fairy", count: 1, interval: 1 }
                ],
                reward: 300
            },
        ],
    },
} as const satisfies Record<string, LevelWaves>;

export type LevelId = keyof typeof LEVEL_WAVES;

export const SCENES: Scenes = [
    ["level1", "level1-2"],
    ["level2", "level2-2"],
    ["level2", "level2-2"]
];

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
    },
    armouredSkeleton: {
        hp: 40,
        armour: 30,
        damage: 1,
        speed: 50,
        sprite: "armoured skeleton"
    },
    fairy: {
        hp: 50,
        damage: 1,
        speed: 60,
        sprite: "fairy",
        healer: {
            amount: 10,
            range: 2
        }
    },
    giantSlime: {
        hp: 300,
        damage: 5,
        speed: 25,
        spawnOnDeath: {
            id: "slime",
            amount: 4
        },
        attacker: {
            projectile: "slimeball",
            attackRange: 4,
            canAttack: false,
            attackCooldown: 3
        },
        sprite: "giant slime"
    },
    giantSkeleton: {
        hp: 500,
        damage: 5,
        speed: 25,
        sprite: "giant skeleton"
    },
    bee: {
        hp: 8,
        damage: 1,
        speed: 75,
        sprite: "bee"
    },
    orc: {
        hp: 50,
        damage: 1,
        speed: 50,
        sprite: "orc"
    },
    armouredOrc: {
        hp: 60,
        armour: 50,
        damage: 1,
        speed: 40,
        sprite: "armoured orc"
    },
    giantBee: {
        hp: 250,
        damage: 5,
        speed: 35,
        sprite: "giant bee",
        attacker: {
            projectile: "stinger",
            attackRange: 4,
            canAttack: false,
            attackCooldown: 2.5
        }
    },
    giantOrc: {
        hp: 700,
        damage: 5,
        speed: 25,
        sprite: "giant orc"
    },
    ghost: {
        hp: 120,
        damage: 1,
        speed: 50,
        sprite: "ghost",
        invincibleDuration: 2,
        invincibleCooldown: 5
    },
    redFairy: {
        hp: 120,
        damage: 1,
        speed: 60,
        sprite: "red fairy",
        healer: {
            amount: 20,
            range: 2
        }
    },
    spider: {
        hp: 120,
        damage: 1,
        speed: 50,
        sprite: "spider",
        spawnOnDeath: {
            id: "spiderling",
            amount: 4
        },
    },
    spiderling: {
        hp: 20,
        damage: 1,
        speed: 75,
        sprite: "spiderling"
    },
    wolf: {
        hp: 60,
        damage: 1,
        speed: 90,
        sprite: "wolf",
        speedBooster: {
            amount: 1.5,
            range: 2
        }
    },
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
            critDamage: 200
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
        },
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: "Most Progress"
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
            critDamage: 200
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
                    projectile.behaviors.bounces ??= 6;
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
        },
        priority: "Most Progress"
    },
    ice: {
        name: "Ice Tower",
        gunSprite: "ice tower",
        baseSprite: "ice tower base",
        sprite: "ice-tower-sprite.png",
        description: "Emits a frost that damages all enemies in range. This tower receives half the amount from range upgrades and buffs",
        cost: 100,
        stats: {
            damage: 2,
            range: 2.5,
            fireInterval: 1,
            critChance: 5,
            critDamage: 200
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
        },
        priority: null
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
            critDamage: 200
        },
        element: "Electric",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 0, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "lightning";
                if (!ctx.lightning) {
                    ctx.lightning = {
                        maxChains: 3,
                        range: 5
                    }
                }
            }
        }],
        canRotate: false,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: "Most Progress"
    },
    crow: {
        name: "Crow Tower",
        gunSprite: "crow tower",
        baseSprite: "crow tower base",
        sprite: "crow-tower-sprite.png",
        description: "A shadowy crow follows and attacks enemies in range",
        cost: 80,
        stats: {
            damage: 6,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 200
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
        },
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: "Most Progress"
    },
    farm: {
        name: "Farm Tower",
        gunSprite: "farm tower",
        baseSprite: "farm tower base",
        sprite: "farm-tower-sprite.png",
        description: "You reap what you sow!",
        cost: 90,
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
        },
        priority: null
    },
    nightshade: {
        name: "Nightshade Tower",
        gunSprite: "nightshade tower",
        baseSprite: "nightshade tower base",
        sprite: "basic-tower-sprite.png",
        description: "Shoots shadowy blobs that absorb life, dealing bonus damage based on the enemy's missing health",
        cost: 90,
        stats: {
            damage: 6,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 200
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
                    if (ctx.target?.type !== "enemy") return;

                    const maxHp = ctx.target?.enemy?.maxHP() ?? 1;
                    const hp = ctx.target?.enemy?.hp() ?? 0;
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
        },
        priority: "Most Progress"
    },
    chili: {
        name: "Chili Pepper Tower",
        gunSprite: "chili tower",
        baseSprite: "plant tower base",
        sprite: "basic-tower-sprite.png",
        description: "Deals fire damage to all enemies in range. This tower receives half the amount from range upgrades and buffs",
        cost: 90,
        stats: {
            damage: 5,
            range: 2.5,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 200
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
        },
        priority: null
    },
    starfruit: {
        name: "Starfruit Tower",
        gunSprite: "starfruit tower",
        baseSprite: "plant tower base",
        sprite: "basic-tower-sprite.png",
        description: "Shoots a volley of 3 stars",
        cost: 90,
        stats: {
            damage: 5,
            range: 5,
            fireInterval: 1,
            critChance: 5,
            critDamage: 200
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
        },
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: null
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
            critDamage: 200
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
                    critChance: 35
                }
            }
        ],
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        priority: "Most Progress"
    },
    hammer: {
        name: "Hammer Tower",
        gunSprite: "hammer tower",
        baseSprite: "hammer tower base",
        sprite: "hammer-tower-sprite.png",
        description: "Smash enemies with a hammer, dealing damage in a small area. This tower receives half the amount from range upgrades and buffs",
        cost: 70,
        stats: {
            damage: 30,
            range: 1.5,
            fireInterval: 2,
            critChance: 5,
            critDamage: 200
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
            handleLength: 8,
            swingAngle: 30,
            startAngle: 45
        },
        effects: [{
            firstEffect(ctx) {
                if (!ctx.meleeAttack) return;

                ctx.attackType = "melee";

                ctx.meleeAttack = {
                    ...ctx.meleeAttack,
                    splashRadius: 1,
                    swingTime: 0.25,
                    onImpact(k, impactPos) {
                        const smashEffect = k.add([
                            k.sprite("smash effect", { anim: "smash" }),
                            k.anchor("center"),
                            k.z(999),
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
        },
        priority: "Most Progress"
    },
    icicle: {
        name: "Icicle Tower",
        gunSprite: "icicle tower",
        baseSprite: "icicle tower base",
        sprite: "icicle-tower-sprite.png",
        description: "Shoots icicles. This tower has a high crit chance",
        cost: 70,
        stats: {
            damage: 3,
            range: 4,
            fireInterval: 0.75,
            critChance: 40,
            critDamage: 200
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
        },
        priority: "Most Progress"
    },
    snowball: {
        name: "Snowball Tower",
        gunSprite: "snowball tower",
        baseSprite: "snowball tower base",
        sprite: "snowball-tower-sprite.png",
        description: "Shoots giant snowballs that deal splash damage",
        cost: 250,
        stats: {
            damage: 25,
            range: 5,
            fireInterval: 1.75,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Most Progress"
    },
    shadowBall: {
        name: "Shadow Ball Tower",
        gunSprite: "shadow ball tower",
        baseSprite: "shadow ball tower base",
        sprite: "shadow-ball-tower-sprite.png",
        description: "Shoots a dark, shadowy blob that deals splash damage and has a 50% chance to bounce between enemies",
        cost: 350,
        stats: {
            damage: 12,
            range: 5,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 200
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
                    projectile.behaviors.bounces ??= 6;
                    projectile.behaviors.bounceChance ??= 0.5;
                    projectile.behaviors.bounceRange ??= 4 * TILE_SIZE;
                    projectile.behaviors.bounceDamageMultiplier ??= 1;
                });
            }
        }],
        priority: "Most Progress"
    },
    sludgeBomb: {
        name: "Sludge Bomb Tower",
        gunSprite: "sludge bomb tower",
        baseSprite: "sludge bomb tower base",
        sprite: "sludge-bomb-tower-sprite.png",
        description: "Shoots a giant ball of sludge that deals splash damage",
        cost: 200,
        stats: {
            damage: 25,
            range: 5,
            fireInterval: 1.75,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Most Progress"
    },
    sniper: {
        name: "Sniper Tower",
        gunSprite: "sniper tower",
        baseSprite: "sniper tower base",
        sprite: "sniper-tower-sprite.png",
        description: "Deals devastating damage to targets at a great range",
        cost: 300,
        stats: {
            damage: 80,
            range: 9,
            fireInterval: 3,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Highest HP"
    },
    laserCanon: {
        name: "Laser Cannon Tower",
        gunSprite: "laser cannon tower",
        baseSprite: "laser cannon tower base",
        sprite: "laser-cannon-tower-sprite.png",
        description: "Shoots a giant laser beam that damages all enemies in its path",
        cost: 300,
        stats: {
            damage: 35,
            range: 4.5,
            fireInterval: 2.5,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Most Progress"
    },
    balloon: {
        name: "Balloon Tower",
        gunSprite: "balloon tower",
        baseSprite: "balloon tower base",
        sprite: "balloon-tower-sprite.png",
        description: "Mechanical arms rub a giant balloon, zapping all enemies in range. This tower receives half the amount from range upgrades and buffs",
        cost: 300,
        stats: {
            damage: 8,
            range: 3,
            fireInterval: 1.25,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: null
    },
    beeHive: {
        name: "Beehive Tower",
        gunSprite: "beehive tower",
        baseSprite: "beehive tower base",
        sprite: "beehive-tower-sprite.png",
        description: "Sends out a swarm of bees that follow the target dealing damage in a small area",
        cost: 250,
        stats: {
            damage: 10,
            range: 5,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 200
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
        },
        priority: "Most Progress"
    },
    storm: {
        name: "Storm Tower",
        gunSprite: "storm tower",
        baseSprite: "storm tower base",
        sprite: "storm-tower-sprite.png",
        description: "Summons storm clouds that damage enemies in a small area",
        cost: 400,
        stats: {
            damage: 100,
            range: 7,
            fireInterval: 4,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Most Progress"
    },
    frostBallista: {
        name: "Frost Ballista Tower",
        gunSprite: "frost ballista tower",
        baseSprite: "frost ballista tower base",
        sprite: "frost-ballista-tower-sprite.png",
        description: "Shoots a giant frozen arrow that deals increased damage depending on distance travelled (up to 100%)",
        cost: 150,
        stats: {
            damage: 15,
            range: 6,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: "Most Progress"
    },
    skull: {
        name: "Skull Tower",
        gunSprite: "skull tower",
        baseSprite: "skull tower base",
        sprite: "skull-tower-sprite.png",
        description: "Shoots ghostly skulls that have bonus crit chance when targeting low health enemies",
        cost: 200,
        stats: {
            damage: 15,
            range: 5,
            fireInterval: 1,
            critChance: 5,
            critDamage: 200
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
                    if (ctx.target?.type !== "enemy") return;

                    const maxHp = ctx.target?.enemy?.maxHP() ?? 1;
                    const hp = ctx.target?.enemy?.hp() ?? 0;
                    const missingHealthPercent = 1 - hp / maxHp;

                    projectile.bonusCrit = 100 * missingHealthPercent * 0.8;
                });
            }
        }],
        priority: "Most Progress"
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
            critDamage: 200
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
        },
        priority: "Most Progress"
    },
    scythe: {
        name: "Scythe Tower",
        gunSprite: "scythe tower",
        baseSprite: "scythe tower base",
        sprite: "scythe-tower-sprite.png",
        description: `Reap enemies' souls, dealing +1 bonus damage per enemy killed (up to +${SCYTHE_MAX_KILL_STACKS}). This tower receives half the amount from range upgrades and buffs`,
        cost: 300,
        stats: {
            damage: 20,
            range: 2.5,
            fireInterval: 2,
            critChance: 5,
            critDamage: 200
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
            startAngle: 90,
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
                            k.z(999),
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
        },
        priority: "Most Progress"
    },
    god: {
        name: "God Tower",
        gunSprite: "god tower",
        baseSprite: "god tower base",
        sprite: "god-tower-sprite.png",
        description: "Shoots 8 angels at random targets",
        cost: 300,
        stats: {
            damage: 8,
            range: 6,
            fireInterval: 1.75,
            critChance: 5,
            critDamage: 200
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
        }],
        priority: null
    },
    mine: {
        name: "Mine Tower",
        gunSprite: "mine tower",
        baseSprite: "mine tower base",
        sprite: "mine-tower-sprite.png",
        description: "Places mines on the path",
        cost: 200,
        stats: {
            damage: 20,
            range: 3,
            fireInterval: 2,
            critChance: 5,
            critDamage: 200
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
        },
        priority: null
    },
    blizzard: {
        name: "Blizzard Tower",
        gunSprite: "blizzard tower",
        baseSprite: "blizzard tower base",
        sprite: "blizzard-tower-sprite.png",
        description: "Summons a blizzard that deals devastating damage to enemies in a large area",
        cost: 400,
        stats: {
            damage: 70,
            range: 7,
            fireInterval: 5,
            critChance: 5,
            critDamage: 200
        },
        element: "Ice",
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
                ctx.attackType = "blizzard";
            }
        }],
        priority: "Most Progress"
    },
    flamethrower: {
        name: "Flamethrower Tower",
        gunSprite: "flamethrower tower",
        baseSprite: "flamethrower tower base",
        sprite: "flamethrower-tower-sprite.png",
        description: "Shoots a cone of flames, dealing devastating damage to nearby enemies",
        cost: 300,
        stats: {
            damage: 4,
            range: 3.5,
            fireInterval: 0.25,
            critChance: 5,
            critDamage: 200
        },
        element: "Fire",
        gunOffset: { x: 7, y: -1 },
        anchorOffset: { x: 14 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: null,
        canRotate: true,
        continuousEffect: "flame particle",
        source: "reward",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.attackType = "cone";
            }
        }],
        priority: "Most Progress"
    },
    charge: {
        name: "Charge Tower",
        gunSprite: "charge tower",
        baseSprite: "charge tower base",
        sprite: "charge-tower-sprite.png",
        description: "Gains charge as it shoots, increasing its fire rate",
        cost: 250,
        stats: {
            damage: 10,
            range: 5,
            fireInterval: 1,
            critChance: 5,
            critDamage: 200
        },
        element: "Electric",
        gunOffset: { x: 7, y: -1 },
        anchorOffset: { x: 14 / 64, y: -2 / 64 },
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
                ctx.attackType = "lightning";
                if (!ctx.lightning) {
                    ctx.lightning = {
                        maxChains: 1,
                        range: 5
                    };
                }
            }
        }],
        charge: {
            currentCharge: 0,
            maxCharge: 0.7,
            chargePerShot: 0.04,
            decayDelay: 1.1
        },
        priority: "Most Progress"
    },
    lava: {
        name: "Lava Tower",
        gunSprite: "lava tower",
        baseSprite: "lava tower base",
        sprite: "lava-tower-sprite.png",
        description: "Pours lava onto the path. This tower receives half the amount from range upgrades and buffs",
        cost: 350,
        stats: {
            damage: 4,
            range: 2.5,
            fireInterval: 900,
            critChance: 5,
            critDamage: 200
        },
        element: "Fire",
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
        lavaTiles: [],
        priority: null
    },
    chomper: {
        name: "Chomper Tower",
        gunSprite: "chomper tower",
        baseSprite: "chomper tower base",
        sprite: "chomper-tower-sprite.png",
        description: "Spawns a chomper that follows the path to eat enemies, dealing the enemy's remaining health percentage as bonus damage. If the chomper kills the enemy, it persists",
        cost: 200,
        stats: {
            damage: 15,
            range: 3,
            fireInterval: 2.5,
            critChance: 5,
            critDamage: 200
        },
        element: "Normal",
        gunOffset: { x: 5, y: 0 },
        anchorOffset: { x: 10 / 64, y: 0 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: true,
        source: "reward",
        pathEntityLimit: 50,
        targetType: "point",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                if (ctx.target?.type !== "point") return;

                ctx.isSummon = true;

                spawnSummon(ctx.context, ctx, "chomper", ctx.target.pos);
            }
        }],
        priority: "Most Progress"
    },
    battery: {
        name: "Battery Tower",
        gunSprite: "battery tower",
        baseSprite: "battery tower base",
        sprite: "battery-tower-sprite.png",
        description: "Dealing damage to enemies in range charges its battery. The number of targets this tower can hit and the damage dealt increases based on the battery charge",
        cost: 300,
        stats: {
            damage: 1,
            range: 5,
            fireInterval: 5,
            critChance: 5,
            critDamage: 200
        },
        element: "Electric",
        gunOffset: { x: 7, y: -1 },
        anchorOffset: { x: 14 / 64, y: -2 / 64 },
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
                ctx.attackType = "lightning";
                if (!ctx.lightning) {
                    ctx.lightning = {
                        maxChains: 1,
                        range: 5
                    };
                }
            }
        }],
        battery: {
            charge: 0,
            maxCharge: 100,
            storePct: 0.25
        },
        priority: "Most Progress"
    },
    potion: {
        name: "Potion Tower",
        gunSprite: "potion tower",
        baseSprite: "sludge bomb tower base",
        sprite: "potion-tower-sprite.png",
        description: "Shoots a poisonous concoction that leaves a puddle on the ground, damaging all enemies that walk over it for 25% of the initial damage per tick",
        cost: 5,
        stats: {
            damage: 25,
            range: 5,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 200
        },
        element: "Poison",
        gunOffset: { x: 5, y: -1 },
        anchorOffset: { x: 10 / 64, y: -2 / 64 },
        shootOffset: { x: -40, y: 0 },
        projectile: "potion",
        canRotate: true,
        source: "starting",
        targetType: "enemy",
        footprint: {
            w: 2,
            h: 2
        },
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.animOnDestroy = "smash";
                });

                const k = ctx.context;
                let timer = 0;
                k.wait(0.5, () => {
                    const puddle = k.add([
                        k.sprite("poison puddle"),
                        k.anchor("center"),
                        k.opacity(1),
                        k.lifespan(2),
                        "puddle",
                        k.pos((ctx.target as { enemy?: { pos: any } })?.enemy?.pos ?? 0),
                        {
                            tickRate: 0.25,
                            update() {
                                timer -= k.dt();

                                while (timer <= 0) {
                                    timer += puddle.tickRate;
                                    (k.get("enemy") as EnemyGameObj[]).forEach(enemy => {
                                        if (enemy.pos.dist(puddle.pos) < TILE_SIZE / 2 && !enemy.invincible) {

                                            hurtEnemy(k, {
                                                target: enemy,
                                                damage: Math.round(ctx.damage * 0.25),
                                                element: ctx.element,
                                                isCrit: false,
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    ]);
                });
            }
        }],
        priority: "Most Progress"
    }
} as const satisfies Record<string, TowerDef>;

export type TowerId = keyof typeof TOWERS;

export const HEROES = {
    archer: {
        name: "Archer",
        sprite: "archer-protrait.png",
        description: "A ranged hero who excels at taking down enemies from afar",
        gunSprite: "archer",
        baseSprite: "archer base",
        stats: {
            damage: 12,
            range: 5,
            fireInterval: 1,
            critChance: 10,
            critDamage: 200
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
        },
        levelUpOffset: { x: 0, y: 0 },
        priority: "Most Progress"
    },
    wizard: {
        name: "Wizard",
        sprite: "wizard-portrait.png",
        description: "A hero who devastates enemies with powerful spells",
        gunSprite: "wizard",
        baseSprite: "wizard base",
        stats: {
            damage: 15,
            range: 4,
            fireInterval: 1.5,
            critChance: 10,
            critDamage: 200
        },
        element: "Fire",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 20 / 32, y: -18 / 32 },
        shootOffset: { x: -20, y: 10 },
        projectile: "fireball",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        levelUpOffset: { x: 180, y: 100 },
        priority: "Most Progress"
    },
    knight: {
        name: "Knight",
        sprite: "knight-portrait.png",
        description: "A melee hero who deals devastating damage at close range",
        gunSprite: "knight",
        baseSprite: "knight base",
        stats: {
            damage: 20,
            range: 1.5,
            fireInterval: 1,
            critChance: 10,
            critDamage: 200
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 20 / 32, y: -18 / 32 },
        shootOffset: { x: 0, y: 0 },
        projectile: null,
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        melee: {
            meleeHandleSprite: "hammer tower",
            meleeHeadSprite: "hammer tower",
            handleLength: 1,
            startAngle: 90,
            swingAngle: 130
        },
        effects: [{
            firstEffect(ctx) {
                if (!ctx.meleeAttack) return;

                ctx.attackType = "melee";

                ctx.meleeAttack = {
                    ...ctx.meleeAttack,
                    splashRadius: 1,
                    swingTime: 0.25,
                    onImpact(k, impactPos) {
                        const slash = k.add([
                            k.sprite("slash effect", { width: 16, height: 32 }),
                            k.anchor("center"),
                            k.rotate(ctx.gun.angle + 180),
                            k.opacity(1),
                            k.scale(2),
                            k.z(999),
                            k.lifespan(0.25),
                            k.pos(impactPos)
                        ]);
                        if (ctx.element === "Light") {
                            slash.use(ctx.context.shader("glow", () => ({
                                u_r: 1,
                                u_g: 0.96,
                                u_b: 0.64,
                                u_flash: 1,
                                u_opacity: 1
                            })));
                        } else if (ctx.element === "Dark") {
                            slash.use(ctx.context.shader("glow", () => ({
                                u_r: 0.2,
                                u_g: 0.0,
                                u_b: 0.2,
                                u_flash: 1,
                                u_opacity: 1
                            })));
                        }
                    }
                };
            }
        }],
        levelUpOffset: { x: 0, y: 0 },
        priority: "Most Progress"
    },
    assassin: {
        name: "Assassin",
        sprite: "assassin-portrait.png",
        description: "A hero who excels at taking out key targets",
        gunSprite: "assassin",
        baseSprite: "assassin base",
        stats: {
            damage: 10,
            range: 3,
            fireInterval: 0.75,
            critChance: 10,
            critDamage: 250
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 9 / 32, y: 12 / 32 },
        shootOffset: { x: 0, y: -5 },
        projectile: "knife",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        levelUpOffset: { x: 0, y: 0 },
        priority: "Most Progress"
    },
    merchant: {
        name: "Merchant",
        sprite: "merchant-portrait.png",
        description: "A hero who excels at making money",
        gunSprite: "merchant",
        baseSprite: "merchant base",
        stats: {
            damage: 5,
            range: 3.5,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 200
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 9 / 32, y: 12 / 32 },
        shootOffset: { x: 0, y: -5 },
        projectile: "moneyBag",
        canRotate: true,
        targetType: "enemy",
        effects: [{
            firstEffect(ctx) {
                ctx.projectiles.forEach(projectile => {
                    projectile.behaviors ??= {};
                    projectile.behaviors.animOnDestroy = "break";
                });
            }
        }],
        footprint: {
            w: 1,
            h: 1
        },
        levelUpOffset: { x: 180, y: 100 },
        priority: "Most Progress"
    },
    witch: {
        name: "Witch",
        sprite: "witch-portrait.png",
        description: "A hero who withers enemies with deadly poisons",
        gunSprite: "witch",
        baseSprite: "witch base",
        stats: {
            damage: 10,
            range: 4,
            fireInterval: 1.25,
            critChance: 10,
            critDamage: 200
        },
        element: "Poison",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 20 / 32, y: -18 / 32 },
        shootOffset: { x: -20, y: 10 },
        projectile: "witchPoison",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        levelUpOffset: { x: 0, y: 0 },
        priority: "Most Progress"
    },
    songstress: {
        name: "Songstress",
        sprite: "songstress-portrait.png",
        description: "A hero who strengthens towers with powerful songs",
        gunSprite: "hammer tower",
        baseSprite: "songstress base",
        stats: {
            damage: 5,
            range: 3.5,
            fireInterval: 1.5,
            critChance: 5,
            critDamage: 200
        },
        element: "Normal",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 20 / 32, y: -18 / 32 },
        shootOffset: { x: -20, y: 10 },
        projectile: "musicalNote",
        canRotate: true,
        targetType: "enemy",
        footprint: {
            w: 1,
            h: 1
        },
        songs: [],
        effects: [{
            firstEffect(ctx) {
                const k = ctx.context;

                const songIndex = ctx.context.randi(ctx.attacker.songs.length);
                const song = ctx.attacker.songs[songIndex];

                k.get("tower").forEach(tower => {
                    const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                    const heroCenter = ctx.attacker.pos.add(k.vec2(TILE_SIZE / 2));

                    if (tower === ctx.attacker ||
                        towerCenter.dist(heroCenter) > TILE_SIZE * tower.footprint.w + ((ctx.attacker.stats.range - 1) * TILE_SIZE)
                    ) return;

                    applySongBuff(tower as TowerGameObj, ctx, song);
                });
            }
        }],
        levelUpOffset: { x: 100, y: 0 },
        priority: "Most Progress"
    },
    necromancer: {
        name: "Necromancer",
        sprite: "necromancer-portrait.png",
        description: "A hero who summons the undead to fight for him",
        gunSprite: "necromancer",
        baseSprite: "necromancer base",
        stats: {
            damage: 10,
            range: 4,
            fireInterval: 4,
            critChance: 10,
            critDamage: 200
        },
        element: "Dark",
        gunOffset: { x: 0, y: 0 },
        anchorOffset: { x: 20 / 32, y: -18 / 32 },
        shootOffset: { x: -20, y: 10 },
        projectile: null,
        canRotate: true,
        targetType: "point",
        footprint: {
            w: 1,
            h: 1
        },
        levelUpOffset: { x: 150, y: 0 },
        priority: null
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
        description: "Fire attacks have a 20% chance to burn enemies, dealing 1% max HP damage per second (caps at 10 damage)",
        applyEffect: (k, { target, chance }) => {
            const duration = 5;

            if (k.randi(100) < (chance ?? 20)) {
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
        description: `Ice attacks apply 1 (+ 1 for every ${ICE_DAMAGE_PER_STACK} damage dealt) stack of chill to enemies, capping at ${MAX_CHILL_STACKS} stacks. Each stack reduces enemy speed by ${CHILL_PERCENT}%`,
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
        description: `Electric attacks apply 1 (+ 1 for every ${CHARGE_DAMAGE_PER_STACK} damage dealt) stack of charge to enemies, capping at ${MAX_CHARGE_STACKS} stacks. ` +
            `Each stack gives enemies a 3% chance to be stunned for ${STUN_DURATION}s whenever they receive electric damage`,
        applyEffect: (k, { target, damage }) => {
            if (target.state === "stunned") return;

            const charge = target.has("charge");
            const numStacks = 1 + Math.floor(damage / CHARGE_DAMAGE_PER_STACK);

            if (charge) {
                const stacks = target.getChargeStacks();
                const stunChance = STUN_PERCENT * stacks / 100;

                target.addChargeStack(numStacks);

                if (Math.random() < stunChance && !target.stunResistance) {
                    target.enterState("stunned");
                    target.unuse("charge");
                }
                return;
            }

            const duration = 2;
            target.use(chargeEffect(k, duration, numStacks));
        },
        color: "#FFFF00"
    },

    Light: {
        description: "Light attacks blind enemies, disorienting them. Blinded enemies have a 50% chance to miss tower attacks and suffer 50% longer debuff durations.",
        applyEffect: (k, { target }) => {
            const duration = 3;

            const blind = target.has("blind");

            if (blind) {
                target.refreshBlind();
                return;
            }

            target.use(blindEffect(k, duration));
        },
        color: "#ffff97"
    },

    Dark: {
        description: "Dark attacks apply curse to enemies. Cursed enemies can't be healed and have an extra 10% chance to receive critical hits",
        applyEffect: (k, { target }) => {
            const duration = 3;
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
        description: `Poison attacks apply 1 (+ 1 for every ${POISON_DAMAGE_PER_STACK} damage dealt) stack of poison to enemies, capping at ${MAX_POISON_STACKS} stacks. Enemies take damage equal to the number of stacks every 5 seconds. Poison keeps ticking until the enemy dies or is healed`,
        applyEffect: (k, { target, damage }) => {
            const poison = target.has("poison");
            const stacks = 1 + Math.floor(damage / POISON_DAMAGE_PER_STACK);
            if (poison) {
                target.addPoisonStack(stacks);
                return;
            }
            target.use(poisonEffect(k, stacks));

            if (!k.get("hero")[0]?.volatileConcoction) return;

            ELEMENTS["Fire"]?.applyEffect?.(k, { target, damage, chance: k.get("hero")[0]?.volatileConcoctionChance ?? 50 });
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
    knife: {
        sprite: "knife",
        homing: true,
        speed: 300,
        splashRadius: 0
    },
    moneyBag: {
        sprite: "money bag",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    poisonKnife: {
        sprite: "poison knife",
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
    witchPoison: {
        sprite: "witch poison",
        homing: true,
        speed: 200,
        splashRadius: 1
    },
    musicalNote: {
        sprite: "musical note",
        homing: true,
        speed: 200,
        splashRadius: 0,
        noRotate: true
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
        splashRadius: 1.2
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
        splashRadius: 1.2
    },
    shadowBall: {
        sprite: "shadow ball",
        homing: true,
        speed: 200,
        splashRadius: 1.2
    },
    sludgeBomb: {
        sprite: "sludge bomb",
        homing: true,
        speed: 200,
        splashRadius: 1.2
    },
    bees: {
        sprite: "bees",
        homing: true,
        speed: 200,
        splashRadius: 1.4
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
        splashRadius: 1.2
    },
    stinger: {
        sprite: "stinger",
        homing: true,
        speed: 200,
        splashRadius: 0
    },
    iceBlast: {
        sprite: "ice blast",
        homing: true,
        speed: 200,
        splashRadius: 1
    },
    potion: {
        sprite: "potion",
        homing: true,
        speed: 300,
        splashRadius: 0
    }
} as const satisfies Record<string, ProjectileDef>;

export type ProjectileId = keyof typeof PROJECTILES;

export const SKILLS = [
    {
        id: "range+1",
        heroIds: ["wizard", "knight", "assassin", "merchant", "witch", "songstress", "necromancer"],
        name: "Range +1",
        description: "Increase range by 1 tile",
        apply: hero => {
            hero.stats.range += 1;
        },
        icon: "sprites/range-icon.png"
    },
    {
        id: "damage+20%",
        heroIds: ["archer", "wizard", "assassin", "merchant", "witch", "songstress", "necromancer"],
        name: "Damage +20%",
        description: "Increase damage by 20%",
        apply: hero => {
            hero.stats.damage += Math.round(hero.stats.damage * 0.2);
        },
        icon: "sprites/damage-icon.png"
    },
    {
        id: "crit-chance+10%",
        heroIds: ["archer", "wizard", "knight", "assassin", "merchant", "witch", "songstress", "necromancer"],
        name: "Crit Chance 10%",
        description: "Increase crit chance by 10%",
        apply: hero => {
            hero.stats.critChance += 10;
        },
        icon: "sprites/critchance-icon.png"
    },
    {
        id: "crit-damage+50%",
        heroIds: ["archer", "wizard", "knight", "merchant", "witch", "songstress", "necromancer"],
        name: "Crit Damage +50%",
        description: "Increase crit damage by 50%",
        apply: hero => {
            hero.stats.critDamage *= 1.5;
        },
        icon: "sprites/critdamage-icon.png"
    },
    {
        id: "fire-rate+20%",
        heroIds: ["archer", "wizard", "knight", "assassin", "merchant", "witch", "songstress", "necromancer"],
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
    },
    {
        id: "archer-range-buff",
        heroIds: ["archer"],
        name: "Archer's Range",
        description: "Gain +1 range and give all adjacent towers +1 range",
        apply(hero) {
            hero.hasRangeBoost = true;
        },
        icon: "sprites/range-boost-skill-icon.png"
    },
    {
        id: "wizard-ice-blast",
        heroIds: ["wizard"],
        name: "Ice Blast",
        description: "50% chance to fire an ice blast that deals damage in a small area",
        apply(hero) {
            let rand: boolean;

            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.projectiles.length === 0) return;
                    rand = Math.random() < 0.5;
                    if (rand) return;

                    ctx.volley ??= {};
                    ctx.volley.volleyChance ??= 100;
                    ctx.volley.volleyCount ??= 1;
                    ctx.volley.volleyCount++;
                    ctx.volley.homingDelay ??= 0.2;
                }
            });

            hero.effects?.push({
                secondEffect(ctx) {
                    if (rand) return;

                    ctx.projectiles[ctx.projectiles.length - 1].element = "Ice";
                    ctx.projectiles[ctx.projectiles.length - 1].id = "iceBlast";
                }
            });
        },
        icon: "sprites/ice-blast-icon.png"
    },
    {
        id: "wizard-lightning-strike",
        heroIds: ["wizard"],
        name: "Lightning Strike",
        description: "35% chance to strike up to 3 targets with lightning for 50% damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (Math.random() < 0.65) return;

                    ctx.attackType = "lightning";
                    if (!ctx.lightning) {
                        ctx.lightning = {
                            maxChains: 3,
                            range: 5,
                            damageMult: 0.5
                        }
                    }
                }
            });
        },
        icon: "sprites/lightning-strike-icon2.png"
    },
    {
        id: "fireball-bounce",
        heroIds: ["wizard"],
        name: "Fireball Bounce",
        description: "Fireballs have a 35% chance to bounce to nearby enemies",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    const fireball = ctx.projectiles[0];
                    fireball.behaviors ??= {};
                    fireball.behaviors.bounces ??= 8;
                    fireball.behaviors.bounceRange ??= 4 * TILE_SIZE;
                    fireball.behaviors.bounceChance ??= 0.35;
                }
            });
        },
        icon: "sprites/bounce-fireball-icon.png"
    },
    {
        id: "wizard-elements",
        heroIds: ["wizard"],
        name: "Master of the Elements",
        description: "Normal towers gain a random element while the wizard is on the field",
        apply(hero) {
            hero.changeNormalElement = true;
        },
        icon: "sprites/elements-skill-icon.png"
    },
    {
        id: "wizard-lightning-strike-plus",
        heroIds: ["wizard"],
        requires: ["wizard-lightning-strike"],
        name: "Lightning Strike Plus",
        description: "Increase lightning strike targets by 3",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (!ctx.lightning) return;

                    ctx.lightning.maxChains += 3;
                }
            });
        },
        icon: "sprites/lightning-strike-icon2.png"
    },
    {
        id: "wizard-ice-blast-plus",
        heroIds: ["wizard"],
        requires: ["wizard-ice-blast"],
        name: "Ice Blast Plus",
        description: "Increase ice blast damage by 100%",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    if (ctx.projectiles.length === 0) return;

                    ctx.projectiles.forEach(p => {
                        if (p.id === "iceBlast") p.bonusDamage = ctx.damage;
                    });
                }
            });
        },
        icon: "sprites/ice-blast-icon.png"
    },
    {
        id: "damage+40%",
        heroIds: ["knight"],
        name: "Damage +40%",
        description: "Increase damage by 40%",
        apply: hero => {
            hero.stats.damage += Math.round(hero.stats.damage * 0.4);
        },
        icon: "sprites/damage-icon.png"
    },
    {
        id: "knight-armour-buff",
        heroIds: ["knight"],
        name: "Knight's Armour",
        description: "Attacks against the knight and all adjacent allies are blocked",
        apply(hero) {
            hero.hasBlock = true;
        },
        icon: "sprites/knight-armour-skill-icon.png"
    },
    {
        id: "knight-holy-skill",
        heroIds: ["knight"],
        name: "Holy Knight",
        description: "50% chance to do a light element attack that deals 50% bonus damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (Math.random() < 0.5) return;
                    if (ctx.element === "Dark") return;

                    ctx.damage += ctx.damage * 0.5;

                    ctx.gun.use(ctx.context.shader("glow", () => ({
                        u_r: 1,
                        u_g: 0.96,
                        u_b: 0.64,
                        u_flash: 1,
                        u_opacity: 1
                    })));
                    ctx.element = "Light";

                    ctx.context.wait(0.5, () => {
                        ctx.gun.use(ctx.context.shader("glow", () => ({
                            u_flash: 0
                        })))
                    });
                }
            });
        },
        icon: "sprites/holy-knight-skill-icon.png"
    },
    {
        id: "knight-dark-skill",
        heroIds: ["knight"],
        name: "Dark Knight",
        description: "50% chance to do a dark element attack that deals 50% bonus damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (Math.random() < 0.5) return;
                    if (ctx.element === "Light") return;

                    ctx.damage += ctx.damage * 0.5;

                    ctx.gun.use(ctx.context.shader("glow", () => ({
                        u_r: 0.2,
                        u_g: 0.0,
                        u_b: 0.2,
                        u_flash: 1,
                        u_opacity: 1
                    })));
                    ctx.element = "Dark";

                    ctx.context.wait(0.5, () => {
                        ctx.gun.use(ctx.context.shader("glow", () => ({
                            u_flash: 0
                        })))
                    })
                }
            });
        },
        icon: "sprites/knight-dark-skill-icon.png"
    },
    {
        id: "knight-holy-skill-plus",
        heroIds: ["knight"],
        requires: ["knight-holy-skill"],
        name: "Holy Knight Plus",
        description: "Increase holy knight bonus damage to 100%",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.element === "Light") {
                        ctx.damage = (ctx.damage / 1.5) * 2;
                    }
                }
            });
        },
        icon: "sprites/holy-knight-skill-icon.png"
    },
    {
        id: "knight-dark-skill-plus",
        heroIds: ["knight"],
        requires: ["knight-dark-skill"],
        name: "Dark Knight Plus",
        description: "Increase dark knight bonus damage to 100%",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.element === "Dark") {
                        ctx.damage = (ctx.damage / 1.5) * 2;
                    }
                }
            });
        },
        icon: "sprites/knight-dark-skill-icon.png"
    },
    {
        id: "assassin-poison-dagger",
        heroIds: ["assassin"],
        name: "Poison Dagger",
        description: "50% chance to throw a poison dagger that deals 50% bonus damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        if (Math.random() < 0.5) return;

                        projectile.bonusDamage = ctx.damage * 0.5;
                        projectile.element = "Poison";
                        projectile.id = "poisonKnife";
                    });
                }
            });
        },
        icon: "sprites/poison-shot-skill-icon.png"
    },
    {
        id: "assassin-killer-rythmn",
        heroIds: ["assassin"],
        name: "Deadly Rythmn",
        description: "Every third attack against the same target is guarenteed to be a critical hit",
        apply(hero) {
            hero.critTracker = {
                targetId: null,
                count: 0
            };

            hero.effects?.push({
                firstEffect(ctx) {
                    if (!ctx.target || ctx.target.type !== "enemy") return;

                    const tracker = hero.critTracker;
                    const targetId = ctx.target.enemy.id;

                    if (tracker.targetId !== targetId) {
                        tracker.targetId = targetId;
                        tracker.count = 0;
                    }

                    tracker.count++;

                    if (tracker.count === 3) {
                        tracker.count = 0;
                        ctx.projectiles[0].bonusCrit = 100;
                    }
                }
            });
        },
        icon: "sprites/killer-rythmn-skill-icon.png"
    },
    {
        id: "assassin-killer-instinct",
        heroIds: ["assassin"],
        name: "Killer Instinct",
        description: "Gain 100% crit chance when striking enemies below 25% health",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (!ctx.target || ctx.target.type !== "enemy") return;

                    const enemy = ctx.target.enemy;

                    if (enemy.hp() / (enemy.maxHP() ?? 1) < 0.25) {
                        ctx.projectiles[0].bonusCrit = 100;
                    }
                }
            });
        },
        icon: "sprites/killer-instinct-skill-icon.png"
    },
    {
        id: "crit-damage+100%",
        heroIds: ["assassin"],
        name: "Crit Damage +100%",
        description: "Increase crit damage by 100%",
        apply: hero => {
            hero.stats.critDamage *= 2;
        },
        icon: "sprites/critdamage-icon.png"
    },
    {
        id: "assassin-blood-rush",
        heroIds: ["assassin"],
        name: "Blood Rush",
        description: "The assassin gains a short burst of attack speed each time he lands a critical hit",
        apply: hero => {
            hero.fireIntervalBoost = 0.5;
        },
        icon: "sprites/blood-rush-skill-icon.png"
    },
    {
        id: "assassin-poison-dagger-plus",
        heroIds: ["assassin"],
        requires: ["assassin-poison-dagger"],
        name: "Poison Dagger Plus",
        description: "Poison dagger deals 100% bonus damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        if (projectile.element === "Poison") {
                            projectile.bonusDamage = ctx.damage;
                        }
                    });
                }
            });
        },
        icon: "sprites/poison-shot-skill-icon.png"
    },
    {
        id: "assassin-killer-instinct-plus",
        heroIds: ["assassin"],
        requires: ["assassin-killer-instinct"],
        name: "Killer Instinct Plus",
        description: "Gain 100% crit chance when striking enemies below 35% health",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (!ctx.target || ctx.target.type !== "enemy") return;

                    const enemy = ctx.target.enemy;

                    if (enemy.hp() / (enemy.maxHP() ?? 1) < 0.35) {
                        ctx.projectiles[0].bonusCrit = 100;
                    }
                }
            });
        },
        icon: "sprites/killer-instinct-skill-icon.png"
    },
    {
        id: "merchant-capital-punishment",
        heroIds: ["merchant"],
        name: "Capital Punishment",
        description: "Deal 3% of current gold as bonus damage",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        projectile.bonusDamage = Math.round(store.get(gameStateAtom).gold * 0.03);
                    });
                }
            });
        },
        icon: "sprites/capital-punishment-skill-icon.png"
    },
    {
        id: "merchant-capital-punishment-plus",
        heroIds: ["merchant"],
        requires: ["merchant-capital-punishment"],
        name: "Capital Punishment Plus",
        description: "Deal 5% of current gold as bonus damage",
        apply(hero) {
            hero.effects?.push({
                secondEffect(ctx) {
                    ctx.projectiles.forEach(projectile => {
                        projectile.bonusDamage = Math.round(store.get(gameStateAtom).gold * 0.05);
                    });
                }
            });
        },
        icon: "sprites/capital-punishment-skill-icon.png"
    },
    {
        id: "merchant-extra-income",
        heroIds: ["merchant"],
        name: "Extra Income",
        description: "Gain 20% extra gold at the end of each wave while the merchant is on the field",
        apply(hero) {
            hero.incomeMod = 1.2;
        },
        icon: "sprites/extra-income-skill-icon.png"
    },
    {
        id: "merchant-extra-income-plus",
        heroIds: ["merchant"],
        requires: ["merchant-extra-income"],
        name: "Extra Income Plus",
        description: "Gain 30% extra gold at the end of each wave while the merchant is on the field",
        apply(hero) {
            hero.incomeMod = 1.3;
        },
        icon: "sprites/extra-income-skill-icon.png"
    },
    {
        id: "merchant-gold-rush",
        heroIds: ["merchant"],
        name: "Gold Rush",
        description: "Gain twice the amount of gold when enemies die in range of the merchant",
        apply(hero) {
            hero.goldRush = true;
        },
        icon: "sprites/gold-rush-skill-icon.png"
    },
    {
        id: "merchant-gold-rush-plus",
        heroIds: ["merchant"],
        requires: ["merchant-gold-rush"],
        name: "Gold Rush Plus",
        description: "Gain thrice the amount of gold when enemies die in range of the merchant",
        apply(hero) {
            hero.goldRushBoost = 3;
        },
        icon: "sprites/gold-rush-skill-icon.png"
    },
    {
        id: "merchant-haggle",
        heroIds: ["merchant"],
        name: "Haggle",
        description: "Towers get a 20% discount while the merchant is on the field",
        apply(hero) {
            hero.discount = 0.8;
            store.set(gameStateAtom, prev => ({
                ...prev,
                towerButtons: prev.towerButtons.map(t => ({
                    ...t,
                    cost: t.cost * hero.discount
                }))
            }));
        },
        icon: "sprites/haggle-skill-icon.png"
    },
    {
        id: "witch-festering-toxins",
        heroIds: ["witch"],
        name: "Festering Toxins",
        description: "Poison stacks go up to 10, and heals only remove 1 stack",
        apply(hero) {
            hero.festeringToxins = true;
        },
        icon: "sprites/festering-toxins-skill-icon.png"
    },
    {
        id: "witch-volatile-concoction",
        heroIds: ["witch"],
        name: "Volatile Concoction",
        description: "Poison attacks have a 50% chance to burn enemies",
        apply(hero) {
            hero.volatileConcoction = true;
            hero.volatileConcoctionChance = 50;
        },
        icon: "sprites/volatile-concoction-skill-icon.png"
    },
    {
        id: "witch-volatile-concoction-plus",
        heroIds: ["witch"],
        requires: ["witch-volatile-concoction"],
        name: "Volatile Concoction Plus",
        description: "Poison attacks have a 100% chance to burn enemies",
        apply(hero) {
            hero.volatileConcoction = true;
            hero.volatileConcoctionChance = 100;
        },
        icon: "sprites/volatile-concoction-skill-icon.png"
    },
    {
        id: "witch-toxic-aura",
        heroIds: ["witch"],
        name: "Toxic Aura",
        description: "All adjacent towers become poison type",
        apply(hero) {
            hero.hasToxicAura = true;
        },
        icon: "sprites/toxic-aura-skill-icon.png"
    },
    {
        id: "witch-deadly-toxins",
        heroIds: ["witch"],
        name: "Deadly Toxins",
        description: "Poison has a 50% chance to deal double damage each tick",
        apply(hero) {
            hero.hasDeadlyToxins = true;
        },
        icon: "sprites/deadly-toxins-skill-icon.png"
    },
    {
        id: "witch-crippling-toxins",
        heroIds: ["witch"],
        name: "Crippling Toxins",
        description: "Poison has a 50% chance to stun enemies each tick",
        apply(hero) {
            hero.hasCripplingToxins = true;
        },
        icon: "sprites/crippling-toxins-skill-icon.png"
    },
    {
        id: "songstress-anthem-power",
        heroIds: ["songstress"],
        name: "Anthem of Power",
        description: "Towers in range gain a 20% damage buff for 3 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "damage",
                value: 0.2,
                duration: 3
            });
        },
        icon: "sprites/anthem-power-skill-icon.png"
    },
    {
        id: "songstress-tempo-surge",
        heroIds: ["songstress"],
        name: "Tempo Surge",
        description: "Towers in range gain a 20% fire rate buff for 3 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "fireRate",
                value: 0.2,
                duration: 3
            });
        },
        icon: "sprites/tempo-surge-skill-icon.png"
    },
    {
        id: "songstress-fortune-refrain",
        heroIds: ["songstress"],
        name: "Fortune's Refrain",
        description: "Towers in range gain a 10% crit chance buff for 3 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "critChance",
                value: 0.1,
                duration: 3
            });
        },
        icon: "sprites/fortune-refrain-skill-icon.png"
    },
    {
        id: "songstress-crescendo-ruin",
        heroIds: ["songstress"],
        name: "Crescendo of Ruin",
        description: "Towers in range gain a 50% crit damage buff for 3 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "critDamage",
                value: 0.5,
                duration: 3
            });
        },
        icon: "sprites/crescendo-ruin-skill-icon.png"
    },
    {
        id: "songstress-anthem-power-plus",
        heroIds: ["songstress"],
        requires: ["songstress-anthem-power"],
        name: "Anthem of Power Plus",
        description: "Towers in range gain a 30% damage buff for 5 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "damage",
                value: 0.3,
                duration: 5
            });

        },
        icon: "sprites/anthem-power-skill-icon.png"
    },
    {
        id: "songstress-tempo-surge-plus",
        heroIds: ["songstress"],
        requires: ["songstress-tempo-surge"],
        name: "Tempo Surge Plus",
        description: "Towers in range gain a 30% fire rate buff for 5 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "fireRate",
                value: 0.3,
                duration: 5
            });
        },
        icon: "sprites/tempo-surge-skill-icon.png"
    },
    {
        id: "songstress-fortune-refrain-plus",
        heroIds: ["songstress"],
        requires: ["songstress-fortune-refrain"],
        name: "Fortune's Refrain Plus",
        description: "Towers in range gain a 20% crit chance buff for 5 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "critChance",
                value: 0.2,
                duration: 5
            });
        },
        icon: "sprites/fortune-refrain-skill-icon.png"
    },
    {
        id: "songstress-crescendo-ruin-plus",
        heroIds: ["songstress"],
        requires: ["songstress-crescendo-ruin"],
        name: "Crescendo of Ruin Plus",
        description: "Towers in range gain a 80% crit damage buff for 5 seconds",
        apply(hero) {
            hero.songs?.push({
                type: "critDamage",
                value: 0.8,
                duration: 5
            });
        },
        icon: "sprites/crescendo-ruin-skill-icon.png"
    },
    {
        id: "summon-skeleton",
        heroIds: ["necromancer"],
        name: "Summon Skeleton",
        description: "Summon a skeleton that deals 100% of the necomancer's damage at 400% the fire rate. Lasts for 3 attacks",
        apply(hero) {
            hero.effects?.push({
                firstEffect(ctx) {
                    if (ctx.target?.type !== "point") return;

                    ctx.isSummon = true;

                    let summonType: SummonId = "skeleton";

                    if (hero.hasZombieSummon) {
                        summonType = Math.random() < 0.3 ? "zombie" : "skeleton";
                    }

                    spawnSummon(ctx.context, ctx, summonType, ctx.target.pos);
                }
            });
        },
        icon: "sprites/summon-skeleton-skill-icon.png"
    },
    {
        id: "summon-zombie",
        heroIds: ["necromancer"],
        name: "Summon Zombie",
        description: "The necromancer has a 30% chance to summon a zombie that deals 200% of the necomancer's damage at 200% the fire rate. Lasts for 4 attacks",
        apply(hero) {
            hero.hasZombieSummon = true;
        },
        icon: "sprites/summon-zombie-skill-icon.png"
    },
    {
        id: "summon-ghost",
        heroIds: ["necromancer"],
        name: "Summon Ghost",
        description: "Summon a ghost each time an enemy dies in range of the necromancer that deals 10% of the necomancer's damage at 800% the fire rate. Lasts for 5 attacks",
        apply(hero) {
            hero.hasGhostSummon = true;
        },
        icon: "sprites/summon-ghost-skill-icon.png"
    },
    {
        id: "stronger-skeletons",
        heroIds: ["necromancer"],
        requires: ["summon-skeleton"],
        name: "Stronger Skeletons",
        description: "Skeletons have a 35% chance to reanimate after dying",
        apply(hero) {
            hero.hasSkeletonBuff = true;
        },
        icon: "sprites/summon-skeleton-skill-icon.png"
    },
    {
        id: "stronger-zombies",
        heroIds: ["necromancer"],
        requires: ["summon-zombie"],
        name: "Stronger Zombies",
        description: "Zombies deal 400% of the necromancer's damage and have a 25% chance to stun enemies for 1 second on hit",
        apply(hero) {
            hero.hasZombieBuff = true;
        },
        icon: "sprites/summon-zombie-skill-icon.png"
    },
    {
        id: "stronger-ghosts",
        heroIds: ["necromancer"],
        requires: ["summon-ghost"],
        name: "Stronger Ghosts",
        description: "Ghosts have a 75% chance to persist after running out of attacks",
        apply(hero) {
            hero.hasGhostBuff = true;
        },
        icon: "sprites/summon-ghost-skill-icon.png"
    },
    {
        id: "stronger-curse",
        heroIds: ["necromancer"],
        name: "Stronger Curse",
        description: "Cursed Enemies have an extra 10% chance to receive critical hits while the necromancer is on the field",
        apply(hero) {
            hero.hasCurseBuff = true;
        },
        icon: "sprites/stronger-curse-skill-icon.png"
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

export const SUMMONS = {
    skeleton: {
        name: "Skeleton",
        sprite: "skeleton",
        damageMult: 1,
        attackSpeedMult: 4,
        speed: 30,
        maxAttacks: 3
    },
    zombie: {
        name: "Zombie",
        sprite: "zombie",
        damageMult: 2,
        attackSpeedMult: 2,
        speed: 20,
        maxAttacks: 4
    },
    ghost: {
        name: "Ghost",
        sprite: "ghost",
        damageMult: 0.1,
        attackSpeedMult: 8,
        speed: 40,
        maxAttacks: 5
    },
    chomper: {
        name: "Chomper",
        sprite: "chomper",
        damageMult: 1,
        attackSpeedMult: 8,
        speed: 40,
        maxAttacks: 1
    }
} as const satisfies Record<string, Summon>;

export type SummonId = keyof typeof SUMMONS;