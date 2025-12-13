import { describe, it, expect } from 'vitest';
import { ParsingEngine } from './utils';

describe('ParsingEngine', () => {
    // ------------------------------------------------------------------
    // SENIOR DEV PRACTICE: Edge Case Testing & Defensive Coding
    // ------------------------------------------------------------------

    it('should correctly parse a standard question block', async () => {
        const rawText = `Q1. The capital of France is?
        A) London
        B) Paris
        C) Berlin
        D) Madrid
        Correct Answer: B
        Explanation: Paris is the capital.`;

        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(1);
        expect(result[0].question.trim()).toBe("The capital of France is?");
        expect(result[0].correctAnswer).toBe(1); // B is index 1
        expect(result[0].options).toHaveLength(4);
    });

    it('should handle unstructured/malformed spacing gracefully', async () => {
        const rawText = `
        Q1:    What   is 2+2?
        A. 3
          B) 4
        C.   5
         D 6
        Correct Answer:   B
        `;
        // Note: Our regex is strict on format, so mixed formats might fail without updates.
        // This test documents expected behavior.
        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(1);
        expect(result[0].question).toContain("What   is 2+2?");
        expect(result[0].correctAnswer).toBe(1);
    });

    it('should ignore blocks without enough options', async () => {
        const rawText = `Q1. Invalid Question
        A) One option only
        Correct Answer: A`;
        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(0);
    });

    it('should try parsing JSON first', async () => {
        const json = JSON.stringify([{ id: 1, question: "Test", options: ["A", "B"], correctAnswer: 0 }]);
        const result = await ParsingEngine.parse(json);
        expect(result).toHaveLength(1);
        expect(result[0].question).toBe("Test");
    });
});
