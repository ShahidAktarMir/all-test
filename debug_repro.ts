
import { ParsingEngine } from './src/shared/lib/utils';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const filePath = path.join(process.cwd(), 'test_repro_batch.txt');
    const rawText = fs.readFileSync(filePath, 'utf-8');

    console.log("Input loaded from:", filePath);
    const result = await ParsingEngine.parse(rawText);
    console.log("Parsed Result:", JSON.stringify(result, null, 2));
}

run();
