
import { ParsingEngineV2 } from './parser_machine';
import { ParsingEngine } from './utils';

const sampleText = `
Q251. Match the following digestive enzymes with their respective substrates:
| Column A (Enzyme) | Column B (Substrate) |
| --- | --- |
| 1. Ptyalin | a. Proteins |
| 2. Pepsin | b. Fats |
| 3. Lipase | c. Starch |
| 4. Trypsin | d. Emulsified Fats |

Select the correct option:
A) 1-c, 2-a, 3-b, 4-d
B) 1-c, 2-a, 3-d, 4-a
C) 1-a, 2-c, 3-b, 4-d
D) 1-b, 2-a, 3-c, 4-d
Correct Answer: B
**[GODFATHER INSIGHT]:**
* Ptyalin (Salivary Amylase) -> Starch.
* Pepsin (Stomach) -> Proteins.
* Lipase (Pancreas) -> Emulsified Fats.
* Trypsin (Pancreas) -> Proteins.
**[HEATMAP]:** [Diff: 6/10] | [Avg Time: 25s] | [Type: MATCH THE COLUMN]
**[SOURCE]:** [Exam: SSC CGL Mains 2022]

###
Q252. Consider the following statements regarding the Liver:
1. It is the largest gland in the human body.
2. It secretes bile which contains digestive enzymes.
3. It stores glucose in the form of glycogen.
Which of the statements given above is/are correct?
A) 1 and 2 only
B) 1 and 3 only
C) 2 and 3 only
D) 1, 2 and 3
Correct Answer: B
**[GODFATHER INSIGHT]:** Statement 2 is the trap. Bile *contains NO enzymes*. It only contains bile salts and pigments.
**[HEATMAP]:** [Diff: 7/10] | [Avg Time: 20s] | [Type: STATEMENT TRAP]
**[SOURCE]:** [Exam: UPSC/SSC CGL]
`;

async function runVerification() {
    console.log("--- Starting ParsingEngineV2 Verification ---");

    const parsed = await ParsingEngineV2.parse(sampleText);
    console.log(`Parsed ${parsed.length} questions.`);

    // Check Question 1 (Table & Multi-line Insight)
    const q1 = parsed[0];
    console.log("\nQ1 Table Detection:");
    if (q1.question.includes("| Column A (Enzyme) |")) {
        console.log("SUCCESS: Table found in question text.");
    } else {
        console.log("FAILURE: Table missing.");
    }

    console.log("\nQ1 Multi-line Insight:");
    if (q1.godfatherInsight?.includes("* Ptyalin") && q1.godfatherInsight?.includes("* Trypsin")) {
        console.log("SUCCESS: Insight captured multiple lines.");
    } else {
        console.log("FAILURE: Insight truncated or missing.");
        console.log("Actual:", q1.godfatherInsight);
    }

    if (q1.source?.exam === "SSC CGL Mains" && q1.source?.year === "2022") {
        console.log("SUCCESS: Source parsed correctly.");
    } else {
        console.log("FAILURE: Source parsed incorrectly.", q1.source);
    }

    // Check Question 2 (Statements)
    const q2 = parsed[1];
    console.log("\nQ2 Statement Detection:");
    if (q2.question.includes("1. It is the largest") && q2.question.includes("3. It stores glucose")) {
        console.log("SUCCESS: Statements included in question text.");
    } else {
        console.log("FAILURE: Statements missing.");
        console.log("Actual Question:", q2.question);
    }
}

runVerification();
