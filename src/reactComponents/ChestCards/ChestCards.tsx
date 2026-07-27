import { useMemo } from 'react';
import SpellCard from '../SpellCard/SpellCard';
import styles from './ChestCards.module.css';
import { SPELLS } from '../../constants';
import type { Spell } from '../../types';
import { chestAtom, gameStateAtom, mapAtom } from '../../store';
import { useAtom } from 'jotai';
import Card from '../Card/Card';
import { castSpell, generateRandomSpells } from '../../utils/spellHelpers';

export default function ChestCards() {
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.fontScale;
    const [, setChestCards] = useAtom(chestAtom);
    const spells = useMemo(
        () => generateRandomSpells(3, SPELLS),
        []
    );

    function addCardToHand(card: Spell) {
        setChestCards(prev => ({
            ...prev,
            visible: false
        }));

        if (gameState?.context) gameState.context.get("*").forEach((obj) => obj.paused = false);

        if (card.target === "auto-consume" && gameState.context) {
            castSpell(gameState.context, card);
            return;
        }

        setGameState(prev => ({
            ...prev,
            upgrades: [...prev.upgrades, { ...card }]
        }));
    }

    return (
        <div style={{ fontSize: 16 * map.fontScale }} className={styles.container}>
            <div className={styles.title}>Choose a Card</div>
            <div className={styles["card-container"]}>
                {spells.map((spell) => (
                    <Card
                        key={spell.name}
                        scale={scale}
                        handleClick={() => addCardToHand(spell)}
                        classNames={[styles.spell]}
                    >
                        <SpellCard
                            name={spell.name}
                            uses={0}
                            icon={spell.icon}
                            iconScale={2}
                        />
                        <div className={styles.description}>
                            {spell.description}
                        </div>
                        <div className={styles.uses}>
                            {spell.uses && "Uses: " + spell.uses}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}