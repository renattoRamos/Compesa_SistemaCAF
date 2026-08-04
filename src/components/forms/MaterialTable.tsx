import React, { useRef } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Updated import
import {
  Material,
  MaterialInForm,
  formatBRL,
  createNewMaterial,
  materialSchema,
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

  const adicionarMaterial = () => {
    const novoMaterial = createNewMaterial();
    const novosMateriais = [...materiais, novoMaterial];
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true });
  };

  const removerMaterial = (tempId: string) => {
    if (materiais.length > 1) {
      const novosMateriais = materiais.filter(m => m.tempId !== tempId);
      setMateriais(novosMateriais);
      form.setValue("materiais", novosMateriais, { shouldValidate: true });
    }
  };

  const atualizarMaterial = (tempId: string, campo: keyof Material, valor: string | number) => {
    const novosMateriais = materiais.map(m =>
      m.tempId === tempId ? { ...m, [campo]: valor } : m,
    );
    setMateriais(novosMateriais);
    form.setValue("materiais", novosMateriais, { shouldValidate: true });
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

        // Helper to find the actual header key, ignoring case and whitespace
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
            description: "Erro na importação",
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
            
            // Validate against Zod schema to ensure data integrity
            try {
                materialSchema.parse(baseMaterial);
                return baseMaterial;
            } catch (e) {
                if (e instanceof ZodError) {
                    // Skipping invalid materials silently during import
                }
                return null; 
            }
          })
          .filter((m): m is MaterialInForm => m !== null);

        if (importedMateriais.length === 0) {
          toast.error("Verifique se as colunas de código, descrição, quantidade e valor unitário estão preenchidas corretamente.", {
            description: "Nenhum material válido encontrado",
          });
          return;
        }

        setMateriais(importedMateriais);
        form.setValue("materiais", importedMateriais, { shouldValidate: true });

        toast.success(`${importedMateriais.length} materiais foram importados.`, {
          description: "Importação bem-sucedida!",
        });
      } catch (error) {
        console.error("Erro ao importar arquivo:", error);
        toast.error("Não foi possível ler o arquivo. Verifique se o formato está correto.", {
          description: "Erro na importação",
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // Helper to get error message for a specific material field
  const getMaterialError = (index: number, fieldName: keyof Material) => {
    const errors = form.formState.errors.materiais;
    if (errors && errors[index] && errors[index][fieldName]) {
      return errors[index][fieldName]?.message;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Informações dos Materiais</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".xls, .xlsx"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleImportClick} className="justify-center h-8 text-xs px-3">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Importar XLSX
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={adicionarMaterial} className="justify-center h-8 text-xs px-3">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar Material
          </Button>
        </div>
      </div>

      {materiais.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full table-fixed text-xs">
              <thead className="bg-muted/70 border-b border-border">
                <tr>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Código</th>
                  <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[70px]">Qtd.</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[80px]">Unid.M</th>
                  <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Unitário</th>
                  <th className="text-right p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[115px]">Valor Total</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[125px]">Almoxarifado</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[125px]">Estoque CD</th>
                  <th className="text-left p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[125px]">ATA/ARP</th>
                  <th className="w-10 p-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {materiais.map((material, index) => (
                  <tr key={material.tempId} className="hover:bg-muted/30 align-middle">
                    <td className="p-1.5">
                      <Input
                        value={material.descricao}
                        onChange={e =>
                          atualizarMaterial(material.tempId, "descricao", e.target.value.toUpperCase())
                        }
                        placeholder="Descrição do material"
                        className="h-8 text-xs px-2"
                      />
                      {getMaterialError(index, "descricao") && (
                        <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">
                          {getMaterialError(index, "descricao")}
                        </p>
                      )}
                    </td>
                    <td className="p-1.5">
                      <Input
                        value={material.codigo}
                        onChange={e =>
                          atualizarMaterial(material.tempId, "codigo", e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Código"
                        maxLength={10}
                        className="h-8 text-xs px-2"
                      />
                      {getMaterialError(index, "codigo") && (
                        <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">
                          {getMaterialError(index, "codigo")}
                        </p>
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
                        className="h-8 text-xs px-2 text-right"
                      />
                      {getMaterialError(index, "quantidade") && (
                        <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">
                          {getMaterialError(index, "quantidade")}
                        </p>
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
                        className="h-8 text-xs px-2 text-right"
                      />
                      {getMaterialError(index, "valorUnitario") && (
                        <p className="text-[10px] text-destructive mt-0.5 font-medium truncate">
                          {getMaterialError(index, "valorUnitario")}
                        </p>
                      )}
                    </td>
                    <td className="p-1.5 text-right">
                      <Input
                        value={formatBRL(material.quantidade * material.valorUnitario)}
                        disabled
                        className="h-8 text-xs px-2 bg-muted/60 text-right font-medium"
                      />
                    </td>
                    <td className="p-1.5">
                      <Select
                        value={material.almoxarifado}
                        onValueChange={value => atualizarMaterial(material.tempId, "almoxarifado", value as Material["almoxarifado"])}
                      >
                        <SelectTrigger className="h-8 text-xs px-2">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="indisponivel">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Select
                        value={material.estoqueCD}
                        onValueChange={value => atualizarMaterial(material.tempId, "estoqueCD", value as Material["estoqueCD"])}
                      >
                        <SelectTrigger className="h-8 text-xs px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="indisponivel">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1.5">
                      <Select
                        value={material.ataArp}
                        onValueChange={value => atualizarMaterial(material.tempId, "ataArp", value as Material["ataArp"])}
                      >
                        <SelectTrigger className="h-8 text-xs px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="indisponivel">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-1.5 text-center">
                      {materiais.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerMaterial(material.tempId)}
                          className="h-7 w-7 p-0 hover:bg-destructive/10"
                          title="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}