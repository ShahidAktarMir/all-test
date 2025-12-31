
// Web Worker for OCR & PDF Processing
import { OCREngine } from '../lib/ocr_engine';

self.onmessage = async (e: MessageEvent) => {
    const { fileBuffer } = e.data;

    if (!fileBuffer) {
        self.postMessage({ status: 'error', error: 'No data provided' });
        return;
    }

    try {
        const result = await OCREngine.extract(fileBuffer, (progress) => {
            self.postMessage({ status: 'progress', message: progress });
        });

        self.postMessage({ status: 'success', text: result.text });
    } catch (err: unknown) {
        self.postMessage({
            status: 'error',
            error: err instanceof Error ? err.message : String(err)
        });
    }
};
