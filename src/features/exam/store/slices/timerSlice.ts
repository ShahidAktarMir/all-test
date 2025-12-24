import type { StateCreator } from 'zustand';
import type { ExamState } from '../types';

export const createTimerSlice: StateCreator<
    ExamState,
    [],
    [],
    Pick<ExamState, 'timeLeft' | 'isPaused' | 'startTime' | 'endTime' | 'tick' | 'togglePause'>
> = (set, get) => ({
    timeLeft: 0,
    isPaused: false,
    startTime: null,
    endTime: null,

    tick: () => set((state) => {
        if (state.isPaused || state.status !== 'EXAM') return {};

        // Critical Performance Optimization:
        // We do NOT clone deep objects here. We only touch timeLeft.
        // This is the "Nano-Update".
        const newTime = Math.max(0, state.timeLeft - 1);

        if (newTime === 0) {
            get().finishExam();
            return { timeLeft: 0 };
        }
        return { timeLeft: newTime };
    }),

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
});
