import React, { useState, useRef } from "react";
import { UploadCloud, FileText, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface NFDropzoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const NFDropzone: React.FC<NFDropzoneProps> = ({
  onFileSelect,
  isProcessing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
      // Reset value so same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Área de upload de nota fiscal"
        className={cn(
          "relative border-2 border-dashed rounded-xl p-4 sm:p-5 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center min-h-[120px]",
          isDragOver
            ? "border-primary bg-primary/10 shadow-lg scale-[1.01]"
            : "border-primary/30 hover:border-primary/70 bg-card hover:bg-accent/40 shadow-sm",
          isProcessing && "opacity-60 pointer-events-none"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".pdf,.xml"
          className="hidden"
        />

        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "p-2.5 rounded-full transition-colors duration-200",
              isDragOver ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            )}
          >
            <UploadCloud className="w-6 h-6 animate-bounce-subtle" />
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              {isDragOver
                ? "Solte o arquivo para iniciar a leitura automática."
                : "Arraste e solte sua Nota Fiscal (PDF ou XML) aqui"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDragOver
                ? "Formatos aceitos: PDF ou XML (NF-e, DANFE, NFS-e)"
                : "ou clique para selecionar um arquivo no seu dispositivo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
            <FileText className="w-3 h-3 text-red-500" /> PDF
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
            <FileCode className="w-3 h-3 text-blue-500" /> XML
          </span>
          <span className="text-xs text-muted-foreground">• NF-e, DANFE e NFS-e</span>
        </div>
      </div>
    </div>
  );
};
