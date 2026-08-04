export type DocumentType = "NF-e" | "DANFE" | "NFS-e";

export type TipoNotaForm = "Compra de Material" | "Serviço" | "Locação";

export type FieldConfidence = "high" | "medium" | "low";

export interface NFExtractedData {
  cnpjEmitente?: string;
  razaoSocialEmitente?: string;
  nomeFantasiaEmitente?: string;
  cnpjDestinatario?: string;
  numeroNota?: string;
  serie?: string;
  modelo?: string;
  chaveAcesso?: string;
  dataEmissao?: string;
  dataCompetencia?: string;
  valorTotal?: number;
  valorLiquido?: number;
  valorProdutos?: number;
  valorServicos?: number;
  valorISS?: number;
  valorICMS?: number;
  valorIPI?: number;
  valorDesconto?: number;
  valorRetido?: number;
  oc?: string;
  scdi?: string;
  sei?: string;
  contrato?: string;
  centroCusto?: string;
  descricao?: string;
  tipoNotaForm?: TipoNotaForm;
}

export type ConfidenceScores = Partial<Record<keyof NFExtractedData, FieldConfidence>>;

export interface NFProcessingResult {
  success: boolean;
  documentType: DocumentType;
  extractedData: NFExtractedData;
  confidenceScores: ConfidenceScores;
  missingFields: string[];
  lowConfidenceFields: string[];
  errorMessage?: string;
  warningMessage?: string;
  hasText: boolean;
  usedOCR: boolean;
}

export interface NFFileMetadata {
  fileName: string;
  fileSize: number;
  fileType: "pdf" | "xml";
  importedAt: Date;
  rawText?: string;
  xmlString?: string;
  fileBlob?: Blob;
}
