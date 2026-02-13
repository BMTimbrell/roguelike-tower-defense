export default function calcFireInterval(fireInterval: number, fireRateIncreasePercent: number): number {
    fireInterval /= 1 + fireRateIncreasePercent / 100;
    fireInterval = Math.max(0.05, fireInterval);
    return fireInterval;
}