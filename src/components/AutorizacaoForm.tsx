import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Processo } from "@/types/processo";
import {
  formSchema,
  FormValues,
  MaterialInForm,
  createNewMaterial,
  formatBRL,
} from "@/schemas/autorizacaoSchema";
import { ProcessoInfoFields } from "./forms/ProcessoInfoFields";
import { MaterialTable } from "./forms/MaterialTable";
import { useProcessos } from "@/hooks/useProcessos";
import {
  Loader2,
  FileText,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Hash,
  Calendar as CalendarIcon,
  Save,
  Info,
} from "lucide-react";
import { format } from "date-fns";

interface AutorizacaoFormProps {
  processo?: Processo | null;
  isEditing?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutorizacaoForm({
  processo,
  isEditing = false,
  open,
  onOpenChange,
}: AutorizacaoFormProps) {
  const { createOrUpdateProcesso, isSaving } = useProcessos();
  const [activeTab, setActiveTab] = useState<string>("dados");
  const [materiais, setMateriais] = useState<MaterialInForm[]>(() => [createNewMaterial()]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataProcesso: new Date(),
      numeroRequisicao: "",
      numeroProcesso: "",
      coordenacao: "CMA SUL",
      aplicacao: "",
      materiais: [],
    },
  });

  useEffect(() => {
    if (open) {
      setActiveTab("dados");
      if (isEditing && processo) {
        const processoMateriais: MaterialInForm[] = processo.materiais.map(m => ({
          ...m,
          tempId: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          unidadeMedida: (m.unidadeMedida || "un") as MaterialInForm["unidadeMedida"],
          almoxarifado: (m.almoxarifado as "disponivel" | "indisponivel") || "indisponivel",
          estoqueCD: (m.estoqueCD as "disponivel" | "indisponivel") || "indisponivel",
          ataArp: (m.ataArp as "disponivel" | "indisponivel"),
        }));
        setMateriais(processoMateriais);
        form.reset({
          dataProcesso: new Date(`${processo.dataProcesso}T00:00:00`),
          numeroRequisicao: processo.numeroRequisicao,
          numeroProcesso: processo.numeroProcesso,
          coordenacao: processo.coordenacao as FormValues["coordenacao"],
          aplicacao: processo.aplicacao,
          materiais: processoMateriais,
        });
      } else {
        const initialMaterial = createNewMaterial();
        form.reset({
          dataProcesso: new Date(),
          numeroRequisicao: "",
          numeroProcesso: "",
          coordenacao: "CMA SUL",
          aplicacao: "",
          materiais: [initialMaterial],
        });
        setMateriais([initialMaterial]);
      }
    }
  }, [isEditing, processo, form, open]);

  const calcularValorTotal = () => {
    return materiais.reduce((total, material) => {
      return total + material.quantidade * material.valorUnitario;
    }, 0);
  };

  const valorTotal = calcularValorTotal();

  const handleSubmit = useCallback(
    (data: FormValues) => {
      createOrUpdateProcesso(
        {
          ...data,
          valorTotal,
          id: processo?.id,
          dataProcesso: data.dataProcesso.toISOString().split("T")[0],
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    },
    [createOrUpdateProcesso, valorTotal, processo?.id, onOpenChange],
  );

  // Keyboard shortcut Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && open && !isSaving) {
        e.preventDefault();
        form.handleSubmit(handleSubmit)();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSaving, form, handleSubmit]);

  // Availability stats for preview tab
  const statsEstoque = useMemo(() => {
    const total = materiais.length;
    const almoxDisp = materiais.filter(m => m.almoxarifado === "disponivel").length;
    const cdDisp = materiais.filter(m => m.estoqueCD === "disponivel").length;
    const ataDisp = materiais.filter(m => m.ataArp === "disponivel").length;
    return { total, almoxDisp, cdDisp, ataDisp };
  }, [materiais]);

  const reqNum = form.watch("numeroRequisicao");
  const procNum = form.watch("numeroProcesso");
  const coord = form.watch("coordenacao");
  const dataProc = form.watch("dataProcesso");
  const aplicacao = form.watch("aplicacao");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-[1300px] xl:max-w-[1450px] w-full overflow-y-auto max-h-[92vh] xl:max-h-[88vh] p-4 sm:p-6 lg:p-7 gap-5">
        {/* Header */}
        <DialogHeader className="pb-3 border-b border-border space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2.5">
                  <span>{isEditing ? "Editar" : "Solicitar"} Autorização SCDI</span>
                  <Badge variant={isEditing ? "secondary" : "default"} className="text-xs font-normal px-2.5 py-0.5">
                    {isEditing ? "Modo Edição" : "Novo Processo"}
                  </Badge>
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Preencha os dados requisitados para automação do processo no sistema SCDI.
                </p>
              </div>
            </div>

            {/* Quick Header Summary Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs sm:text-sm py-1.5 px-3 font-semibold border-primary/20 bg-primary/5 text-primary">
                Valor Total: {formatBRL(valorTotal)}
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm py-1.5 px-3 font-medium">
                {materiais.length} {materiais.length === 1 ? "Item" : "Itens"}
              </Badge>
              {coord && (
                <Badge variant="outline" className="text-xs sm:text-sm py-1.5 px-3">
                  {coord}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto h-11 mb-5 bg-muted/80 p-1 rounded-xl">
                <TabsTrigger value="dados" className="text-xs sm:text-sm gap-2 font-semibold rounded-lg">
                  <FileText className="h-4 w-4" />
                  1. Dados do Processo
                </TabsTrigger>

                <TabsTrigger value="materiais" className="text-xs sm:text-sm gap-2 font-semibold rounded-lg relative">
                  <Package className="h-4 w-4" />
                  2. Materiais
                  <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary text-[11px] rounded-full font-bold">
                    {materiais.length}
                  </span>
                </TabsTrigger>

                <TabsTrigger value="resumo" className="text-xs sm:text-sm gap-2 font-semibold rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  3. Resumo & Revisão
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: DADOS GERAIS */}
              <TabsContent value="dados" className="space-y-4 focus-visible:outline-hidden mt-0">
                <ProcessoInfoFields form={form} valorTotal={valorTotal} />

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("materiais")}
                    className="gap-1.5 text-xs h-9"
                  >
                    Avançar para Materiais <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: MATERIAIS */}
              <TabsContent value="materiais" className="space-y-4 focus-visible:outline-hidden mt-0">
                <MaterialTable
                  materiais={materiais}
                  setMateriais={setMateriais}
                  form={form}
                />

                <div className="flex justify-between items-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("dados")}
                    className="gap-1.5 text-xs h-9"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar: Dados
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setActiveTab("resumo")}
                    className="gap-1.5 text-xs h-9"
                  >
                    Avançar para Resumo <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 3: RESUMO & REVISÃO */}
              <TabsContent value="resumo" className="space-y-4 focus-visible:outline-hidden mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Dados do Processo */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Dados Cadastrados</h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> Data:
                        </span>
                        <span className="font-semibold">{dataProc ? format(dataProc, "dd/MM/yyyy") : "-"}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Nº Requisição:
                        </span>
                        <span className="font-mono font-semibold">{reqNum || "Não informado"}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Nº Processo SCDI:
                        </span>
                        <span className="font-mono font-semibold">{procNum || "Não informado"}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Coordenação:
                        </span>
                        <span className="font-semibold">{coord}</span>
                      </div>

                      <div className="pt-1">
                        <span className="text-muted-foreground block mb-1">Aplicação:</span>
                        <p className="p-2 bg-muted/50 rounded-md text-foreground italic text-[11px] min-h-[40px]">
                          {aplicacao || "Nenhuma aplicação informada."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Análise do Estoque */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <Package className="h-4 w-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Status de Disponibilidade</h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Almoxarifado</span>
                          <span className="font-semibold">{statsEstoque.almoxDisp} de {statsEstoque.total} disp.</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${statsEstoque.total > 0 ? (statsEstoque.almoxDisp / statsEstoque.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Estoque CD</span>
                          <span className="font-semibold">{statsEstoque.cdDisp} de {statsEstoque.total} disp.</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${statsEstoque.total > 0 ? (statsEstoque.cdDisp / statsEstoque.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Ata ARP</span>
                          <span className="font-semibold">{statsEstoque.ataDisp} de {statsEstoque.total} disp.</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${statsEstoque.total > 0 ? (statsEstoque.ataDisp / statsEstoque.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] flex items-start gap-1.5 mt-2">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Confira se todos os itens e preços estão corretos antes de salvar.</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Resumo Financeiro */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wide">Resumo Financeiro</h4>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Total de Linhas:</span>
                          <span className="font-bold">{materiais.length}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Qtd. Total de Peças/Unidades:</span>
                          <span className="font-bold">
                            {materiais.reduce((acc, m) => acc + (m.quantidade || 0), 0)}
                          </span>
                        </div>
                        <div className="pt-2">
                          <span className="text-muted-foreground block text-[11px]">Valor Total do Processo:</span>
                          <span className="text-xl font-extrabold text-primary font-mono block">
                            {formatBRL(valorTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full gap-2 h-10 font-bold text-xs"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando Autorização...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Confirmar e Salvar Autorização
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("materiais")}
                    className="gap-1.5 text-xs h-9"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar: Materiais
                  </Button>

                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Dica: Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Ctrl + Enter</kbd> para salvar de qualquer aba.
                  </span>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-border mt-2">
              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span>Atalho:</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono">Ctrl + Enter</kbd>
                <span>para salvar</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="h-9 text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 text-xs font-semibold gap-1.5 px-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Salvar Processo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

