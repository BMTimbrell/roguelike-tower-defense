import { useAtom } from 'jotai';
import { mapAtom } from '../../store';
import Button from '../Button/Button';
import styles from './LoadoutPreviewPanel.module.css';
import { useState } from 'react';
import DeckUI from '../DeckUI/DeckUI';
import Modal from '../Modal/Modal';
import TowerUI from '../TowerUI/TowerUI';

export default function LoadoutPreviewPanel() {
    const [map] = useAtom(mapAtom);
    const [showCardLoadout, setShowCardLoadout] = useState(false);
    const [showTowerLoadout, setShowTowerLoadout] = useState(false);

    return (
        <div className={styles.container}>
            <Button onClick={() => setShowTowerLoadout(true)}>
                <img width={`${map.scale * 32}px`} src={"sprites/tower-icon.png"} />
            </Button>

            <div className={styles.deck} onClick={() => {
                setShowCardLoadout(true);
            }}>
                <div className={styles.card1}></div>
                <div className={styles.card2}></div>
                <div className={styles.card3}></div>
                <div className={`${styles["top-card"]}`}>
                </div>
            </div>

            <Modal isOpen={showCardLoadout} onClose={() => setShowCardLoadout(false)}>
                <DeckUI />
            </Modal>

            <Modal isOpen={showTowerLoadout} onClose={() => setShowTowerLoadout(false)}>
                <TowerUI />
            </Modal>
        </div>
    );
}