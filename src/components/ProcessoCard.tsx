import { useState } from "react";
import { Eye, Pencil, Trash2, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

const getStatusBadgeVariant = (status: Processo["status"]) => {
  switch (status) {
    case "Aprovado":
      return "default";
    case "Rejeitado":
      return "destructive";
    case "Aguardando Entrega":
      // Usamos 'secondary' como base, mas aplicamos classes customizadas
      return "secondary";
    case "Pendente":
    default:
      return "secondary";
  }
};

const getPendenteClasses = (status: Processo["status"]) => {
  if (status === "Pendente") {
    return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700 hover:bg-red-100/80";
  }
  if (status === "Aguardando Entrega") {
    // Novo tom de verde/ciano para 'Aguardando Entrega'
    return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
  }
  return "";
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

  const cardBackgroundClass = processo.status === "Aguardando Entrega" 
    ? "bg-green-100/50 dark:bg-green-900/30" 
    : "";

  return (
    <div>
      <Card className={cn("hover:shadow-lg transition-shadow", cardBackgroundClass)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div>
                <CardTitle className="text-lg">
                  <ClickToCopy copyText={processo.numeroProcesso} className="p-0 m-0 hover:bg-transparent">
                    Processo {processo.numeroProcesso}
                  </ClickToCopy>
                </CardTitle>
                <CardDescription className="mt-1">
                  Requisição: {processo.numeroRequisicao}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={getStatusBadgeVariant(processo.status)}
                className={cn(getPendenteClasses(processo.status))}
              >
                {processo.status}
              </Badge>
              <Badge variant="secondary">{processo.coordenacao}</Badge>
            </div>
          </div>
          {/* Ajuste de altura para padronizar o layout */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 mt-2 min-h-[2.5rem]">
            <p>Data: {formattedDate}</p>
            {processo.status === "Pendente" && (
              <p className="font-semibold text-destructive">
                Pendente há {pendingDays} dia{pendingDays !== 1 ? "s" : ""}
              </p>
            )}
            {processo.status === "Aguardando Entrega" && processo.prazoEntrega && (
              <p className="font-semibold text-green-700 dark:text-green-400">
                Prazo:{" "}
                {format(new Date(`${processo.prazoEntrega}T00:00:00`), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Aplicação:</span>{" "}
              {processo.aplicacao.length > 100
                ? `${processo.aplicacao.substring(0, 100)}...`
                : processo.aplicacao}
            </p>
            <p className="text-sm">
              <span className="font-medium text-foreground">Materiais:</span>{" "}
              {processo.materiais.length} item(s)
            </p>
            <p className="text-lg font-semibold text-primary">
              Total: {formatCurrency(processo.valorTotal)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {processo.status === "Pendente" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setStatusUpdateOpen(true)}
              >
                <Clock className="h-4 w-4" />
                Definir Prazo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => onEdit(processo)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setEmailPreviewOpen(true)}
            >
              <Mail className="h-4 w-4" />
              Preview E-mail
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Detalhes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </CardContent>
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