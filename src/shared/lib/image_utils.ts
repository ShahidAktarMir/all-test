
/**
 * Advanced Image Processing Utility for OCR
 * Implements commercial-grade algorithms: Otsu's Method, Median Filter, Projection Profiling.
 */
export class ImageProcessor {

    /**
     * Converts image to Grayscale using Luma formula (Rec. 601).
     * Modifies data in-place.
     */
    static toGrayscale(data: Uint8ClampedArray) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114);
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }

    /**
     * Calculates the optimal threshold using Otsu's Method.
     * Minimizes intra-class variance = Maximizes inter-class variance.
     */
    static getOtsuThreshold(data: Uint8ClampedArray): number {
        const histogram = new Array(256).fill(0);
        let total = 0;

        // Build Histogram
        for (let i = 0; i < data.length; i += 4) {
            histogram[data[i]]++; // Assume grayscale
            total++;
        }

        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVar = 0;
        let threshold = 0;

        for (let t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;

            sumB += t * histogram[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;

            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > maxVar) {
                maxVar = varBetween;
                threshold = t;
            }
        }

        return threshold;
    }

    /**
     * Binarizes the image using a specific threshold.
     */
    static binarize(data: Uint8ClampedArray, threshold: number) {
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i] > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }
    }

    /**
     * Applies a 3x3 Median Filter to remove salt-and-pepper noise.
     * Expensive O(N) operation but critical for scanned documents.
     */
    static applyMedianFilter(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
        const copy = new Uint8ClampedArray(data);

        // Window offsets for 3x3
        const offsets = [
            -width - 1, -width, -width + 1,
            -1, 0, 1,
            width - 1, width, width + 1
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const centerIdx = (y * width + x) * 4;
                const window: number[] = [];

                // Collect 3x3 neighborhood intensity
                for (const offset of offsets) {
                    window.push(copy[centerIdx + (offset * 4)]);
                }

                // Sort and pick median (5th element)
                window.sort((a, b) => a - b);
                const median = window[4];

                data[centerIdx] = median;
                data[centerIdx + 1] = median;
                data[centerIdx + 2] = median;
            }
        }
        return data;
    }

    /**
     * Detects Skew Angle using Horizontal Projection Profile magnitude variance.
     * Sweeps from -5 to +5 degrees.
     * @returns Angle in degrees
     */
    static detectSkew(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): number {
        // We need a reduced resolution copy for speed
        // Scale down significantly. Analysis at 200-300px width is sufficient for skew.
        const targetWidth = 300;
        const scale = width > targetWidth ? targetWidth / width : 1.0;
        const smallW = Math.floor(width * scale);
        const smallH = Math.floor(height * scale);

        // This is pseudo-logic because we can't easily draw scaled on OffscreenCanvas without creating another one
        // For simplicity/performance in JS Worker, let's use the provided data directly but skip pixels.
        // Actually, creating a small internal canvas is better.

        const smallC = new OffscreenCanvas(smallW, smallH);
        const smallCtx = smallC.getContext('2d');
        if (!smallCtx) return 0;

        smallCtx.drawImage(ctx.canvas, 0, 0, smallW, smallH);


        let maxVariance = 0;
        let bestAngle = 0;

        // Optimization: Binarize first for sharp edges
        // (Assuming input is already grayscale or raw)
        // Let's assume input to detectSkew is roughly processed or raw. Skew detection works best on edges.

        // Sweep angles
        for (let angle = -5; angle <= 5; angle += 0.5) {
            if (angle === 0) continue; // Skip 0 for now, check later or compare

            // To simulate rotation, we map pixels. This is expensive in JS loop.
            // A faster way is: Use the context!
            // But we are in a worker. 
            // Better Approach: Rotate the small canvas, get projection profile.

            // Clean slate
            smallCtx.save();
            smallCtx.fillStyle = 'white';
            smallCtx.fillRect(0, 0, smallW, smallH);

            smallCtx.translate(smallW / 2, smallH / 2);
            smallCtx.rotate(angle * Math.PI / 180);
            smallCtx.translate(-smallW / 2, -smallH / 2);
            smallCtx.drawImage(ctx.canvas, 0, 0, smallW, smallH);
            smallCtx.restore();

            const profile = this.getProjectionProfile(smallCtx, smallW, smallH);
            const variance = this.calculateVariance(profile);

            if (variance > maxVariance) {
                maxVariance = variance;
                bestAngle = angle;
            }
        }

        return bestAngle;
    }

    private static getProjectionProfile(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number): number[] {
        const data = ctx.getImageData(0, 0, w, h).data;
        const profile = new Array(h).fill(0);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                // If pixel is black (text)
                if (data[(y * w + x) * 4] < 128) {
                    profile[y]++;
                }
            }
        }
        return profile;
    }

    private static calculateVariance(arr: number[]): number {
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < arr.length; i++) {
            sum += arr[i];
            sumSq += arr[i] * arr[i];
        }
        const mean = sum / arr.length;
        return (sumSq / arr.length) - (mean * mean);
    }
    /**
     * Calculates the Vertical Projection Profile (Sum of pixels per column).
     * Used for detecting gutters (gaps) between columns.
     */
    static getVerticalProjectionProfile(data: Uint8ClampedArray, width: number, height: number): number[] {
        const profile = new Array(width).fill(0);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                // If pixel is black (text) -> count it
                // Assuming image is binarized (0 or 255)
                if (data[idx] === 0) {
                    profile[x]++;
                }
            }
        }
        return profile;
    }

    /**
     * Analyzes standard page layout to detect columns.
     * Returns an array of bounding boxes (Regions of Interest) to OCR sequentially.
     */
    static detectLayout(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): { x: number, y: number, w: number, h: number }[] {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. Get Vertical Profile
        const profile = this.getVerticalProjectionProfile(data, width, height);

        // 2. Analyze Profile for Central Gutter
        // We look for a gap in the middle 50% of the page
        const searchStart = Math.floor(width * 0.25);
        const searchEnd = Math.floor(width * 0.75);
        const minGutterWidth = 20; // 20px gap minimum

        let maxGapWidth = 0;
        let gapStart = -1;
        let currentGapStart = -1;

        // Simple run-length algorithm for white space (0 count in profile)
        // Note: Profile counts BLACK pixels. So 0 means whitespace.
        // Noise tolerance: allow < 5 pixels (specks)
        const noiseFloor = 5;

        for (let x = searchStart; x < searchEnd; x++) {
            if (profile[x] <= noiseFloor) {
                if (currentGapStart === -1) currentGapStart = x;
            } else {
                if (currentGapStart !== -1) {
                    const gapWidth = x - currentGapStart;
                    if (gapWidth > maxGapWidth) {
                        maxGapWidth = gapWidth;
                        gapStart = currentGapStart;
                    }
                    currentGapStart = -1;
                }
            }
        }

        // Check trailing gap
        if (currentGapStart !== -1) {
            const gapWidth = searchEnd - currentGapStart;
            if (gapWidth > maxGapWidth) {
                maxGapWidth = gapWidth;
                gapStart = currentGapStart;
            }
        }

        // 3. Decision: Split or Not?
        if (maxGapWidth >= minGutterWidth && gapStart !== -1) {
            const splitX = Math.floor(gapStart + maxGapWidth / 2);
            // Return 2 columns
            return [
                { x: 0, y: 0, w: splitX, h: height },            // Left Column
                { x: splitX, y: 0, w: width - splitX, h: height } // Right Column
            ];
        }

        // Default: Single Column
        return [{ x: 0, y: 0, w: width, h: height }];
    }
}
