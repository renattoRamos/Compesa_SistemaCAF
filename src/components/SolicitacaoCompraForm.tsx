import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Copy } from "lucide-react";
import {
  solicitacaoCompraSchema,
  SolicitacaoCompraValues,
} from "@/schemas/solicitacaoCompraSchema";

interface SolicitacaoCompraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMessage = (data: SolicitacaoCompraValues): string => {
  let message = `*SOLICITAÇÃO DE COMPRA AO ADM*\n\n`;

  message += `*Justificativa de Aquisição:*\n${data.justificativa}\n\n`;

  if (data.temCodigo && data.materiais && data.materiais.length > 0) {
    message += `*Lista de Materiais:*\n\n`;

    const materialLines = data.materiais.map((material, index) => {
      const codigo = material.codigo.trim() || "SEM CÓDIGO";
      const descricao = material.descricao.trim();
      const quantidade = String(material.quantidade).padStart(2, "0");

      return `${index + 1}. ${codigo} | ${descricao} | *Qtd:* ${quantidade}`;
    });

    message += materialLines.join("\n\n");
  }
  return message;
};

export function SolicitacaoCompraForm({ open, onOpenChange }: SolicitacaoCompraFormProps) {
  const form = useForm<SolicitacaoCompraValues>({
    resolver: zodResolver(solicitacaoCompraSchema),
    defaultValues: {
      justificativa: "",
      temCodigo: false,
      materiais: [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materiais",
  });

  const temCodigo = form.watch("temCodigo");

  const handleAddMaterial = () => {
    append({ codigo: "", descricao: "", quantidade: 1 });
  };

  const handleSubmit = (data: SolicitacaoCompraValues) => {
    const message = formatMessage(data);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
    toast.success("Solicitação pronta para ser enviada no WhatsApp!");
  };

  const handleCopy = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Preencha o formulário corretamente antes de copiar.");
      return;
    }
    const data = form.getValues();
    const message = formatMessage(data);
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada para a área de transferência!");
    } catch (err) {
      console.error("Falha ao copiar texto: ", err);
      toast.error("Não foi possível copiar a mensagem.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Solicitar Compra ao ADM</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para solicitar a compra de um novo material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa de Aquisição</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva o motivo da necessidade do material..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temCodigo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Você tem o código do item?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {temCodigo && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-semibold">Materiais</h3>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddMaterial}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 p-2 border rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`materiais.${index}.codigo`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Código</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="3208120022"
                                maxLength={10}
                                onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`materiais.${index}.descricao`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Descrição</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ELETRODUTO PVC..."
                                onChange={e =>
                                  field.onChange(
                                    e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, ""),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`materiais.${index}.quantidade`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min="1" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.materiais?.root && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.materiais.root.message}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={!form.formState.isValid}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button type="submit">Solicitar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}