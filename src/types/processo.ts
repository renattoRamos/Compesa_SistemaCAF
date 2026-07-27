export interface Processo {
  id: string;
  numeroRequisicao: string;
  numeroProcesso: string;
  coordenacao: string;
  aplicacao: string;
  valorTotal: number;
  status: "Pendente" | "Aprovado" | "Rejeitado" | "Aguardando Entrega";
  prazoEntrega?: string | null;
  dataProcesso: string; // Armazenado como string (ISO date YYYY-MM-DD)
  materiais: Array<{
    descricao: string;
    codigo: string;
    quantidade: number;
    unidadeMedida: string;
    valorUnitario: number;
    almoxarifado: string;
    estoqueCD: string;
    ataArp: string;
  }>;
}