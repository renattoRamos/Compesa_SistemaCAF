import { useState } from "react";
import { Eye, Pencil, Trash2, Clock, Mail, Calendar, Package, AlertCircle, Truck, Copy, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Processo } from "@/types/processo";
import { ProcessoDetalhesDialog } from "./ProcessoDetalhesDialog";
import { ProcessoDeleteDialog } from "./ProcessoDeleteDialog";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClickToCopy from "./ClickToCopy";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { SCDIEmailPreviewModal } from "./SCDIEmailPreviewModal";

interface ProcessoCardProps {
  processo: Processo;
  onEdit: (processo: Processo) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getStatusBadgeConfig = (status: Processo["status"]) => {
  switch (status) {
    case "Aprovado":
      return {
        variant: "default" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800",
        icon: CheckCircle2,
      };
    case "Rejeitado":
      return {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800",
        icon: XCircle,
      };
    case "Aguardando Entrega":
      return {
        variant: "secondary" as const,
        className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
        icon: Truck,
      };
    case "Pendente":
    default:
      return {
        variant: "secondary" as const,
        className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
        icon: Clock,
      };
  }
};

const getCardAccentBorder = (status: Processo["status"]) => {
  switch (status) {
    case "Aprovado":
      return "border-l-4 border-l-blue-500";
    case "Rejeitado":
      return "border-l-4 border-l-red-500";
    case "Aguardando Entrega":
      return "border-l-4 border-l-emerald-500";
    case "Pendente":
    default:
      return "border-l-4 border-l-amber-500";
  }
};

export function ProcessoCard({ processo, onEdit, onDelete, isDeleting }: ProcessoCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const processDate = new Date(`${processo.dataProcesso}T00:00:00`);
  const formattedDate = format(processDate, "dd/MM/yyyy", { locale: ptBR });

  let pendingDays = 0;
  if (processo.status === "Pendente") {
    pendingDays = differenceInDays(new Date(), processDate);
    pendingDays = Math.max(0, pendingDays);
  }

  const statusConfig = getStatusBadgeConfig(processo.status);
  const StatusIcon = statusConfig.icon;
  const accentBorderClass = getCardAccentBorder(processo.status);

  return (
    <div className="h-full">
      <Card className={cn(
        "h-full flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-border/80",
        accentBorderClass
      )}>
        <div>
          <CardHeader className="pb-3 pt-4 px-4 space-y-3">
            {/* Top row: Status Badge & Coordination Tag */}
            <div className="flex items-center justify-between gap-2">
              <Badge variant={statusConfig.variant} className={cn("gap-1 px-2.5 py-0.5 text-xs font-semibold shadow-none border", statusConfig.className)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {processo.status}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground bg-muted/30 border-border/60">
                {processo.coordenacao}
              </Badge>
            </div>

            {/* Title & Requisition */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <ClickToCopy
                  copyText={processo.numeroProcesso}
                  className="p-0 m-0 hover:bg-transparent group inline-flex items-center gap-1.5"
                >
                  <span className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                    Proc. {processo.numeroProcesso}
                  </span>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                </ClickToCopy>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Req: <span className="font-semibold text-foreground/80">{processo.numeroRequisicao}</span>
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-3 space-y-3">
            {/* Application description */}
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40 text-xs text-foreground/80 line-clamp-2 leading-relaxed">
              <span className="font-semibold text-foreground">Aplicação: </span>
              {processo.aplicacao}
            </div>

            {/* Date & Items Row */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Package className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span>{processo.materiais.length} {processo.materiais.length === 1 ? 'item' : 'itens'}</span>
              </div>
            </div>

            {/* Status Alert/Deadline info banner */}
            {processo.status === "Pendente" && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Pendente há {pendingDays} dia{pendingDays !== 1 ? 's' : ''}</span>
              </div>
            )}

            {processo.status === "Aguardando Entrega" && processo.prazoEntrega && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-medium">
                <Truck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Prazo: {format(new Date(`${processo.prazoEntrega}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}

            {/* Total Value */}
            <div className="pt-2 border-t border-border/50 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor Total</span>
              <span className="text-lg font-bold text-primary tracking-tight">
                {formatCurrency(processo.valorTotal)}
              </span>
            </div>
          </CardContent>
        </div>

        {/* Card Footer Actions */}
        <div className="px-4 pb-4 pt-2 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1">
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-8 text-xs font-medium gap-1 px-2.5"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs font-medium gap-1 px-2.5"
              onClick={() => onEdit(processo)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {processo.status === "Pendente" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs gap-1 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30"
                onClick={() => setStatusUpdateOpen(true)}
                title="Definir Prazo de Entrega"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prazo</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setEmailPreviewOpen(true)}
              title="Preview E-mail SCDI"
            >
              <Mail className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
              title="Excluir Processo"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <ProcessoDetalhesDialog
        processo={processo}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
      <ProcessoDeleteDialog
        processo={processo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />
      <UpdateStatusDialog
        processo={processo}
        open={statusUpdateOpen}
        onOpenChange={setStatusUpdateOpen}
      />
      <SCDIEmailPreviewModal
        processo={processo}
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
      />
    </div>
  );
}
