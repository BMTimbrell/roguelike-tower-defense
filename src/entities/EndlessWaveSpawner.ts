import type {
    KAPLAYCtx,
    Vec2
} from "kaplay";

import type {
    EndlessRewardType,
    HeroGameObj,
    MapChunk,
    PathTile,
    Tile,
    TowerGameObj,
    Wave
} from "../types";

import {
    BASE_DRAW_COST,
    ELEMENTS,
    ENDLESS_ENEMIES,
    MAX_HAND_SIZE,
    ROUND_DRAW_NUM,
    SEEDS,
    TILE_SIZE,
    type EnemyId
} from "../constants";

import makeEnemy from "./Enemy";
import { revealChunk } from "../utils/generateFog";
import { generateWaypoints } from "../utils/generateProceduralMap";
import { store, gameStateAtom, mapAtom, rewardsAtom, rewardChoiceAtom } from "../store";
import makeTower from "./Tower";
import drawCards from "../utils/drawCards";
import { playUISound } from "../utils/soundHelpers";
import { createSeededRandom } from "../utils/seededRandom";
import makeHero from "./Hero";
import updateSkills from "../utils/updateSkills";
import addTowers from "../utils/addTowers";

type EndlessWaveSpawnerOptions = {
    chunks: MapChunk[];
    tileGrid: Tile[][];
    waypoints: Vec2[];
    pathTiles: PathTile[];
    seed: number;
};

