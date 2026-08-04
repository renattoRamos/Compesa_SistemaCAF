import { NFProcessingResult } from "@/types/nf";
import { parseXMLInvoice } from "./xmlParser";
import { parsePDFInvoice } from "./pdfParser";
import { fetchCompanyByCNPJ, unformatCNPJ } from "@/lib/cnpj";

export async function processNFFile(
  file: File,
  signal?: AbortSignal
): Promise<NFProcessingResult> {
  const fileName = file.name.toLowerCase();
  const isPDF = fileName.endsWith(".pdf");
  const isXML = fileName.endsWith(".xml");

  if (!isPDF && !isXML) {
    return {
      success: false,
      documentType: "NF-e",
      extractedData: {},
      confidenceScores: {},
      missingFields: [],
      lowConfidenceFields: [],
      errorMessage: "Por favor, envie um arquivo fiscal válido no formato PDF (.pdf) ou XML (.xml).",
      hasText: false,
      usedOCR: false,
    };
  }

  let result: NFProcessingResult;

  if (isXML) {
    const text = await file.text();
    if (signal?.aborted) throw new Error("Processing cancelled");
    result = parseXMLInvoice(text);
  } else {
    result = await parsePDFInvoice(file);
    if (signal?.aborted) throw new Error("Processing cancelled");
  }

  // Automatic CNPJ Lookup complement if CNPJ was extracted
  if (result.success && result.extractedData.cnpjEmitente) {
    const rawCnpj = unformatCNPJ(result.extractedData.cnpjEmitente);
    if (rawCnpj.length === 14) {
      try {
        const companyData = await fetchCompanyByCNPJ(rawCnpj, signal);
        if (companyData?.razaoSocialName && !result.extractedData.razaoSocialEmitente) {
          result.extractedData.razaoSocialEmitente = companyData.razaoSocialName;
          result.confidenceScores.razaoSocialEmitente = "high";
        }
      } catch (e) {
        console.warn("CNPJ lookup complement notice:", e);
      }
    }
  }

  return result;
}
