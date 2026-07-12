import type { KAPLAYCtx } from 'kaplay';
import { store, gameStateAtom } from '../store';
import drawCards from './drawCards';
import { SPELLS } from '../constants';
import { generateRandomSpells } from './spellHelpers';

export default function reroll(k: KAPLAYCtx) {
    const oldHand = store.get(gameStateAtom).upgrades;

    const spellCount = oldHand.filter(card => "type" in card && card.type === "spell").length;
    const upgradeCount = oldHand.length - spellCount;

    const upgradeCards = drawCards(k, store.get(gameStateAtom).deck.cards, upgradeCount);
    const spellCards = generateRandomSpells(spellCount, SPELLS);

    let upgradeIndex = 0;
    let spellIndex = 0;

    const newHand = oldHand.map(card => {
        if ("type" in card && card.type === "spell") {
            return spellCards[spellIndex++];
        }

        return upgradeCards[upgradeIndex++];
    });

    store.set(gameStateAtom, prev => ({
        ...prev,
        upgrades: newHand,
        handVersion: prev.handVersion + 1
    }));
}