import type { KAPLAYCtx } from 'kaplay';
import type { Upgrade } from '../types';
import setCardAnimationDelay from './setCardAnimationDelay';
import { playUISound } from './soundHelpers';

export default function drawCards(k: KAPLAYCtx, deck: Upgrade[], amount: number): Upgrade[] {
    const cards: Upgrade[] = [];
    let deckIndex = k.randi(0, deck.length);

    amount = Math.min(amount, deck.length);

    while (cards.length < amount) {
        const card = deck[deckIndex];
        if (!cards.includes(card)) {
            cards.push(card);
        }
        deckIndex = k.randi(0, deck.length);
    }

    playUISound(k, "card");

    return cards.map((card, index) => ({ ...card, ...(amount > 1 ? { animationDelay: setCardAnimationDelay(index) } : '') }));
}