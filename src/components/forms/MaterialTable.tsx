import React, { useRef, useState, useMemo } from "react";
import { Plus, Trash2, Upload, Download, Copy, Search, SlidersHorizontal, Package, Check, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Material,
  MaterialInForm,
  formatBRL,
  createNewMaterial,
  cloneMaterial,
  materialSchema,
  FormValues,
} from "@/schemas/autorizacaoSchema";
import { UseFormReturn } from "react-hook-form";
import { ZodError } from "zod";

interface MaterialTableProps {
  materiais: MaterialInForm[];
  setMateriais: React.Dispatch<React.SetStateAction<MaterialInForm[]>>;
  form: UseFormReturn<FormValues>;
}

export function MaterialTable({ materiais, setMateriais, form }: MaterialTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const adicionarMaterial = () => {
    const novoMaterial = createNewMaterial();
    const novosMateriais = [...materiais, novoMaterial];
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true, shouldDirty: true });
  };

  const adicionarCincoMateriais = () => {
    const novos = Array.from({ length: 5 }, () => createNewMaterial());
    const novosMateriais = [...materiais, ...novos];
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true, shouldDirty: true });
    toast.success("5 novos itens adicionados à tabela.");
  };

  const duplicarMaterial = (tempId: string) => {
    const itemToClone = materiais.find(m => m.tempId === tempId);
    if (!itemToClone) return;
    const cloned = cloneMaterial(itemToClone);
    const index = materiais.findIndex(m => m.tempId === tempId);
    const novos = [...materiais];
    novos.splice(index + 1, 0, cloned);
    setMateriais(novos);
    form.setValue("materiais", novos, { shouldValidate: true, shouldDirty: true });
    toast.info("Item duplicado com sucesso.");
  };

  const removerMaterial = (tempId: string) => {
    if (materiais.length > 1) {
      const novosMateriais = materiais.filter(m => m.tempId !== tempId);
      setMateriais(novosMateriais);
      form.setValue("materiais", novosMateriais, { shouldValidate: true, shouldDirty: true });
    } else {
      toast.error("O processo deve ter pelo menos um material cadastrado.");
    }
  };

  const atualizarMaterial = (tempId: string, campo: keyof Material, valor: string | number) => {
    const novosMateriais = materiais.map(m =>
      m.tempId === tempId ? { ...m, [campo]: valor } : m,
    );
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true, shouldDirty: true });
  };

  const aplicarStatusEmLote = (campo: "almoxarifado" | "estoqueCD" | "ataArp", valor: "disponivel" | "indisponivel") => {
    const novosMateriais = materiais.map(m => ({
      ...m,
      [campo]: valor,
    }));
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true, shouldDirty: true });
    
    const campoNome = campo === "almoxarifado" ? "Almoxarifado" : campo === "estoqueCD" ? "Estoque CD" : "ATA/ARP";
    toast.success(`Todos os itens tiveram ${campoNome} alterado para "${valor === "disponivel" ? "Disponível" : "Indisponível"}".`);
  };

  const limparLinhasVazias = () => {
    if (materiais.length <= 1) return;
    const novos = materiais.filter(m => m.descricao.trim() !== "" || m.codigo.trim() !== "" || m.valorUnitario > 0);
    const resultado = novos.length > 0 ? novos : [createNewMaterial()];
    setMateriais(resultado);
    form.setValue("materiais", resultado, { shouldValidate: true, shouldDirty: true });
    toast.info("Linhas vazias removidas.");
  };

  const downloadModeloXLSX = () => {
    const sampleData = [
      {
        "Cód Mat": "102030",
        "Descr Material": "CABO DE COBRE FLEXIVEL 2.5MM2 AZUL",
        "UM Tít": "m",
        "Quantidade": 100,
        "Preço/Base": 4.50,
      },
      {
        "Cód Mat": "102031",
        "Descr Material": "DISJUNTOR MONOPOLAR 20A DIN",
        "UM Tít": "un",
        "Quantidade": 15,
        "Preço/Base": 18.90,
      },
      {
        "Cód Mat": "102032",
        "Descr Material": "CAIXA DE PASSAGEM EMBUTIR 4X2",
        "UM Tít": "un",
        "Quantidade": 30,
        "Preço/Base": 3.20,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Materiais");
    XLSX.writeFile(workbook, "Modelo_Importacao_Materiais_SCDI.xlsx");
    toast.success("Modelo XLSX baixado com sucesso!");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          toast.error("A planilha selecionada não contém dados.", {
            description: "Arquivo vazio",
          });
          return;
        }

        const findHeaderKey = (row: Record<string, unknown>, expectedHeader: string) => {
          return Object.keys(row).find(key => key.trim().toLowerCase() === expectedHeader.toLowerCase());
        };

        const firstRow = jsonData[0];
        const headerMapping = {
          codigo: findHeaderKey(firstRow, "Cód Mat"),
          descricao: findHeaderKey(firstRow, "Descr Material"),
          unidadeMedida: findHeaderKey(firstRow, "UM Tít"),
          quantidade: findHeaderKey(firstRow, "Quantidade"),
          valorUnitario: findHeaderKey(firstRow, "Preço/Base"),
        };

        if (Object.values(headerMapping).some(key => !key)) {
          toast.error("O arquivo não contém os cabeçalhos esperados (Cód Mat, Descr Material, UM Tít, Quantidade, Preço/Base).", {
            description: "Utilize o botão 'Baixar Modelo' para gerar um arquivo no padrão correto.",
          });
          return;
        }

        const mapUnidadeMedida = (um: string): Material["unidadeMedida"] => {
          if (!um) return "un";
          const lowerUm = um.toLowerCase();
          const validUnits: Material["unidadeMedida"][] = ["un", "m", "m2", "m3", "cx", "pc", "ml", "l"];
          return validUnits.includes(lowerUm as Material["unidadeMedida"]) ? (lowerUm as Material["unidadeMedida"]) : "un";
        };

        const importedMateriais: MaterialInForm[] = jsonData
          .map((row): MaterialInForm | null => {
            const baseMaterial = {
              tempId: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              descricao: String(row[headerMapping.descricao!] || "").toUpperCase(),
              codigo: String(row[headerMapping.codigo!] || "").replace(/\D/g, ""),
              quantidade: Number(row[headerMapping.quantidade!] || 1),
              unidadeMedida: mapUnidadeMedida(String(row[headerMapping.unidadeMedida!] || "un")),
              valorUnitario: Number(row[headerMapping.valorUnitario!] || 0),
              almoxarifado: "indisponivel" as const,
              estoqueCD: "indisponivel" as const,
              ataArp: "indisponivel" as const,
            };

            try {
              materialSchema.parse(baseMaterial);
              return baseMaterial;
            } catch (e) {
              if (e instanceof ZodError) {
                // Skipping invalid materials
              }
              return null;
            }
          })
          .filter((m): m is MaterialInForm => m !== null);

        if (importedMateriais.length === 0) {
          toast.error("Nenhum material válido foi encontrado na planilha.", {
            description: "Verifique se as colunas estão preenchidas corretamente.",
          });
          return;
        }

        setMateriais(importedMateriais);
        form.setValue("materiais", importedMateriais, { shouldValidate: true, shouldDirty: true });

        toast.success(`${importedMateriais.length} materiais foram importados com sucesso!`);
      } catch (error) {
        console.error("Erro ao importar arquivo:", error);
        toast.error("Não foi possível ler o arquivo. Verifique se o formato é .xlsx válido.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const getMaterialError = (index: number, fieldName: keyof Material) => {
    const errors = form.formState.errors.materiais;
    if (errors && errors[index] && errors[index][fieldName]) {
      return errors[index][fieldName]?.message;
    }
    return null;
  };

  const filteredMateriais = useMemo(() => {
    if (!searchTerm.trim()) return materiais;
    const term = searchTerm.toLowerCase();
    return materiais.filter(
      m => m.descricao.toLowerCase().includes(term) || m.codigo.toLowerCase().includes(term)
    );
  }, [materiais, searchTerm]);

  const totalQuantidade = useMemo(() => {
    return materiais.reduce((sum, m) => sum + (m.quantidade || 0), 0);
  }, [materiais]);

  const totalValorGlobal = useMemo(() => {
    return materiais.reduce((sum, m) => sum + (m.quantidade * m.valorUnitario || 0), 0);
  }, [materiais]);

  return (
    <div className="space-y-3 bg-card/60 p-4 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Itens & Materiais do Processo</h3>
              <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0">
                {materiais.length} {materiais.length === 1 ? "item" : "itens"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Cadastre os materiais ou importe via planilha Excel</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".xls, .xlsx"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadModeloXLSX}
            className="h-8 text-xs gap-1.5"
            title="Baixar planilha de exemplo no formato correto"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Modelo</span> XLSX
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="h-8 text-xs gap-1.5"
          >
            <Upload className="h-3.5 w-3.5 text-primary" />
            Importar Planilha
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                Ações em Lote
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel>Status do Almoxarifado</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => aplicarStatusEmLote("almoxarifado", "disponivel")}>
                <Check className="h-3.5 w-3.5 text-emerald-500 mr-2" />
                Marcar Almox. Disponível
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => aplicarStatusEmLote("almoxarifado", "indisponivel")}>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2" />
                Marcar Almox. Indisponível
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status Estoque CD</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => aplicarStatusEmLote("estoqueCD", "disponivel")}>
                <Check className="h-3.5 w-3.5 text-emerald-500 mr-2" />
                Marcar Estoque CD Disponível
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => aplicarStatusEmLote("estoqueCD", "indisponivel")}>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-2" />
                Marcar Estoque CD Indisponível
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ações na Tabela</DropdownMenuLabel>
              <DropdownMenuItem onClick={adicionarCincoMateriais}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Adicionar +5 Linhas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={limparLinhasVazias}>
                <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive" />
                Limpar Linhas Vazias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={adicionarMaterial}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {materiais.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filtrar por código ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-xs border-input"
          />
        </div>
      )}

      {materiais.length === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed rounded-lg bg-muted/20">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium text-foreground">Nenhum material cadastrado</p>
          <p className="text-xs text-muted-foreground mb-3">
            Adicione itens manualmente ou importe uma planilha contendo os materiais.
          </p>
          <Button type="button" size="sm" onClick={adicionarMaterial} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto min-w-full max-h-[380px] lg:max-h-[480px] xl:max-h-[540px]">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-muted/80 sticky top-0 z-10 border-b border-border backdrop-blur-xs">
                <tr>
                  <th className="w-8 p-2 text-center text-muted-foreground font-semibold">#</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">Descrição</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[100px]">Código</th>
                  <th className="text-right p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[75px]">Qtd.</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Unid.M</th>
                  <th className="text-right p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Unitário</th>
                  <th className="text-right p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[120px]">Valor Total</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">Almoxarifado</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">Estoque CD</th>
                  <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">ATA/ARP</th>
                  <th className="w-16 p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMateriais.map((material, index) => {
                  const originalIndex = materiais.findIndex(m => m.tempId === material.tempId);
                  const descError = getMaterialError(originalIndex, "descricao");
                  const codError = getMaterialError(originalIndex, "codigo");
                  const qtdError = getMaterialError(originalIndex, "quantidade");
                  const unitError = getMaterialError(originalIndex, "valorUnitario");

                  return (
                    <tr key={material.tempId} className="hover:bg-muted/40 transition-colors align-middle">
                      <td className="p-1.5 text-center text-[11px] font-mono text-muted-foreground">
                        {originalIndex + 1}
                      </td>

                      <td className="p-1.5">
                        <Input
                          value={material.descricao}
                          onChange={e =>
                            atualizarMaterial(material.tempId, "descricao", e.target.value.toUpperCase())
                          }
                          placeholder="Descrição detalhada do material..."
                          className={`h-8 text-xs px-2 ${descError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {descError && (
                          <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">{descError}</p>
                        )}
                      </td>

                      <td className="p-1.5">
                        <Input
                          value={material.codigo}
                          onChange={e =>
                            atualizarMaterial(material.tempId, "codigo", e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="Cód."
                          maxLength={10}
                          className={`h-8 text-xs px-2 font-mono ${codError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {codError && (
                          <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">{codError}</p>
                        )}
                      </td>

                      <td className="p-1.5">
                        <Input
                          type="number"
                          value={material.quantidade}
                          onChange={e =>
                            atualizarMaterial(material.tempId, "quantidade", parseFloat(e.target.value) || 0)
                          }
                          min="1"
                          className={`h-8 text-xs px-2 text-right font-mono ${qtdError ? "border-destructive" : ""}`}
                        />
                        {qtdError && (
                          <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">{qtdError}</p>
                        )}
                      </td>

                      <td className="p-1.5">
                        <Select
                          value={material.unidadeMedida}
                          onValueChange={value =>
                            atualizarMaterial(material.tempId, "unidadeMedida", value as Material["unidadeMedida"])
                          }
                        >
                          <SelectTrigger className="h-8 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="un">UN</SelectItem>
                            <SelectItem value="m">M</SelectItem>
                            <SelectItem value="m2">M2</SelectItem>
                            <SelectItem value="m3">M3</SelectItem>
                            <SelectItem value="cx">CX</SelectItem>
                            <SelectItem value="pc">PC</SelectItem>
                            <SelectItem value="ml">ML</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-1.5">
                        <Input
                          type="text"
                          value={formatBRL(material.valorUnitario)}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\D/g, "");
                            const numericValue = rawValue ? parseFloat(rawValue) / 100 : 0;
                            atualizarMaterial(material.tempId, "valorUnitario", numericValue);
                          }}
                          placeholder="R$ 0,00"
                          className={`h-8 text-xs px-2 text-right font-mono ${unitError ? "border-destructive" : ""}`}
                        />
                        {unitError && (
                          <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">{unitError}</p>
                        )}
                      </td>

                      <td className="p-1.5 text-right font-mono font-semibold text-foreground">
                        <div className="h-8 px-2 flex items-center justify-end bg-muted/40 rounded-md border border-border/50 text-xs">
                          {formatBRL(material.quantidade * material.valorUnitario)}
                        </div>
                      </td>

                      <td className="p-1.5">
                        <Select
                          value={material.almoxarifado}
                          onValueChange={value =>
                            atualizarMaterial(material.tempId, "almoxarifado", value as Material["almoxarifado"])
                          }
                        >
                          <SelectTrigger className="h-8 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Disponível
                              </span>
                            </SelectItem>
                            <SelectItem value="indisponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                                Indisponível
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-1.5">
                        <Select
                          value={material.estoqueCD}
                          onValueChange={value =>
                            atualizarMaterial(material.tempId, "estoqueCD", value as Material["estoqueCD"])
                          }
                        >
                          <SelectTrigger className="h-8 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Disponível
                              </span>
                            </SelectItem>
                            <SelectItem value="indisponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                                Indisponível
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-1.5">
                        <Select
                          value={material.ataArp}
                          onValueChange={value =>
                            atualizarMaterial(material.tempId, "ataArp", value as Material["ataArp"])
                          }
                        >
                          <SelectTrigger className="h-8 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Disponível
                              </span>
                            </SelectItem>
                            <SelectItem value="indisponivel">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                                Indisponível
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicarMaterial(material.tempId)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Duplicar item"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerMaterial(material.tempId)}
                            disabled={materiais.length <= 1}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 border-t border-border p-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-4 text-muted-foreground font-medium">
              <span>Total de Itens: <strong className="text-foreground">{materiais.length}</strong></span>
              <span>Soma de Qtds: <strong className="text-foreground">{totalQuantidade}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Valor Total dos Materiais:</span>
              <span className="text-sm font-bold text-primary font-mono">{formatBRL(totalValorGlobal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}