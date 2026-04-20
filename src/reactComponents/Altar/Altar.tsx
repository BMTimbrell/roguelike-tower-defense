import { useAtom } from "jotai";
import { altarAtom, gameStateAtom, mapAtom, shopAtom } from "../../store";
import styles from './Altar.module.css';
import LoadoutPreviewPanel from "../LoadoutPreviewPanel/LoadoutPreviewPanel";
import Button from "../Button/Button";
import { useState } from "react";
import Modal from "../Modal/Modal";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import Card from "../Card/Card";

export default function Altar() {
    const [altar, setAltar] = useAtom(altarAtom);
    const [shop] = useAtom(shopAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const towerCoins = gameState.towerCoins;
    const healCost = Math.round((gameState.maxHealth - gameState.health) * 2.5);
    const maxHPCost = altar.maxHPCost;
    const removeCardCost = altar.removeCardCost;
    const [showRCModal, setShowRCModal] = useState(false);

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px` }}>
            <div className={styles.heading}>Altar</div>

            <div className={styles.stats}>
                <div className={styles.health}><img width={22 * scale} src="/sprites/heart.png" />{gameState.health}/{gameState.maxHealth}</div>
                <div className={styles["tower-coins"]}>
                    <img width={17 * scale} src="sprites/tower-coin.png" />
                    <div>{gameState.towerCoins}</div>
                </div>
            </div>

            <div className={styles["choice-container"]}>
                <div
                    className={`${styles.choice} ${healCost > towerCoins || healCost <= 0 ? styles.disabled : ''}`}
                    onClick={() => {
                        if (healCost > towerCoins) return;

                        setGameState(prev => ({
                            ...prev,
                            health: prev.maxHealth,
                            towerCoins: prev.towerCoins - healCost
                        }));
                    }}
                >
                    <div>Restore HP</div>
                    <div className={styles.cost}><img width={17 * scale} src={'/sprites/tower-coin.png'} />
                        <div className={`${healCost > towerCoins ? styles["cant-afford"] : ''}`}>{healCost}</div>
                    </div>
                </div>
                <div
                    className={`${styles.choice} ${maxHPCost > towerCoins ? styles.disabled : ''}`}
                    onClick={() => {
                        if (maxHPCost > towerCoins) return;
                        setGameState(prev => ({
                            ...prev,
                            health: prev.health + 5,
                            maxHealth: prev.maxHealth + 5,
                            towerCoins: prev.towerCoins - maxHPCost
                        }));
                        setAltar(prev => ({
                            ...prev,
                            maxHPCost: prev.maxHPCost * 2
                        }));
                    }}
                >
                    <div>+5 Max HP</div>
                    <div className={styles.cost}><img width={17 * scale} src={'/sprites/tower-coin.png'} />
                        <div className={`${maxHPCost > towerCoins ? styles["cant-afford"] : ''}`}>{maxHPCost}</div>
                    </div>
                </div>
                <div
                    className={`${styles.choice} ${removeCardCost > towerCoins ? styles.disabled : ''}`}
                    onClick={() => {
                        if (removeCardCost <= towerCoins) setShowRCModal(true)
                    }}
                >
                    <div>Remove Card</div>
                    <div className={styles.cost}><img width={17 * scale} src={'/sprites/tower-coin.png'} />
                        <div className={`${removeCardCost > towerCoins ? styles["cant-afford"] : ''}`}>{removeCardCost}</div>
                    </div>
                </div>
            </div>

            <Modal isOpen={showRCModal} onClose={() => setShowRCModal(false)}>
                <div className={styles["remove-card"]}>Remove a Card</div>
                <div className={styles["rc-container"]}>
                    {gameState.deck.cards.map((card, index) => (
                        <Card
                            key={index}
                            scale={map.scale}
                            handleClick={() => {
                                setGameState(prev => ({
                                    ...prev,
                                    towerCoins: prev.towerCoins - removeCardCost,
                                    deck: {
                                        ...prev.deck,
                                        cards: prev.deck.cards.filter(c => c !== card)
                                    }
                                }));
                                setAltar(prev => ({
                                    ...prev,
                                    removeCardCost: prev.removeCardCost * 2
                                }));
                                setShowRCModal(false);
                            }}
                        >
                            <UpgradeCard upgrade={card} scale={scale} />
                        </Card>
                    ))}
                </div>
            </Modal>

            <div className={styles["button-container"]}>
                <LoadoutPreviewPanel />

                <Button
                    onClick={() => {
                        shop.nextLevel();
                        setAltar(prev => ({
                            ...prev,
                            visible: false
                        }));
                    }}
                >
                    Next Level
                </Button>
            </div>
        </div>
    );
}