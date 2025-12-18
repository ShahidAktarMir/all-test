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

    // ------------------------------------------------------------------
    // NEW FORMATS SUPPORT
    // ------------------------------------------------------------------

    it('should parse bracketed answer keys [Correct Answer: A]', async () => {
        const rawText = `Q97. The "Hotri" priest recites:
        A) Rig Veda
        B) Sama Veda
        C) Yajur Veda
        D) Atharva Veda
        [Correct Answer: A]
        Explanation: The invoker.`;

        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(1);
        expect(result[0].correctAnswer).toBe(0); // A
        expect(result[0].explanation).toContain("The invoker");
    });

    it('should parse Error Detection with embedded options', async () => {
        const rawText = `Q97. Error Detection:
        "She orders (A) / as if she (B) / was my mother. (C) / No Error (D)"
        [Answer: C]
        Explanation: "As if" -> "Were".`;

        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(1);
        expect(result[0].question).toContain("She orders (A)");
        expect(result[0].options).toEqual(["(A)", "(B)", "(C)", "(D)"]);
        expect(result[0].correctAnswer).toBe(2); // C is 2
    });

    it('should parse Sentence Improvement questions', async () => {
        const rawText = `Q73. Sentence Improvement:
        "Hardly had I arrived than the phone rang."
        A) When
        B) Then
        C) While
        D) No Improvement
        [Answer: A]
        Explanation: Hardly/Scarcely takes "When".`;

        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(1);
        expect(result[0].correctAnswer).toBe(0); // A
        expect(result[0].question).toContain("Hardly had I arrived");
    });
});
