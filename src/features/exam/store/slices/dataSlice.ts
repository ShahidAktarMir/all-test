import type { StateCreator } from 'zustand';
import type { ExamState } from '../types';

export const createDataSlice: StateCreator<
    ExamState,
    [],
    [],
    Pick<ExamState,
        'questions' | 'answers' | 'marked' | 'visited' |
        'setQuestions' | 'answerQuestion' | 'toggleMark' | 'clearResponse' | 'updateQuestionTopic' | 'reattempt'
    >
> = (set) => ({
    questions: [],
    allQuestions: [],
    answers: {},
    marked: {},
    visited: {},

    setQuestions: (questions) => {
        // Advanced DSA: Automatic Sorting using Memoizable Comparison
        // Source Text (Group) -> Year (Desc)
        // O(N log N) - Validated fast for < 10k items
        const sorted = [...questions].sort((a, b) => {
            const textA = a.source?.text || "";
            const textB = b.source?.text || "";

            if (!textA && !textB) return 0;
            if (!textA) return 1;
            if (!textB) return -1;

            if (textA !== textB) {
                return textA.localeCompare(textB);
            }
            const yearA = parseInt(a.source?.year || "0") || 0;
            const yearB = parseInt(b.source?.year || "0") || 0;
            return yearB - yearA;
        });

        set({ questions: sorted, allQuestions: sorted, status: 'REVIEW' });
    },

    answerQuestion: (qId, optionIndex) => set((state) => ({
        // O(1) Update using Hash Map spread
        answers: { ...state.answers, [qId]: optionIndex },
        visited: { ...state.visited, [state.currentIndex]: true }
    })),

    toggleMark: (qId) => set((state) => ({
        // O(1) Toggle
        marked: { ...state.marked, [qId]: !state.marked[qId] }
    })),

    clearResponse: (qId) => {
        set((state) => {
            // O(1) Delete
            const newAnswers = { ...state.answers };
            delete newAnswers[qId];
            return { answers: newAnswers };
        });
    },

    updateQuestionTopic: (id, topic) => set((state) => ({
        // O(N) Map - Unavoidable for Array, but acceptable for singular updates
        questions: state.questions.map(q => q.id === id ? { ...q, topic } : q),
        allQuestions: state.allQuestions.map(q => q.id === id ? { ...q, topic } : q)
    })),

    reattempt: (mode: 'full' | 'incorrect' | 'unattempted') => set((state) => {
        let nextQuestions: typeof state.questions = [];

        if (mode === 'full') {
            // Restore from Master Copy
            nextQuestions = [...state.allQuestions];
        } else if (mode === 'incorrect') {
            // Filter from the questions just taken (subset or full)
            nextQuestions = state.questions.filter(q => {
                const answer = state.answers[q.id];
                return answer !== undefined && answer !== q.correctAnswer;
            });
        } else if (mode === 'unattempted') {
            // Filter from the questions just taken
            nextQuestions = state.questions.filter(q => state.answers[q.id] === undefined);
        }

        // Guard: If no questions to re-attempt, do not change status.
        if (nextQuestions.length === 0) {
            return {};
        }

        // Robust Time Calculation
        const totalTime = nextQuestions.reduce((acc, q) => {
            const limit = typeof q.timeLimit === 'number' ? q.timeLimit : 60;
            return acc + limit;
        }, 0);

        const safeTime = totalTime > 0 ? totalTime : nextQuestions.length * 60;

        return {
            questions: nextQuestions,
            answers: {},
            marked: {},
            visited: {},
            timeLeft: safeTime,
            isPaused: false,
            status: 'EXAM',
            currentIndex: 0,
            startTime: Date.now(),
            endTime: null
        };
    }),
});
