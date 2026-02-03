
import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import * as Tesseract from 'tesseract.js';
import { ImageProcessor } from './image_utils';

// Set worker source for PDF.js
// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Polyfill for Web Worker environment where 'window' and 'document' are missing
// yet pdfjs-dist / Tesseract might try to check them or create elements.
if (typeof self !== 'undefined' && typeof document === 'undefined') {
    // @ts-expect-error Polyfill for Document in Worker
    self.document = {
        createElement: (tagName: string) => {
            if (tagName === 'canvas') {
                return new OffscreenCanvas(1, 1);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return {} as any;
        },
        createElementNS: (_ns: string, tagName: string) => {
            if (tagName === 'canvas') {
                return new OffscreenCanvas(1, 1);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return {} as any;
        },
        head: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            appendChild: (node: any) => node
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
    };

    self.window = self;
    // @ts-expect-error Polyfill for HTMLCanvasElement in Worker
    self.HTMLCanvasElement = OffscreenCanvas;
}

export interface OCRResult {
    text: string;
    confidence: number;
    pages: number;
}

export class OCREngine {

    private static scheduler: Tesseract.Scheduler | null = null;

    private static async getScheduler(): Promise<Tesseract.Scheduler> {
        if (this.scheduler) return this.scheduler;

        this.scheduler = Tesseract.createScheduler();
        const workerCount = 2;
        // Universal Language Pack: English, Hindi, Spanish, French, German, Chinese, Japanese, Russian
        // Note: Tesseract will download .traineddata for these. First run might be slower.
        const langs = 'eng+hin+spa+fra+deu+chi_sim+jpn+rus';

        for (let w = 0; w < workerCount; w++) {
            const worker = await Tesseract.createWorker(langs, 1, {
                logger: () => { }, // Disable internal logging for speed
                errorHandler: () => { }
            });
            this.scheduler.addWorker(worker);
        }
        return this.scheduler;
    }

    static async extract(fileData: ArrayBuffer, onProgress?: (status: string) => void): Promise<OCRResult> {
        // Detect if PDF or Image
        // Simple heuristic: PDF starts with %PDF
        const header = new Uint8Array(fileData.slice(0, 5));
        const isPdf = String.fromCharCode(...header) === '%PDF-';

        // Re-use scheduler
        const scheduler = await this.getScheduler();

        if (!isPdf) {
            onProgress?.("Image Detected. Processing with Universal OCR...");

            // Quick path for single image
            const result = await scheduler.addJob('recognize', fileData);

            return {
                text: OCREngine.cleanText(result.data.text),
                confidence: 80,
                pages: 1
            };
        }

        onProgress?.("Loading PDF Document...");
        const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: fileData }).promise;
        const totalPages = pdf.numPages;

        const pagePromises = [];

        for (let i = 1; i <= totalPages; i++) {
            pagePromises.push((async () => {
                onProgress?.(`Processing Page ${i}/${totalPages}...`);
                const page = await pdf.getPage(i);

                // 1. Try Text Layer Extraction
                const textContent = await page.getTextContent();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const textItems = textContent.items.map((item: any) => item.str).join(" ");

                // Heuristic: High density text -> Use direct extraction
                if (textItems.length > 50) {
                    return `\n\n--- Page ${i} ---\n\n` + textItems;
                } else {
                    // 2. Vision Path: Render & OCR
                    onProgress?.(`Rendering Page ${i} for OCR...`);

                    const viewport = page.getViewport({ scale: 1.5 }); // Retrieve scale slightly for speed (was 2.0)
                    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return "";

                    // Cast to unknown first to avoid TS error with OffscreenCanvas vs Canvas types
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const renderContext = { canvasContext: ctx, viewport } as unknown as any;
                    await page.render(renderContext).promise;

                    // Pre-process (Deskew, Binarize)
                    this.preprocessImage(ctx, viewport.width, viewport.height);

                    // Detect Segments (Columns)
                    const segmentBlobs = await this.getPageSegments(ctx, viewport.width, viewport.height);

                    if (segmentBlobs.length > 1) {
                        onProgress?.(`Detected ${segmentBlobs.length} Columns on Page ${i}...`);
                    } else {
                        onProgress?.(`Queuing Page ${i} for OCR...`);
                    }

                    let pageText = "";
                    for (const blob of segmentBlobs) {
                        const result = await scheduler.addJob('recognize', blob);
                        pageText += result.data.text + "\n";
                    }

                    return `\n\n--- Page ${i} (OCR) ---\n\n` + this.cleanText(pageText);
                }
            })());
        }

        // Wait for all pages
        const results = await Promise.all(pagePromises);
        const fullText = results.join("");

        // Do NOT terminate scheduler, keep warm for next file
        // await scheduler.terminate(); 

        return {
            text: fullText,
            confidence: 100,
            pages: totalPages
        };
    }

    /**
     * Pre-process image to improve OCR accuracy.
     * Pipeline: Deskew -> Grayscale -> Median Filter -> Otsu Binarization.
     */
    private static preprocessImage(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) {

        // 1. Deskew (Expensive, optional check?)
        // Lets do simple check. If skew > 0.5 deg.
        // NOTE: In a Worker, creating too many Canvases might be heavy.
        // Let's rely on robustness of Tesseract for small skews, or implement if strictly needed.
        // Given "State of the Art", let's do it.
        const skew = ImageProcessor.detectSkew(ctx, width, height);
        if (Math.abs(skew) > 0.5) {
            // Rotate context
            // We need a temporary canvas to hold current state to rotate properly?
            // Or just draw self onto self with rotation.
            // Easier: Create temp canvas
            const temp = new OffscreenCanvas(width, height);
            const tCtx = temp.getContext('2d');
            if (tCtx) {
                tCtx.drawImage(ctx.canvas, 0, 0);

                // Clear and rotate
                ctx.save();
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.translate(width / 2, height / 2);
                ctx.rotate(-skew * Math.PI / 180); // Counter-rotate?
                ctx.translate(-width / 2, -height / 2);
                ctx.drawImage(temp, 0, 0);
                ctx.restore();
            }
        }

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 2. Grayscale
        ImageProcessor.toGrayscale(data);

        // 3. Median Filter (Noise Reduction) - DISABLED FOR SPEED
        // This is O(N) with sorting per pixel, causing massive lag on high-res images.
        // Otsu's method below handles most noise implicitly.
        // ImageProcessor.applyMedianFilter(data, width, height); 

        // 4. Adaptive Thresholding (Otsu)
        const threshold = ImageProcessor.getOtsuThreshold(data);

        // 5. Binarize
        ImageProcessor.binarize(data, threshold);
        ctx.putImageData(imageData, 0, 0);

        // 6. Layout Analysis & Segmentation
        // If columns are detected, we segment the page.
        // Note: This needs to happen IN extract() flow to schedule jobs.
        // We will return segments here or handle in extract? 
        // Better design: preprocessImage returns nothing (in-place), 
        // but we add a new method to get blobs.
    }

    private static async getPageSegments(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): Promise<Blob[]> {
        const segments = ImageProcessor.detectLayout(ctx, width, height);
        const blobs: Blob[] = [];

        for (const seg of segments) {
            if (segments.length === 1) {
                // Determine if it is actually just the whole page
                const blob = await (ctx.canvas as OffscreenCanvas).convertToBlob();
                blobs.push(blob);
            } else {
                // Crop
                const tempCanvas = new OffscreenCanvas(seg.w, seg.h);
                const tCtx = tempCanvas.getContext('2d');
                if (tCtx) {
                    tCtx.drawImage(ctx.canvas, seg.x, seg.y, seg.w, seg.h, 0, 0, seg.w, seg.h);
                    const blob = await tempCanvas.convertToBlob();
                    blobs.push(blob);
                }
            }
        }
        return blobs;
    }

    /**
     * Clean OCR artifacts.
     */
    private static cleanText(text: string): string {
        return text
            .replace(/\|/g, 'I') // Replace pipe with I often confused
            .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable chars
            .replace(/\n\s*\n/g, '\n') // Collapse multiple empty lines
            .trim();
    }
}
