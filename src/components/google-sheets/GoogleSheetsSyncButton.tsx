import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, ExternalLink, RefreshCw } from "lucide-react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";

interface GoogleSheetsSyncButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function GoogleSheetsSyncButton({
  onClick,
  className = "",
  variant = "outline",
}: GoogleSheetsSyncButtonProps) {
  const { spreadsheetId, spreadsheetTitle, isAuthenticated, isSyncing, lastSyncTime } =
    useGoogleSheets();

  return (
    <Button
      id="btn-open-google-sheets-modal"
      variant={variant}
      onClick={onClick}
      className={`gap-2 text-xs h-9 relative border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ${className}`}
    >
      <div className="relative">
        <FileSpreadsheet className={`h-4 w-4 text-emerald-600 ${isSyncing ? "animate-spin" : ""}`} />
        {isAuthenticated && spreadsheetId && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      <span className="font-medium">
        {spreadsheetId ? "Planilha Google Conectada" : "Armazenar na Planilha Google"}
      </span>

      {spreadsheetId && (
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[10px] px-1.5 py-0 h-4 font-normal hidden sm:inline-flex"
        >
          {lastSyncTime ? "Sincronizada" : "Ativa"}
        </Badge>
      )}
    </Button>
  );
}
