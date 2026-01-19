import type { ParsingStrategy } from './types';
import type { ParsedQuestion } from '../../types';
import { Lexer } from '../lexer';
import { Parser } from '../parser';

export class LexicalStrategy implements ParsingStrategy {
    canParse(_text: string): boolean {
        // Fallback strategy, always attempts if others fail or if explicitly chosen
        return true;
    }

    async parse(text: string): Promise<ParsedQuestion[]> {
        // 1. Lexical Analysis (O(N))
        const lexer = new Lexer();
        const tokens = lexer.tokenize(text);

        // 2. Syntactic Analysis (O(M))
        const parser = new Parser(tokens);
        const questions = parser.parse();

        // 3. Post-Processing (Rapid Fire Logic generation)
        this.applyRapidFireLogic(questions);

        return questions;
    }

    private applyRapidFireLogic(questions: ParsedQuestion[]) {
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
