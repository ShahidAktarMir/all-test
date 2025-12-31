
export interface ParsedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    topic?: string;
    groupInstruction?: string;
    // New Metadata Fields
    godfatherInsight?: string;
    heatmap?: {
        diff: string;
        avgTime: string;
        type: string;
    };
    source?: {
        type: string; // e.g. "Exam", "Book Ref"
        text: string; // e.g. "SSC CGL", "NCERT Class 11"
        year?: string;
    };
    timeLimit?: number; // Time limit in seconds
}
