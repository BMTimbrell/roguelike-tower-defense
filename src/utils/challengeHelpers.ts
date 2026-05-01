import { gameStateAtom, store } from "../store";
import type { ChallengeDef, ChallengeState, GameEvent } from "../types";

export function generateChallenges() {
    const damageTypes = [...new Set(store.get(gameStateAtom).towerButtons.map(tb => tb.element).filter(element => element !== "Normal"))];
    const towers = store.get(gameStateAtom).towerButtons.map(tb => ({ id: tb.id, name: tb.name, cost: tb.cost }));

    const challenges: ChallengeDef[] = [];
    const result = new Set<ChallengeDef>();

    let randomIndex = 0

    if (damageTypes.length > 0) {
        randomIndex = Math.floor(Math.random() * damageTypes.length);
        const randomDamageType = damageTypes[randomIndex];
        const damageTypeAmount = store.get(gameStateAtom).towerButtons.map(tb => tb.element).filter(dt => dt === randomDamageType).length;
        const difficulty = Math.random() < 0.5 ? "normal" : "hard";
        const baseTarget = difficulty === "normal" ? 4000 : 8000;
        const target = baseTarget * damageTypeAmount;

        challenges.push({
            id: "deal_damage",
            type: "progress",
            params: { damageType: randomDamageType },
            description: `Deal ${target} ${randomDamageType.toLowerCase()} damage`,
            target,
            conditions: [
                {
                    event: "DEAL_DAMAGE",
                    where: { damageType: "$damageType" },
                    increment: "amount"
                }
            ],
            reward: difficulty === "normal" ? 20 : 40
        });
    }

    randomIndex = Math.floor(Math.random() * towers.length);
    const randomTower = towers[randomIndex];
    const baseTarget = 75;
    const target = Math.round(baseTarget / Math.pow(randomTower.cost, 0.6));

    challenges.push({
        id: "place_tower",
        type: "progress",
        params: { towerId: randomTower.id },
        description: `Place ${target} ${randomTower.name}s`,
        target,
        conditions: [
            {
                event: "BUILD_TOWER",
                where: { towerId: "$towerId" },
                increment: 1
            }
        ],
        reward: 40
    });

    challenges.push({
        id: "no_draw",
        description: "Don't draw any cards",
        type: "restriction",
        conditions: [
            {
                event: "DRAW_CARD",
                fail: true
            }
        ],
        reward: 30
    },
        {
            id: "no_build",
            description: "Don't build any towers during a wave",
            type: "restriction",
            conditions: [
                {
                    event: "BUILD_TOWER",
                    where: { waveActive: true },
                    fail: true
                }
            ],
            reward: 30
        }
    );

    while (result.size < 3) {
        const randomIndex = Math.floor(Math.random() * challenges.length);
        result.add(challenges[randomIndex]);
    }

    return [...result];
}

function handleEvent(state: ChallengeState, event: GameEvent) {
    const { def } = state;

    for (const cond of def.conditions) {
        if (cond.event !== event.type) continue;

        // check filters
        if (cond.where) {
            const matches = Object.entries(cond.where).every(([key, value]) => {
                if (def.params) {
                    const expected = resolveValue(value, def.params);
                    return (event as any)[key] === expected;
                }

                return (event as any)[key] === value;

            });

            if (!matches) continue;
        }

        // restriction fail
        if (cond.fail) {
            state.failed = true;
        }

        // progress increment
        if (def.type === "progress" && cond.increment) {
            if (cond.increment === "amount") {
                state.progress += (event as any).amount ?? 0;
            } else {
                state.progress += cond.increment;
            }
        }
    }
}

function updateChallenge(state: ChallengeState) {
    if (state.failed || state.completed) return;

    const def = state.def;

    if (def.type === "progress" && def.target !== undefined) {
        if (state.progress >= def.target) {
            state.completed = true;
            return;
        }
    }
}

export class ChallengeManager {
    active: ChallengeState | null = null;

    setChallenge(def: ChallengeDef | null) {
        if (!def) {
            this.active = null;
            return;
        }

        this.active = {
            def,
            progress: 0,
            failed: false,
            completed: false,
        };
    }

    getChallenge() {
        return this.active;
    }

    handleEvent(event: GameEvent) {
        if (!this.active) return;
        handleEvent(this.active, event);
        updateChallenge(this.active);
    }

    completeIfSurvivedLevel() {
        if (!this.active) return;

        const state = this.active;

        // Only applies to restriction challenges
        if (state.def.type === "restriction" && !state.failed) {
            state.completed = true;
        }
    }
}

function resolveValue(value: any, params?: Record<string, any>) {
    if (typeof value === "string" && value.startsWith("$")) {
        return params?.[value.slice(1)];
    }
    return value;
}