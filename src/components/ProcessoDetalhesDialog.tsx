import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, Clock, Mail, Eye } from "lucide-react";
import { Processo } from "@/types/processo";
import { useProcessoCopy } from "@/hooks/useProcessoCopy";
import { ProcessoInfo } from "./ProcessoInfo";
import { ProcessoMateriaisTable } from "./ProcessoMateriaisTable";
import { Separator } from "./ui/separator";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { SCDIEmailPreviewModal } from "./SCDIEmailPreviewModal";

interface ProcessoDetalhesDialogProps {
  processo: Processo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessoDetalhesDialog({
  processo,
  open,
  onOpenChange,
}: ProcessoDetalhesDialogProps) {
  const { handleCopyToEmail, handleCopyToWhatsApp, handleCopyToEmailCD } =
    useProcessoCopy(processo);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  const canUpdateStatus =
    processo.status === "Pendente" || processo.status === "Aguardando Entrega";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100rem] w-[95vw] overflow-y-auto !max-w-none max-h-[95vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo {processo.numeroProcesso}</DialogTitle>
            <DialogDescription>
              Visualização detalhada das informações e materiais do processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-foreground">Informações do Processo</h3>
                <div className="flex gap-2 flex-wrap">
                  {canUpdateStatus && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setStatusUpdateOpen(true)}
                    >
                      <Clock className="h-4 w-4" />
                      {processo.status === "Pendente" ? "Definir Prazo" : "Atualizar Status"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => setEmailPreviewOpen(true)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview E-mail
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 bg-primary hover:bg-primary/90"
                    onClick={handleCopyToEmail}
                  >
                    <Mail className="h-4 w-4" />
                    Copiar E-mail SCDI
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Copy className="h-4 w-4" />
                        Mais Opções
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEmailPreviewOpen(true)}>
                        <Eye className="h-4 w-4 mr-2" /> Preview do E-mail (HTML)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyToEmail}>
                        <Mail className="h-4 w-4 mr-2" /> Copiar E-mail SCDI (HTML)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyToEmailCD}>
                        <Mail className="h-4 w-4 mr-2" /> Copiar E-mail CD (HTML)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyToWhatsApp}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar para WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <ProcessoInfo processo={processo} />
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Materiais</h3>
              <ProcessoMateriaisTable materiais={processo.materiais} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modais auxiliares fora da árvore do dialog principal */}
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
    </>
  );
}