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

    it('should parse Rapid Fire linear questions and generate options', async () => {
        const rawText = `
        Q61. What is the unit of power of a lens? -> Dioptre.
        Q62. Which instrument measures blood pressure? -> Sphygmomanometer.
        Q63. What kind of energy is stored in a dry cell? -> Chemical Energy.
        Q64. Sound travels fastest in? -> Steel (Solids).
        `;

        const result = await ParsingEngine.parse(rawText);
        expect(result).toHaveLength(4);

        // Verify Question 1
        const q1 = result.find(q => q.question.includes("unit of power"));
        expect(q1).toBeDefined();
        if (q1) {
            expect(q1.options).toHaveLength(4);
            expect(q1.options).toContain("Dioptre."); // Note: cleaning might affect trailing dot
            // Check that options are generated from others
            expect(q1.options).toEqual(expect.arrayContaining(["Sphygmomanometer.", "Chemical Energy.", "Steel (Solids)."]));

            const correctOpt = q1.options[q1.correctAnswer];
            expect(correctOpt).toBe("Dioptre.");
        }
    });
});

// ------------------------------------------------------------------
// NEW FORMATS SUPPORT - PHASE 2 (Critical Reasoning, Puzzles, etc.)
// ------------------------------------------------------------------

it('should parse Critical Reasoning questions with Statement and Course of Action', async () => {
    const rawText = `Q4. [TOPIC: CRITICAL REASONING - Course of Action]
Statement: A severe collision occurred between two trains...
due to the failure of the automatic signaling system.

Courses of Action:
I. The Railway Minister should immediately resign...
II. A high-level technical committee should be constituted...
III. All train operations should be suspended...

A) Only II follows
B) Only I and II follow
C) Only II and III follow
D) All follow

[CORRECT ANSWER]: A) Only II follows
[THE "TRAP" EXPLANATION]:
Option I is the "Emotional Trap". In reality, ministers resign...`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("CRITICAL REASONING - Course of Action");
    expect(result[0].question).toContain("Statement: A severe collision");
    expect(result[0].question).toContain("Courses of Action:");
    expect(result[0].question).toContain("III. All train operations should be suspended");
    expect(result[0].correctAnswer).toBe(0); // A
    // Note: Explanation might have newline before the text due to multi-line parsing logic
    expect(result[0].explanation).toContain('**THE "TRAP" EXPLANATION**:');
    expect(result[0].explanation).toContain("Option I is the \"Emotional Trap\"");
});

it('should parse Science question with [CORRECT ANSWER]: B) Format', async () => {
    const rawText = `Q7. [TOPIC: SCIENCE - Periodic Table Trends]
In the Modern Periodic Table... which of the following properties DECREASES?

A) Atomic Radius
B) Electronegativity
C) Density
D) Boiling Point

[CORRECT ANSWER]: B) Electronegativity
[THE "TRAP" EXPLANATION]:
Visualizing the table: F, Cl, Br, I.
Size increases...`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("SCIENCE - Periodic Table Trends");
    expect(result[0].correctAnswer).toBe(1); // B
    expect(result[0].explanation).toContain("Size increases");
});

it('should parse Art & Culture with Trap Explanation', async () => {
    const rawText = `Q5. [TOPIC: ART & CULTURE - The 'Gharana' Killer]
Pandit Bhimsen Joshi... awarded the Bharat Ratna?

A) Kirana Gharana, 2008
B) Gwalior Gharana, 2009
C) Kirana Gharana, 2009
D) Banaras Gharana, 2008

[CORRECT ANSWER]: A) Kirana Gharana, 2008
[THE "TRAP" EXPLANATION]:
Double Data Point Trap.
Everyone knows Bhimsen Joshi = Kirana Gharana.`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("ART & CULTURE - The 'Gharana' Killer");
    expect(result[0].correctAnswer).toBe(0); // A
    expect(result[0].explanation).toContain("Double Data Point Trap");
});

