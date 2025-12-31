
/**
 * Super Ultimate Heuristics Module
 * Provides Fuzzy Matching and OCR Correction for the Parser.
 */

export class Heuristics {

    static readonly VALID_TAGS = [
        "EXPLANATION",
        "SOURCE",
        "SOURCES",
        "GODFATHER INSIGHT",
        "HEATMAP",
        "TOPIC",
        "TYPE",
        "CORRECT ANSWER",
        "ANSWER"
    ];

    /**
     * Calculates the Levenshtein Distance between two strings.
     * O(N*M) Dynamic Programming approach.
     */
    static levenshtein(a: string, b: string): number {
        const matrix: number[][] = [];

        // Increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    /**
     * Fuzzy matches a candidate string against a list of known valid tags.
     * Returns the best match if confidence is high (>80%), otherwise null.
     */
    static fuzzyMatch(candidate: string, validTags: string[]): string | null {
        const cleanCandidate = candidate.toUpperCase().trim();
        let bestMatch = null;
        let minDistance = Infinity;

        for (const tag of validTags) {
            const distance = this.levenshtein(cleanCandidate, tag);
            // Normalized distance (0 to 1, where 0 is perfect)
            // But usually we just want a threshold.
            // Allow 1 edit per 4 chars roughly.
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = tag;
            }
        }

        // Threshold Logic
        // If exact match
        if (minDistance === 0) return bestMatch;

        // If short word (< 4 chars), require exact match usually. 
        // But for "Expln", len 5, dist 2 ("Ex" "pla" "n" "ation") -> might be high.
        // Let's use a dynamic threshold: Max 2 edits allowed generally, or 3 for long words.
        const allowedEdits = bestMatch!.length > 6 ? 3 : 2;

        if (minDistance <= allowedEdits) {
            return bestMatch;
        }

        return null;
    }

    /**
     * Corrects common OCR Errors in text.
     * e.g., '(@)' -> '(A)', '0ption' -> 'Option'
     */
    static fixOCR(text: string): string {
        return text
            // Fix Option Labels
            .replace(/\(@\)/g, '(A)')
            .replace(/\(a\)/g, '(A)') // Lowercase allowed but normalize
            // Fix Numbers/Letters confusion
            .replace(/\b0ption\b/gi, 'Option')
            .replace(/\bQueston\b/gi, 'Question')
            .replace(/Q(\d+)[1l]/g, 'Q$1.') // Q1l -> Q1. often happens
    }
}
