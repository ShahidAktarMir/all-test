import type { Token } from './types';
import { TokenType } from './types';
import type { ParsedQuestion } from '../types';
import { Heuristics } from './heuristics';

/**
 * Advanced Syntax Analyzer (Parser)
 * Consumes the Token Stream and constructs the ParsedQuestion objects.
 * Implements a Deterministic Finite Automaton (DFA).
 */
export class Parser {
    private tokens: Token[];
    private current = 0;
    private questions: ParsedQuestion[] = [];

    // Context for current question being built
    private currentQ: Partial<ParsedQuestion> | null = null;
    private currentOptionIndex: number = -1; // Track which option is active
    private lastSection: 'QUESTION' | 'OPTION' | 'EXPLANATION' | 'METADATA' = 'QUESTION';

    // Smart Context Storage
    private contextText: string | null = null;
    private contextRange: { start: number, end: number } | null = null;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public parse(): ParsedQuestion[] {
        // Try Strict Parsing First
        this.current = 0;
        this.questions = [];
        this.parseStrict();

        // If Strict Parsing failed to find any questions (or too few?), try Loose Mode
        // "Infinite Level" means we NEVER give up.
        if (this.questions.length === 0) {
            console.log("Strict Parsing failed. Engaging Loose Mode (Infinite Level).");
            this.current = 0;
            this.questions = [];
            this.parseLoose();
        }

        return this.questions;
    }

    private parseStrict() {
        this.current = 0;
        this.currentQ = null;

        while (!this.isAtEnd()) {
            const token = this.peek();

            // GLOBAL TRANSITIONS (Can happen anywhere)

            // 1. New Question Start
            if (token.type === TokenType.QUESTION_NUMBER || token.type === TokenType.SEPARATOR) {
                // Check if the PREVIOUS token was a "Directions" block?
                // Actually, "Directions" usually comes as a distinct TEXT block before Q1.
                // We handle it in the parse loop. If we see TEXT that looks like directions, we store it.
                // But TEXT is handled below. We need to check context variables.

                this.finalizeCurrentQuestion();
                this.startNewQuestion();

                // Smart Context Application
                if (this.contextText && this.contextRange) {
                    // Check if current Q index (we don't know Q number yet easily, but we can parse it)
                    // Let's rely on question count or parse the number from token.
                    let qNum = -1;
                    if (token.type === TokenType.QUESTION_NUMBER) {
                        const match = token.value.match(/(\d+)/);
                        if (match) qNum = parseInt(match[1]);
                    }

                    if (qNum !== -1 && qNum >= this.contextRange.start && qNum <= this.contextRange.end) {
                        this.currentQ!.groupInstruction = this.contextText;
                    } else if (qNum > this.contextRange.end) {
                        // Clear context if we passed the range
                        this.contextText = null;
                        this.contextRange = null;
                    }
                }

                if (token.type === TokenType.QUESTION_NUMBER) {
                    this.advance(); // Consumed Q header
                } else if (token.type === TokenType.SEPARATOR) {
                    this.advance(); // Consumed Separator
                }
                continue;
            }

            // 2. Answer Key Found using Token
            if (token.type === TokenType.ANSWER_LABEL) {
                if (!this.currentQ) this.startNewQuestion(); // Should not happen strictly but robust
                this.parseAnswer();
                continue;
            }

            // 3. Option Label Found
            if (token.type === TokenType.OPTION_LABEL) {
                if (!this.currentQ) this.startNewQuestion();
                this.parseOption();
                continue;
            }

            // 4. Metadata Label
            if (token.type === TokenType.TAG_LABEL) {
                if (!this.currentQ) this.startNewQuestion();
                this.parseMetadata();
                continue;
            }

            // 5. Plain Text Handling (Context Dependent)
            if (token.type === TokenType.TEXT) {
                if (!this.currentQ) this.startNewQuestion();
                this.handleText(token);
                this.advance();
                continue;
            }

            // Fallback
            this.advance();
        }

        this.finalizeCurrentQuestion();
        return this.questions;
    }

    private startNewQuestion() {
        this.currentQ = {
            id: this.questions.length + 1,
            question: '',
            options: [],
            correctAnswer: -1,
            explanation: '',
            topic: 'General'
        };
        this.lastSection = 'QUESTION';
        this.currentOptionIndex = -1;
    }

