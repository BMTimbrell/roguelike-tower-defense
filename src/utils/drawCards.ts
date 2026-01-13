import type { KAPLAYCtx } from 'kaplay';
import type { Upgrade } from '../types';

export default function drawCards(k: KAPLAYCtx, deck: Upgrade[], amount: number): Upgrade[] {
    const cards: Upgrade[] = [];
    let deckIndex = k.randi(0, deck.length);

    while (cards.length < amount) {
        cards.push(deck[deckIndex]);
        deckIndex = k.randi(0, deck.length);
    }

    return cards.map(card => ({ ...card }));
}