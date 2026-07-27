import * as z from "zod";

export const lancamentoNFSchema = z.object({
  cnpj: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, "");
      return digits.length === 0 || digits.length === 14;
    }, "CNPJ inválido. Digite os 14 números do CNPJ."),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória."),
  idFornecedor: z
    .string()
    .min(1, "ID do Fornecedor é obrigatório.")
    .regex(/^\d+$/, "ID do Fornecedor deve conter apenas números.")
    .max(10, "ID do Fornecedor deve ter no máximo 10 caracteres."),
  numeroNota: z.string().min(1, "Nº da nota é obrigatório."),
  oc: z.string().min(1, "OC é obrigatória."),
  scdi: z
    .string()
    .max(5, "SCDI deve ter no máximo 5 caracteres.")
    .regex(/^\d+$/, "SCDI deve conter apenas números.")
    .min(1, "SCDI é obrigatório."),
  valorTotal: z.number({ required_error: "Valor total é obrigatório." }).min(0.01, "Valor total deve ser maior que zero."),
  sei: z.string().min(1, "SEI é obrigatório."),
  tipoNota: z.enum(["Compra de Material", "Serviço", "Locação"], {
    required_error: "Selecione um tipo de nota.",
  }),
});

export type LancamentoNFValues = z.infer<typeof lancamentoNFSchema>;
