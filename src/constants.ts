import type { Upgrade, LevelWaves, EnemyConfig, TowerDef, ElementDef, ElementName, ProjectileDef, HeroDef } from "./types";
import { burnEffect } from "./entities/Enemy";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const TILE_SIZE = 32;
export const TOWER_RANGE_TOLERANCE = 5;
export const MAX_TOWER_UPGRADES = 5;
export const FOG_Z = 900;
export const MAX_HAND_SIZE = 6;
export const DAMAGE_NUMBER_SIZE = 14;
export const SMALL_DAMAGE_NUMBER_SIZE = 11;
export const CRIT_DAMAGE_NUMBER_SIZE = 22;
export const DAMAGE_NUMBER_COLOR = "#fffb00";
export const CRIT_DAMAGE_NUMBER_COLOR = "#ff0000";
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
        startDelay: 30,
        waves: [
            {
                spawns: [
                    { id: "grunt", count: 3, interval: 0.6 },
                    { id: "fast", count: 5, interval: 0.4 }
                ],
                reward: 50
            },
            {
                spawns: [
                    { id: "tank", count: 2, interval: 0.4 }
                ],
                reward: 80
            }
        ],
    },

    level2: {
        startDelay: 30,
        waves: [
            { 
                spawns: [{ id: "fast", count: 5, interval: 0.4 }],
                reward: 50
            }
        ],
    },
} as const satisfies Record<string, LevelWaves>;

export type LevelId = keyof typeof LEVEL_WAVES;

export const ENEMIES = {
    grunt: {
        hp: 100,
        damage: 1,
        speed: 60,
        sprite: "grunt",
    },

    fast: {
        hp: 6,
        damage: 1,
        speed: 120,
        sprite: "fast",
    },

    tank: {
        hp: 50,
        damage: 1,
        speed: 30,
        sprite: "tank",
    },
} as const satisfies Record<string, EnemyConfig>;

export type EnemyId = keyof typeof ENEMIES;

export const TOWERS = {
    basic: { 
        name: "Basic Tower",
        gunSprite: "basic tower",
        baseSprite: "basic tower base",
        sprite: "basic-tower-sprite.png",
        description: "A cheap but basic tower",
        cost: 50,
        stats: {
            damage: 4,
            range: 4,
            fireInterval: 0.75,
            critChance: 5,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 2, y: 0 },
        anchorOffset: { x:  4 / 32, y: 0 },
        shootOffset: { x: -20, y: 0 },
        projectile: "basic"
    },
    fire: { 
        name: "Fire Tower",
        gunSprite: "fire tower",
        baseSprite: "fire tower base",
        sprite: "fire-tower-sprite.png",
        description: "A tower that shoots fireballs at enemies",
        cost: 70,
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
        projectile: "fireball"
    }
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
            damage: 8,
            range: 5,
            fireInterval: 1,
            critChance: 10,
            critDamage: 100
        },
        element: "Normal",
        gunOffset: { x: 3, y: 0 },
        anchorOffset: { x: 6 / 32, y: 0 },
        shootOffset: { x: -25, y: 0 },
        projectile: "basic",
        skills: []
    }
} as const satisfies Record<string, HeroDef>;

export const ELEMENTS: Record<ElementName, ElementDef> = {
    Normal: {
        description: null,
        applyEffect: null,
        color: "#FFFFFF"
    },

    Fire: {
        description: "Fire attacks have a 15% chance to burn enemies, dealing 1% max HP damage per second.",
        applyEffect: (k, target) => {
            const duration = 5;
            if (k.randi(100) < 15) {
                const burn = target.get("burn");
                if (burn && typeof (burn as any).refresh === "function") {
                    (burn as unknown as { refresh: (duration: number) => void }).refresh(duration);
                    return;
                }
                target.use(burnEffect(k, duration));
            }
        },
        color: "#FF4500"
    },

    Ice: {
        description: "Ice attacks apply a stack of chill (up to 3). Each stack reduces enemy speed (5%, 10%, 15%)",
        applyEffect: (target) => {
            // Apply slow effect to target
        },
        color: "#00FFFF"
    },

    Electric: {
        description: "Electric attacks add charge stacks to enemies (up to 3). " +
            "Enemies have a % of electric damage dealt chance to be stunned for 0.5s based on their charge stacks (0 = 2%, 1 = 5%, 2 = 10%, 3 = 20%)",
        applyEffect: (target) => {
            // Apply shock effect to target
        },
        color: "#FFFF00"
    },

    Light: {
        description: "Light attacks blind enemies, preventing them from hitting towers.",
        applyEffect: (target) => {
            // Apply light effect to target
        },
        color: "#ffff97"
    },

    Dark: {
        description: "Dark attacks apply curse to enemies. Cursed enemies can't be healed and have an extra 10% chance to be critted.",
        applyEffect: (target) => {
            // Apply dark effect to target
        },
        color: "#800080"
    },

    Poison: {
        description: "Poison attacks add poison stacks (up to 5) to enemies dealing 1 damage per (5, 4, 3, 2, 1) second(s). Enemies are cured of poison when healed.",
        applyEffect: (target) => {
            // Apply poison effect to target
        },
        color: "#00FF00"
    }
} as const;

export const PROJECTILES = {
    basic: {
        sprite: "basic projectile",
        hitbox: { width: 8, height: 8 },
        speed: 300,
        splashRadius: 0
    },
    fireball: {
        sprite: "fireball",
        hitbox: { width: 9, height: 8 },
        speed: 300,
        splashRadius: 0
    }
} as const satisfies Record<string, ProjectileDef>;

export type ProjectileId = keyof typeof PROJECTILES;