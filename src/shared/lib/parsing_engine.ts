
// ------------------------------------------------------------------
// TYPES (Exported for use in Store/Other files)
// ------------------------------------------------------------------
import type { ParsedQuestion } from './types';
import { Lexer } from './compiler/lexer';
import { Parser } from './compiler/parser';

export type { ParsedQuestion }; // Re-export for compatibility


/**
 * Parsing Engine for Text-to-Question conversion.
 * V5: Robust, Multi-Format Support (JSON, CSV, RAPID FIRE, BLOCKS)
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
        // 0. Try JSON Parsing First
        try {
            const trimmed = rawText.trim();
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return parsed.map((q: any, i: number) => ({
                    id: i + 1,
                    question: q.question || "",
                    options: q.options || [],
                    correctAnswer: q.correctAnswer || 0,
                    explanation: q.explanation,
                    topic: q.topic,
                    source: q.source,
                    heatmap: q.heatmap,
                    godfatherInsight: q.godfatherInsight
                })).filter((q: any) => q.question);
            }
        } catch {
            // Not JSON, continue to text parsing
        }

        // 1. Lexical Analysis (O(N))
        const lexer = new Lexer();
        const tokens = lexer.tokenize(rawText);

        // 2. Syntactic Analysis (O(M))
        const parser = new Parser(tokens);
        const questions = parser.parse();

        // 3. Post-Processing (Rapid Fire Logic generation)
        this.applyRapidFireLogic(questions);

        return questions;
    }

    private static applyRapidFireLogic(questions: ParsedQuestion[]) {
        const linearQuestions = questions.filter(q => q.options.length === 1 && q.correctAnswer === 0);
        if (linearQuestions.length > 2) {
            const allAnswers = linearQuestions.map(q => q.options[0]);

            linearQuestions.forEach(q => {
                const correctAnswerText = q.options[0];
                const distractors = allAnswers.filter(a => a !== correctAnswerText)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                const newOptions = [correctAnswerText, ...distractors].sort(() => 0.5 - Math.random());
                q.options = newOptions;
                q.correctAnswer = newOptions.indexOf(correctAnswerText);

                if (q.question.includes('->')) {
                    q.question = q.question.split('->')[0].trim();
                }
            });
        }
    }
}


