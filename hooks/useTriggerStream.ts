import { useTriggerSubscription } from '@/context/TriggerContext';

type TriggerData = {
    announcements?: boolean;
    challenges?: boolean;
    leaderboard?: boolean;
    status?: boolean;
};

export function useTriggerStream(onTrigger: (data: TriggerData) => void) {
    // Now consumes the centralized subscription from TriggerContext
    useTriggerSubscription(onTrigger);
}
