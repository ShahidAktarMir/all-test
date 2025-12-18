import { create } from 'zustand';

// --- TYPES ---
export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

interface ExamState {
    // Data
    questions: Question[];
    currentIndex: number;

    // Progress
    answers: Record<number, number>; // qId -> optionIndex
    marked: Record<number, boolean>;
    visited: Record<number, boolean>;

    // Timer & Status
    timeLeft: number; // in seconds
    isPaused: boolean;
    status: 'IDLE' | 'PARSING' | 'REVIEW' | 'EXAM' | 'RESULT';

    // Metadata
    startTime: number | null;
    endTime: number | null;
    processingLog: string[];

    // Actions
    setQuestions: (questions: Question[]) => void;
    startExam: () => void;
    answerQuestion: (qId: number, optionIndex: number) => void;
    toggleMark: (qId: number) => void;
    clearResponse: (qId: number) => void;
    navigate: (index: number) => void;
    tick: () => void;
    togglePause: () => void;
    finishExam: () => void;
    restartExam: (filterType?: 'ALL' | 'WRONG' | 'SKIPPED') => void;
    resetExam: () => void;
    addLog: (msg: string) => void;
    setStatus: (status: ExamState['status']) => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
    questions: [],
    currentIndex: 0,
    answers: {},
    marked: {},
    visited: {},
    timeLeft: 0,
    isPaused: false,
    status: 'IDLE',
    startTime: null,
    endTime: null,
    processingLog: [],

    setQuestions: (questions) => set({ questions, status: 'REVIEW' }),

    addLog: (msg) => set((state) => ({ processingLog: [...state.processingLog, msg] })),

    setStatus: (status) => set({ status }),

    startExam: () => {
        const { questions } = get();
        set({
            status: 'EXAM',
            currentIndex: 0,
            timeLeft: questions.length * 30,
            startTime: Date.now(),
            visited: { 0: true },
            answers: {},
            marked: {},
            isPaused: false
        });
    },

    answerQuestion: (qId, optionIndex) => set((state) => ({
        answers: { ...state.answers, [qId]: optionIndex },
        visited: { ...state.visited, [state.currentIndex]: true }
    })),

    toggleMark: (qId) => set((state) => ({
        marked: { ...state.marked, [qId]: !state.marked[qId] }
    })),

    clearResponse: (qId) => {
        const state = get();
        const newAnswers = { ...state.answers };
        delete newAnswers[qId];
        set({ answers: newAnswers });
    },

    navigate: (index) => set((state) => ({
        currentIndex: index,
        visited: { ...state.visited, [index]: true }
    })),

    tick: () => set((state) => {
        if (state.isPaused || state.status !== 'EXAM') return {};
        const newTime = Math.max(0, state.timeLeft - 1);
        if (newTime === 0) {
            get().finishExam();
            return { timeLeft: 0 };
        }
        return { timeLeft: newTime };
    }),

    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

    finishExam: () => set({ status: 'RESULT', endTime: Date.now() }),

    restartExam: (filterType: 'ALL' | 'WRONG' | 'SKIPPED' = 'ALL') => {
        const { questions, answers } = get();
        let questionsToUse = questions;

        if (filterType === 'WRONG') {
            // Include wrong answers AND exclude skipped ones (if logic implies "wrong" means attempted but incorrect)
            // Usually "Wrong" means Attempted & Incorrect. "Skipped" is Separate.
            questionsToUse = questions.filter(q => {
                const ans = answers[q.id];
                return ans !== undefined && ans !== q.correctAnswer;
            });
        } else if (filterType === 'SKIPPED') {
            questionsToUse = questions.filter(q => answers[q.id] === undefined);
        }

        if (questionsToUse.length === 0) return; // Safety check

        set({
            status: 'EXAM',
            questions: questionsToUse,
            currentIndex: 0,
            timeLeft: questionsToUse.length * 30, // 30s per question rule
            startTime: Date.now(),
            endTime: null,
            visited: { 0: true },
            answers: {},
            marked: {},
            isPaused: false
        });
    },

    resetExam: () => set({
        status: 'IDLE',
        questions: [],
        answers: {},
        marked: {},
        visited: {},
        processingLog: []
    })
}));
