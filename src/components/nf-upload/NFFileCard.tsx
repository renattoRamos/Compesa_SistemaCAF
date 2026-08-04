import React, { useRef } from "react";
import { FileText, FileCode, Eye, RefreshCw, Trash2, Calendar, HardDrive, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NFFileMetadata, DocumentType } from "@/types/nf";
import { Badge } from "@/components/ui/badge";

interface NFFileCardProps {
  metadata: NFFileMetadata;
  documentType: DocumentType;
  onView: () => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
}

export const NFFileCard: React.FC<NFFileCardProps> = ({
  metadata,
  documentType,
  onView,
  onReplace,
  onRemove,
}) => {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const formattedSize =
    metadata.fileSize > 1024 * 1024
      ? `${(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(metadata.fileSize / 1024).toFixed(1)} KB`;

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(metadata.importedAt);

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onReplace(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-card border border-primary/20 hover:border-primary/40 rounded-xl p-3.5 shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceChange}
        accept=".pdf,.xml"
        className="hidden"
      />

      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
          {metadata.fileType === "pdf" ? (
            <FileText className="w-5 h-5 text-red-500" />
          ) : (
            <FileCode className="w-5 h-5 text-blue-500" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-sm text-foreground truncate max-w-[220px] sm:max-w-[320px]" title={metadata.fileName}>
              {metadata.fileName}
            </h4>
            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0">
              {documentType}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Vinculado
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> {formattedSize}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onView}
          className="h-8 text-xs gap-1 hover:bg-primary/5 hover:text-primary"
        >
          <Eye className="w-3.5 h-3.5" />
          Visualizar
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => replaceInputRef.current?.click()}
          className="h-8 text-xs gap-1 hover:bg-primary/5 hover:text-primary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Substituir
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </Button>
      </div>
    </div>
  );
};
