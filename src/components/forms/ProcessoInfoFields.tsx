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
import { FormValues, formatBRL } from "@/schemas/autorizacaoSchema";
import { DatePickerField } from "./DatePickerField";

interface ProcessoInfoFieldsProps {
  form: UseFormReturn<FormValues>;
  valorTotal: number;
}

export function ProcessoInfoFields({ form, valorTotal }: ProcessoInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Informações do Processo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <FormLabel>Nº da Requisição</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="000000"
                  maxLength={6}
                  onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                  className="border-primary/40"
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
              <FormLabel>Nº do Processo SCDI</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="000000"
                  maxLength={6}
                  onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                  className="border-primary/40"
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
              <FormLabel>Coordenação</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-primary/40">
                    <SelectValue placeholder="Selecione a coordenação" />
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
            <FormLabel>Aplicação</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Descreva a aplicação..."
                rows={3}
                className="border-primary/40"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium text-foreground">
          Valor Total: {formatBRL(valorTotal)}
        </p>
      </div>
    </div>
  );
}