it('should parse Puzzle with Numbered Conditions', async () => {
    const rawText = `Q3. [TOPIC: PUZZLE - Box + Variable]
8 Boxes (A-H) are arranged vertically. Each contains a different fruit.
1. Three boxes between A and Mango.
2. H is immediately below Mango.
3. Two boxes between H and Apple.
4. C is immediately above Apple.
5. C does not contain Mango.
6. Number of boxes above C is same as below G (G contains Guava).
7. F is just above D.
Which box is at the bottom?

A) B
B) E
C) D
D) Cannot be determined

[CORRECT ANSWER]: C) D
[THE "TRAP" EXPLANATION]:
The "Immediate Neighbor" Cascade.`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].topic).toContain("PUZZLE - Box + Variable");
    // Ensure "1. Three boxes..." is part of the QUESTION, not treated as a new Q
    expect(result[0].question).toContain("1. Three boxes between A and Mango.");
    expect(result[0].question).toContain("7. F is just above D.");
    expect(result[0].options).toHaveLength(4);
    expect(result[0].correctAnswer).toBe(2); // C
    expect(result[0].options).toHaveLength(4);
    expect(result[0].correctAnswer).toBe(2); // C
});

it('should parse Hacked Question Format with ### separator', async () => {
    const rawText = `###
Q10. [The Hacked Question Text]
A) Option A
B) Option B
C) Option C
D) Option D
Correct Answer: B
Explanation: [ALGORITHM REVEAL]: "Based on [Source Name], this [VAR_TOPIC] question..."
###
Q11. Next Question for Hacked Format
A) Yes
B) No
C) Maybe
D) Never
Correct Answer: A
Explanation: This is the second question.`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(2); // Should flush on ### and Q11

    // Check first question
    expect(result[0].question).toContain("Hacked Question Text");
    expect(result[0].correctAnswer).toBe(1); // B
    expect(result[0].explanation).toContain('**ALGORITHM REVEAL**: "Based on [Source Name]');

    // Check second question (Q11)
    expect(result[1].question).toContain("Next Question for Hacked Format");
    expect(result[1].options).toEqual(["Yes", "No", "Maybe", "Never"]);
    expect(result[1].correctAnswer).toBe(0); // A
    expect(result[1].explanation).toContain("This is the second question.");
});

it('should parse Math Question with Source-Backed Logic', async () => {
    const rawText = `Q41. A train covers a distance...
A) 3 km/h more
B) 4 km/h less
C) 3 km/h less
D) 4 km/h more
Correct Answer: A
Explanation: [SOURCE-BACKED LOGIC]: Calculation Intensive Math from 'RRB_NTPC_...'
Total Time = 2 days...
Since 67 > 64...`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].question).toContain("A train covers a distance");
    expect(result[0].correctAnswer).toBe(0); // A
    expect(result[0].explanation).toContain("**SOURCE-BACKED LOGIC**: Calculation Intensive Math");
    expect(result[0].explanation).toContain("Since 67 > 64");
});

it('should dynamically parse Unknown/Custom tags', async () => {
    const rawText = `Q99. Dynamic Test?
A) Yes
B) No
Correct Answer: A
Explanation: [SUPER AI ANALYSIS]: This tag does not exist in code.
[CUSTOM METADATA]: Another dynamic field.`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].explanation).toContain("**SUPER AI ANALYSIS**: This tag does not exist in code.");
    expect(result[0].explanation).toContain("**CUSTOM METADATA**: Another dynamic field.");
});

it('should parse Sequence Question with numbered list and multi-line Explanation tag', async () => {
    const rawText = `###
Q20. Select the option that represents the correct order...
1. Hacking
2. Haggle
3. Habitat
4. Handle
5. Hamper
A) 3, 1, 2, 5, 4
B) 3, 1, 2, 4, 5
C) 3, 2, 1, 5, 4
D) 1, 3, 2, 5, 4
Correct Answer: A
Explanation: [SOURCE-BACKED LOGIC: Screening question from 'RRB_NTPC...'.
Order:
Ha-b (Habitat) -> 3
Ha-c (Hacking) -> 1
Sequence: 3, 1, 2, 5, 4.
This guarantees 1 mark but requires 15 seconds of focus.]`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    // Verify question includes the list
    expect(result[0].question).toContain("1. Hacking");
    expect(result[0].question).toContain("5. Hamper");
    // Verify output
    expect(result[0].correctAnswer).toBe(0); // A
    // Verify explanation formatting
    expect(result[0].explanation).toContain("**SOURCE-BACKED LOGIC**: Screening question");
    expect(result[0].explanation).toContain("Ha-b (Habitat) -> 3");
    // Check if trailing ']' is handled (it might be present currently, let's see)
    // For now, simple check.
    expect(result[0].explanation).toContain("15 seconds of focus");
});

