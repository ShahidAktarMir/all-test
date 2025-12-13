import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';
import { useExamStore } from './store';

// ------------------------------------------------------------------
// SENIOR DEV PRACTICE: State Logic Isolation Testing
// ------------------------------------------------------------------

describe('Exam Store (Zustand)', () => {
    beforeEach(() => {
        useExamStore.getState().resetExam();
    });

    it('should initialize with default state', () => {
        const state = useExamStore.getState();
        expect(state.status).toBe('IDLE');
        expect(state.questions).toHaveLength(0);
    });

    it('should correctly mark and answer questions', () => {
        const mockQ = { id: 1, question: 'Q', options: ['A', 'B'], correctAnswer: 0 };
        useExamStore.getState().setQuestions([mockQ]);
        useExamStore.getState().startExam();

        useExamStore.getState().answerQuestion(1, 0); // Answer index 0
        expect(useExamStore.getState().answers[1]).toBe(0);

        useExamStore.getState().toggleMark(1);
        expect(useExamStore.getState().marked[1]).toBe(true);
    });

    it('should handle timer ticks and auto-submit', () => {
        vi.useFakeTimers();
        const mockQ = { id: 1, question: 'Q', options: ['A', 'B'], correctAnswer: 0 };
        useExamStore.getState().setQuestions([mockQ]);
        useExamStore.getState().startExam();

        // Expect init time: 1 min per Q = 60s
        expect(useExamStore.getState().timeLeft).toBe(60);

        act(() => {
            useExamStore.getState().tick();
        });
        expect(useExamStore.getState().timeLeft).toBe(59);

        // Fast forward to end
        act(() => {
            for (let i = 0; i < 60; i++) useExamStore.getState().tick();
        });

        expect(useExamStore.getState().timeLeft).toBe(0);
        expect(useExamStore.getState().status).toBe('RESULT');

        vi.useRealTimers();
    });
});
