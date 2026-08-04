import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Processo } from "@/types/processo";
import {
  formSchema,
  FormValues,
  MaterialInForm,
  createNewMaterial,
} from "@/schemas/autorizacaoSchema";
import { ProcessoInfoFields } from "./forms/ProcessoInfoFields";
import { MaterialTable } from "./forms/MaterialTable";
import { useProcessos } from "@/hooks/useProcessos";
import { Loader2 } from "lucide-react";

interface AutorizacaoFormProps {
  processo?: Processo | null;
  isEditing?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutorizacaoForm({
  processo,
  isEditing = false,
  open,
  onOpenChange,
}: AutorizacaoFormProps) {
  const { createOrUpdateProcesso, isSaving } = useProcessos();
  const [materiais, setMateriais] = useState<MaterialInForm[]>(() => [createNewMaterial()]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataProcesso: new Date(),
      numeroRequisicao: "",
      numeroProcesso: "",
      coordenacao: "CMA SUL",
      aplicacao: "",
      materiais: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (isEditing && processo) {
        const processoMateriais: MaterialInForm[] = processo.materiais.map(m => ({
          ...m,
          tempId: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          unidadeMedida: (m.unidadeMedida || "un") as MaterialInForm["unidadeMedida"],
          almoxarifado: (m.almoxarifado as "disponivel" | "indisponivel") || "indisponivel",
          estoqueCD: (m.estoqueCD as "disponivel" | "indisponivel") || "indisponivel",
          ataArp: (m.ataArp as "disponivel" | "indisponivel"),
        }));
        setMateriais(processoMateriais);
        form.reset({
          dataProcesso: new Date(`${processo.dataProcesso}T00:00:00`),
          numeroRequisicao: processo.numeroRequisicao,
          numeroProcesso: processo.numeroProcesso,
          coordenacao: processo.coordenacao as FormValues["coordenacao"],
          aplicacao: processo.aplicacao,
          materiais: processoMateriais,
        });
      } else {
        const initialMaterial = createNewMaterial();
        form.reset({
          dataProcesso: new Date(),
          numeroRequisicao: "",
          numeroProcesso: "",
          coordenacao: "CMA SUL",
          aplicacao: "",
          materiais: [initialMaterial],
        });
        setMateriais([initialMaterial]);
      }
    }
  }, [isEditing, processo, form, open]);

  const calcularValorTotal = () => {
    return materiais.reduce((total, material) => {
      return total + material.quantidade * material.valorUnitario;
    }, 0);
  };

  const handleSubmit = (data: FormValues) => {
    const valorTotal = calcularValorTotal();

    createOrUpdateProcesso(
      {
        ...data,
        valorTotal,
        id: processo?.id,
        dataProcesso: data.dataProcesso.toISOString().split('T')[0],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const valorTotal = calcularValorTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[92vw] overflow-y-auto max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <DialogTitle className="text-lg font-bold">{isEditing ? "Editar" : "Solicitar"} Autorização SCDI</DialogTitle>
          <DialogDescription className="text-xs">
            Preencha as informações abaixo para {isEditing ? "editar o" : "criar um novo"} processo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-1">

            <ProcessoInfoFields form={form} valorTotal={valorTotal} />

            <MaterialTable
              materiais={materiais}
              setMateriais={setMateriais}
              form={form}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Processo"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
