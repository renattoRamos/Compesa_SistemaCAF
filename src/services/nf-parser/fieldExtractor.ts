import { ConfidenceScores, DocumentType, NFExtractedData, NFProcessingResult } from "@/types/nf";
import { formatCNPJ, unformatCNPJ, isValidCNPJ } from "@/lib/cnpj";
import { detectDocumentType } from "./documentDetector";
import { parseNFeAccessKey } from "./accessKeyParser";

export function extractFieldsFromText(
  text: string,
  forcedDocumentType?: DocumentType,
  isOCR: boolean = false
): NFProcessingResult {
  const data: NFExtractedData = {};
  const confidence: ConfidenceScores = {};

  const { documentType: detectedDocType, tipoNotaForm } = detectDocumentType(text);
  const documentType = forcedDocumentType || detectedDocType;
  data.tipoNotaForm = tipoNotaForm;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = text.replace(/\s+/g, " ");

  // 1. Chave de Acesso (44 digits or 50 digits) - Extraction & Offline Structuring
  let rawChaveDigits: string | undefined;

  // Search after "CHAVE DE ACESSO" (e.g. "CHAVE DE ACESSO DA NFS-E \n 260290212245510850001642600000000039 \n 26082478245020")
  const explicitChaveMatch = fullText.match(/(?:CHAVE DE ACESSO(?: DA NFS-E| DA NF-E)?|CHAVE DE ACESSO)\s*[:#.-]?\s*([\d\s.-]{40,75})/i);
  if (explicitChaveMatch && explicitChaveMatch[1]) {
    const candidateDigits = explicitChaveMatch[1].replace(/\D/g, "");
    if (candidateDigits.length >= 50) {
      rawChaveDigits = candidateDigits.substring(0, 50);
    } else if (candidateDigits.length >= 44) {
      rawChaveDigits = candidateDigits.substring(0, 44);
    }
  }

  if (!rawChaveDigits) {
    const chaveMatch =
      fullText.match(/\b(\d{50})\b/) ||
      fullText.match(/\b(\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4})\b/) ||
      fullText.match(/\b(\d{44})\b/) ||
      fullText.match(/NFe\s*(\d{44})/i);
    if (chaveMatch && chaveMatch[1]) {
      rawChaveDigits = chaveMatch[1].replace(/\s+/g, "");
    }
  }

  if (rawChaveDigits) {
    const parsedKey = parseNFeAccessKey(rawChaveDigits);

    if (parsedKey.isValid) {
      data.chaveAcesso = parsedKey.chave;
      confidence.chaveAcesso = "high";

      // Populate key-derived fields automatically
      if (parsedKey.cnpjEmitente) {
        data.cnpjEmitente = parsedKey.cnpjEmitente;
        confidence.cnpjEmitente = "high";
      }

      if (parsedKey.serie) {
        data.serie = parsedKey.serie;
      }

      if (parsedKey.numeroNota) {
        data.numeroNota = parsedKey.serie
          ? `${parsedKey.serie}/${parsedKey.numeroNota}`
          : parsedKey.numeroNota;
        confidence.numeroNota = "high";
      }

      if (parsedKey.modelo) {
        data.modelo = parsedKey.modelo;
      }

      if (parsedKey.anoMes && !data.dataEmissao) {
        data.dataEmissao = parsedKey.anoMes;
        confidence.dataEmissao = "medium";
      }
    } else {
      data.chaveAcesso = rawChaveDigits;
      confidence.chaveAcesso = "high";
    }
  }

  // 2. CNPJ Extraction & Distinction (if not already extracted from Chave)
  if (!data.cnpjEmitente) {
    const cnpjMatches = Array.from(text.matchAll(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})\b/g));
    const foundCNPJs: { cnpj: string; index: number; context: string }[] = [];

    cnpjMatches.forEach((m) => {
      const rawDigits = unformatCNPJ(m[0]);
      if (isValidCNPJ(rawDigits)) {
        const idx = m.index || 0;
        const start = Math.max(0, idx - 100);
        const end = Math.min(text.length, idx + 100);
        const context = text.slice(start, end).toUpperCase();
        foundCNPJs.push({ cnpj: formatCNPJ(rawDigits), index: idx, context });
      }
    });

    if (foundCNPJs.length > 0) {
      let emitente = foundCNPJs.find(
        (c) =>
          c.context.includes("PRESTADOR") ||
          c.context.includes("EMITENTE") ||
          c.context.includes("FORNECEDOR") ||
          c.context.includes("CEDENTE")
      );

      const destinatario = foundCNPJs.find(
        (c) =>
          c.context.includes("TOMADOR") ||
          c.context.includes("DESTINATÁRIO") ||
          c.context.includes("DESTINATARIO") ||
          c.context.includes("CLIENTE") ||
          c.context.includes("COMPESA")
      );

      if (!emitente) {
        const nonCompesa = foundCNPJs.find((c) => !c.cnpj.includes("09.769.035"));
        if (nonCompesa) {
          emitente = nonCompesa;
        } else {
          emitente = foundCNPJs[0];
        }
      }

      if (emitente) {
        data.cnpjEmitente = emitente.cnpj;
        confidence.cnpjEmitente = isOCR ? "medium" : "high";
      }

      if (destinatario) {
        data.cnpjDestinatario = destinatario.cnpj;
      }
    }
  }

  // 3. Razão Social (from PDF text)
  const razaoRegexes = [
    /(?:PRESTADOR \/ FORNECEDOR|PRESTADOR DE SERVIÇOS|EMITENTE DA NFS-E)[\s\S]{1,120}?(?:Nome \/ Nome Empresarial|Nome Empresarial|Razão Social|Razao Social)\s*[:-]?\s*([A-Z0-9.\s&/-]{3,80})/i,
    /(?:NOME \/ NOME EMPRESARIAL|NOME EMPRESARIAL|RAZÃO SOCIAL|RAZAO SOCIAL|NOME\/RAZÃO SOCIAL|PRESTADOR DE SERVIÇOS|EMITENTE)\s*[:-]?\s*([A-Z0-9.\s&/-]{3,80})/i,
    /(?:NOME FANTASIA)\s*[:-]?\s*([A-Z0-9.\s&/-]{3,80})/i,
  ];

  for (const regex of razaoRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidateName = match[1].toUpperCase();
      if (!candidateName.includes("CNPJ") && !candidateName.includes("COMPANHIA PERNAMBUCANA DE SANEAMENTO")) {
        const cleanedName = match[1].replace(/(?:CNPJ|CPF|INDICADOR|ENDEREÇO|MUNICIPIO|TELEFONE|E-MAIL).*/i, "").trim();
        if (cleanedName.length > 2) {
          data.razaoSocialEmitente = cleanedName;
          confidence.razaoSocialEmitente = isOCR ? "medium" : "high";
          break;
        }
      }
    }
  }

  // 4. Série e Número da Nota (if not already extracted from Chave)
  if (!data.serie) {
    const serieMatch = text.match(/(?:SÉRIE DA DPS|SÉRIE|SERIE)\s*[:#.-]?\s*(\d{1,5})\b/i);
    if (serieMatch && serieMatch[1]) {
      data.serie = serieMatch[1].trim();
    }
  }

  if (!data.numeroNota) {
    const numNotaRegexes = [
      /(?:NÚMERO DA NFS-E|NUMERO DA NFS-E|Nº DA NFS-E|N° DA NFS-E)\s*[:#.-]?\s*(\d{1,15})\b/i,
      /(?:NOTA FISCAL|NFS-E|NF-E|Nº|NUMERO|NÚMERO|N°)\s*(?:DA NOTA|ELETRÔNICA)?\s*[:#.-]?\s*(\d{1,15})\b/i,
      /\bNº\s*(\d{1,15})\b/i,
    ];

    for (const regex of numNotaRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        const rawNum = match[1].trim();
        data.numeroNota = data.serie && !rawNum.includes("/") ? `${data.serie}/${rawNum}` : rawNum;
        confidence.numeroNota = isOCR ? "medium" : "high";
        break;
      }
    }
  }

  // 5. Datas (Emissão Completa do texto do PDF)
  const dataMatch =
    text.match(/(?:DATA E HORA DA EMISSÃO DA NFS-E|DATA DE EMISSÃO|EMISSÃO DA NFS-E|COMPETÊNCIA DA NFS-E|EMISSÃO|EMISSAO|DATA\/HORA EMISSÃO)\s*[:-]?\s*(\d{2}\/\d{2}\/\d{4})/i) ||
    text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  if (dataMatch && dataMatch[1]) {
    data.dataEmissao = dataMatch[1];
    confidence.dataEmissao = "high";
  }

  // 6. Valor Total da Nota
  const valorTotalRegexes = [
    /(?:VALOR TOTAL DA NFS-E|VALOR DA OPERAÇÃO \/ SERVIÇO|VALOR DA OPERACAO \/ SERVICO|VALOR DOS SERVIÇOS|VALOR DOS SERVICOS|VALOR LÍQUIDO DA NFS-E|VALOR LIQUIDO DA NFS-E|VALOR TOTAL DA NOTA|VALOR TOTAL|VALOR LIQUIDO|VALOR DA NOTA|V\. TOTAL|TOTAL)\s*[:=]?\s*(?:R\$)?\s*([\d.,]{2,15})/i,
    /(?:R\$)\s*([\d.,]{2,15})\b/i,
  ];

  for (const regex of valorTotalRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const rawVal = match[1].replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(rawVal);
      if (!isNaN(parsed) && parsed > 0) {
        data.valorTotal = parsed;
        confidence.valorTotal = isOCR ? "medium" : "high";
        break;
      }
    }
  }

  // 7. Dados Comerciais (OC / Ordem de Compra)
  // Varre Informações Complementares / Dados Adicionais da Nota Fiscal em busca estrita do nome "Ordem de Compra"
  const infSectionMatch = fullText.match(/(?:INFORMAÇÕES COMPLEMENTARES|DADOS ADICIONAIS|INF\. COMPLEMENTARES|OBSERVAÇÕES|DADOS COMPLEMENTARES)[\s\S]*/i);
  const textToScan = infSectionMatch ? infSectionMatch[0] : fullText;

  const ocMatch = textToScan.match(/ORDEM DE COMPRA\s*[:#.-]?\s*([A-Za-z0-9/-]+)/i);

  if (ocMatch && ocMatch[1]) {
    const candidate = ocMatch[1].trim();
    if (candidate.length >= 2 && !/^(VALOR|NOTA|TOTAL|FISCAL|IMPOSTO|PARCELA|FATURA|CONDIÇOES|CONDICOES)$/i.test(candidate)) {
      data.oc = candidate;
      confidence.oc = "high";
    }
  }

  // Descrição do Serviço
  const descMatch = text.match(/(?:Descrição do Serviço|Descricao do Servico|DESCRIÇÃO DOS SERVIÇOS|DESCRICAO DOS SERVICOS|SERVIÇO PRESTADO)\s*[:-]?\s*([\s\S]{10,300}?)(?=(?:TRIBUTAÇÃO|TRIBUTACAO|VALOR|INFORMAÇÕES|INF\. COMPLEMENTARES|DADOS ADICIONAIS|BC ISSQN|$))/i);
  if (descMatch && descMatch[1]) {
    const cleanDesc = descMatch[1].replace(/\s+/g, " ").trim();
    if (cleanDesc.length > 5) {
      data.descricao = cleanDesc.slice(0, 250);
    }
  } else {
    data.descricao = lines.slice(0, 15).join(" ");
  }

  // Identify missing & low confidence fields
  const missingFields: string[] = [];
  const lowConfidenceFields: string[] = [];

  if (!data.cnpjEmitente) missingFields.push("CNPJ");
  if (!data.razaoSocialEmitente) missingFields.push("Razão Social");
  if (!data.numeroNota) missingFields.push("Nº da Nota");
  if (!data.valorTotal) missingFields.push("Valor Total");
  if (!data.oc) missingFields.push("OC");

  Object.entries(confidence).forEach(([k, val]) => {
    if (val === "low" || (isOCR && val === "medium")) {
      lowConfidenceFields.push(k);
    }
  });

  return {
    success: true,
    documentType,
    extractedData: data,
    confidenceScores: confidence,
    missingFields,
    lowConfidenceFields,
    hasText: !isOCR,
    usedOCR: isOCR,
  };
}
