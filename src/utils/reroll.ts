import type { KAPLAYCtx } from 'kaplay';
import { store, gameStateAtom } from '../store';
import drawCards from './drawCards';

export default function reroll(k: KAPLAYCtx) {
    const numberOfCards = store.get(gameStateAtom).upgrades.length;
    const cards = drawCards(k, store.get(gameStateAtom).deck.cards, numberOfCards);
    store.set(gameStateAtom, prev => ({
        ...prev,
        upgrades: cards,
        gold: prev.gold - prev.reroll.cost,
        reroll: {
            ...prev.reroll,
            baseCost: Math.min(40, prev.reroll.baseCost * 2),
            rerollCount: prev.reroll.rerollCount + 1
        }
    }));

}