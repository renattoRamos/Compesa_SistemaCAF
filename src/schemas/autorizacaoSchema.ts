import * as z from "zod";

export const materialSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  codigo: z
    .string()
    .min(1, "Código é obrigatório")
    .max(10, "Código deve ter no máximo 10 caracteres")
    .regex(/^\d+$/, "Código deve conter apenas números"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que 0"),
  unidadeMedida: z.enum(["un", "m", "m2", "m3", "cx", "pc", "ml", "l"]),
  valorUnitario: z.number().min(0.01, "Valor deve ser maior que 0"),
  almoxarifado: z.enum(["disponivel", "indisponivel"], {
    required_error: "Almoxarifado é obrigatório",
  }),
  estoqueCD: z.enum(["disponivel", "indisponivel"]),
  ataArp: z.enum(["disponivel", "indisponivel"]),
});

export const formSchema = z.object({
  numeroRequisicao: z
    .string()
    .min(1, "Número da requisição é obrigatório")
    .max(6, "Nº da Requisição deve ter no máximo 6 caracteres")
    .regex(/^\d+$/, "Nº da Requisição deve conter apenas números"),
  numeroProcesso: z
    .string()
    .min(1, "Número do processo é obrigatório")
    .max(6, "Nº do Processo deve ter no máximo 6 caracteres")
    .regex(/^\d+$/, "Nº do Processo deve conter apenas números"),
  coordenacao: z.enum(["CMA NORTE", "CMA SUL", "CMA OESTE"]),
  aplicacao: z.string().min(1, "Aplicação é obrigatória"),
  dataProcesso: z.date({
    required_error: "A data do processo é obrigatória.",
  }),
  materiais: z.array(materialSchema).min(1, "Adicione pelo menos um material"),
});

export type FormValues = z.infer<typeof formSchema>;
export type Material = z.infer<typeof materialSchema>;
// MaterialInForm includes a temporary ID for stable list rendering in React
export type MaterialInForm = Material & { tempId: string };

export const formatBRL = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const createNewMaterial = (): MaterialInForm => ({
  tempId: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  descricao: "",
  codigo: "",
  quantidade: 1,
  unidadeMedida: "un",
  valorUnitario: 0,
  almoxarifado: "indisponivel",
  estoqueCD: "indisponivel",
  ataArp: "indisponivel",
});

export const cloneMaterial = (material: MaterialInForm): MaterialInForm => ({
  ...material,
  tempId: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
});