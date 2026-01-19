
import type { Token } from './types.ts';
import { TokenType } from './types.ts';
import { Heuristics } from './heuristics.ts';

/**
 * Advanced Lexical Analyzer (Lexer)
 * Converts raw raw text into a stream of structured Tokens.
 * Uses Regular Expressions for pattern matching with O(N) linear scanning.
 */
export class Lexer {
    private input: string = '';
    private tokens: Token[] = [];
    private currentLine: number = 0;

    // Compiled Regex Patterns for performance
    // Note: Order matters for precedence
    private patterns = {
        SEPARATOR: /^[-#*]{3,}/,
        BATCH_HEADER: /^###\s*⚡\s*BATCH/i, // Explicitly detect batch headers to skip or handle specific logic

        // Universal Question: Matches "1.", "Q1.", "Question 1:", "प्रश्न 1.", "Task 1"
        // Key is robust digit capture at start of line
        QUESTION_NUMBER: /^(?:Q|Question|Que|Prashna|Sawal|Problema|Aufgabe|Parte|Step|Task)?\s*(\d+)[.):]/i,
        OPTION_LABEL: /(?:(^|\s)(\(?[A-Ea-e]\)|\[[A-Ea-e]\])|(^|\t|\s{2,})([A-Ea-e]\.))(?=[\s"')]|$)/i,
        ANSWER_LABEL: /(?:Correct\s)?(?:Answer|Ans|Uttar|Respuesta|Antwort|Jawab)(?:\]?:\s*|:\s*)\[?([A-Ea-e])\]?/i,
        TAG_START: /^(?:\*\*)?\[([A-Za-z0-9\s]{1,30})\](?::)?|\[?([A-Za-z0-9\s]{1,30}):/i,
        METADATA_KEY: /^(Explanation|Sources?|Godfather Insight|Heatmap|Type|Topic)(?:\]?:\s*|:\s*)/i
    };

    /**
     * Tokenizes the entire input string.
     * @param input Raw text content
     * @returns Array of Tokens
     */
    tokenize(input: string): Token[] {
        // 0. Pre-process with OCR Heuristics
        const cleanInput = Heuristics.fixOCR(input);

        this.input = cleanInput.replace(/\r\n/g, '\n');
        const lines = this.input.split('\n');
        this.tokens = [];
        this.currentLine = 0;

        for (const line of lines) {
            this.currentLine++;
            const trimmed = line.trim();
            if (!trimmed) continue;

            this.processLine(trimmed, line); // Pass raw line for preservation if needed
        }

        this.tokens.push({ type: TokenType.EOF, value: '', line: this.currentLine, raw: '' });
        return this.tokens;
    }

    private processLine(text: string, rawLine: string) {
        // 1. Separators
        if (this.patterns.BATCH_HEADER.test(text)) {
            // Treat as separator or just skip?
            // Let's treat as separator to ensure Q flush
            this.tokens.push(this.makeToken(TokenType.SEPARATOR, text, rawLine));
            return;
        }
        if (this.patterns.SEPARATOR.test(text)) {
            this.tokens.push(this.makeToken(TokenType.SEPARATOR, text, rawLine));
            return;
        }

        // 2. Question Header
        // Only valid if it's the start of the line
        const qMatch = text.match(this.patterns.QUESTION_NUMBER);
        if (qMatch && qMatch.index === 0) {
            this.tokens.push(this.makeToken(TokenType.QUESTION_NUMBER, qMatch[1], rawLine));
            // The rest of the line is effectively TEXT (the question body)
            // But we need to handle "Q1. What is...?"
            // We emit Q_NUM then the rest as TEXT
            const remaining = text.substring(qMatch[0].length).trim();
            if (remaining) {
                this.processLineBody(remaining, rawLine);
            }
            return;
        }

        // 3. Answer Key
        const ansMatch = text.match(this.patterns.ANSWER_LABEL);
        // Correct Answer must be explicit.
        // If it appears, we treat the whole line as an answer declaration usually.
        if (ansMatch) {
            this.tokens.push(this.makeToken(TokenType.ANSWER_LABEL, ansMatch[1], rawLine));
            // Check for metadata after answer? e.g. "Answer: A. Explanation..."
            // For now, assume Answer is its own line or end of Q.
            return;
        }

        // 4. Metadata / Tags (Explicit line starts)
        const metaMatch = text.match(this.patterns.METADATA_KEY);
        if (metaMatch) {
            // Specific known metadata keys
            this.tokens.push(this.makeToken(TokenType.TAG_LABEL, metaMatch[1], rawLine));
            const remaining = text.substring(metaMatch[0].length).trim();
            if (remaining) {
                this.tokens.push(this.makeToken(TokenType.TEXT, remaining, rawLine));
            }
            return;
        }

        // Check for generic [Tag]: format
        // But be careful not to match [A] options or [Text] inside Q.
        // Rule: Must be at start of line, enclosed in [], followed by :?
        // Let's defer strict tag parsing to the Parser, or handle specific obvious ones.
        // We will output TEXT for now, and let Parser look for tags in TEXT if context allows.

        // 5. Options & Text (Mixed content)
        this.processLineBody(text, rawLine);
    }

    /**
     * Processes a line that might contain Options or just Text.
     * Handles "Embedded Options" like "(A) X (B) Y"
     */
    private processLineBody(text: string, rawLine: string) {
        // Global search for options in this line
        // We want to split the string by Option Labels

        // Regex with 'g' flag
        const optionRegex = new RegExp(this.patterns.OPTION_LABEL, 'gi');
        let lastIndex = 0;
        let match;

        const tokensInLine: Token[] = [];

        while ((match = optionRegex.exec(text)) !== null) {
            // Found an option label like " (A) " or Start of line "(A) "
            // Group 2 is Paren Format, Group 4 is Dot Format
            const label = match[2] || match[4];
            const startIndex = match.index;
            const fullMatch = match[0];

            // Text BEFORE this option?
            if (startIndex > lastIndex) {
                const preText = text.substring(lastIndex, startIndex).trim();
                if (preText) {
                    tokensInLine.push(this.makeToken(TokenType.TEXT, preText, rawLine));
                }
            }

            tokensInLine.push(this.makeToken(TokenType.OPTION_LABEL, label, rawLine));
            lastIndex = startIndex + fullMatch.length;
        }

        // Text AFTER last option (or if no options found, the whole text)
        if (lastIndex < text.length) {
            const postText = text.substring(lastIndex).trim();
            if (postText) {
                tokensInLine.push(this.makeToken(TokenType.TEXT, postText, rawLine));
            }
        }

        // Push all found
        this.tokens.push(...tokensInLine);
    }

    private makeToken(type: TokenType, value: string, raw: string): Token {
        return {
            type,
            value: value.trim(),
            line: this.currentLine,
            raw
        };
    }
}
