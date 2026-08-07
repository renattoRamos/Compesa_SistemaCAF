import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormValues, formatBRL } from "@/schemas/autorizacaoSchema";
import { DatePickerField } from "./DatePickerField";
import { FileText, Hash, Building2, HelpCircle, Sparkles, Tag } from "lucide-react";

interface ProcessoInfoFieldsProps {
  form: UseFormReturn<FormValues>;
  valorTotal: number;
}

const APLICACAO_PRESETS = [
  "Manutenção Preventiva",
  "Manutenção Corretiva",
  "Suprimento de Estoque",
  "Atendimento Emergencial",
  "Apoio Operacional",
];

export function ProcessoInfoFields({ form, valorTotal }: ProcessoInfoFieldsProps) {
  const applyPreset = (preset: string) => {
    const currentValue = form.getValues("aplicacao") || "";
    if (!currentValue) {
      form.setValue("aplicacao", preset, { shouldValidate: true, shouldDirty: true });
    } else if (!currentValue.includes(preset)) {
      form.setValue("aplicacao", `${currentValue} - ${preset}`, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div className="space-y-4 bg-card/60 p-4 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Informações Básicas do Processo</h3>
            <p className="text-xs text-muted-foreground">Identificação e atribuição da autorização</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/20 w-fit">
          <span className="text-muted-foreground">Valor Estimado Total:</span>
          <span className="font-bold text-sm text-primary">{formatBRL(valorTotal)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <DatePickerField
          control={form.control}
          name="dataProcesso"
          label="Data do Processo"
        />

        <FormField
          control={form.control}
          name="numeroRequisicao"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Nº da Requisição
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Número de até 6 dígitos da requisição no sistema interno.</TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: 123456"
                  maxLength={6}
                  onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                  className="border-input text-sm h-9 font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numeroProcesso"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Nº do Processo SCDI
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Número de até 6 dígitos do processo registrado no SCDI.</TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: 654321"
                  maxLength={6}
                  onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                  className="border-input text-sm h-9 font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coordenacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Coordenação
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-input text-sm h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CMA NORTE">CMA NORTE</SelectItem>
                  <SelectItem value="CMA SUL">CMA SUL</SelectItem>
                  <SelectItem value="CMA OESTE">CMA OESTE</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="aplicacao"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Aplicação / Finalidade
              </FormLabel>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Sugestões rápidas</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pb-1">
              {APLICACAO_PRESETS.map(preset => (
                <Badge
                  key={preset}
                  variant="outline"
                  className="text-[11px] font-normal cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors py-0.5 px-2"
                  onClick={() => applyPreset(preset)}
                >
                  + {preset}
                </Badge>
              ))}
            </div>

            <FormControl>
              <Textarea
                {...field}
                placeholder="Descreva a aplicação, destino ou justificativa do material..."
                rows={2}
                className="border-input text-sm min-h-[60px] resize-y"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}