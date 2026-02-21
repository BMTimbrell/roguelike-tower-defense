import { TOWERS, type TowerId } from "../constants";

export default function generateTowerOptions(): TowerId[] {
    const towers: Set<TowerId> = new Set();
    const towerIds: TowerId[] = Object.keys(TOWERS) as TowerId[];

    while (towers.size < 3) {
        const randomIndex = Math.floor((Math.random() * towerIds.length));
        towers.add(towerIds[randomIndex]);
    }

    return [...towers];
}