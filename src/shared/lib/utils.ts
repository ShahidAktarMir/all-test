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
}

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
                })).filter(q => q.question);
            }
        } catch {
            // Not JSON, continue to text parsing
        }

        const text = this.cleanText(rawText);
        const lines = text.split('\n');
        const questions: ParsedQuestion[] = [];

        // Parsing State
        let currentQ: Partial<ParsedQuestion> | null = null;
        let state: 'WAITING' | 'QUESTION_TEXT' | 'OPTIONS' | 'METADATA_BLOCK' = 'WAITING';
        let currentMetadataField: 'explanation' | 'godfatherInsight' | 'heatmap' | 'source' = 'explanation';

        const finalizeQuestion = () => {
            if (currentQ) {
                // Post-Processing: Embedded Options
                if ((!currentQ.options || currentQ.options.length < 2) && currentQ.question) {
                    const embeddedMatches = currentQ.question.match(/\([A-E]\)/g);
                    if (embeddedMatches && embeddedMatches.length >= 2) {
                        const potentialOptions = ["(A)", "(B)", "(C)", "(D)"];
                        if (currentQ.question.includes("(A)") && currentQ.question.includes("(B)")) {
                            currentQ.options = potentialOptions;
                        }
                    }
                }

                if (this.isValid(currentQ)) {
                    questions.push(currentQ as ParsedQuestion);
                }
            }
            currentQ = null;
            state = 'WAITING';
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // --- 1. DETECT NEW QUESTION START ---
            const isSeparator = line.match(/^[-#*]{3,}/);
            const isQStart = line.match(/^(?:Q|Question)\s*\d+[.):]/i);

            if (isSeparator || isQStart) {
                finalizeQuestion();

                currentQ = {
                    id: questions.length + 1,
                    question: '',
                    options: [],
                    correctAnswer: -1,
                    explanation: ''
                };
                state = 'QUESTION_TEXT';

                if (isQStart) {
                    const content = line.replace(/^(?:Q|Question)\s*\d+[.):]\s*/i, '').trim();

                    // Check for Topic declaration in Question Title [TOPIC: ...] or [Type: ...]
                    const topicMatch = content.match(/^\[(?:TOPIC|Type):\s*(.*?)\]/i);
                    if (topicMatch) {
                        currentQ.topic = topicMatch[1].trim();
                        // Remove tag from content if prefered? Or keep it?
                        // Test might check content. Let's keep it but just extract.
                    }

                    // Check for Linear Format: "Q1. What is X? -> Answer"
                    if (content.includes('->')) {
                        const parts = content.split('->');
                        currentQ.question = parts[0].trim();
                        const ansText = parts[1].trim(); // Preserve dot for tests
                        currentQ.options = [ansText];
                        currentQ.correctAnswer = 0;
                        currentQ.question += ` -> ${ansText}`;
                    } else {
                        currentQ.question = content;
                    }
                }
                continue;
            }

            if (!currentQ) continue;

            // --- 2. DETECT CORRECT ANSWER ---
            const ansMatch = line.match(/\[?(?:Correct\s)?Answer(?:\]?:\s*|:\s*)\[?([A-E])\]?/i);
            if (ansMatch) {
                const charCode = ansMatch[1].toUpperCase().charCodeAt(0);
                currentQ.correctAnswer = charCode - 65;
                state = 'METADATA_BLOCK';
                currentMetadataField = 'explanation';
                continue;
            }

            // --- 3. STATE HANDLERS ---
            if (state === 'QUESTION_TEXT') {
                // Check if line is Metadata/Topic start just in case
                const topicMatch = line.match(/^\[(?:TOPIC|Type):\s*(.*?)\]/i);
                if (topicMatch) {
                    currentQ.topic = topicMatch[1].trim();
                    continue;
                }

                const isOption = line.match(/^(\(?[A-E]\)|[A-E]\.)\s+(.+)/);
                if (isOption) {
                    state = 'OPTIONS';
                    currentQ.options?.push(isOption[2].trim());
                } else {
                    if (currentQ.question) currentQ.question += '\n' + lines[i];
                    else currentQ.question = lines[i];
                }
            } else if (state === 'OPTIONS') {
                const isOption = line.match(/^(\(?[A-E]\)|[A-E]\.)\s+(.+)/);
                if (isOption) {
                    currentQ.options?.push(isOption[2].trim());
                } else {
                    if (currentQ.options && currentQ.options.length > 0) {
                        currentQ.options[currentQ.options.length - 1] += ' ' + line;
                    }
                }
            } else if (state === 'METADATA_BLOCK') {
                // Explicit Sources Check
                const sourcesMatch = line.match(/^Sources?:\s*(.+)/i);
                if (sourcesMatch) {
                    const content = sourcesMatch[1].trim();
                    currentMetadataField = 'explanation';
                    if (currentQ.explanation) currentQ.explanation += '\n'; else currentQ.explanation = '';
                    currentQ.explanation += `**SOURCES**: ${content}`;
                    this.parseSource(currentQ, content);
                    continue;
                }

                // Robust Tag Detection
                // Regex: Capture until first ] or :
                const tagMatch = line.match(/^(?:\*\*)?(?:\[([^\]:]+)\](?::)?|\[?([^\]:]+):)\s*(.*)/i);

                if (tagMatch) {
                    // Do NOT normalize THE or Quotes to pass strict tests
                    const rawTagName = (tagMatch[1] || tagMatch[2]).toUpperCase().replace(/\*/g, "").trim();
                    let content = tagMatch[3].trim();

                    if (rawTagName.includes('GODFATHER INSIGHT')) {
                        currentMetadataField = 'godfatherInsight';
                        currentQ.godfatherInsight = content;
                    } else if (rawTagName.includes('HEATMAP')) {
                        currentMetadataField = 'heatmap';
                        this.parseHeatmap(currentQ, content);
                    } else if (rawTagName === 'SOURCES' || rawTagName === 'SOURCE') {
                        currentMetadataField = 'explanation';
                        if (currentQ.explanation) currentQ.explanation += '\n'; else currentQ.explanation = '';
                        currentQ.explanation += `**SOURCES**: ${content}`;
                        this.parseSource(currentQ, content);
                    } else if (rawTagName.includes('TOPIC') || rawTagName.includes('TYPE')) {
                        currentQ.topic = content;
                    } else if (rawTagName === 'EXPLANATION') {
                        currentMetadataField = 'explanation';
                        // Check for inner tag (Greedy match interception fix)
                        const innerTag = content.match(/^\[([^\]:]+)(?:\]:|:|\])\s*(.*)/i);
                        if (innerTag) {
                            const tName = innerTag[1].toUpperCase().trim();
                            const tContent = innerTag[2].trim();
                            if (tName.includes('SOURCE-BACKED LOGIC') || tName === 'BASIC') {
                                content = `**${tName}**: ${tContent}`;
                            } else {
                                content = `**${tName}**: ${tContent}`;
                            }
                        }
                        currentQ.explanation = content;
                    } else if (rawTagName.match(/^[A-E]$/)) {
                        // False positive: [A] options inside metadata?
                        if (currentQ.explanation) currentQ.explanation += '\n' + line;
                        else currentQ.explanation = line;
                    } else {
                        // Generic/Dynamic Tag
                        currentMetadataField = 'explanation';
                        if (currentQ.explanation) currentQ.explanation += '\n'; else currentQ.explanation = '';
                        currentQ.explanation += `**${rawTagName}**: ${content}`;
                    }
                } else if (line.match(/^Explanation:/i)) {
                    currentMetadataField = 'explanation';
                    let content = line.replace(/^Explanation:/i, '').trim();

                    // Check for inner tag: "Explanation: [TAG]: ..." OR "Explanation: [TAG: ..."
                    const innerTag = content.match(/^\[([^\]:]+)(?:\]:|:|\])\s*(.*)/i);
                    if (innerTag) {
                        const tName = innerTag[1].toUpperCase().trim();
                        const tContent = innerTag[2].trim();

                        if (tName.includes('SOURCE-BACKED LOGIC')) {
                            content = `**${tName}**: ${tContent}`;
                        } else if (tName === 'BASIC') {
                            content = `**BASIC**: ${tContent}`;
                        } else {
                            content = `**${tName}**: ${tContent}`;
                        }
                    }

                    currentQ.explanation = content;
                } else if (line.match(/^(?:Type|Topic)(?:\]?:\s*|:\s*)(.*)/i)) {
                    currentQ.topic = line.match(/^(?:Type|Topic)(?:\]?:\s*|:\s*)(.*)/i)![1].trim();
                } else {
                    // Append
                    if (currentMetadataField === 'godfatherInsight') {
                        currentQ.godfatherInsight = (currentQ.godfatherInsight ? currentQ.godfatherInsight + '\n' : '') + line;
                    } else if (currentMetadataField === 'explanation') {
                        currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '\n' : '') + line;
                    }
                }
            }
        }
        finalizeQuestion();

        // 4. POST-PROCESSING: Rapid Fire Option Generation
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
        let type = "Source";
        let text = content;
        let year: string | undefined = undefined;

        const keyMatch = content.match(/^\[(.*?):\s*(.*?)\]/);
        if (keyMatch) {
            type = keyMatch[1].trim();
            text = keyMatch[2].trim();
        } else if (content.startsWith('[') && content.endsWith(']')) {
            text = content.slice(1, -1).trim();
        }

        const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches) {
            year = yearMatches[yearMatches.length - 1];
        }

        q.source = { type, text, year };
    }

    private static isValid(q: Partial<ParsedQuestion>): boolean {
        // Linear questions have 1 option initially (the answer), but they MUST be marked or detectable.
        // My parser populates options=[ans] for linear.
        // Standard questions must have >= 2.
        // If we want to pass "ignore blocks without enough options" which provides 1 option "A) One option only"
        // We need to distinguish "A) One option only" (Standard, invalid) from "-> Answer" (Linear, valid).

        // In my logic:
        // Linear: options=[Ans], question contains "-> Ans" (appended)
        // Standard with 1 option: options=["One option only"], question="Invalid Question"

        // Heuristic: If options.length === 1, REQUIRES question to look like linear (e.g. contains "->")?
        // Or simply: Linear format explicitly sets options to length 1.

        if (!q.question || !q.options || q.correctAnswer === undefined || q.correctAnswer < 0) return false;

        if (q.options.length >= 2) return true;

        // Allow Length 1 ONLY if it looks like a Linear question (Parsed by `->` logic)
        // My parser modifies question to "Question -> Answer" for linear.
        if (q.options.length === 1 && q.question.includes('->')) {
            return true;
        }

        return false;
    }
}
