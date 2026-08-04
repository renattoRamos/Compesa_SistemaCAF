import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { NFDropzone } from "./NFDropzone";
import { NFProcessingOverlay } from "./NFProcessingOverlay";
import { NFSuccessBanner } from "./NFSuccessBanner";
import { NFFileCard } from "./NFFileCard";
import { NFPreviewModal } from "./NFPreviewModal";
import { processNFFile } from "@/services/nf-parser";
import { getSampleNFE, getSampleNFSE } from "@/services/nf-parser/demoSamples";
import { NFProcessingResult, NFFileMetadata, DocumentType, NFExtractedData, ConfidenceScores } from "@/types/nf";

interface NFModuleContainerProps {
  onAutoFill: (extractedData: NFExtractedData, confidence: ConfidenceScores) => void;
  onClearForm?: () => void;
}

export const NFModuleContainer: React.FC<NFModuleContainerProps> = ({ onAutoFill, onClearForm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<NFFileMetadata | null>(null);
  const [lastResult, setLastResult] = useState<NFProcessingResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleProcessFile = async (file: File, sampleResult?: NFProcessingResult) => {
    // 1. Cancel ongoing process if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    const isPDF = file.name.toLowerCase().endsWith(".pdf");

    // Create file metadata
    const metadata: NFFileMetadata = {
      fileName: file.name,
      fileSize: file.size,
      fileType: isPDF ? "pdf" : "xml",
      importedAt: new Date(),
      fileBlob: file,
    };

    try {
      let result: NFProcessingResult;

      if (sampleResult) {
        // Instant sample result
        await new Promise((resolve) => setTimeout(resolve, 600)); // smooth experience
        result = sampleResult;
      } else {
        result = await processNFFile(file, controller.signal);
      }

      if (controller.signal.aborted) return;

      setIsProcessing(false);
      setFileMetadata(metadata);
      setLastResult(result);

      if (result.success) {
        // Trigger auto fill
        onAutoFill(result.extractedData, result.confidenceScores);

        if (result.lowConfidenceFields.length > 0 || result.missingFields.length > 0) {
          toast.warning("Nota Fiscal lida com avisos. Por favor revise os campos destacados.");
        } else {
          toast.success("Nota Fiscal processada e campos preenchidos automaticamente!");
        }
      } else {
        toast.error(result.errorMessage || "Não foi possível realizar a leitura automática deste documento.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Cancelled silently
      }
      setIsProcessing(false);
      toast.error("Erro ao processar o arquivo. Verifique o formato enviado.");
    }
  };

  const handleLoadSampleNFE = () => {
    const { file, result } = getSampleNFE();
    handleProcessFile(file, result);
  };

  const handleLoadSampleNFSE = () => {
    const { file, result } = getSampleNFSE();
    handleProcessFile(file, result);
  };

  const handleRemoveFile = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setFileMetadata(null);
    setLastResult(null);
    if (onClearForm) {
      onClearForm();
    }
    toast.info("Arquivo de Nota Fiscal removido e campos limpos.");
  };

  return (
    <div className="w-full space-y-4 mb-6">
      {/* 1. Processing Overlay */}
      {isProcessing && (
        <NFProcessingOverlay fileName={fileMetadata?.fileName} />
      )}

      {/* 2. File Linked Card & Success Banner */}
      {!isProcessing && lastResult && fileMetadata && (
        <div className="space-y-3">
          <NFSuccessBanner
            fileName={fileMetadata.fileName}
            documentType={lastResult.documentType}
            importedAt={fileMetadata.importedAt}
            isPartial={lastResult.missingFields.length > 0 || lastResult.lowConfidenceFields.length > 0}
            isUnreadable={!lastResult.success}
          />

          <NFFileCard
            metadata={fileMetadata}
            documentType={lastResult.documentType}
            onView={() => setIsPreviewOpen(true)}
            onReplace={(newFile) => handleProcessFile(newFile)}
            onRemove={handleRemoveFile}
          />
        </div>
      )}

      {/* 3. Dropzone area when no file is linked or during replace */}
      {!isProcessing && (!fileMetadata || !lastResult) && (
        <NFDropzone
          onFileSelect={(file) => handleProcessFile(file)}
          isProcessing={isProcessing}
          onLoadSampleNFE={handleLoadSampleNFE}
          onLoadSampleNFSE={handleLoadSampleNFSE}
        />
      )}

      {/* 4. Preview Modal */}
      <NFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileMetadata={fileMetadata}
        extractedData={lastResult?.extractedData || null}
        documentType={lastResult?.documentType as DocumentType}
      />
    </div>
  );
};
