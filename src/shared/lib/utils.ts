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
            // Strict Regex: Requires "Q" or "Question" prefix to avoid matching puzzle conditions (e.g. "1. Condition")
            const qStartRegex = /^(?:Q|Question)\s*\d+[.):]/i;

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
                // Modified regex: strictly require 'Q' or 'Question' mostly, 
                // but for simple "1." it might still trigger. 
                // To support Puzzles (1. condition), we should prefer "Q" prefix if possible or check context.
                // However, user prompt images show "Q4. [TOPIC..." so standard regex is:
                // Start with Q/Question OR just number followed by dot/paren
                // BUT, to avoid capturing "1." inside a puzzle, we rely on the previous line or format.
                // For now, let's keep                    // New Question Detection
                // Explicit Delimiter for "Hacked" format or other separators
                // Matches "###", "***", "---" (at least 3 chars)
                if (line.match(/^[-#*]{3,}/)) {
                    if (currentQ && this.isValid(currentQ)) {
                        questions.push(currentQ as ParsedQuestion);
                        currentQ = null;
                    }
                    continue;
                }

                if (qStartRegex.test(line)) {
                    if (currentQ && this.isValid(currentQ)) {
                        questions.push(currentQ as ParsedQuestion);
                    }

                    // Check for Topic in this line
                    let topic: string | undefined = undefined;
                    // Relaxed regex: handle [TOPIC: ...], TOPIC: ... etc more loosely
                    const topicMatch = line.match(/TOPIC:\s*([^\]]+)/i);
                    if (topicMatch) {
                        topic = topicMatch[1].trim();
                    }

                    currentQ = {
                        id: questions.length + 1,
                        question: line.replace(qStartRegex, '').replace(/\[TOPIC:\s*.+?\]/i, '').trim(),
                        options: [],
                        correctAnswer: -1,
                        topic: topic
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
                    else if (currentQ.options?.length === 0 && (line.includes('(A)') || line.includes('/ (A)'))) {
                        if (currentQ.options.length === 0) {
                            currentQ.options = ["(A)", "(B)", "(C)", "(D)"];
                            currentQ.question += '\n' + line; // Preserve specific formatting? or just space
                        }
                    }
                    // Correct Answer Detection
                    // Matches: "Correct Answer: B", "[Correct Answer: B]", "[Answer: B]", "[CORRECT ANSWER]: A"
                    else if (line.match(/\[?(?:Correct\s)?Answer(?:\]?:\s*|:\s*)([A-E])/i)) {
                        const match = line.match(/\[?(?:Correct\s)?Answer(?:\]?:\s*|:\s*)([A-E])/i);
                        if (match) {
                            const charCode = match[1].toUpperCase().charCodeAt(0);
                            currentQ.correctAnswer = charCode - 65; // A=0, B=1...
                        }
                    }
                    // Explanation Detection
                    else if (line.match(/^Explanation:/i)) {
                        let expText = line.replace(/^Explanation:/i, '').trim();

                        // --- UNIVERSAL METADATA PARSER ---
                        // Dynamic detection of [TAG NAME]: Content
                        // Regex matches: [TAG]: Content OR TAG: Content
                        // We check for patterns like [ALGORITHM REVEAL]: ... or [SOURCE-BACKED LOGIC]: ...

                        // Strategy: Look for known heavy formatting or just generic tags?
                        // "Super Intelligent" approach:
                        // Scan for any pattern [UPPERCASE TAG]: Content

                        // Check for common specific tags first purely for standardization if needed, 
                        // OR just use a generic replacer.

                        // Let's iterate over ALL valid tags found in the line.
                        // But usually it's one main tag at the start.

                        // We use a regex to capture [TAG]: content
                        const metadataMatch = expText.match(/^(?:\[?([A-Z0-9\s_\-"']+)\]?[:]\s*)(.*)/i);

                        if (metadataMatch) {
                            const tagName = metadataMatch[1].trim().toUpperCase();
                            let content = metadataMatch[2].trim();

                            if (content.endsWith(']')) {
                                content = content.slice(0, -1).trim();
                            }

                            // Re-format nicely
                            // Exclude common "Explanation" text if it was captured as tag (unlikely due to replace above)
                            // We explicitly format it as **TAG NAME**: Content
                            expText = `**${tagName}**: ${content}`;
                        }

                        currentQ.explanation = expText;
                    }
                    // Dynamic Metadata Line Detection (e.g. [THE "TRAP" EXPLANATION]: ...) on its own line
                    // STRICTER: Require '[' to start, to avoid matching "Statement:", "Equation:", etc.
                    else if (line.match(/^\[([A-Z0-9\s_\-"']+)\]?[:]\s*(.*)/i)) {
                        const match = line.match(/^\[([A-Z0-9\s_\-"']+)\]?[:]\s*(.*)/i);
                        if (match) {
                            const tagName = match[1].trim().toUpperCase();
                            // Filter out standard ones if necessary, but generic is fine.
                            // Avoid capturing "Correct Answer" if it slipped through (handled above).
                            if (tagName !== "CORRECT ANSWER" && tagName !== "ANSWER") {
                                let content = match[2].trim();
                                if (content.endsWith(']')) {
                                    content = content.slice(0, -1).trim();
                                }
                                currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '\n\n' : '') + `**${tagName}**: ` + content;
                            }
                        }
                    }
                    // Explicit Sources Detection (User Request)
                    else if (line.match(/^(?:Sources?|Cite)(?:\]?:\s*|:\s*)(.*)/i)) {
                        const match = line.match(/^(?:Sources?|Cite)(?:\]?:\s*|:\s*)(.*)/i);
                        if (match) {
                            const content = match[1].trim();
                            currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '\n\n' : '') + `**SOURCES**: ` + content;
                        }
                    }
                    // Catch-all for multi-line explanation or question text
                    else if (!line.startsWith('[') && !line.startsWith('Correct Answer')) {
                        // Only append if it doesn't look like metadata
                        if (currentQ.correctAnswer !== -1 && currentQ.explanation !== undefined) {
                            // Append to explanation
                            currentQ.explanation += '\n' + line;
                        } else if (currentQ.options?.length === 0) {
                            // Still in question text block - PRESERVE NEWLINES for Puzzles/Statements
                            currentQ.question += '\n' + line;
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
