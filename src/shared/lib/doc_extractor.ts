import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Universal Office Document Extractor
 * Handles DOCX and XLSX text extraction.
 */
export class DocumentExtractor {

    /**
     * Extracts raw text from a DOCX file ArrayBuffer using Mammoth.
     */
    static async extractDocx(arrayBuffer: ArrayBuffer): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            return result.value.trim(); // The raw text
        } catch (error) {
            console.error("DOCX Extraction Failed:", error);
            throw new Error("Failed to parse DOCX file.");
        }
    }

    /**
     * Extracts text from an Excel file (XLSX/XLS) ArrayBuffer using SheetJS.
     * Converts all sheets to CSV format and concatenates them.
     */
    static extractExcel(arrayBuffer: ArrayBuffer): string {
        try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            let fullText = "";

            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                // Convert to CSV text
                const csv = XLSX.utils.sheet_to_csv(sheet);
                fullText += `\n\n--- Sheet: ${sheetName} ---\n\n${csv}`;
            });

            return fullText.trim();
        } catch (error) {
            console.error("Excel Extraction Failed:", error);
            throw new Error("Failed to parse Excel file.");
        }
    }
}
