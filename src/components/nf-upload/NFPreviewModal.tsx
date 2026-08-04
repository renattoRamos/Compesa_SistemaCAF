import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FileCode, CheckCircle2, Calendar, Building, Hash, DollarSign, FileCheck } from "lucide-react";
import { NFExtractedData, NFFileMetadata, DocumentType } from "@/types/nf";

interface NFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileMetadata: NFFileMetadata | null;
  extractedData: NFExtractedData | null;
  documentType?: DocumentType;
}

export const NFPreviewModal: React.FC<NFPreviewModalProps> = ({
  isOpen,
  onClose,
  fileMetadata,
  extractedData,
  documentType = "NF-e",
}) => {
  if (!fileMetadata) return null;

  const formatBRL = (val?: number) => {
    if (val === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fileMetadata.importedAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {fileMetadata.fileType === "pdf" ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <FileCode className="w-5 h-5 text-blue-500" />
            )}
            <DialogTitle className="text-lg font-bold">
              Visualização da Nota Fiscal - {documentType}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Informações extraídas automaticamente do arquivo importado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs sm:text-sm my-2">
          {/* File Card Info */}
          <div className="bg-muted/60 p-3 rounded-lg border border-border/50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-primary" /> {fileMetadata.fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tamanho: {(fileMetadata.fileSize / 1024).toFixed(1)} KB • Importado em: {formattedDate}
              </p>
            </div>
            <Badge variant="secondary" className="uppercase font-semibold text-xs">
              {documentType}
            </Badge>
          </div>

          {/* Extracted Fields Summary Grid */}
          {extractedData && (
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dados Identificados no Documento
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-card p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5" /> CNPJ / Prestador
                  </span>
                  <p className="font-medium text-foreground">{extractedData.cnpjEmitente || "Não identificado"}</p>
                  <p className="text-xs text-muted-foreground truncate">{extractedData.razaoSocialEmitente || ""}</p>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Hash className="w-3.5 h-3.5" /> Número da Nota Fiscal
                  </span>
                  <p className="font-medium text-foreground">{extractedData.numeroNota || "Não identificado"}</p>
                  <p className="text-xs text-muted-foreground">
                    Série: {extractedData.serie || "-"} • Modelo: {extractedData.modelo || "-"}
                  </p>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> Valor Total
                  </span>
                  <p className="font-bold text-primary text-base">{formatBRL(extractedData.valorTotal)}</p>
                  <p className="text-xs text-muted-foreground">
                    Tipo Form: {extractedData.tipoNotaForm || "Serviço"}
                  </p>
                </div>

                <div className="bg-card p-3 rounded-lg border border-border/60">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Data de Emissão
                  </span>
                  <p className="font-medium text-foreground">{extractedData.dataEmissao || "Não identificada"}</p>
                </div>
              </div>

              {/* Commercial Data */}
              <div className="bg-card p-3 rounded-lg border border-border/60 space-y-2">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Dados Comerciais & Referências
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">OC / Ordem Compra</span>
                    <span className="font-medium">{extractedData.oc || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">SCDI</span>
                    <span className="font-medium text-muted-foreground italic">Preenchimento Manual</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Processo SEI</span>
                    <span className="font-medium text-muted-foreground italic">Preenchimento Manual</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {extractedData.descricao && (
                <div className="bg-card p-3 rounded-lg border border-border/60 space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold">Descrição / Observações</span>
                  <p className="text-xs text-muted-foreground line-clamp-3 italic">
                    "{extractedData.descricao}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" size="sm">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
