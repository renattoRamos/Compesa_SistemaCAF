import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, FileCheck, Calendar, Tag, FileText } from "lucide-react";
import { DocumentType } from "@/types/nf";
import { Badge } from "@/components/ui/badge";

interface NFSuccessBannerProps {
  fileName: string;
  documentType: DocumentType;
  importedAt: Date;
  isPartial?: boolean;
  isUnreadable?: boolean;
  onDismiss?: () => void;
}

export const NFSuccessBanner: React.FC<NFSuccessBannerProps> = ({
  fileName,
  documentType,
  importedAt,
  isPartial = false,
  isUnreadable = false,
}) => {
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(importedAt);

  if (isUnreadable) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 flex items-start gap-3 animate-fade-in">
        <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-semibold text-destructive">
            Não foi possível realizar a leitura automática deste documento.
          </p>
          <p className="text-muted-foreground text-xs">
            Você pode realizar o preenchimento manual dos campos no formulário abaixo normalmente.
          </p>
        </div>
      </div>
    );
  }

  if (isPartial) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Não foi possível identificar todas as informações desta Nota Fiscal. Revise os campos destacados antes de salvar.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {fileName}
            </span>
            <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-400">
              {documentType}
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formattedTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div className="space-y-1 text-xs sm:text-sm">
        <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <span>Nota Fiscal processada com sucesso. Os campos foram preenchidos automaticamente.</span>
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> {fileName}
          </span>
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0">
            <Tag className="w-3 h-3 mr-1" />
            {documentType}
          </Badge>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" /> {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};
