import * as pdfjsLib from "pdfjs-dist";
import { NFProcessingResult } from "@/types/nf";
import { extractFieldsFromText } from "./fieldExtractor";
import { processDocumentWithOCR } from "./ocrService";

// Set worker source for pdfjs-dist ESM compatibility
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    const pdfVersion = pdfjsLib.version || "6.2.108";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
  }
}

export async function parsePDFInvoice(file: File): Promise<NFProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    let fullText = "";
    const numPages = pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    const trimmedText = fullText.trim();
    const hasSearchableText = trimmedText.length > 30;

    if (hasSearchableText) {
      // Direct text extraction successful
      const result = extractFieldsFromText(trimmedText);
      result.hasText = true;
      result.usedOCR = false;
      return result;
    } else {
      // Scanned PDF / Image PDF -> Trigger OCR fallback
      return await processDocumentWithOCR([], trimmedText);
    }
  } catch (error) {
    console.warn("PDF.js primary parser notice, attempting OCR fallback:", error);
    // If PDF parsing or worker fails, trigger OCR/fallback parser gracefully
    return await processDocumentWithOCR([], "");
  }
}
