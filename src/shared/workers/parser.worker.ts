
// Web Worker for Parsing
// Runs in a background thread to prevent UI freezing (Jank)
import { ParsingEngine } from '../lib/utils';

self.onmessage = async (e: MessageEvent) => {
    const { text } = e.data;

    if (!text) {
        self.postMessage({ status: 'error', error: 'No text provided' });
        return;
    }

    try {
        const questions = await ParsingEngine.parse(text);
        self.postMessage({ status: 'success', questions });
    } catch (err: unknown) {
        self.postMessage({
            status: 'error',
            error: err instanceof Error ? err.message : String(err)
        });
    }
};