it('should parse Schedule Puzzle with multi-line explanation and trailing bracket', async () => {
    const rawText = `Q69. Each of C, D, E, F, S, T, and U has an exam on a different day...
A) 0
B) 1
C) 2
D) 3
Correct Answer: A
Explanation: [SOURCE-BACKED LOGIC: Schedule Puzzle from 'RRB_NTPC...Shift-II'.
1. F = Thursday.
2. T is after F...
...
If Option A is 0... I will set the answer to 3 (Option D).]`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(1);
    expect(result[0].question).toContain("Each of C, D, E");
    expect(result[0].correctAnswer).toBe(0); // A

    // Check dynamic tag formatting
    expect(result[0].explanation).toContain("**SOURCE-BACKED LOGIC**: Schedule Puzzle");
    expect(result[0].explanation).toContain("1. F = Thursday.");

    // Check if trailing bracket allows cleanly (it is acceptable if present, but "super perfect" might imply removal)
    // For now, let's just assert the content is there.
    expect(result[0].explanation).toContain("I will set the answer to 3");
});

it('should pass the Mega Stress Test: Auto-detect mixed formats in one stream', async () => {
    const rawText = `Q1. Standard Question?
A) Yes
B) No
Correct Answer: A
Explanation: [BASIC]: Simple.

###
Q2. Hacked Format Question
1. List Item
A) A
B) B
Correct Answer: B
Explanation: [ALGORITHM REVEAL]: Secret.

Q3. Puzzle Question (Box based)
1. Box A is above B.
2. Box C is below.
A) Option 1
B) Option 2
Correct Answer: A
Explanation: [SOURCE-BACKED LOGIC]: Complex logic.
Step 1: A > B.

Q4. Math Question
equation: 2 + 2 = 4
A) 4
B) 5
Correct Answer: A
Explanation: [MATH LOGIC]: Calculation.`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(4);

    // Q1: Standard
    expect(result[0].id).toBe(1);
    expect(result[0].question).toContain("Standard Question");
    expect(result[0].explanation).toContain("**BASIC**: Simple");

    // Q2: Hacked
    expect(result[1].question).toContain("Hacked Format Question");
    expect(result[1].question).toContain("1. List Item");
    expect(result[1].explanation).toContain("**ALGORITHM REVEAL**: Secret");

    // Q3: Puzzle
    expect(result[2].question).toContain("Puzzle Question");
    expect(result[2].question).toContain("1. Box A is above B");
    expect(result[2].explanation).toContain("**SOURCE-BACKED LOGIC**: Complex logic");

    // Q4: Math
    expect(result[3].question).toContain("Math Question");
    expect(result[3].question).toContain("equation: 2 + 2 = 4");
    expect(result[3].explanation).toContain("**MATH LOGIC**: Calculation");
});

it('should parse Q69 -> Q70 sequence from user image with ### separators', async () => {
    const rawText = `###
Q69. Each of C, D, E, F, S, T, and U has an exam on a different day...
A) 0
B) 1
C) 2
D) 3
Correct Answer: A
Explanation: [SOURCE-BACKED LOGIC: Schedule Puzzle from 'RRB_NTPC...'.
1. F = Thursday.
...
If Option A is 0... I will set the answer to 3 (Option D).]

###
Q70. Who won the 2025 Asian Snooker Championship men's title?
A) Pankaj Advani
B) Habib Shalaby
C) Amir Sarkhosh
D) Ishpreet Singh Chadha
Correct Answer: B
Explanation: [SOURCE-BACKED LOGIC: Sports Award from 'RRB_NTPC...'.
While Pankaj Advani is the usual Indian favorite... specific "Winner vs Runner-up" trap.]
###`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(2); // Should have 2 questions

    // Check Q69
    expect(result[0].question).toContain("Each of C, D, E");
    expect(result[0].correctAnswer).toBe(0); // A
    expect(result[0].explanation).toContain("**SOURCE-BACKED LOGIC**: Schedule Puzzle");
    expect(result[0].explanation).toContain("I will set the answer to 3");

    // Check Q70
    expect(result[1].question).toContain("Who won the 2025 Asian Snooker");
    expect(result[1].correctAnswer).toBe(1); // B
    expect(result[1].explanation).toContain("**SOURCE-BACKED LOGIC**: Sports Award");
    expect(result[1].explanation).toContain("Winner vs Runner-up");
});

