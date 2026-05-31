import { useAtom } from "jotai";
import { altarAtom, gameStateAtom, mapAtom, shopAtom } from "../../store";
import styles from './Altar.module.css';
import LoadoutPreviewPanel from "../LoadoutPreviewPanel/LoadoutPreviewPanel";
import Button from "../Button/Button";
import { useState } from "react";
import Modal from "../Modal/Modal";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import Card from "../Card/Card";
import { playUISound } from "../../utils/soundHelpers";

export default function Altar() {
    const [altar, setAltar] = useAtom(altarAtom);
    const [shop] = useAtom(shopAtom);
    const [map] = useAtom(mapAtom);
    const fontScale = map.fontScale;
    const iconScale = map.iconScale;
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const towerCoins = gameState.towerCoins;
    const healCost = Math.round((gameState.maxHealth - gameState.health) * 2.5);
    const maxHPCost = altar.maxHPCost;
    const removeCardCost = altar.removeCardCost;
    const levelUpCost = altar.levelUpCost;
    const [showRCModal, setShowRCModal] = useState(false);

    return (
        <div className={styles.container} style={{ fontSize: `${16 * fontScale}px` }}>
            <div className={styles.heading}>Altar</div>

            <div className={styles.stats}>
                <div className={styles.health}><img width={22 * iconScale} src="/sprites/heart.png" />{gameState.health}/{gameState.maxHealth}</div>
                <div className={styles["tower-coins"]}>
                    <img width={17 * iconScale} src="sprites/tower-coin.png" />
                    <div>{gameState.towerCoins}</div>
                </div>
            </div>

            <div className={styles["choice-container"]}>
                <div
                    className={`${styles.choice} ${healCost > towerCoins || healCost <= 0 ? styles.disabled : ''}`}
                    onClick={() => {
                        if (healCost > towerCoins) return;
                        playUISound(gameState.context, "blessing");

                        setGameState(prev => ({
                            ...prev,
                            health: prev.maxHealth,
                            towerCoins: prev.towerCoins - healCost
                        }));
                    }}
                >
                    <div className={styles["sub-heading"]}>Blessing of Restoration</div>
                    <div>Restore HP</div>
                    <div className={styles.cost}><img width={17 * iconScale} src={'/sprites/tower-coin.png'} />
                        <div className={`${healCost > towerCoins ? styles["cant-afford"] : ''}`}>{healCost}</div>
                    </div>
                </div>
                <div
                    className={`${styles.choice} ${maxHPCost > towerCoins || altar.remainingUses.maxHP <= 0 ? styles.disabled : ''}`}
                    onClick={() => {
                        if (maxHPCost > towerCoins || altar.remainingUses.maxHP <= 0) return;
                        playUISound(gameState.context, "blessing");
                        setGameState(prev => ({
                            ...prev,
                            health: prev.health + 5,
                            maxHealth: prev.maxHealth + 5,
                            towerCoins: prev.towerCoins - maxHPCost
                        }));
                        setAltar(prev => ({
                            ...prev,
                            remainingUses: {
                                ...prev.remainingUses,
                                maxHP: prev.remainingUses.maxHP - 1
                            }
                        }));
                    }}
                >
                    <div className={styles["sub-heading"]}>Blessing of Vitality</div>
                    <div>+5 Max HP</div>

                    <div className={styles["choice-footer"]}>
                        <div className={styles.cost}><img width={17 * iconScale} src={'/sprites/tower-coin.png'} />
                            <div className={`${maxHPCost > towerCoins ? styles["cant-afford"] : ''}`}>{maxHPCost}</div>
                        </div>
                        <div>Uses: {altar.remainingUses.maxHP}</div>
                    </div>
                </div>
                <div
                    className={`${styles.choice} ${removeCardCost > towerCoins || altar.remainingUses.removeCard <= 0 ? styles.disabled : ''}`}
                    onClick={() => {
                        if (removeCardCost <= towerCoins && altar.remainingUses.removeCard > 0) {
                            setShowRCModal(true);
                        }
                    }}
                >
                    <div className={styles["sub-heading"]}>Blessing of Purification</div>
                    <div>Remove Card</div>

                    <div className={styles["choice-footer"]}>
                        <div className={styles.cost}><img width={17 * iconScale} src={'/sprites/tower-coin.png'} />
                            <div className={`${removeCardCost > towerCoins ? styles["cant-afford"] : ''}`}>{removeCardCost}</div>
                        </div>
                        <div>Uses: {altar.remainingUses.removeCard}</div>
                    </div>
                </div>

                <div
                    className={`${styles.choice} ${levelUpCost > towerCoins || altar.remainingUses.levelUp <= 0 ? styles.disabled : ''}`}
                    onClick={() => {
                        if (levelUpCost > towerCoins || altar.remainingUses.levelUp <= 0) return;
                        setGameState(prev => ({
                            ...prev,
                            towerCoins: prev.towerCoins - levelUpCost
                        }));
                        playUISound(gameState.context, "blessing");
                        setAltar(prev => ({
                            ...prev,
                            remainingUses: {
                                ...prev.remainingUses,
                                levelUp: prev.remainingUses.levelUp - 1
                            }
                        }));

                        altar.levelUp();
                    }}
                >
                    <div className={styles["sub-heading"]}>Blessing of Growth</div>
                    <div>Level Up</div>

                    <div className={styles["choice-footer"]}>
                        <div className={styles.cost}><img width={17 * iconScale} src={'/sprites/tower-coin.png'} />
                            <div className={`${levelUpCost > towerCoins ? styles["cant-afford"] : ''}`}>{levelUpCost}</div>
                        </div>
                        <div>Uses: {altar.remainingUses.levelUp}</div>
                    </div>
                </div>

            </div>

            <Modal isOpen={showRCModal} onClose={() => setShowRCModal(false)}>
                <div className={styles["remove-card"]}>Remove a Card</div>
                <div className={styles["rc-container"]}>
                    {gameState.deck.cards.map((card, index) => (
                        <Card
                            key={index}
                            scale={map.fontScale}
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
                                    remainingUses: {
                                        ...prev.remainingUses,
                                        removeCard: prev.remainingUses.removeCard - 1
                                    }
                                }));
                                playUISound(gameState.context, "blessing");
                                setShowRCModal(false);
                            }}
                        >
                            <UpgradeCard upgrade={card} scale={fontScale} />
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