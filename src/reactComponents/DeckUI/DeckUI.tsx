import { useAtom } from "jotai";
import { gameStateAtom, mapAtom } from "../../store";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import Card from "../Card/Card";
import styles from './DeckUI.module.css';
import type { Upgrade } from "../../types";

export default function DeckUI({
    setHovered,
    setPopupPos,
    setCard
}: {
    setHovered: React.Dispatch<React.SetStateAction<boolean>>;
    setPopupPos: React.Dispatch<React.SetStateAction<{
        x: number;
        y: number;
    } | null>>;
    setCard:  React.Dispatch<React.SetStateAction<Upgrade>>;
}) {
    const [gameState] = useAtom(gameStateAtom);
    const cards = gameState.deck.cards;
    const [map] = useAtom(mapAtom);

    return (
        <div className={styles["card-container"]}>
            {cards.map((card, index) => (
                <Card
                    key={index}
                    setPopupPos={setPopupPos}
                    scale={map.scale}
                    setDeckHovered={setHovered}
                >
                    <UpgradeCard
                        upgrade={card}
                        scale={map.scale}
                        setCard={setCard}
                    />
                </Card>
            ))}
        </div>
    );
}