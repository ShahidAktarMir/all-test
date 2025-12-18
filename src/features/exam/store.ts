import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- TYPES ---
export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    topic?: string;
}

export interface ExamAttempt {
    id: string;
    date: number;
    totalQuestions: number;
    correctCount: number;
    score: number;
    timeSpent: number; // in seconds (total - left)
    questions?: Question[]; // Snapshot for review/re-attempt
    answers?: Record<number, number>; // Snapshot of choices
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

    // AI
    apiKey: string | null;

    // History
    history: ExamAttempt[];

    // Actions
    setQuestions: (questions: Question[]) => void;
    updateQuestionTopic: (id: number, topic: string) => void;
    setApiKey: (key: string | null) => void;
    startExam: () => void;
    answerQuestion: (qId: number, optionIndex: number) => void;
    toggleMark: (qId: number) => void;
    clearResponse: (qId: number) => void;
    navigate: (index: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    markForReview: (qId: number) => void;
    tick: () => void;
    togglePause: () => void;
    finishExam: () => void;
    restartExam: (filterType?: 'ALL' | 'WRONG' | 'SKIPPED') => void;
    resetExam: () => void;
    addLog: (msg: string) => void;
    setStatus: (status: ExamState['status']) => void;
    clearHistory: () => void;
    loadHistoryReview: (id: string) => void;
    reattemptHistory: (id: string) => void;
}

export const useExamStore = create<ExamState>()(
    persist(
        (set, get) => ({
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
            history: [],
            apiKey: null, // Default null

            setQuestions: (questions) => set({ questions, status: 'REVIEW' }),

            updateQuestionTopic: (id, topic) => set((state) => ({
                questions: state.questions.map(q => q.id === id ? { ...q, topic } : q)
            })),

            setApiKey: (key) => set({ apiKey: key }),

            addLog: (msg) => set((state) => ({ processingLog: [...state.processingLog, msg] })),

            setStatus: (status) => set({ status }),

            startExam: () => {
                const { questions } = get();
                set({
                    status: 'EXAM',
                    currentIndex: 0,
                    timeLeft: questions.length * 30, // 30s per question
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

            nextQuestion: () => set((state) => {
                const nextIdx = Math.min(state.questions.length - 1, state.currentIndex + 1);
                return { currentIndex: nextIdx, visited: { ...state.visited, [nextIdx]: true } };
            }),

            prevQuestion: () => set((state) => {
                const prevIdx = Math.max(0, state.currentIndex - 1);
                return { currentIndex: prevIdx, visited: { ...state.visited, [prevIdx]: true } };
            }),

            markForReview: (qId) => set((state) => ({
                marked: { ...state.marked, [qId]: !state.marked[qId] }
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

            finishExam: () => {
                const state = get();
                const endTime = Date.now();

                // Calculate Stats
                const correctCount = state.questions.filter(q => state.answers[q.id] === q.correctAnswer).length;
                const score = Math.round((correctCount / state.questions.length) * 100);

                if (state.status !== 'RESULT') {
                    const newAttempt: ExamAttempt = {
                        id: crypto.randomUUID(),
                        date: endTime,
                        totalQuestions: state.questions.length,
                        correctCount,
                        score,
                        timeSpent: (state.questions.length * 30) - state.timeLeft,
                        questions: state.questions,
                        answers: state.answers
                    };

                    set((prev) => ({
                        status: 'RESULT',
                        endTime,
                        history: [newAttempt, ...prev.history]
                    }));
                }
            },

            restartExam: (filterType: 'ALL' | 'WRONG' | 'SKIPPED' = 'ALL') => {
                const { questions, answers } = get();
                let questionsToUse = questions;

                // 1. Filter
                if (filterType === 'WRONG') {
                    questionsToUse = questions.filter(q => {
                        const ans = answers[q.id];
                        return ans !== undefined && ans !== q.correctAnswer;
                    });
                } else if (filterType === 'SKIPPED') {
                    questionsToUse = questions.filter(q => answers[q.id] === undefined);
                }

                if (questionsToUse.length === 0) return;

                // 2. Shuffle
                const shuffled = [...questionsToUse];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                set({
                    status: 'EXAM',
                    questions: shuffled,
                    currentIndex: 0,
                    timeLeft: shuffled.length * 30,
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
            }),

            clearHistory: () => set({ history: [] }),

            loadHistoryReview: (id) => {
                const { history } = get();
                const attempt = history.find(h => h.id === id);
                if (!attempt) return;

                // Restore the snapshot!
                if (attempt.questions) {
                    set({
                        status: 'RESULT',
                        questions: attempt.questions,
                        answers: attempt.answers || {}
                    });
                } else {
                    // Fallback for old history (legacy support)
                    // We can't do much if questions are missing, so we ideally warn or just show what we have
                    console.warn("Attempt missing snapshot data");
                }
            },

            reattemptHistory: (id) => {
                const { history } = get();
                const attempt = history.find(h => h.id === id);
                if (!attempt || !attempt.questions) return;

                // Load the OLD questions into the active state
                set({ questions: attempt.questions });

                // Start the exam (this will reset timer/answers etc for a fresh attempt on these questions)
                get().startExam();
            }
        }),
        {
            name: 'neuro-exam-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                history: state.history,
                apiKey: state.apiKey,
                // Persist active session data
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
