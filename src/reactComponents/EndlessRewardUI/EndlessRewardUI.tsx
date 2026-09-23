import { useAtom } from 'jotai';
import { endlessRewardsAtom } from '../../store';
import styles from './EndessRewardUI.module.css';

export default function EndlessRewardUI() {
    const [endlessReward, setEndlessReward] = useAtom(endlessRewardsAtom);
    const reward = endlessReward.reward;

    return (
        <div>
            {reward}
        </div>
    );
}