import { useState, useMemo, useEffect } from "react";
import { Plus, ShoppingCart, List, LayoutGrid, Filter, FileSpreadsheet, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
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
import { GoogleSheetsSyncModal } from "@/components/google-sheets/GoogleSheetsSyncModal";
import { GoogleSheetsSyncButton } from "@/components/google-sheets/GoogleSheetsSyncButton";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterStatus = "Todos" | "Pendente" | "Aguardando Entrega";

const AutorizacaoSCDI = () => {
  const { processos, isLoading, deleteProcesso, isDeleting, deletingId, setAllProcessos } = useProcessos();
  const {
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    lastSyncTime,
    isAuthenticated,
    isSyncing,
    syncProcessos,
  } = useGoogleSheets();

  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompraFormOpen, setIsCompraFormOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
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
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <GoogleSheetsSyncButton onClick={() => setIsSheetsModalOpen(true)} />
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

        {/* Banner Informativo e Guia de Planilha Google */}
        <div className="mb-6">
          {spreadsheetId ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                      Planilha Google Vinculada:
                    </span>
                    <span className="text-xs font-bold text-foreground">{spreadsheetTitle}</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/40 border-emerald-300 font-normal">
                      Google Sheets
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lastSyncTime
                      ? `Última sincronização com o Google Drive realizada em: ${lastSyncTime}`
                      : "Planilha pronta para receber os dados dos processos SCDI e seus materiais."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                {spreadsheetUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs h-8 gap-1.5 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/50 text-emerald-900 dark:text-emerald-300"
                  >
                    <a href={spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Planilha
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="text-xs h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerenciar / Sincronizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Armazenamento e Backup na Planilha Google
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl">
                    Conecte sua conta Google para gerar automaticamente a planilha com 2 abas (&quot;Processos SCDI&quot; e &quot;Itens dos Processos&quot;) e manter tudo sincronizado na nuvem.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setIsSheetsModalOpen(true)}
                className="text-xs h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 self-end md:self-auto"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Conectar Planilha Google
              </Button>
            </div>
          )}
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

        <GoogleSheetsSyncModal
          open={isSheetsModalOpen}
          onOpenChange={setIsSheetsModalOpen}
          processos={processos}
          onImportProcessos={setAllProcessos}
        />
      </main>
    </div>
  );
};

export default AutorizacaoSCDI;