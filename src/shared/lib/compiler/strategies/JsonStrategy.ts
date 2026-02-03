import type { ParsingStrategy } from './types';
import type { ParsedQuestion } from '../../types';

export class JsonStrategy implements ParsingStrategy {
    canParse(text: string): boolean {
        const trimmed = text.trim();
        return trimmed.startsWith('[') && trimmed.endsWith(']');
    }

    async parse(text: string): Promise<ParsedQuestion[]> {
        try {
            const parsed = JSON.parse(text);
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
                })).filter((q) => q.question);
            }
        } catch {
            return [];
        }
        return [];
    }
}
