import type { ParsedQuestion } from '../../types';

/**
 * Strategy Interface for Parsing Algorithms.
 * Allows interchangeable parsing logic (JSON, Lexical, Heuristic).
 */
export interface ParsingStrategy {
    /**
     * Determines if this strategy is suitable for the given input.
     * @param text Raw input text
     */
    canParse(text: string): boolean;

    /**
     * Executes the parsing logic.
     * @param text Raw input text
     */
    parse(text: string): Promise<ParsedQuestion[]>;
}
