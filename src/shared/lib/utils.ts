import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Re-export Parsing Engine for non-worker usage if needed
export { ParsingEngine, type ParsedQuestion } from './parsing_engine';

/**
 * Utility to merge Tailwind classes conditionally.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
