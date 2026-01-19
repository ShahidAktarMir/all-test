
// ------------------------------------------------------------------
// TYPES (Exported for use in Store/Other files)
// ------------------------------------------------------------------
import type { ParsedQuestion } from './types';
import type { ParsingStrategy } from './compiler/strategies/types';
import { JsonStrategy } from './compiler/strategies/JsonStrategy';
import { LexicalStrategy } from './compiler/strategies/LexicalStrategy';

export type { ParsedQuestion }; // Re-export for compatibility


/**
 * Parsing Engine for Text-to-Question conversion.
 * V5: Robust, Multi-Format Support (JSON, CSV, RAPID FIRE, BLOCKS)
 */
export class ParsingEngine {

    static async parse(rawText: string): Promise<ParsedQuestion[]> {
        const strategies: ParsingStrategy[] = [
            new JsonStrategy(),
            new LexicalStrategy()
        ];

        // "Infinite Level" Context: Select the best strategy
        for (const strategy of strategies) {
            if (strategy.canParse(rawText)) {
                console.log(`[ParsingEngine] Strategy Selected: ${strategy.constructor.name}`);
                const results = await strategy.parse(rawText);
                if (results.length > 0) return results;
            }
        }

        // Fallback or Empty
        console.warn("[ParsingEngine] No valid strategy found. Returning empty set.");
        return [];
    }

    // Rapid Fire Logic moved to LexicalStrategy
}