    private finalizeCurrentQuestion() {
        if (this.currentQ) {
            // Support Linear Format: "Question -> Answer"
            if (this.currentQ.question && this.currentQ.question.includes('->')) {
                const parts = this.currentQ.question.split('->');
                // Only treat as linear if it looks like a short answer, not random arrow usage?
                // Heuristic: If we have NO options yet, treat as Linear.
                if (!this.currentQ.options || this.currentQ.options.length === 0) {
                    this.currentQ.question = parts[0].trim() + ' -> ' + parts[1].trim();
                    this.currentQ.options = [parts[1].trim()];
                    this.currentQ.correctAnswer = 0;
                }
            }

            // Extract Topic/Type/Time/Tags from Question Text if present
            if (this.currentQ.question) {
                // Time Limit: [Time: 45s]
                const timeMatch = this.currentQ.question.match(/\[Time:\s*([^\]]+)\]/i);
                if (timeMatch) {
                    this.parseTimeLimit(this.currentQ, timeMatch[0]); // Use full string '[Time: 45s]' for helper
                    this.currentQ.question = this.currentQ.question.replace(timeMatch[0], '');
                }

                // Topic: [Topic: ...]
                const topicMatch = this.currentQ.question.match(/\[TOPIC:\s*([^\]]+)\]/i);
                if (topicMatch) {
                    this.currentQ.topic = topicMatch[1].trim();
                    this.currentQ.question = this.currentQ.question.replace(topicMatch[0], '');
                }

                // Generic Tags: [TAG: ...] -> Append to Topic or new field?
                // Let's just strip them for now or append to topic?
                // Request didn't specify, but "Super Ultimate" implies we should keep them.
                // Let's append to topic for now.
                const tagMatch = this.currentQ.question.match(/\[TAG:\s*([^\]]+)\]/i);
                if (tagMatch) {
                    // If topic exists, append.
                    this.currentQ.topic = (this.currentQ.topic ? this.currentQ.topic + ', ' : '') + tagMatch[1].trim();
                    this.currentQ.question = this.currentQ.question.replace(tagMatch[0], '');
                }
            }

            // Post-Processing: Intelligent Error Detection / Embedded Options Reversal
            // If options start with '/' (common in error detection "Slash" format)
            if (this.currentQ.options && this.currentQ.options.some(o => o.trim().startsWith('/'))) {
                let reconstructedQ = this.currentQ.question || "";
                const originalOptionCount = this.currentQ.options.length;

                this.currentQ.options.forEach((optText, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    reconstructedQ += ` (${label}) ${optText}`;
                });

                // If the last option is "No Error" or similar, usually (D) or (E)
                // The test expects options to be literal ["(A)", "(B)"...] for this type?
                // Let's match the test expectation: options=["(A)", "(B)", "(C)", "(D)"]
                this.currentQ.question = reconstructedQ;
                this.currentQ.options = Array.from({ length: originalOptionCount }, (_, i) => `(${String.fromCharCode(65 + i)})`);
            }

            // Validation & Cleanup
            this.currentQ.question = this.currentQ.question?.trim();
            this.currentQ.explanation = this.currentQ.explanation?.trim();

            // Auto-clean options
            if (this.currentQ.options) {
                this.currentQ.options = this.currentQ.options.map(o => o.trim()).filter(o => o);
            }

            // Strict Validation Logic
            let isValid = false;

            // 1. Must have Question Text
            if (!this.currentQ.question) isValid = false;

            // 2. Options Check
            else if (this.currentQ.options && this.currentQ.options.length >= 2) {
                isValid = true;
            }
            // 3. Linear Check (1 option is allowed IF it's linear format)
            else if (this.currentQ.options && this.currentQ.options.length === 1) {
                // If it was parsed as Linear (embedded -> or explicit single option with answer set)
                // We check if it has '->' in question OR we implicitly trust 1-option questions if they have an Answer set?
                // The test case "should ignore blocks without enough options" has 1 option and CorrectAnswer set, but expects FAILURE.
                // So purely having an answer is NOT enough to allow 1 option. It MUST be Linear Format.
                if (this.currentQ.question.includes('->')) {
                    isValid = true;
                }
            }

            if (isValid && this.currentQ.correctAnswer !== undefined && this.currentQ.correctAnswer >= 0) {
                this.questions.push(this.currentQ as ParsedQuestion);
            }
        }
        this.currentQ = null;
    }

    private parseAnswer() {
        const token = this.advance(); // consume LABEL or TEXT
        let val = token.value;

        // If token is TEXT (Loose Mode), extract answer
        if (token.type === TokenType.TEXT) {
            const match = val.match(/(?:Answer).*?([A-E])/i);
            if (match) val = match[1];
        }

        val = val.toUpperCase().replace(/[^A-E]/g, '');
        // If multiple chars (e.g. from "Correct Answer" -> CECAEB), take the last one or strict?
        // Usually Answer: B -> B.
        // If we have garbage, assume the answer is the last valid char or single char?
        // Let's take the LAST valid char if length > 1 (heuristic), 
        // OR better: The extracted group from Regex should be just "B".

        // If strict lexing worked, value is "B".
        // If loose mode matched invalidly, we might have issues.
        // Let's assume the last char is the answer if string is long.
        if (val.length > 1) {
            val = val.substring(val.length - 1);
        }

        if (val.length > 0 && this.currentQ) {
            this.currentQ.correctAnswer = val.charCodeAt(0) - 65;
        }
        this.lastSection = 'EXPLANATION';
    }

    private parseOption() {
        this.advance(); // Consumed LABEL (A)
        // Ensure options array init
        if (!this.currentQ!.options) this.currentQ!.options = [];

        this.currentQ!.options!.push(''); // Start new option accumulator
        this.currentOptionIndex = this.currentQ!.options!.length - 1;
        this.lastSection = 'OPTION';
    }

    private parseMetadata() {
        const token = this.advance(); // Consume TAG_LABEL like "Explanation"
        const rawKey = token.value.toUpperCase();

        // Fuzzy Match key against valid tags
        const key = Heuristics.fuzzyMatch(rawKey, Heuristics.VALID_TAGS) || rawKey;

        if (key.includes('EXPLANATION')) {
            this.lastSection = 'EXPLANATION';
        } else if (key.includes('GODFATHER')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'godfatherInsight';
        } else if (key.includes('HEATMAP')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'heatmap';
        } else if (key.includes('SOURCE')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'source';
        } else if (key.includes('TYPE') || key.includes('TOPIC')) {
            this.lastSection = 'METADATA';
            // We can store it directly in topic or use metadata generic?
            // Let's assume we read the next text as topic
            // But parseMetadata just sets section. handleText does the work.
            // We need a key for handleText to map to topic.
            // 'topic' isn't in my switch case in handleText yet.
            // Or just treat 'TYPE' as 'TOPIC'.
        } else if (key.includes('TYPE') || key.includes('TOPIC')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'topic';
        } else if (key.includes('TIME')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'timeLimit';
        } else if (key.includes('LOGIC')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'logic'; // Map to explanation
        } else if (key.includes('PROVENANCE')) {
            this.lastSection = 'METADATA';
            this.currentMetadataKey = 'source';
        } else {
            // Generic handling -> Put into explanation or metadata
            this.lastSection = 'EXPLANATION';
            if (this.currentQ!.explanation) this.currentQ!.explanation += '\n';
            this.currentQ!.explanation += `**${token.value}**: `;
        }
    }

    // Temporary storage for metadata target key
    private currentMetadataKey: string = '';

    private handleText(token: Token) {
        const text = token.value;
        if (!this.currentQ) return;

        switch (this.lastSection) {
            case 'QUESTION':
                // Check for Directions Block (Context)
                // e.g. "Directions (Q1-5):" or "Directions (Q. 101-105):"
                const dirMatch = text.match(/Directions\s*\(?Q(?:uestions?)?\.?\s*(\d+)\s*[-to]+\s*(\d+)\)?/i);
                if (dirMatch) {
                    this.contextText = text;
                    this.contextRange = {
                        start: parseInt(dirMatch[1]),
                        end: parseInt(dirMatch[2])
                    };
                    // Treat as separate context, don't append to current question if it's empty
                    // If current question is NOT empty, this might be a mistake or end of prev question?
                    // Usually Directions appear between questions.
                    // If we are "building" a question but it has no options yet, maybe we are just capturing text.
                    // Let's reset current question if it only has this text.
                }

                this.currentQ.question = (this.currentQ.question ? this.currentQ.question + '\n' : '') + text;
                break;
            case 'OPTION':
                if (this.currentOptionIndex >= 0 && this.currentQ.options) {
                    this.currentQ.options[this.currentOptionIndex] += (this.currentQ.options[this.currentOptionIndex] ? ' ' : '') + text;
                }
                break;
            case 'EXPLANATION':
                // Check for inner tag styling: [TAG]: Content -> **TAG**: Content
                let content = text;
                const innerTag = content.match(/^\[([^\]:]+)(?:\]:|:|\])\s*(.*)/s); // /s for dotAll if needed? No, token is usually line or chunk.
                if (innerTag) {
                    const rawTName = innerTag[1].toUpperCase().trim();
                    const tContent = innerTag[2].trim();
                    // Fuzzy Match Inner Tag
                    const tName = Heuristics.fuzzyMatch(rawTName, Heuristics.VALID_TAGS) || rawTName;
                    // Apply formatting for known or generic tags found effectively at start of line
                    content = `**${tName}**: ${tContent}`;
                }
                this.currentQ.explanation = (this.currentQ.explanation ? this.currentQ.explanation + '\n' : '') + content;
                break;
            case 'METADATA':
                if (this.currentMetadataKey === 'godfatherInsight') {
                    this.currentQ.godfatherInsight = (this.currentQ.godfatherInsight ? this.currentQ.godfatherInsight + '\n' : '') + text;
                } else if (this.currentMetadataKey === 'source') {
                    this.parseSource(this.currentQ, text);
                    // Back-compat: Append to explanation
                    this.currentQ.explanation = (this.currentQ.explanation ? this.currentQ.explanation + '\n' : '') + `**SOURCES**: ${text}`;
                } else if (this.currentMetadataKey === 'heatmap') {
                    this.parseHeatmap(this.currentQ, text);
                } else if (this.currentMetadataKey === 'topic') {
                    this.currentQ.topic = text;
                } else if (this.currentMetadataKey === 'logic') {
                    // logic -> explanation
                    this.currentQ.explanation = (this.currentQ.explanation ? this.currentQ.explanation + '\n' : '') + `**Logic**: ${text}`;
                } else if (this.currentMetadataKey === 'timeLimit') {
                    this.parseTimeLimit(this.currentQ, text);
                }
                break;
        }
    }

    // --- Specific Parsers ---

    private parseTimeLimit(q: Partial<ParsedQuestion>, content: string) {
        // Formats: "30s", "45", "[Time: 30s]"
        const clean = content.replace(/[\[\]]/g, '').trim();
        const numMatch = clean.match(/(\d+)/);
        if (numMatch) {
            let val = parseInt(numMatch[1]);
            // Heuristic: if < 5, might be minutes? Default to seconds usually.
            // If text contains 'm' or 'min', convert.
            if (/m(in)?\b/i.test(clean)) {
                val *= 60;
            }
            q.timeLimit = val;
        }
    }

    private parseHeatmap(q: Partial<ParsedQuestion>, content: string) {
        const diffMatch = content.match(/\[Diff:\s*([^\]]+)\]/i);
        const timeMatch = content.match(/\[Avg Time:\s*([^\]]+)\]/i);
        const typeMatch = content.match(/\[Type:\s*([^\]]+)\]/i);

        q.heatmap = {
            diff: diffMatch ? diffMatch[1].trim() : 'N/A',
            avgTime: timeMatch ? timeMatch[1].trim() : 'N/A',
            type: typeMatch ? typeMatch[1].trim() : 'Standard'
        };
    }

    private parseSource(q: Partial<ParsedQuestion>, content: string) {
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

        // Merge if exists or create
        // Logic: if multiple lines call source, how to merge?
        // Assume last overwrite or intelligent merge? Overwrite for now.
        q.source = { type, text, year };
    }


    // --- Helpers ---

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    /**
     * Infinite Level Loose Parser
     * Uses heuristics to recover questions even from badly formatted text.
     */
    private parseLoose() {
        while (!this.isAtEnd()) {
            const token = this.peek();

            // Heuristic: Check if TEXT looks like a Question Start (e.g. "1. ", "**Q1**")
            // The Lexer might have missed it if it was messy.
            let isLooseQ = false;
            if (token.type === TokenType.TEXT) {
                // Support: 1., Q1., **Q1**, **Q.1**
                if (/^\d+[.):]/.test(token.value) || /^(?:\*\*)?(?:Q|Question)\s*(\d+)/i.test(token.value)) {
                    isLooseQ = true;
                }
            }

            if (token.type === TokenType.QUESTION_NUMBER || isLooseQ) {
                this.finalizeCurrentQuestion();
                this.startNewQuestion();

                // If it was TEXT, we use the value as question body
                if (token.type === TokenType.TEXT) {
                    this.currentQ!.question = token.value;
                    // Try to strip number?
                    this.currentQ!.question = this.currentQ!.question!.replace(/^\d+[.):]\s*/, '');
                } else {
                    // Check next token for body
                    this.advance(); // consume number
                    continue;
                }
            }
            else if (token.type === TokenType.OPTION_LABEL) {
                if (!this.currentQ) this.startNewQuestion();
                this.parseOption();
                continue;
            }
            else if (token.type === TokenType.ANSWER_LABEL || /Answer:/i.test(token.value)) {
                if (!this.currentQ) this.startNewQuestion(); // Should exist though
                this.parseAnswer();
                continue;
            }
            else if (this.currentQ) {
                // Determine where to put text
                // If we are in OPTION state, looks like option continuation
                if (this.lastSection === 'OPTION') {
                    this.handleText(token);
                } else {
                    // Default to question or explanation
                    // If we have answer, assume explanation
                    if (this.currentQ.correctAnswer !== -1) {
                        this.lastSection = 'EXPLANATION';
                    }
                    this.handleText(token);
                }
            }

            this.advance();
        }
        this.finalizeCurrentQuestion();
    }
}
