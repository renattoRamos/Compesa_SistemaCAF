import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface NFProcessingOverlayProps {
  fileName?: string;
  onCancel?: () => void;
}

export const NFProcessingOverlay: React.FC<NFProcessingOverlayProps> = ({ fileName }) => {
  const [progress, setProgress] = useState(15);
  const [stepText, setStepText] = useState("Identificando formato do documento...");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStepText("Extraindo dados do emitente e documento fiscal...");
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStepText("Consultando CNPJ e validando dados comerciais...");
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(95);
      setStepText("Finalizando preenchimento automático...");
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-5 shadow-sm text-center space-y-3 animate-fade-in">
      <div className="flex items-center justify-center gap-2">
        <div className="relative">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h4 className="font-semibold text-foreground text-sm sm:text-base">
          Lendo e extraindo informações da Nota Fiscal...
        </h4>
      </div>

      {fileName && (
        <p className="text-xs text-muted-foreground font-mono bg-background/60 py-1 px-3 rounded inline-block border border-border/40">
          {fileName}
        </p>
      )}

      <div className="max-w-md mx-auto space-y-1.5 pt-1">
        <Progress value={progress} className="h-2 bg-primary/20" />
        <p className="text-xs text-primary font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          {stepText}
        </p>
      </div>
    </div>
  );
};
