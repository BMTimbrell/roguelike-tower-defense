import type { KAPLAYCtx } from 'kaplay';
import type { Upgrade } from '../types';

export default function drawCards(k: KAPLAYCtx, deck: Upgrade[], amount: number): Upgrade[] {
    const cards: Upgrade[] = [];
    let deckIndex = k.randi(0, deck.length);

    while (cards.length < amount) {
        const card = deck[deckIndex];
        if (!cards.includes(card)) {
            cards.push(card);
        }
        deckIndex = k.randi(0, deck.length);
    }

    return cards.map(card => ({ ...card }));
}