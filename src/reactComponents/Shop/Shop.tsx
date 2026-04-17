import { useAtom } from "jotai";
import { gameStateAtom, mapAtom, shopAtom } from "../../store";
import { TOWERS } from "../../constants";
import UpgradeCard from "../UpgradeCard/UpgradeCard";
import { useState } from "react";
import styles from './Shop.module.css';
import TowerCard from "../TowerCard/TowerCard";
import Button from "../Button/Button";

export default function Shop() {
    const [shop] = useAtom(shopAtom);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number; } | null>(null);
    const [gameState, setGameState] = useAtom(gameStateAtom);
    const [map] = useAtom(mapAtom);
    const scale = map.scale;
    const towerCoins = gameState.towerCoins;

    return (
        <div className={styles.container} style={{ fontSize: `${16 * scale}px`}}>
            <div className={styles.heading}>Shop</div>

            <div className={styles["tower-coins"]}>
                <img width={17 * scale} src="sprites/tower-coin-2.png" />
                <div>{gameState.towerCoins}</div>
            </div>

            <div className={styles["tower-container"]}>
                {shop.towers.map((tower, index) => (
                    <div className={styles["tower-contents"]} key={index}>
                        <div className={styles.tower}><TowerCard id={tower} scale={scale} /></div>
                        <div className={styles.cost}>
                            <img width={17 * scale} src="sprites/tower-coin-2.png" />
                            <div className={TOWERS[tower].cost / 10 > towerCoins ? styles["cant-afford"] : ''}>{TOWERS[tower].cost / 10}</div>
                        </div>
                        <Button disabled={TOWERS[tower].cost / 10 > towerCoins}>Buy</Button>
                    </div>
                ))}
            </div>

            <div className={styles["upgrades"]}>
                {shop.upgrades.map((u, index) => (
                    <div key={index} className={styles["upgrade-contents"]}>
                        <UpgradeCard upgrade={u} scale={scale} showPopup={true} fontSize={16} />
                        <div className={styles.cost}>
                            <img width={17 * scale} src="sprites/tower-coin-2.png" />
                            <div className={`${u.cost * 10 > towerCoins ? styles["cant-afford"] : ''}`}>{u.cost * 10}</div>
                        </div>
                        <Button disabled={u.cost * 10 > towerCoins}>Buy</Button>
                    </div>
                ))}
            </div>
            
            <div className={styles["next-button"]}>
                <Button>Next Level</Button>
            </div>
        </div>
    );
}