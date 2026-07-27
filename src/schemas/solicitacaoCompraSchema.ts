import * as z from "zod";

export const compraMaterialSchema = z.object({
  codigo: z
    .string()
    .min(1, "Código é obrigatório")
    .max(10, "O código deve ter no máximo 10 caracteres")
    .regex(/^\d+$/, "O código deve conter apenas números."),
  descricao: z
    .string()
    .min(1, "Descrição é obrigatória")
    .regex(/^[A-Z0-9\s]*$/, "A descrição deve conter apenas letras maiúsculas, números e espaços."),
  quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
});

export const solicitacaoCompraSchema = z
  .object({
    justificativa: z.string().min(10, "A justificativa deve ter pelo menos 10 caracteres."),
    temCodigo: z.boolean().default(false),
    materiais: z.array(compraMaterialSchema).optional(),
  })
  .refine(
    data => {
      if (data.temCodigo) {
        return data.materiais && data.materiais.length > 0;
      }
      return true;
    },
    {
      message: "Adicione pelo menos um material se a opção estiver marcada.",
      path: ["materiais"],
    },
  );

export type CompraMaterial = z.infer<typeof compraMaterialSchema>;
export type SolicitacaoCompraValues = z.infer<typeof solicitacaoCompraSchema>;