import { useIsMutating } from "@tanstack/react-query";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  // useIsMutating retorna o número de mutações pendentes/em andamento
  const isMutating = useIsMutating(); 

  // Sincronizando: Online, mas com mutações pendentes (retries)
  const isSyncing = isMutating > 0 && isOnline;
  // Offline com ações pendentes: Offline, mas com mutações na fila
  const isOfflineWithPending = isMutating > 0 && !isOnline;

  let icon: React.ReactNode;
  let text: string;
  let className: string;

  if (isSyncing) {
    icon = <Loader2 className="h-4 w-4 animate-spin" />;
    text = "Sincronizando...";
    className = "bg-accent text-accent-foreground";
  } else if (!isOnline) {
    icon = <WifiOff className="h-4 w-4" />;
    text = isOfflineWithPending ? "Offline (Ações Pendentes)" : "Offline";
    className = "bg-destructive text-destructive-foreground";
  } else {
    // Online e não sincronizando
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300",
        className,
      )}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}