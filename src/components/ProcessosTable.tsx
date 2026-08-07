import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Loader2, Clock, Mail } from "lucide-react";
import { Processo } from "@/types/processo";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProcessoDetalhesDialog } from "./ProcessoDetalhesDialog";
import { ProcessoDeleteDialog } from "./ProcessoDeleteDialog";
import ClickToCopy from "./ClickToCopy";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { SCDIEmailPreviewModal } from "./SCDIEmailPreviewModal";

interface ProcessosTableProps {
  processos: Processo[];
  onEdit: (processo: Processo) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingId: string | undefined;
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

export function ProcessosTable({
  processos,
  onEdit,
  onDelete,
  isDeleting,
  deletingId,
}: ProcessosTableProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const handleOpenDetails = (processo: Processo) => {
    setSelectedProcesso(processo);
    setDetailsOpen(true);
  };

  const handleOpenDelete = (processo: Processo) => {
    setSelectedProcesso(processo);
    setDeleteOpen(true);
  };

  const handleOpenStatusUpdate = (processo: Processo) => {
    setSelectedProcesso(processo);
    setStatusUpdateOpen(true);
  };

  const handleOpenEmailPreview = (processo: Processo) => {
    setSelectedProcesso(processo);
    setEmailPreviewOpen(true);
  };

  return (
    <div className="border border-border rounded-lg overflow-x-auto w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[120px] text-center">Nº Processo</TableHead>
            <TableHead className="w-[120px]">Requisição</TableHead>
            <TableHead className="w-[120px]">Coordenação</TableHead>
            <TableHead>Aplicação</TableHead>
            <TableHead className="text-right w-[150px]">Valor Total</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[120px]">Prazo Entrega</TableHead>
            <TableHead className="w-[160px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processos.map(processo => {
            const processDate = new Date(`${processo.dataProcesso}T00:00:00`);
            const formattedDate = format(processDate, "dd/MM/yyyy", { locale: ptBR });

            return (
              <TableRow key={processo.id}>
                <TableCell className="text-xs">{formattedDate}</TableCell>
                <TableCell className="font-medium text-center">
                  <ClickToCopy
                    copyText={processo.numeroProcesso}
                    className="inline-flex items-center justify-center gap-1 p-0 m-0 hover:bg-transparent"
                  >
                    {processo.numeroProcesso}
                  </ClickToCopy>
                </TableCell>
                <TableCell>{processo.numeroRequisicao}</TableCell>
                <TableCell>{processo.coordenacao}</TableCell>
                <TableCell className="max-w-[300px] truncate text-sm">
                  {processo.aplicacao}
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {formatCurrency(processo.valorTotal)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(processo.status)}
                    className={cn("whitespace-nowrap", getPendenteClasses(processo.status))}
                  >
                    {processo.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {processo.prazoEntrega
                    ? format(new Date(`${processo.prazoEntrega}T00:00:00`), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {processo.status === "Pendente" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenStatusUpdate(processo)}
                        title="Definir Prazo de Entrega"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEmailPreview(processo)}
                      title="Preview do E-mail (HTML)"
                      className="text-primary hover:text-primary/80"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(processo)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDetails(processo)}
                      title="Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(processo)}
                      title="Excluir"
                      disabled={isDeleting && deletingId === processo.id}
                    >
                      {isDeleting && deletingId === processo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedProcesso && (
        <>
          <ProcessoDetalhesDialog
            processo={selectedProcesso}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <ProcessoDeleteDialog
            processo={selectedProcesso}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
          <UpdateStatusDialog
            processo={selectedProcesso}
            open={statusUpdateOpen}
            onOpenChange={setStatusUpdateOpen}
          />
          <SCDIEmailPreviewModal
            processo={selectedProcesso}
            open={emailPreviewOpen}
            onOpenChange={setEmailPreviewOpen}
          />
        </>
      )}
    </div>
  );
}