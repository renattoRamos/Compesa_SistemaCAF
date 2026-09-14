import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Processo } from "@/types/processo";
import { FormValues } from "@/schemas/autorizacaoSchema";
import { toast } from "sonner";

const STORAGE_KEY = "processos_caf_gpm";

// --- Types ---
export interface SaveProcessoData extends Omit<FormValues, 'dataProcesso'> {
  valorTotal: number;
  id?: string;
  dataProcesso: string;
}

// --- Helper Functions for localStorage ---
const getStoredProcessos = (): Processo[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Processo[];
  } catch (err) {
    console.error("Erro ao ler processos do localStorage:", err);
    return [];
  }
};

const saveStoredProcessos = (processos: Processo[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processos));
  } catch (err) {
    console.error("Erro ao salvar processos no localStorage:", err);
  }
};

// --- LocalStorage Async Handlers ---
const fetchProcessos = async (): Promise<Processo[]> => {
  return getStoredProcessos();
};

const saveProcesso = async (data: SaveProcessoData): Promise<Processo> => {
  const currentProcessos = getStoredProcessos();
  const { id, materiais, valorTotal, numeroRequisicao, numeroProcesso, coordenacao, aplicacao, dataProcesso } = data;

  const formattedMateriais = materiais.map(m => ({
    descricao: m.descricao,
    codigo: m.codigo,
    quantidade: m.quantidade,
    unidadeMedida: m.unidadeMedida,
    valorUnitario: m.valorUnitario,
    almoxarifado: m.almoxarifado,
    estoqueCD: m.estoqueCD,
    ataArp: m.ataArp,
  }));

  if (id) {
    // Editing existing process
    const index = currentProcessos.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error("Processo não encontrado para atualização.");
    }

    const updatedProcesso: Processo = {
      ...currentProcessos[index],
      numeroRequisicao,
      numeroProcesso,
      coordenacao,
      aplicacao,
      valorTotal,
      dataProcesso,
      materiais: formattedMateriais,
    };

    currentProcessos[index] = updatedProcesso;
    saveStoredProcessos(currentProcessos);
    return updatedProcesso;
  } else {
    // Creating new process
    const newProcesso: Processo = {
      id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numeroRequisicao,
      numeroProcesso,
      coordenacao,
      aplicacao,
      valorTotal,
      status: "Pendente",
      dataProcesso,
      materiais: formattedMateriais,
    };

    const updatedList = [newProcesso, ...currentProcessos];
    saveStoredProcessos(updatedList);
    return newProcesso;
  }
};

const deleteProcesso = async (id: string): Promise<void> => {
  const currentProcessos = getStoredProcessos();
  const updatedList = currentProcessos.filter(p => p.id !== id);
  saveStoredProcessos(updatedList);
};

const updateProcessoStatus = async ({
  processoId,
  status,
  prazoEntrega,
}: {
  processoId: string;
  status: Processo["status"];
  prazoEntrega?: string | null;
}): Promise<void> => {
  const currentProcessos = getStoredProcessos();
  const index = currentProcessos.findIndex(p => p.id === processoId);
  if (index !== -1) {
    currentProcessos[index] = {
      ...currentProcessos[index],
      status,
      prazoEntrega: prazoEntrega ?? null,
    };
    saveStoredProcessos(currentProcessos);
  } else {
    throw new Error("Processo não encontrado para atualização de status.");
  }
};

const bulkSetProcessos = async (newProcessos: Processo[]): Promise<Processo[]> => {
  saveStoredProcessos(newProcessos);
  return newProcessos;
};

// --- Custom Hook ---
export const useProcessos = () => {
  const queryClient = useQueryClient();

  const { data: processos, isLoading, error } = useQuery<Processo[], Error>({
    queryKey: ["processos"],
    queryFn: fetchProcessos,
  });

  const createOrUpdateMutation = useMutation<Processo, Error, SaveProcessoData>({
    mutationFn: saveProcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Processo salvo com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao salvar processo: ${err.message}`);
    },
  });

  const bulkImportMutation = useMutation<Processo[], Error, Processo[]>({
    mutationFn: bulkSetProcessos,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success(`${data.length} processos carregados com sucesso!`);
    },
    onError: (err) => {
      toast.error(`Erro ao carregar processos: ${err.message}`);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteProcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Processo excluído com sucesso!");
    },
    onError: (err) => {
      toast.error(`Erro ao excluir processo: ${err.message}`);
    },
  });

  const updateStatusMutation = useMutation<
    void,
    Error,
    { processoId: string; status: Processo["status"]; prazoEntrega?: string | null }
  >({
    mutationFn: updateProcessoStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Status do processo atualizado!");
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar status: ${err.message}`);
    },
  });

  return {
    processos: processos || [],
    isLoading,
    error,
    createOrUpdateProcesso: createOrUpdateMutation.mutate,
    isSaving: createOrUpdateMutation.isPending,
    deleteProcesso: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deletingId: deleteMutation.variables,
    updateProcessoStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    setAllProcessos: bulkImportMutation.mutateAsync,
    isBulkImporting: bulkImportMutation.isPending,
  };
};
