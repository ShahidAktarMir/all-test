import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes conditionally.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ------------------------------------------------------------------
// TYPES (Exported for use in Store/Other files)
// ------------------------------------------------------------------
export interface ParsedQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    topic?: string;
}

/**
 * Parsing Engine for Text-to-Question conversion.
 */
export class ParsingEngine {

    static cleanText(text: string) {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\u00A0/g, ' ')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .trim();
    }

    static async parse(rawText: string): Promise<ParsedQuestion[]> {
        const text = this.cleanText(rawText);
        const lines = text.split('\n');
        const questions: ParsedQuestion[] = [];
        let currentQ: Partial<ParsedQuestion> | null = null;

        // --- RAPID FIRE PRE-SCAN ---
        const rapidFireRegex = /^(?:Q|Question)?\s*(\d+)[.):]\s*(.+?)\s*(?:->|=>)\s*(.+)$/i;
        const allRapidFireAnswers = new Set<string>();

        // Collect all answers first to use as distractors
        for (const line of lines) {
            const match = line.trim().match(rapidFireRegex);
            if (match) {
                allRapidFireAnswers.add(match[3].trim());
            }
        }
        const potentialDistractors = Array.from(allRapidFireAnswers);
        // ---------------------------

        try {
            // 1. Try JSON Parse first
            if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                try {
                    const json = JSON.parse(text);
                    if (Array.isArray(json)) return json;
                    if (json.questions) return json.questions;
                } catch {
                    // Ignore JSON parsing error and fall back to text parsing
                }
            }

            // 2. Text Block Parsing
            const qStartRegex = /^(Q?\d+[.):]|Question\s*\d+[:.])/i;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // --- RAPID FIRE PARSING ---
                const rfMatch = line.match(rapidFireRegex);
                if (rfMatch) {
                    // Flush existing question
                    if (currentQ && this.isValid(currentQ)) {
                        questions.push(currentQ as ParsedQuestion);
                        currentQ = null;
                    }

                    const qText = rfMatch[2].trim();
                    const correctText = rfMatch[3].trim();

                    // Generate Distractors
                    let distractors = potentialDistractors.filter(a => a !== correctText);
                    // Shuffle distractors
                    distractors = distractors.sort(() => 0.5 - Math.random());
                    // Pick 3
                    const selectedDistractors = distractors.slice(0, 3);

                    // Fill if needed
                    const fallbacks = ["None of the above", "All of the above", "Both A and B", "Data Insufficient"];
                    let fbIndex = 0;
                    while (selectedDistractors.length < 3) {
                        if (fbIndex < fallbacks.length) {
                            selectedDistractors.push(fallbacks[fbIndex++]);
                        } else {
                            selectedDistractors.push(`Option ${String.fromCharCode(65 + selectedDistractors.length)}`);
                        }
                    }

                    // Create Options Array
                    const finalOptions = [correctText, ...selectedDistractors];
                    // Shuffle Options
                    finalOptions.sort(() => 0.5 - Math.random());

                    const correctIndex = finalOptions.indexOf(correctText);

                    questions.push({
                        id: questions.length + 1,
                        question: qText,
                        options: finalOptions,
                        correctAnswer: correctIndex,
                        explanation: "Rapid Fire Question"
                    });

                    continue; // Skip standard parsing
                }
                // ---------------------------

                // New Question Detection
                if (qStartRegex.test(line)) {
                    if (currentQ && this.isValid(currentQ)) {
                        questions.push(currentQ as ParsedQuestion);
                    }
                    currentQ = {
                        id: questions.length + 1,
                        question: line.replace(qStartRegex, '').trim(),
                        options: [],
                        correctAnswer: -1
                    };
                    continue;
                }

                if (currentQ) {
                    // Option Detection: "A)", "A.", "(A)"
                    const optMatch = line.match(/^(\(?[A-E]\)|[A-E]\.)\s+(.+)/);
                    if (optMatch) {
                        currentQ.options?.push(optMatch[2].trim());
                    }
                    // Embedded Options Detection (e.g. "Some text (A) / some text (B)")
                    // Only run if we haven't found standard options yet and line contains pattern
                    else if (currentQ.options?.length === 0 && (line.includes('(A)') || line.includes('/ (A)'))) {
                        // This is likely an error detection or sentence improvement line
                        // We can blindly add generic options if they don't exist
                        if (currentQ.options.length === 0) {
                            currentQ.options = ["(A)", "(B)", "(C)", "(D)"];
                            // Append the line to question text as it contains the problem
                            currentQ.question += ' ' + line;
                        }
                    }
                    // Correct Answer Detection
                    // Matches: "Correct Answer: B", "[Correct Answer: B]", "[Answer: B]"
                    else if (line.match(/\[?(?:Correct\s)?Answer:\s*([A-E])/i)) {
                        const match = line.match(/\[?(?:Correct\s)?Answer:\s*([A-E])/i);
                        if (match) {
                            const charCode = match[1].toUpperCase().charCodeAt(0);
                            currentQ.correctAnswer = charCode - 65; // A=0, B=1...
                        }
                    }
                    // Explanation Detection
                    else if (line.match(/^Explanation:/i)) {
                        currentQ.explanation = line.replace(/^Explanation:/i, '').trim();
                    }
                    // Append to Question text if not an option/answer/explanation/tag
                    else if (!line.startsWith('[') && !line.startsWith('Correct Answer')) {
                        // Only append if it doesn't look like metadata
                        if (currentQ.options?.length === 0) {
                            currentQ.question += ' ' + line;
                        } else if (currentQ.explanation !== undefined) {
                            // Append to explanation if we are in explanation mode
                            currentQ.explanation += ' ' + line;
                        }
                    }
                }
            }

            // Push last question
            if (currentQ && this.isValid(currentQ)) {
                questions.push(currentQ as ParsedQuestion);
            }

        } catch (error) {
            console.error("Parsing Error:", error);
        }

        return questions;
    }

    private static isValid(q: Partial<ParsedQuestion>): boolean {
        return !!(q.question && q.options && q.options.length >= 2 && q.correctAnswer !== undefined && q.correctAnswer >= 0);
    }
}
