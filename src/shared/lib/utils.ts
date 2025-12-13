import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes conditionally.
 * Essential for building reusable components with overrides.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Parsing Logic Extracted from Monolithic App.tsx
 * Following Single Responsibility Principle.
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

    static async parse(rawText: string) {
        const text = this.cleanText(rawText);

        // Try JSON Parse first
        try {
            const json = JSON.parse(text);
            if (Array.isArray(json)) return json;
        } catch (e) {
            // Not JSON, proceed to Text Parsing
        }

        const questions: any[] = [];
        // Regex lookahead: split when we see a newline followed by Q and a number
        const blocks = text.split(/\n(?=Q\d+[\.:\)\s])/i);

        console.log(`[Parser] Found ${blocks.length} potential blocks`);

        blocks.forEach((block: string) => {
            if (!block.trim()) return;
            const q = this.parseBlock(block);
            if (q) questions.push(q);
        });

        return questions;
    }

    static parseBlock(blockText: string) {
        const lines = blockText.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 3) return null;

        const questionObj: any = {
            id: 0,
            question: "",
            options: [],
            correctAnswer: 0,
            explanation: ""
        };

        // 1. Extract Question Text
        const qMatch = lines[0].match(/^Q(\d+)[\.:\)\s]\s*(.+)/i);
        if (!qMatch) return null;

        questionObj.id = parseInt(qMatch[1]);
        questionObj.question = qMatch[2];

        // 2. Scan lines
        let mode: string = 'OPTIONS';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // Detect "Correct Answer:"
            if (line.match(/^Correct Answer:/i)) {
                const ansChar = line.split(':')[1].trim().charAt(0).toUpperCase();
                questionObj.correctAnswer = ansChar.charCodeAt(0) - 65;
                mode = 'ANSWER_FOUND';
                continue;
            }

            // Detect "Explanation:"
            if (line.match(/^Explanation:/i)) {
                questionObj.explanation = line.replace(/^Explanation:\s*/i, '');
                mode = 'EXPLANATION';
                continue;
            }

            // Capture Options
            if ((mode as string) === 'OPTIONS' || (mode as string) === 'ANSWER_FOUND') {
                const optMatch = line.match(/^([A-D])[\)\.]\s+(.+)/i);
                if (optMatch) {
                    questionObj.options.push(optMatch[2]);
                } else if (mode === 'EXPLANATION') {
                    questionObj.explanation += " " + line;
                } else if (questionObj.options.length > 0) {
                    questionObj.options[questionObj.options.length - 1] += " " + line;
                } else {
                    questionObj.question += " " + line;
                }
            } else if (mode === 'EXPLANATION') {
                questionObj.explanation += " " + line;
            }
        }

        // Validation
        if (questionObj.options.length < 2) return null;
        if (questionObj.correctAnswer < 0 || questionObj.correctAnswer > 3) questionObj.correctAnswer = 0;

        return questionObj;
    }
}
