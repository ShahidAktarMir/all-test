
import { ParsingEngine } from './src/shared/lib/utils';

async function run() {
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

    // Test Regex directly
    const firstLine = rawText.split('\n')[0];
    console.log("First Line:", `"${firstLine}"`);
    const regex = /\[TOPIC:\s*(.+?)\]/i;
    const match = firstLine.match(regex);
    console.log("Regex Match:", match);

    console.log("Input Length:", rawText.length);
    const result = await ParsingEngine.parse(rawText);
    console.log("Parsed Questions:", result.length);
    if (result.length > 0) {
        console.log("Topic:", `"${result[0].topic}"`);
        console.log("Topic Match:", result[0].topic === "PUZZLE - Box + Variable");
        console.log("Topic Contain Match:", result[0].topic?.includes("PUZZLE - Box + Variable"));
    }
}

run();