export default function makeEndlessWaveSpawner(
    k: KAPLAYCtx,
    opts: EndlessWaveSpawnerOptions
) {
    const {
        chunks,
        tileGrid,
        seed,
        pathTiles
    } = opts;

    let waypoints = opts.waypoints;

    let spawnQueue: {
        id: EnemyId;
        time: number;
    }[] = [];

    let timer = 0;
    let spawning = false;
    let waitingForNextWave = true;
    let scale = store.get(mapAtom).iconScale;
    let enemyDeadCheck = true;

    function buildQueue(wave: Wave) {
        const queue: {
            id: EnemyId;
            time: number;
        }[] = [];

        let t = 0;

        for (const group of wave.spawns) {
            for (
                let i = 0;
                i < group.count;
                i++
            ) {
                queue.push({
                    id: group.id,
                    time: t
                });

                t += group.interval;
            }
        }

        return queue;
    }

    const spawner = k.add([
        "endlessWaveSpawner",
        {
            waveIndex: -1,

            startNextWave() {
                if (spawner.waveIndex < 0) {
                    k.get("arrow").forEach(a => k.destroy(a));
                }

                spawner.waveIndex++;

                const waveNumber =
                    spawner.waveIndex + 1;

                const wave = generateEndlessWave(
                    seed,
                    waveNumber
                );

                spawnQueue = buildQueue(wave);

                timer = 0;
                spawning = true;
                enemyDeadCheck = true;
                waitingForNextWave = false;

                let luckBonus = 0;

                if (waveNumber > 5) luckBonus = 1;

                if (waveNumber > 1) {
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        luck: prev.luck + 1 + luckBonus
                    }));
                }

                store.set(
                    gameStateAtom,
                    prev => ({
                        ...prev,
                        waveActive: true,
                        waveNumber:
                            spawner.waveIndex + 1
                    })
                );

                (k.get("tower") as TowerGameObj[]).forEach(t => {
                    if (t.timeData) t.timeData.timeMultiplier = 1;
                    if (t.charge) t.charge.currentCharge = 0;
                });
            }
        }
    ]);

    spawner.onUpdate(() => {
        scale = store.get(mapAtom).iconScale;
        if (
            store.get(gameStateAtom).gameOver
        ) {
            return;
        }

        /*
         * WAVE FINISHED
         */
        if (!spawning) {
            const enemies = k.get("enemy");

            if (
                enemyDeadCheck &&
                enemies.length === 0 &&
                spawner.waveIndex >= 0
            ) {
                enemyDeadCheck = false;
                waitingForNextWave = true;

                store.set(
                    gameStateAtom,
                    prev => ({
                        ...prev,
                        waveActive: false
                    })
                );

                const incomeMod = k.get("hero")[0]?.incomeMod ?? 1;
                const freeCardDraw = k.get("hero")[0]?.freeCardDraw ?? false;

                const reward = Math.round(50 * store.get(gameStateAtom).waveNumber * incomeMod);
                const duration = 1;

                const offsets = [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1]
                ];

                offsets.forEach(([x, y]) => {
                    const outline = k.add([
                        k.pos(k.toScreen(k.vec2(k.getCamPos().x + x, k.getCamPos().y + y))),
                        k.text(`Reward: +${reward}`, {
                            font: "free pixel",
                            size: 32 * scale
                        }),
                        k.color("#000000"),
                        k.opacity(1),
                        k.fixed(),
                        k.z(999999),
                        "textOutline",
                        k.anchor("center"),
                        {
                            time: 0,
                            update() {
                                outline.time += k.dt() * store.get(gameStateAtom).timeScale;
                                const t = Math.min(rewardText.time / duration, 1);

                                const eased = 1 - Math.pow(t, 3);
                                outline.opacity = eased;

                                if (t >= duration) {
                                    k.destroy(outline);
                                }
                            }
                        }
                    ]);
                });

                const rewardText = k.add([
                    k.pos(k.toScreen(k.getCamPos())),
                    k.text(`Reward: +${reward}`, {
                        font: "free pixel",
                        size: 32 * scale
                    }),
                    k.opacity(1),
                    k.anchor("center"),
                    k.z(9999999),
                    k.fixed(),
                    {
                        time: 0,
                        update() {
                            rewardText.time += k.dt();
                            const t = Math.min(rewardText.time / duration, 1);

                            const eased = 1 - Math.pow(t, 3);
                            rewardText.opacity = eased;

                            if (t >= duration) {
                                k.destroy(rewardText);
                            }
                        }
                    }
                ]);

                store.set(gameStateAtom, prev => ({
                    ...prev,
                    gold: prev.gold + reward,
                    deck: {
                        ...prev.deck,
                        drawCost: freeCardDraw ? 0 : BASE_DRAW_COST
                    }

                }));
                const deck = store.get(gameStateAtom).deck.cards;
                const cardsInHand = store.get(gameStateAtom).upgrades.length;
                const cardsToDraw = Math.min(ROUND_DRAW_NUM, MAX_HAND_SIZE - cardsInHand);
                if (cardsToDraw > 0) {
                    const cards = drawCards(k, deck, cardsToDraw);
                    store.set(gameStateAtom, prev => ({
                        ...prev,
                        upgrades: [
                            ...prev.upgrades,
                            ...cards
                        ]
                    }));
                }
                k.get("tower").forEach(tower => {
                    tower.buffs = null;
                });

                k.get("pathEntity").forEach(e => k.destroy(e));
                k.get("summon").forEach(s => s.enterState("die"));
                k.get("puddle").forEach(p => k.destroy(p));

                (k.get("tower") as TowerGameObj[]).forEach(e => {

                    if (e.farmData?.turnsRemaining) {
                        e.farmData.turnsRemaining--;

                        if (e.farmData.turnsRemaining <= 0) {
                            const plant = makeTower(k, {
                                towerId: SEEDS[e.farmData.plantedSeed ?? "nightshade"].growsInto,
                                pos: e.pos,
                                tileGrid: e.tileGrid,
                                pathTiles: e.pathTiles
                            });

                            k.destroy(e);
                            plant.placed = true;
                            plant.opacity = 1;
                            plant.selected = false;
                            plant.hovered = false;

                            if (k.get("hero").some(hero => hero.hasRangeBoost)) {
                                const hero = k.get("hero")[0];

                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    const amount = 1;
                                    plant.stats.range += amount;
                                }
                            }

                            if (k.get("hero").some(hero => hero.hasToxicAura)) {
                                const hero = k.get("hero")[0];

                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    plant.element = "Poison";
                                }
                            }

                            if (k.get("hero").some(hero => hero.hasBlock)) {
                                const hero = k.get("hero")[0];
                                const towerCenter = plant.pos.add(k.vec2((plant.footprint.w * TILE_SIZE) / 2));
                                const heroCenter = hero.pos.add(k.vec2(TILE_SIZE / 2));

                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * plant.footprint.w) {
                                    plant.hasBlock = true;
                                }
                            }
                        } else {
                            e.gun.play(`grow${3 - e.farmData.turnsRemaining}`);
                        }
                    }
                });

                const waveNumber = store.get(gameStateAtom).waveNumber;
                const endlessReward = getEndlessRewardType(waveNumber);

                switch (endlessReward) {
                    case "expand":
                        const nextChunk = chunks.find(
                            chunk => !chunk.revealed
                        );

                        if (nextChunk) {
                            revealChunk(
                                k,
                                nextChunk,
                                tileGrid
                            );

                            // Entrance has moved, so rebuild
                            // the route.
                            waypoints = generateWaypoints(
                                k,
                                chunks
                            );

                        }
                        break;
                    case "hero":
                        const hero = store.get(gameStateAtom).hero;

                        if (hero) {
                            store.set(rewardsAtom, prev => ({
                                ...prev,
                                visible: true,
                                rewardIndex: 0,
                                addSkill: (id) => {

                                    hero.skillIds.push(id)
                                    updateSkills(hero);

                                    const updatedHero = makeHero(
                                        k,
                                        {
                                            heroId: hero.heroId,
                                            pos: k.toWorld(k.mousePos()),
                                            tileGrid: hero.tileGrid,
                                            pathTiles: hero.pathTiles,
                                            level: hero.level + 1
                                        }
                                    );

                                    updatedHero.skillIds = hero.skillIds;

                                    store.set(gameStateAtom, prev => ({
                                        ...prev,
                                        hero: updatedHero,
                                        heroButton: {
                                            ...prev.heroButton,
                                            heroButton: {
                                                ...prev.heroButton,
                                                onClick: () => {
                                                    if (k.get("hero")[0]) k.destroy(k.get("hero")[0]);
                                                    else k.add(updatedHero);
                                                }
                                            },
                                        },
                                        heroCharge: {
                                            ...prev.heroCharge
                                        }
                                    }));

                                    updateSkills(updatedHero);

                                    const oldHero = k.get("hero")[0];
                                    if (oldHero && !oldHero.placed) k.destroy(oldHero);

                                    if (oldHero?.placed) {
                                        updatedHero.pos = oldHero.pos;
                                        updatedHero.placed = true;
                                        updatedHero.selected = false;
                                        updatedHero.hovered = false;
                                        updatedHero.opacity = 1;
                                        k.destroy(oldHero);
                                        k.add(updatedHero);
                                        updatedHero.sprite.opacity = 1;

                                        if (updatedHero.changeNormalElement && !oldHero.changeNormalElement) {
                                            k.get("tower").forEach(tower => {
                                                if (tower.element === "Normal") {
                                                    const elements = Object.keys(ELEMENTS).filter(e => e !== "Normal");
                                                    const rand = k.randi(elements.length);
                                                    tower.element = elements[rand];
                                                }
                                            });
                                        }

                                        if (updatedHero.heroId === "archer" && updatedHero.hasRangeBoost) updatedHero.stats.range++;

                                        if (updatedHero.hasRangeBoost && !oldHero.hasRangeBoost) {
                                            k.get("tower").forEach(tower => {
                                                if (tower.name === "Farm Tower") return;
                                                if (tower.heroId === "archer") return;

                                                const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                                                const heroCenter = updatedHero.pos.add(k.vec2(TILE_SIZE / 2));

                                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                                                    tower.stats.range++
                                                }
                                            });
                                        }

                                        if (updatedHero.hasToxicAura) {
                                            k.get("tower").forEach(tower => {
                                                const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                                                const heroCenter = updatedHero.pos.add(k.vec2(TILE_SIZE / 2));

                                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                                                    tower.element = "Poison";
                                                }
                                            });
                                        }

                                        if (updatedHero.hasBlock) {
                                            k.get("tower").forEach(tower => {
                                                const towerCenter = tower.pos.add(k.vec2((tower.footprint.w * TILE_SIZE) / 2));
                                                const heroCenter = updatedHero.pos.add(k.vec2(TILE_SIZE / 2));

                                                if (towerCenter.dist(heroCenter) <= TILE_SIZE * tower.footprint.w) {
                                                    tower.hasBlock = true;
                                                }
                                            });
                                        }
                                    }

                                    store.set(rewardsAtom, prev => ({
                                        ...prev,
                                        visible: false
                                    }));
                                }
                            }));

                        }

                        break;
                    case "tower":
                        store.set(rewardsAtom, prev => ({
                            ...prev,
                            visible: true,
                            rewardIndex: 2,
                            addTower: id => {

                                store.set(rewardsAtom, prev => ({
                                    ...prev,
                                    visible: false,
                                    rewardIndex: 0
                                }));

                                store.set(gameStateAtom, prev => ({
                                    ...prev,
                                    towerButtons: [
                                        ...addTowers(k, [...prev.towerButtons.map(tb => tb.id), id], tileGrid, pathTiles)
                                    ]
                                }));

                            }

                        }));
                        break;
                    case "card":
                        if (store.get(gameStateAtom).waveNumber > 12 && store.get(gameStateAtom).deck.cards.length >= 6) {
                            store.set(rewardChoiceAtom, prev => ({
                                ...prev,
                                visible: true,
                                show: "upgrades"
                            }));
                        } else {
                            store.set(rewardsAtom, prev => ({
                                ...prev,
                                visible: true,
                                rewardIndex: 1,
                                endlessCards: upgrade => {
    
                                    store.set(rewardsAtom, prev => ({
                                        ...prev,
                                        rewardIndex: 0,
                                        visible: false,
                                        endlessCards: null
                                    }));
    
                                    store.set(gameStateAtom, prev => ({
                                        ...prev,
                                        deck: {
                                            ...prev.deck,
                                            cards: [...prev.deck.cards, upgrade]
                                        }
                                    }));
    
                                }
                            }));
                        }
                        break;
                }
            }


            return;
        }

        /*
         * SPAWN QUEUE
         */
        timer +=
            k.dt() *
            store.get(gameStateAtom).timeScale;

        while (
            spawnQueue.length &&
            spawnQueue[0].time <= timer
        ) {
            const spawn =
                spawnQueue.shift()!;

            makeEnemy(
                k,
                spawn.id,
                waypoints,
                0
            );
        }

        if (
            spawning &&
            spawnQueue.length === 0
        ) {
            spawning = false;
            enemyDeadCheck = true;
        }
    });

    let waveTextPos = k.vec2(20 * scale, 15 * scale);
    let buttonPos = k.vec2(waveTextPos).add(k.vec2(160 * scale, 10 * scale));

    k.onUpdate(() => {
        waveTextPos = k.vec2(20 * scale, 15 * scale);
        buttonPos = k.vec2(waveTextPos).add(k.vec2(160 * scale, 10 * scale));
    });

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    offsets.forEach(([x, y]) => {
        const outline = k.add([
            k.pos(waveTextPos.x + x * scale, waveTextPos.y + y * scale),
            k.text("", {
                size: 20 * scale,
                font: "free pixel"
            }),
            k.color("#000000"),
            k.opacity(store.get(gameStateAtom).hideUI ? 0 : 1),
            k.fixed(),
            k.z(999),
            {
                update() {
                    let textStr = "";

                    if (spawner.waveIndex < 0) {
                        textStr = 'Wave: 1';
                    } else if (spawning) {
                        textStr = `Wave: ${spawner.waveIndex + 1}`;
                    } else if (waitingForNextWave) {
                        textStr = `Wave: ${spawner.waveIndex + 2}`;
                    } else {
                        textStr = `Wave: ${spawner.waveIndex + 1}`;
                    }

                    outline.text = textStr;

                    outline.pos = waveTextPos.add(x * scale, y * scale);

                    outline.textSize = 20 * scale;
                    outline.opacity = store.get(gameStateAtom).hideUI || store.get(gameStateAtom).gameOver ? 0 : 1;
                }
            }
        ]);
    });
    let opacity = store.get(gameStateAtom).hideUI || store.get(gameStateAtom).gameOver ? 0 : 1;

    const waveText = k.add([
        k.pos(waveTextPos),
        k.color('#FFFFFF'),
        k.text("", {
            size: 20 * scale,
            font: "free pixel"
        }),
        k.opacity(opacity),
        k.fixed(),
        k.z(999),
        {
            update() {
                let textStr = "";

                if (spawner.waveIndex < 0) {
                    textStr = 'Wave: 1';
                } else if (spawning) {
                    textStr = `Wave: ${spawner.waveIndex + 1}`;
                } else if (waitingForNextWave) {
                    textStr = `Wave: ${spawner.waveIndex + 2}`;
                } else {
                    textStr = `Wave: ${spawner.waveIndex + 1}`;
                }

                waveText.text = textStr;

                waveText.pos = waveTextPos;

                waveText.textSize = 20 * scale;

                waveText.opacity = store.get(gameStateAtom).hideUI || store.get(gameStateAtom).gameOver ? 0 : 1;
            }
        }
    ]);

    const nextWaveButton = k.add([
        k.rect(100 * scale, 25 * scale, { radius: 2 * scale }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.area(),
        k.fixed(),
        k.color(85, 85, 85),
        k.z(1000),
        {
            update() {
                nextWaveButton.hidden = (!waitingForNextWave || store.get(gameStateAtom).gameOver);
                nextWaveButton.pos = buttonPos;
                nextWaveButton.width = 100 * scale;
                nextWaveButton.height = 25 * scale;
            }
        }
    ]);

    const outline = k.add([
        k.rect(100 * scale, 25 * scale, { radius: 2 * scale, fill: false }),
        k.pos(buttonPos),
        k.anchor("center"),
        k.fixed(),
        k.opacity(0.5),
        k.z(1001),
        k.outline(1, k.rgb(255, 255, 255)),
        {
            update() {
                outline.hidden = (!waitingForNextWave || store.get(gameStateAtom).gameOver);
                outline.pos = buttonPos;
                outline.width = 100 * scale;
                outline.height = 25 * scale;
            }
        }
    ]);

    const buttonText = k.add([
        k.text("Start Wave", { size: 16 * scale, font: "free pixel" }),
        k.pos(buttonPos.x, buttonPos.y),
        k.fixed(),
        k.anchor("center"),
        k.z(1001),
        {
            update() {
                buttonText.hidden = (!waitingForNextWave || store.get(gameStateAtom).gameOver);
                buttonText.pos = k.vec2(buttonPos.x, buttonPos.y);

                buttonText.textSize = 16 * scale;
            }
        }
    ]);

    nextWaveButton.onHover(() => {
        if (nextWaveButton.hidden) return;
        k.setCursor("pointer");
        playUISound(k, "ui hover");
        nextWaveButton.color = k.rgb(144, 144, 144); // brighter green
    });

    nextWaveButton.onHoverEnd(() => {
        k.setCursor("default");
        nextWaveButton.color = k.rgb(85, 85, 85); // original color
    });

    nextWaveButton.onClick(() => {
        if (nextWaveButton.hidden) return;
        playUISound(k, "start wave");

        if (waitingForNextWave) {
            waitingForNextWave = false;
            spawner.startNextWave();
        }
    });


    return spawner;
}

