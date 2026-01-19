
export interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    topic?: string;
    godfatherInsight?: string;
    heatmap?: {
        diff: string;
        avgTime: string;
        type: string;
    };
    source?: {
        type: string;
        text: string;
        year?: string;
    };
}

export interface ExamState {
    // Data Slice
    questions: Question[];
    answers: Record<number, number>; // Map<QuestionId, OptionIndex> for O(1) Access
    marked: Record<number, boolean>;
    visited: Record<number, boolean>;

    // Timer Slice
    timeLeft: number;
    isPaused: boolean;
    startTime: number | null;
    endTime: number | null;

    // UI/Status Slice
    status: 'IDLE' | 'PARSING' | 'REVIEW' | 'EXAM' | 'RESULT';
    currentIndex: number;
    processingLog: string[];


    // Actions (Combined for now, but implemented in slices)
    setQuestions: (questions: Question[]) => void;
    startExam: () => void;
    tick: () => void;
    togglePause: () => void;
    answerQuestion: (qId: number, optionIndex: number) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    navigate: (index: number) => void;
    toggleMark: (qId: number) => void;
    clearResponse: (qId: number) => void;
    finishExam: () => void;

    reattempt: (mode: 'full' | 'incorrect' | 'unattempted') => void;
    resetExam: () => void;
    updateQuestionTopic: (id: number, topic: string) => void;
    setStatus: (status: ExamState['status']) => void;
    addLog: (msg: string) => void;
}
