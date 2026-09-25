import { useAtom } from 'jotai';
import { gameStateAtom, mapAtom, rewardChoiceAtom, rewardsAtom } from '../../store';
import styles from './EndessRewardUI.module.css';
import { useState } from 'react';
import Modal from '../Modal/Modal';
import Card from '../Card/Card';
import UpgradeCard from '../UpgradeCard/UpgradeCard';
import LoadoutPreviewPanel from '../LoadoutPreviewPanel/LoadoutPreviewPanel';
import { playUISound } from '../../utils/soundHelpers';

export default function EndlessRewardUI() {
    const [rewardChoice, setRewardChoice] = useAtom(rewardChoiceAtom);
    const [, setRewards] = useAtom(rewardsAtom);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const choices = rewardChoice.choices;
    const fontScale = map.fontScale;
    const [showRCModal, setShowRCModal] = useState(false);

    const handleClick = {
        "Add Card": () => {
            playUISound(gameState.context, "ui click");
            setRewardChoice(prev => ({ ...prev, visible: false }));
            setRewards(prev => ({
                ...prev,
                visible: true,
                rewardIndex: 1,
                endlessCards: upgrade => {

                    setRewards(prev => ({
                        ...prev,
                        rewardIndex: 0,
                        visible: false,
                        endlessCards: null
                    }));

                    setGameState(prev => ({
                        ...prev,
                        deck: {
                            ...prev.deck,
                            cards: [...prev.deck.cards, upgrade]
                        }
                    }));

                }
            }))
        },
        "Remove Card": () => {
            playUISound(gameState.context, "ui click");
            setShowRCModal(true);
        },
        "Add Hero": () => setRewards(prev => ({
            ...prev,
            visible: true,
            rewardIndex: 1,
            endlessCards: upgrade => {

                setRewards(prev => ({
                    ...prev,
                    rewardIndex: 0,
                    visible: false,
                    endlessCards: null
                }));

                setGameState(prev => ({
                    ...prev,
                    deck: {
                        ...prev.deck,
                        cards: [...prev.deck.cards, upgrade]
                    }
                }));

            }
        })),
        "Level Hero": () => setRewards(prev => ({
            ...prev,
            visible: true,
            rewardIndex: 1,
            endlessCards: upgrade => {

                setRewards(prev => ({
                    ...prev,
                    rewardIndex: 0,
                    visible: false,
                    endlessCards: null
                }));

                setGameState(prev => ({
                    ...prev,
                    deck: {
                        ...prev.deck,
                        cards: [...prev.deck.cards, upgrade]
                    }
                }));

            }
        }))
    };

    return (
        <>
            <div style={{ fontSize: `${16 * fontScale}px` }} className={styles.container}>
                <div className={styles["choice-container"]}>
                    {choices[rewardChoice["show"]].map(choice => (
                        <div onClick={handleClick[choice]} onMouseEnter={() => playUISound(gameState.context, "ui hover")} className={styles.choice} key={choice}>
                            {choice}
                        </div>
                    ))}
                </div>

                <LoadoutPreviewPanel />
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
                                        deck: {
                                            ...prev.deck,
                                            cards: prev.deck.cards.filter(c => c !== card)
                                        }
                                    }));
                                    setRewardChoice(prev => ({ ...prev, visible: false }));
                                    setShowRCModal(false);
                                }}
                            >
                                <UpgradeCard upgrade={card} scale={fontScale} />
                            </Card>
                        ))}
                    </div>
                </Modal>
            </div>

        </>
    );

}