function generateEndlessWave(
    runSeed: number,
    waveNumber: number
): Wave {
    const rng = createSeededRandom(
        getWaveSeed(runSeed, waveNumber)
    );

    let remainingBudget =
        getWaveBudget(waveNumber);

    const spawns: Wave["spawns"] = [];

    let previousEnemyId: EnemyId | null = null;

    while (remainingBudget > 0) {
        const availableEnemies =
            ENDLESS_ENEMIES.filter(enemy =>
                enemy.unlockWave <= waveNumber &&
                enemy.cost * enemy.minGroupSize <= remainingBudget &&
                enemy.id !== previousEnemyId
            );

        if (availableEnemies.length === 0) {
            break;
        }

        const enemy =
            availableEnemies[
            Math.floor(
                rng() *
                availableEnemies.length
            )
            ];

        const maxAffordable =
            Math.floor(
                remainingBudget / enemy.cost
            );

        const maxGroupSize = Math.min(
            enemy.maxGroupSize,
            maxAffordable
        );

        const count =
            enemy.minGroupSize +
            Math.floor(
                rng() *
                (
                    maxGroupSize -
                    enemy.minGroupSize +
                    1
                )
            );

        spawns.push({
            id: enemy.id,
            count,
            interval: 0.75
        });

        remainingBudget -=
            count * enemy.cost;

        previousEnemyId = enemy.id;
    }

    return {
        reward: 20,
        spawns
    };
}

function getWaveSeed(
    runSeed: number,
    waveNumber: number
) {
    return (
        runSeed +
        waveNumber * 0x9E3779B9
    ) >>> 0;
}

function getWaveBudget(wave: number) {
    let result = 0;

    for (let i = 0; i < wave; i++) {
        if (i < 6) result += 5;
        else if (i < 11) result += 10;
        else if (i < 16) result += 20;
        else result += 30;
    }

    return result;
}

function getEndlessRewardType(
    waveNumber: number
): EndlessRewardType {
    const isExpansionWave =
        (waveNumber - 1) % 5 === 0;

    if (isExpansionWave) {
        return "expand";
    }

    const cycle = [
        "hero",
        "tower",
        "card"
    ] as const;

    const expansionCount =
        Math.floor((waveNumber - 1) / 5) + 1;

    const normalRewardsGiven =
        waveNumber - 1 - expansionCount;

    return cycle[
        normalRewardsGiven % cycle.length
    ];
}