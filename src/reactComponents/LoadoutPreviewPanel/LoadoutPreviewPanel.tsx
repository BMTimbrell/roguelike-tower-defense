import { useAtom } from 'jotai';
import { mapAtom } from '../../store';
import Button from '../Button/Button';
import styles from './LoadoutPreviewPanel.module.css';
import { useState } from 'react';
import DeckUI from '../DeckUI/DeckUI';
import Modal from '../Modal/Modal';
import TowerUI from '../TowerUI/TowerUI';
import UpgradePopup from '../UpgradePopup/UpgradePopup';
import { UPGRADES } from '../../constants';
import type { Upgrade } from '../../types';

export default function LoadoutPreviewPanel() {
    const [map] = useAtom(mapAtom);
    const [showCardLoadout, setShowCardLoadout] = useState(false);
    const [showTowerLoadout, setShowTowerLoadout] = useState(false);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [hovered, setHovered] = useState(false);
    const [card, setCard] = useState<Upgrade>(UPGRADES[0]);
    const upgradePopup = <UpgradePopup upgrade={card} pos={popupPos} />;

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
                <DeckUI setHovered={setHovered} setPopupPos={setPopupPos} setCard={setCard} />
            </Modal>

            <Modal isOpen={showTowerLoadout} onClose={() => setShowTowerLoadout(false)}>
                <TowerUI />
            </Modal>

            {hovered && upgradePopup}
        </div>
    );
}