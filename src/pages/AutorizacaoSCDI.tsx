import { useState, useMemo, useEffect } from "react";
import { Plus, ShoppingCart, List, LayoutGrid, Filter } from "lucide-react";
import { AutorizacaoForm } from "@/components/AutorizacaoForm";
import { ProcessoCard } from "@/components/ProcessoCard";
import { Processo } from "@/types/processo";
import { Button } from "@/components/ui/button";
import SummaryPanel from "@/components/SummaryPanel";
import { SolicitacaoCompraForm } from "@/components/SolicitacaoCompraForm";
import { useProcessos } from "@/hooks/useProcessos";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ProcessosTable } from "@/components/ProcessosTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterStatus = "Todos" | "Pendente" | "Aguardando Entrega";

const AutorizacaoSCDI = () => {
  const { processos, isLoading, deleteProcesso, isDeleting, deletingId } = useProcessos();
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompraFormOpen, setIsCompraFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Todos");

  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('processosViewMode');
      return (savedMode === 'table' || savedMode === 'grid') ? savedMode : 'grid';
    }
    return 'grid';
  });

  const handleCreate = () => {
    setEditingProcesso(null);
    setIsFormOpen(true);
  };

  const handleEdit = (processo: Processo) => {
    setEditingProcesso(processo);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProcesso(id);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status as FilterStatus);
  };

  const filteredProcessos = useMemo(() => {
    if (filterStatus === "Todos") {
      return processos;
    }
    return processos.filter(processo => processo.status === filterStatus);
  }, [processos, filterStatus]);

  // Sincroniza o filtro da Select com o filtro dos Cards
  useEffect(() => {
    if (filterStatus !== "Todos" && !filteredProcessos.length && processos.length) {
      // Se o filtro atual não retornar resultados, mas houver processos,
      // podemos manter o filtro, mas o usuário pode querer resetar.
      // Não faremos reset automático, apenas garantimos que o estado está sincronizado.
    }
  }, [filterStatus, filteredProcessos.length, processos.length]);


  const ProcessoList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      );
    }

    if (filteredProcessos.length === 0) {
      return (
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            Nenhum processo encontrado com o filtro selecionado.
          </p>
        </div>
      );
    }
    
    const transitionClass = "transition-opacity duration-300 ease-in-out";

    if (viewMode === 'table') {
      return (
        <div className={transitionClass}>
          <ProcessosTable
            processos={filteredProcessos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deletingId={deletingId}
          />
        </div>
      );
    }

    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${transitionClass}`}>
        {filteredProcessos.map(processo => (
          <ProcessoCard
            key={processo.id}
            processo={processo}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={isDeleting && deletingId === processo.id}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-foreground">Autorização SCDI</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button className="gap-2 justify-center" onClick={() => setIsCompraFormOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              Solicita Compra ao ADM
            </Button>
            <Button className="gap-2 justify-center" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Nova Autorização SCDI
            </Button>
          </div>
        </div>

        <SummaryPanel 
          processos={processos} 
          currentFilter={filterStatus}
          onFilterChange={handleFilterChange}
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          {/* Filtro de Status */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterStatus}
              onValueChange={(value: FilterStatus) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Processos</SelectItem>
                <SelectItem value="Pendente">Pendente de Automação</SelectItem>
                <SelectItem value="Aguardando Entrega">Aguardando Entrega do Fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle de Visualização */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value: 'grid' | 'table') => {
              if (value) {
                setViewMode(value);
                localStorage.setItem('processosViewMode', value);
              }
            }}
            className="w-auto"
          >
            <ToggleGroupItem value="grid" aria-label="Visualização em Cards">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Visualização em Tabela">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <ProcessoList />

        <AutorizacaoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          isEditing={!!editingProcesso}
          processo={editingProcesso}
        />

        <SolicitacaoCompraForm open={isCompraFormOpen} onOpenChange={setIsCompraFormOpen} />
      </main>
    </div>
  );
};

export default AutorizacaoSCDI;