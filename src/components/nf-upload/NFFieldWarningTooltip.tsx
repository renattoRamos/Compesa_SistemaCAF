import React from "react";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldConfidence } from "@/types/nf";
import { cn } from "@/lib/utils";

interface NFFieldWarningTooltipProps {
  confidence?: FieldConfidence;
  children: React.ReactNode;
  label?: string;
  isMissing?: boolean;
}

export const NFFieldWarningTooltip: React.FC<NFFieldWarningTooltipProps> = ({
  confidence,
  children,
  isMissing = false,
}) => {
  const isLow = confidence === "low" || confidence === "medium";
  const shouldWarn = isLow || isMissing;

  if (!shouldWarn) {
    return <>{children}</>;
  }

  const tooltipText = isMissing
    ? "Campo pendente. Não foi possível identificar automaticamente no documento."
    : "Informação identificada automaticamente. Recomenda-se conferência.";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative group w-full">
        <div
          className={cn(
            "rounded-md transition-all duration-200",
            isLow && "ring-2 ring-amber-400 border-amber-400 shadow-sm shadow-amber-100 dark:shadow-none",
            isMissing && "ring-2 ring-amber-500/70 border-amber-500"
          )}
        >
          {children}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute right-2.5 top-2.5 cursor-pointer z-10 text-amber-500 hover:text-amber-600">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-amber-600 text-white border-none text-xs font-medium max-w-xs p-2">
            <p className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{tooltipText}</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
