import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import Card from "../Card/Card";
import UpgradePopup from "../UpgradePopup/UpgradePopup";
import { useState } from "react";
import styles from './DeckUI.module.css';

export default function DeckUI() {
    const [gameState] = useAtom(gameStateAtom);
    const cards = gameState.deck.cards;
    const [map] = useAtom(mapAtom);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);

    return (
        <div className={styles.container}>
            <div className={styles.heading}>Your Deck</div>
            <div className={styles["card-container"]}>
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        popup={<UpgradePopup upgrade={card} pos={popupPos} />}
                        setPopupPos={setPopupPos}
                        scale={map.scale}
                    >
                        <UpgradeCard
                            upgrade={card}
                            scale={map.scale}
                        />
                    </Card>
                ))}
            </div>
        </div>
    );
}