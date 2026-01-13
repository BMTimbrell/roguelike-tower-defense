import type { Upgrade } from '../types';
import { UPGRADES } from '../constants';
import type { KAPLAYCtx } from 'kaplay';

export default function generateDeck(k: KAPLAYCtx): Upgrade[] {
    const singles: Upgrade[] = UPGRADES.filter(u => u.cost === 1);
    const doubles: Upgrade[] = UPGRADES.filter(u => u.cost === 2);
    let upgradeIndex = k.randi(0, singles.length);
    const deck: Upgrade[] = [];
    let allowDuplicates = k.randi() === 0;

    while (deck.length < 5) {
        const upgrade = singles[upgradeIndex];

        if (!deck.includes(upgrade) || allowDuplicates) {
            if (deck.includes(upgrade)) {
                allowDuplicates = false;
            }
            deck.push(upgrade);
        }

        upgradeIndex = k.randi(0, singles.length);
    }

    upgradeIndex = k.randi(0, doubles.length);
    deck.push(doubles[upgradeIndex]);

    return deck.map(c => ({ ...c }));
}