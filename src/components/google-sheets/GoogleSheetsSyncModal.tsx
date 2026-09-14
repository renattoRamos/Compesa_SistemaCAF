import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Link2,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
  LogOut,
  Info,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Processo } from "@/types/processo";

interface GoogleSheetsSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processos: Processo[];
  onImportProcessos?: (processos: Processo[]) => Promise<unknown>;
}

export function GoogleSheetsSyncModal({
  open,
  onOpenChange,
  processos,
  onImportProcessos,
}: GoogleSheetsSyncModalProps) {
  const {
    user,
    isAuthenticated,
    isSigningIn,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    lastSyncTime,
    isSyncing,
    isImporting,
    isCreatingSheet,
    autoSync,
    login,
    logout,
    createSpreadsheet,
    connectSpreadsheet,
    disconnectSpreadsheet,
    syncProcessos,
    importProcessos,
    setAutoSync,
  } = useGoogleSheets();

  const [inputUrl, setInputUrl] = useState("");
  const [activeTab, setActiveTab] = useState<string>("sync");
  const [newSheetTitle, setNewSheetTitle] = useState("Processos SCDI - CAF GPM");

  // Estados dos Diálogos de Confirmação Obrigatórios (Workspace Skill Mandatory)
  const [showSyncConfirmDialog, setShowSyncConfirmDialog] = useState(false);
  const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);
  const [pendingImportList, setPendingImportList] = useState<Processo[] | null>(null);

  const totalItens = processos.reduce(
    (acc, p) => acc + (p.materiais ? p.materiais.length : 0),
    0
  );

  const handleCreateNew = async () => {
    try {
      await createSpreadsheet(newSheetTitle);
    } catch (e) {
      // toast já disparado no hook
    }
  };

  const handleConnectExisting = async () => {
    if (!inputUrl.trim()) return;
    const ok = await connectSpreadsheet(inputUrl);
    if (ok) {
      setInputUrl("");
    }
  };

  // Dispara sincronização após confirmação do usuário
  const handleExecuteSync = async () => {
    setShowSyncConfirmDialog(false);
    await syncProcessos(processos);
  };

  // Dispara leitura e abre confirmação antes de sobrescrever processos locais
  const handleStartImport = async () => {
    const list = await importProcessos();
    if (list && list.length > 0) {
      setPendingImportList(list);
      setShowImportConfirmDialog(true);
    }
  };

  const handleConfirmImport = async () => {
    if (pendingImportList && onImportProcessos) {
      await onImportProcessos(pendingImportList);
      setPendingImportList(null);
    }
    setShowImportConfirmDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto p-6 gap-5">
          {/* Header */}
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Armazenamento no Google Sheets
                    {spreadsheetId && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-normal">
                        Conectado
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Sincronize, salve e faça backup de todos os seus processos SCDI e itens diretamente na sua conta Google.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Estado de Autenticação */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-4 transition-all">
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-[420px]">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    1º Passo: Conecte sua Conta Google
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Conceda permissão para que o sistema possa criar e atualizar a planilha no seu Google Drive com total segurança e controle seu.
                  </p>
                </div>

                <Button
                  id="btn-google-signin"
                  onClick={login}
                  disabled={isSigningIn}
                  className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 shadow-sm font-medium text-xs px-4 py-2.5 h-auto rounded-lg flex items-center gap-2.5 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  {isSigningIn ? "Conectando..." : "Entrar com Google"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Usuário"}
                      className="h-10 w-10 rounded-full border border-border"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {user?.displayName || "Usuário Conectado"}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Desconectar
                </Button>
              </div>
            )}
          </div>

          {/* Abas de Gerenciamento */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="sync" className="text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Sincronizar
              </TabsTrigger>
              <TabsTrigger value="config" className="text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Vincular Planilha
              </TabsTrigger>
              <TabsTrigger value="guide" className="text-xs">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Como Funciona
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: SINCRONIZAÇÃO */}
            <TabsContent value="sync" className="space-y-4 mt-4">
              {/* Card da Planilha Vinculada */}
              {spreadsheetId ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        Planilha Ativa no Google Sheets
                      </span>
                      <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                        {spreadsheetTitle}
                      </h4>
                    </div>

                    {spreadsheetUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-background text-xs gap-1.5 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
                      >
                        <a href={spreadsheetUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir no Google Sheets
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Processos no App:</span>
                      <span className="font-semibold text-foreground">{processos.length} processos</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Itens/Materiais:</span>
                      <span className="font-semibold text-foreground">{totalItens} itens</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground block text-[11px]">Última Sincronização:</span>
                      <span className="font-medium text-foreground">
                        {lastSyncTime || "Ainda não sincronizado"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                  <FileSpreadsheet className="h-9 w-9 mx-auto text-muted-foreground/60" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Nenhuma planilha do Google vinculada ainda
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Crie uma planilha oficial formatada com 1 clique ou informe o link de uma planilha existente para começar.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("config")}
                    className="text-xs gap-1.5"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Configurar Planilha
                  </Button>
                </div>
              )}

              {/* Botões de Ação de Sincronização */}
              {spreadsheetId && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Enviar para o Sheets */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-foreground">
                          Enviar para Planilha
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Grava todos os {processos.length} processos cadastrados nas abas &quot;Processos SCDI&quot; e &quot;Itens dos Processos&quot;.
                      </p>
                      <Button
                        id="btn-sync-to-sheet"
                        onClick={() => setShowSyncConfirmDialog(true)}
                        disabled={isSyncing || !isAuthenticated}
                        className="w-full text-xs gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
                      </Button>
                    </div>

                    {/* Importar do Sheets */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                      <div className="flex items-center gap-2">
                        <DownloadCloud className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          Importar da Planilha
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Lê os dados existentes na planilha do Google e atualiza a lista de processos no seu aplicativo.
                      </p>
                      <Button
                        id="btn-import-from-sheet"
                        variant="outline"
                        onClick={handleStartImport}
                        disabled={isImporting || !isAuthenticated}
                        className="w-full text-xs gap-2"
                      >
                        <DownloadCloud className={`h-3.5 w-3.5 ${isImporting ? "animate-spin" : ""}`} />
                        {isImporting ? "Lendo Planilha..." : "Importar do Google"}
                      </Button>
                    </div>
                  </div>

                  {/* Toggle de Auto-Sincronização */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync-toggle" className="text-xs font-semibold cursor-pointer">
                        Sincronização Automática
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Ao cadastrar ou atualizar processos no sistema, sincronizar com a planilha automaticamente.
                      </p>
                    </div>
                    <Switch
                      id="auto-sync-toggle"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 2: VINCULAR / CRIAR PLANILHA */}
            <TabsContent value="config" className="space-y-4 mt-4">
              {/* Opção A: Criar Nova Planilha Formatada */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Opção 1: Criar Nova Planilha Formatada (Recomendado)
                    </h4>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Pronto para uso</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gera automaticamente no seu Google Drive uma planilha completa, com cabeçalhos profissionais, colunas congeladas e 2 abas estruturadas (&quot;Processos SCDI&quot; e &quot;Itens dos Processos&quot;).
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Input
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="Nome da planilha"
                    className="text-xs"
                  />
                  <Button
                    id="btn-create-sheet"
                    onClick={handleCreateNew}
                    disabled={isCreatingSheet || !isAuthenticated}
                    className="text-xs gap-1.5 whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {isCreatingSheet ? "Criando..." : "Criar no Meu Drive"}
                  </Button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-xs text-muted-foreground font-medium uppercase">
                  ou
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Opção B: Vincular Planilha Existente */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Opção 2: Conectar Planilha Google Existente
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Já possui uma planilha no Google Sheets compartilhada com você ou criada anteriormente? Cole o link ou ID dela abaixo.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Input
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Cole o link ou ID da planilha (ex: https://docs.google.com/spreadsheets/d/...)"
                    className="text-xs"
                  />
                  <Button
                    id="btn-connect-sheet"
                    variant="outline"
                    onClick={handleConnectExisting}
                    disabled={isSyncing || !inputUrl.trim() || !isAuthenticated}
                    className="text-xs gap-1.5 whitespace-nowrap"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Vincular
                  </Button>
                </div>
              </div>

              {spreadsheetId && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectSpreadsheet}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Desvincular Planilha Atual
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ABA 3: GUIA EXPLICATIVO */}
            <TabsContent value="guide" className="space-y-3 mt-4 text-xs">
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  Como os dados dos Processos SCDI são organizados na Planilha
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Para máxima clareza e facilidade de relatórios no Excel ou Google Sheets, a planilha é estruturada em duas abas integradas:
                </p>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5 text-emerald-600" />
                      Aba 1: &quot;Processos SCDI&quot; (Visão Geral)
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Contém uma linha para cada processo cadastrado: ID, Nº Requisição, Nº Processo, Coordenação, Aplicação, Data, Valor Total (R$), Status atual, Prazo de entrega e quantidade de itens.
                    </p>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                    <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      Aba 2: &quot;Itens dos Processos&quot; (Detalhamento dos Materiais)
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-1">
                      Cada linha corresponde a um item/material: Código, Descrição completa, Quantidade, Unidade de Medida, Valor Unitário, Valor Total do item, Almoxarifado, Estoque CD e Ata ARP.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-foreground text-xs mb-1">Dicas Úteis:</p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                    <li>Você pode compartilhar a planilha Google criada com membros da sua equipe no Google Drive.</li>
                    <li>Qualquer usuário com permissão de edição na planilha poderá ter os dados sincronizados.</li>
                    <li>Você pode filtrar, gerar gráficos e tabelas dinâmicas diretamente no Google Sheets.</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO OBRIGATÓRIO PARA SINCRONIZAÇÃO (Workspace Skill Mandatory) */}
      <AlertDialog open={showSyncConfirmDialog} onOpenChange={setShowSyncConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-600" />
              Confirmar Sincronização com o Google Sheets
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <span>
                Esta operação irá atualizar os dados na planilha{" "}
                <strong className="text-foreground">&quot;{spreadsheetTitle}&quot;</strong>.
              </span>
              <div className="p-3 bg-muted rounded-md text-foreground font-medium space-y-1 my-2">
                <p>• {processos.length} processos serão gravados na aba &quot;Processos SCDI&quot;</p>
                <p>• {totalItens} materiais/itens serão detalhados na aba &quot;Itens dos Processos&quot;</p>
              </div>
              <span>Os dados existentes nas abas serão atualizados com as informações mais recentes do aplicativo. Deseja prosseguir?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSync}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Confirmar e Sincronizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO DE CONFIRMAÇÃO PARA IMPORTAÇÃO DO GOOGLE SHEETS */}
      <AlertDialog open={showImportConfirmDialog} onOpenChange={setShowImportConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DownloadCloud className="h-5 w-5 text-primary" />
              Confirmar Importação de Processos
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <span>
                Foram localizados <strong className="text-foreground">{pendingImportList?.length || 0} processos</strong> na sua planilha Google.
              </span>
              <p className="text-muted-foreground">
                Deseja carregar esses dados no aplicativo agora? Isso atualizará a lista de processos cadastrados localmente com os dados da planilha.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImportList(null)} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} className="text-xs">
              Sim, Importar Dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
