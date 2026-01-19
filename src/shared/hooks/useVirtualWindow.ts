import { useState, useMemo } from 'react';

// --- ADVANCED VIRTUALIZATION KERNEL ---
// "Infinite Scroll" is naive. "Virtual Windowing" is architectural mastery.
// This hook calculates the visible viewport and renders ONLY the DOM nodes required.
// Time Complexity: O(1) for rendering, regardless of N items.

interface VirtualOptions {
    itemHeight: number;
    overscan?: number; // How many items to render outside the viewport for smoothness
    containerHeight: number;
}

export function useVirtualWindow<T>(items: T[], options: VirtualOptions) {
    const { itemHeight, overscan = 3, containerHeight } = options;
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate effective range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const renderCount = Math.ceil(containerHeight / itemHeight) + (2 * overscan);
    const endIndex = Math.min(items.length, startIndex + renderCount);

    // Create the virtual slice
    const virtualItems = useMemo(() => {
        return items.slice(startIndex, endIndex).map((item, index) => ({
            item,
            index: startIndex + index,
            offsetTop: (startIndex + index) * itemHeight
        }));
    }, [items, startIndex, endIndex, itemHeight]);

    // Total phantom height to ensure scrollbar remains accurate
    const totalHeight = items.length * itemHeight;

    return {
        virtualItems,
        totalHeight,
        onScroll: (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop),
        startIndex,
        endIndex
    };
}
