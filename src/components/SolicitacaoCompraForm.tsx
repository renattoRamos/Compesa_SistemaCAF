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
      <DialogContent className="max-w-2xl sm:max-w-3xl p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <DialogTitle className="text-lg font-bold">Solicitar Compra ao ADM</DialogTitle>
          <DialogDescription className="text-xs">
            Preencha as informações abaixo para solicitar a compra de um novo material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-1">
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
                      rows={3}
                      className="text-sm min-h-[70px] resize-y"
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-muted/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel className="cursor-pointer font-medium text-xs">Você tem o código do item?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {temCodigo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Materiais</h3>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddMaterial} className="h-7 text-xs px-2.5">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2.5 border rounded-md bg-card">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 items-end">
                      <div className="sm:col-span-3">
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
                                  className="h-8 text-xs px-2"
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-6">
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
                                  className="h-8 text-xs px-2"
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <FormField
                          control={form.control}
                          name={`materiais.${index}.quantidade`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quantidade</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} min="1" className="h-8 text-xs px-2" />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.materiais?.root && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.materiais.root.message}
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!form.formState.isValid}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar Textos
              </Button>
              <Button type="submit" size="sm">Solicitar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}