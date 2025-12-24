
import { ParsedQuestion } from './utils';

export class ParsingEngineV2 {

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

        // Parsing State
        let currentQ: Partial<ParsedQuestion> | null = null;
        let state: 'WAITING' | 'QUESTION_TEXT' | 'OPTIONS' | 'METADATA_BLOCK' = 'WAITING';
        let currentMetadataField: 'explanation' | 'godfatherInsight' | 'heatmap' | 'source' = 'explanation';

        const finalizeQuestion = () => {
            if (currentQ && this.isValid(currentQ)) {
                questions.push(currentQ as ParsedQuestion);
            }
            currentQ = null;
            state = 'WAITING';
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Preserve empty lines only if they might differ meaning; 
            // generally skip strict empty lines unless inside code/table blocks?
            // For markdown tables, empty lines matter less, but for paragraph separation they do.
            // Let's Skip empty lines for now to reduce nose, but might need to revisit.
            if (!line) continue;

            // --- 1. DETECT NEW QUESTION START ---
            // Regex: "Q1.", "Q249.", "Question 1", "###", etc.
            const isSeparator = line.match(/^[-#*]{3,}/);
            const isQStart = line.match(/^(?:Q|Question)\s*\d+[.):]/i);

            if (isSeparator || isQStart) {
                // If we were building a question, finish it.
                finalizeQuestion();

                // Start new question
                currentQ = {
                    id: questions.length + 1,
                    question: '', // Initialize empty
                    options: [],
                    correctAnswer: -1,
                };
                state = 'QUESTION_TEXT';

                // If it was a text line update (Q249. Text...), capture the text part
                if (isQStart) {
                    // Extract text after "Q... "
                    // Matches "Q249. Which..." -> "Which..."
                    const content = line.replace(/^(?:Q|Question)\s*\d+[.):]\s*/i, '').trim();
                    currentQ.question = content;
                }
                continue;
            }

            // If we haven't started a question yet, skip garbage lines
            if (!currentQ) continue;

            // --- 2. DETECT CORRECT ANSWER ---
            // Priority check to switch mode to POST-QUESTION (Metadata/Explanation)
            // Support: "Correct Answer: B", "[Correct Answer]: B", etc.
            const ansMatch = line.match(/\[?(?:Correct\s)?Answer(?:\]?:\s*|:\s*)\[?([A-E])\]?/i);
            if (ansMatch) {
                const charCode = ansMatch[1].toUpperCase().charCodeAt(0);
                currentQ.correctAnswer = charCode - 65;
                state = 'METADATA_BLOCK';
                currentMetadataField = 'explanation'; // Default to explanation unless a tag is found
                continue;
            }

            // --- 3. STATE HANDLERS ---

            if (state === 'QUESTION_TEXT') {
                // Check if we are transitioning to OPTIONS
                // Option Pattern: "A)", "(A)", "A."
                // But NOT inside a table or if it looks like English text?
                // Strict requirement: Start of line.
                const isOption = line.match(/^(\(?[A-E]\)|[A-E]\.)\s+(.+)/);

                if (isOption) {
                    state = 'OPTIONS';
                    currentQ.options?.push(isOption[2].trim());
                } else {
                    // Still in Question Text (could be multi-line, table, statements)
                    if (currentQ.question) {
                        currentQ.question += '\n' + lines[i]; // Use raw line to preserve formatting
                    } else {
                        currentQ.question = lines[i]; // First meaningful line
                    }
                }
            }

            else if (state === 'OPTIONS') {
                // Strict option matching
                const isOption = line.match(/^(\(?[A-E]\)|[A-E]\.)\s+(.+)/);
                if (isOption) {
                    currentQ.options?.push(isOption[2].trim());
                } else {
                    // Handling Embedded Options / Compact Options?
                    // "A) x B) y..."
                    // For now, assume if it's NOT an option and NOT an answer, it might be junk OR extended option text?
                    // Let's assume extended option text for now IF previous was option? 
                    // Or could be "Correct Answer" (handled above).
                    // If simply text, might be better to ignore or append to last option?
                    // Appending to last option allows multi-line options.
                    if (currentQ.options && currentQ.options.length > 0) {
                        currentQ.options[currentQ.options.length - 1] += ' ' + line;
                    }
                }
            }

            else if (state === 'METADATA_BLOCK') {
                // We are in the metadata zone (Explanation, Insight, Heatmap, Source)

                // --- TAG DETECTION ---
                // Check if this line Starts a new specific tag
                // Matches "**[TAG]:** Content"
                const tagMatch = line.match(/^\*\*\[([A-Z0-9\s_\-]+)\]:\*\*\s*(.*)/i);

                if (tagMatch) {
                    const tagName = tagMatch[1].toUpperCase();
                    let content = tagMatch[2].trim();

                    if (tagName === 'GODFATHER INSIGHT') {
                        currentMetadataField = 'godfatherInsight';
                        currentQ.godfatherInsight = content;
                    } else if (tagName === 'HEATMAP') {
                        currentMetadataField = 'heatmap';
                        this.parseHeatmap(currentQ, content);
                    } else if (tagName === 'SOURCE') {
                        currentMetadataField = 'source';
                        this.parseSource(currentQ, content);
                    } else {
                        // Unknown tag or generic header -> Treat as part of Explanation
                        currentMetadataField = 'explanation';
                        if (currentQ.explanation) currentQ.explanation += '\n';
                        else currentQ.explanation = '';
                        currentQ.explanation += `**${tagName}**: ${content}`;
                    }
                }
                else if (line.match(/^Explanation:/i)) {
                    currentMetadataField = 'explanation';
                    const content = line.replace(/^Explanation:/i, '').trim();
                    currentQ.explanation = content;
                }
                else {
                    // CONTINUE PREVIOUS FIELD (Multi-line support)
                    if (currentMetadataField === 'godfatherInsight') {
                        currentQ.godfatherInsight = (currentQ.godfatherInsight ? currentQ.godfatherInsight + '\n' : '') + line;
                    }
                    else if (currentMetadataField === 'explanation') {
                        // Auto-detect other legacy tags like [Type: ...]
                        if (line.match(/^Type(?:\]?:\s*|:\s*)(.*)/i)) {
                            currentQ.topic = line.match(/^Type(?:\]?:\s*|:\s*)(.*)/i)![1].trim();
                        } else {
                            currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '\n' : '') + line;
                        }
                    }
                }
            }
        }

        // Finalize last Q
        finalizeQuestion();

        return questions;
    }

    private static parseHeatmap(q: Partial<ParsedQuestion>, content: string) {
        const diffMatch = content.match(/\[Diff:\s*([^\]]+)\]/i);
        const timeMatch = content.match(/\[Avg Time:\s*([^\]]+)\]/i);
        const typeMatch = content.match(/\[Type:\s*([^\]]+)\]/i);

        q.heatmap = {
            diff: diffMatch ? diffMatch[1].trim() : 'N/A',
            avgTime: timeMatch ? timeMatch[1].trim() : 'N/A',
            type: typeMatch ? typeMatch[1].trim() : 'Standard'
        };
    }

    private static parseSource(q: Partial<ParsedQuestion>, content: string) {
        const examMatch = content.match(/\[Exam:\s*([^\]]+)\]/i);
        if (examMatch) {
            const fullExamStr = examMatch[1].trim();
            const parts = fullExamStr.split(' ');
            const lastPart = parts[parts.length - 1];

            let year = lastPart;
            let examName = fullExamStr;

            if (/^\d{4}$/.test(lastPart)) {
                year = lastPart;
                examName = parts.slice(0, parts.length - 1).join(' ');
            } else {
                year = "Unknown";
            }

            q.source = {
                exam: examName,
                year: year
            };
        }
    }

    private static isValid(q: Partial<ParsedQuestion>): boolean {
        return !!(q.question && q.options && q.options.length >= 2 && q.correctAnswer !== undefined && q.correctAnswer >= 0);
    }
}
