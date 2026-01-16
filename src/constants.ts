import type { Upgrade } from "./types";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const TILE_SIZE = 32;
export const TOWER_RANGE_TOLERANCE = 5;
export const MAX_TOWER_UPGRADES = 5;
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
    name: "Fire rate",
    icon: "sprites/damage-icon.png",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire rate",
    icon: "sprites/damage-icon.png",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire rate",
    icon: "sprites/damage-icon.png",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    icon: "sprites/damage-icon.png",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    icon: "sprites/damage-icon.png",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    icon: "sprites/damage-icon.png",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit damage",
    icon: "sprites/damage-icon.png",
    amount: 50,
    cost: 1,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit damage",
    icon: "sprites/damage-icon.png",
    amount: 120,
    cost: 2,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit damage",
    icon: "sprites/damage-icon.png",
    amount: 180,
    cost: 3,
    percentage: true
}] as const;