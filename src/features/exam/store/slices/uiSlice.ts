import type { StateCreator } from 'zustand';
import type { ExamState } from '../types';

export const createUISlice: StateCreator<
    ExamState,
    [],
    [],
    Pick<ExamState,
        'status' | 'currentIndex' | 'processingLog' |
        'startExam' | 'navigate' | 'nextQuestion' | 'prevQuestion' |
        'finishExam' | 'resetExam' | 'setStatus' | 'addLog'
    >
> = (set, get) => ({
    status: 'IDLE',
    currentIndex: 0,
    processingLog: [],


    startExam: () => {
        const { questions } = get();
        set({
            status: 'EXAM',
            currentIndex: 0,
            timeLeft: questions.length * 20,
            startTime: Date.now(),
            visited: { 0: true },
            answers: {},
            marked: {},
            isPaused: false
        });
    },

    navigate: (index) => set((state) => ({
        currentIndex: index,
        visited: { ...state.visited, [index]: true }
    })),

    nextQuestion: () => set((state) => {
        const nextIdx = Math.min(state.questions.length - 1, state.currentIndex + 1);
        return { currentIndex: nextIdx, visited: { ...state.visited, [nextIdx]: true } };
    }),

    prevQuestion: () => set((state) => {
        const prevIdx = Math.max(0, state.currentIndex - 1);
        return { currentIndex: prevIdx, visited: { ...state.visited, [prevIdx]: true } };
    }),

    finishExam: () => {
        const { questions } = get();
        if (questions.length > 0) {
            set({ status: 'RESULT' });
        }
    },



    resetExam: () => set({
        status: 'IDLE',
        questions: [],
        answers: {},
        marked: {},
        visited: {},
        processingLog: []
    }),

    setStatus: (status) => set({ status }),
    addLog: (msg) => set((state) => ({ processingLog: [...state.processingLog, msg] })),
});
