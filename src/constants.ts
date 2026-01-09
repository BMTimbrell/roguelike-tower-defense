import type { Upgrade } from "./types";

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const TILE_SIZE = 32;
export const TOWER_RANGE_TOLERANCE = 5;
export const MAX_TOWER_UPGRADES = 5;
export const UPGRADES: Upgrade[] = [{
    stat: "damage",
    name: "Damage",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "damage",
    name: "Damage",
    amount: 2,
    cost: 1,
    percentage: false
},
{
    stat: "damage",
    name: "Damage",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "damage",
    name: "Damage",
    amount: 5,
    cost: 2,
    percentage: false
},
{
    stat: "damage",
    name: "Damage",
    amount: 80,
    cost: 3,
    percentage: true
},
{    
    stat: "damage",
    name: "Damage",
    amount: 8,
    cost: 3,
    percentage: false
},
{
    stat: "range",
    name: "Range",
    amount: 1,
    cost: 1,
    percentage: false
}, 
{
    stat: "range",
    name: "Range",
    amount: 3,
    cost: 2,
    percentage: false
}, 
{
    stat: "range",
    name: "Range",
    amount: 5,
    cost: 3,
    percentage: false
}, 
{
    stat: "fireInterval",
    name: "Fire rate",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire rate",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "fireInterval",
    name: "Fire rate",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    amount: 20,
    cost: 1,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    amount: 50,
    cost: 2,
    percentage: true
},
{
    stat: "critChance",
    name: "Crit chance",
    amount: 80,
    cost: 3,
    percentage: true
},
{
    stat: "critDamage",
    name: "Crit damage",
    amount: 0.5,
    cost: 1,
    percentage: false
},
{
    stat: "critDamage",
    name: "Crit damage",
    amount: 1.2,
    cost: 2,
    percentage: false
},
{
    stat: "critDamage",
    name: "Crit damage",
    amount: 1.8,
    cost: 3,
    percentage: false
}];