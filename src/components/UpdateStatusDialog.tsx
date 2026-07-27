import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "./forms/DatePickerField";
import { Processo } from "@/types/processo";
import { useProcessos } from "@/hooks/useProcessos";
import { Loader2 } from "lucide-react";

interface UpdateStatusDialogProps {
  processo: Processo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  prazoEntrega: z.date({
    required_error: "A data do prazo é obrigatória.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function UpdateStatusDialog({ processo, open, onOpenChange }: UpdateStatusDialogProps) {
  const { updateProcessoStatus, isUpdatingStatus } = useProcessos();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Preenche o campo com o prazo existente se estiver em 'Aguardando Entrega'
      prazoEntrega:
        processo.status === "Aguardando Entrega" && processo.prazoEntrega
          ? new Date(`${processo.prazoEntrega}T00:00:00`)
          : undefined,
    },
  });

  const handleSubmit = (data: FormValues) => {
    updateProcessoStatus(
      {
        processoId: processo.id,
        status: "Aguardando Entrega",
        prazoEntrega: data.prazoEntrega.toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  };

  const handleRevertToPendente = () => {
    updateProcessoStatus(
      {
        processoId: processo.id,
        status: "Pendente",
        prazoEntrega: null, // Limpa o prazo
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  };

  const isAguardandoEntrega = processo.status === "Aguardando Entrega";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Status: Processo {processo.numeroProcesso}</DialogTitle>
          <DialogDescription>
            {isAguardandoEntrega
              ? "Atualize o prazo de entrega ou reverta o status para Pendente."
              : 'O status será alterado para "Aguardando Entrega". Informe o prazo estimado.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <DatePickerField
              control={form.control}
              name="prazoEntrega"
              label="Prazo Estimado de Entrega"
            />
            <DialogFooter>
              {isAguardandoEntrega && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRevertToPendente}
                  disabled={isUpdatingStatus}
                >
                  Reverter para Pendente
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUpdatingStatus}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Prazo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}