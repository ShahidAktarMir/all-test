
import { ParsingEngine } from './src/shared/lib/utils';

async function run() {
    const rawText = `Q3. [TOPIC: PUZZLE - Box + Variable]
8 Boxes (A-H) are arranged vertically.`;

    console.log("Input:", rawText);
    const result = await ParsingEngine.parse(rawText);
    console.log("Parsed:", JSON.stringify(result, null, 2));
}

run();