it('should parse Bracketed Hacked Format (Q[N], [Options]) correctly', async () => {
    const rawText = `Q1. [The Hacked Question Text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: A
###
###
Q2. [Next Question...]
A) Option A
B) Option B
Correct Answer: A
###`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(2);

    // Q1
    expect(result[0].id).toBe(1);
    expect(result[0].question).toContain("[The Hacked Question Text]");
    expect(result[0].options).toEqual(["[Option A]", "[Option B]", "[Option C]", "[Option D]"]);
    expect(result[0].correctAnswer).toBe(0); // A

    // Q2
    expect(result[1].question).toContain("[Next Question...]");
});

it('should parse Math Question Sequence (Sphere, SD, CI) from user image', async () => {
    const rawText = `Q1. A solid metallic sphere of radius 15 cm is melted and recast into a frustum of a cone...
A) 15 cm
B) 10 cm
C) 5 cm
D) 25 cm
Correct Answer: C
###
Q2. Find the standard deviation of the mode and median of the following data set: 8, 10, 15, 8, 12, 10, 8, 12, 10, 8.
A) 0
B) 1
C) 2
D) 1.5
Correct Answer: B
###
Q3. A sum of ₹18,000 is invested at 16% p.a. compound interest...
A) ₹3,845
B) ₹3,782
C) ₹3,640
D) ₹3,105
Correct Answer: A`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(3);

    // Q1
    expect(result[0].question).toContain("solid metallic sphere");
    expect(result[0].correctAnswer).toBe(2); // C

    // Q2
    expect(result[1].question).toContain("standard deviation");
    expect(result[1].question).toContain("8, 10, 15");
    expect(result[1].correctAnswer).toBe(1); // B

    // Q3
    expect(result[2].question).toContain("₹18,000");
    expect(result[2].question).toContain("16% p.a.");
    expect(result[2].options).toContain("₹3,845");
    expect(result[2].correctAnswer).toBe(0); // A
});

it('should parse Algebra & Geometry Sequence (Coordinates, Train, Polynomials) from user image', async () => {
    const rawText = `###
Q4. The coordinates of the vertices of a triangle are (a, b + c), (b, c + a), and (c, a + b). What is the area of this triangle?
A) a + b + c
B) abc
C) 0
D) 1/2 (ab + bc + ca)
Correct Answer: C
###
Q5. A train covers a distance of 3584 km in 2 days and 8 hours...
A) 3 km/h more
B) 3 km/h less
C) 4 km/h more
D) 5 km/h less
Correct Answer: A
###
Q6. If x + 1/x = 5, then find the value of (x⁴ + 1/x²) / (x² - 3x + 1).
A) 55
B) 27.5
C) 110
D) 52.5
Correct Answer: A`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(3);

    // Q4: Coordinates
    expect(result[0].question).toContain("vertices of a triangle are (a, b + c)");
    expect(result[0].options).toContain("1/2 (ab + bc + ca)");
    expect(result[0].correctAnswer).toBe(2); // C

    // Q5: Train
    expect(result[1].question).toContain("3584 km in 2 days");
    expect(result[1].correctAnswer).toBe(0); // A

    // Q6: Algebra
    // Note: The parser reads raw text. If user inputs x⁴, it reads x⁴.
    expect(result[2].question).toContain("x + 1/x = 5");
    expect(result[2].question).toContain("(x⁴ + 1/x²)");
    expect(result[2].correctAnswer).toBe(0); // A
});

it('should parse "Sources" field in Hacked Format correctly (appended to explanation)', async () => {
    const rawText = `Q1. [The Hacked Question Text]
A) [Option A]
B) [Option B]
Correct Answer: A
Sources: [Cite the specific uploaded file/Year/Pattern origin]
###
###
Q2. [Next Question...]
A) Opt 1
B) Opt 2
Correct Answer: A
###`;

    const result = await ParsingEngine.parse(rawText);
    expect(result).toHaveLength(2);

    // Q1
    expect(result[0].question).toContain("[The Hacked Question Text]");
    expect(result[0].correctAnswer).toBe(0); // A
    // Verify Sources is captured in explanation
    expect(result[0].explanation).toContain("**SOURCES**: [Cite the specific uploaded file");

    // Q2
    expect(result[1].question).toContain("[Next Question...]");
});

