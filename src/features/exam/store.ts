import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ExamState, Question } from './store/types';
import { createTimerSlice } from './store/slices/timerSlice';
import { createDataSlice } from './store/slices/dataSlice';
import { createUISlice } from './store/slices/uiSlice';

// Export Type for consumers
export type { Question, ExamState };

export const useExamStore = create<ExamState>()(
    persist(
        (...a) => ({
            ...createTimerSlice(...a),
            ...createDataSlice(...a),
            ...createUISlice(...a),
        }),
        {
            name: 'neuro-exam-storage',
            version: 1, // Bump version to force clear old cache causing Chrome crash
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                questions: state.questions,
                answers: state.answers,
                marked: state.marked,
                visited: state.visited,
                timeLeft: state.timeLeft,
                status: state.status,
                currentIndex: state.currentIndex,
                startTime: state.startTime
            }),
        }
    )
);
