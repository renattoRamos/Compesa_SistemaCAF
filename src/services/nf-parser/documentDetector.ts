import { DocumentType, TipoNotaForm } from "@/types/nf";

export function detectDocumentType(text: string): { documentType: DocumentType; tipoNotaForm: TipoNotaForm } {
  const upper = text.toUpperCase();

  if (upper.includes("DANFE") || upper.includes("DOCUMENTO AUXILIAR DA NOTA FISCAL")) {
    return { documentType: "DANFE", tipoNotaForm: "Compra de Material" };
  }

  if (
    upper.includes("NFS-E") ||
    upper.includes("NOTA FISCAL DE SERVIÇOS") ||
    upper.includes("NOTA FISCAL DE SERVICOS") ||
    upper.includes("PRESTADOR DE SERVIÇOS") ||
    upper.includes("PRESTADOR DE SERVICOS") ||
    upper.includes("TOMADOR DE SERVIÇOS") ||
    upper.includes("TOMADOR DE SERVICOS") ||
    upper.includes("ISSQN") ||
    upper.includes("VALOR DOS SERVIÇOS")
  ) {
    if (upper.includes("LOCAÇÃO") || upper.includes("LOCACAO") || upper.includes("ALUGUEL")) {
      return { documentType: "NFS-e", tipoNotaForm: "Locação" };
    }
    return { documentType: "NFS-e", tipoNotaForm: "Serviço" };
  }

  // Default to NF-e / DANFE (Compra de Material)
  return { documentType: "DANFE", tipoNotaForm: "Compra de Material" };
}
