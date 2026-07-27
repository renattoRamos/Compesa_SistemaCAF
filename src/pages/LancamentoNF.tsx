import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, ArrowLeft, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lancamentoNFSchema, LancamentoNFValues } from "@/schemas/lancamentoNFSchema";
import {
  formatCNPJ,
  unformatCNPJ,
  generateIdFornecedorFromCNPJ,
  fetchCompanyByCNPJ,
} from "@/lib/cnpj";

const EMAIL_DESTINATARIO = "lucidelmamiranda@compesa.com.br";
const EMAIL_CC = "fgoncalves@compesa.com.br, marianarezende@compesa.com.br";
const EMAIL_TITULO = "NF para Lançamento da CMA SUL/CPR SUL - GPM";

const LancamentoNF = () => {
  const [reportData, setReportData] = useState<LancamentoNFValues | null>(null);
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const lastQueriedCNPJRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const form = useForm<LancamentoNFValues>({
    resolver: zodResolver(lancamentoNFSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      idFornecedor: "",
      numeroNota: "",
      oc: "",
      scdi: "",
      sei: "",
      tipoNota: undefined,
    },
  });

  const handleCNPJChange = async (rawValue: string) => {
    const formatted = formatCNPJ(rawValue);
    form.setValue("cnpj", formatted, { shouldValidate: true });

    const digits = unformatCNPJ(formatted);

    // 1. Preenchimento automático do ID Fornecedor (8 dígitos da raiz + 2 DV)
    if (digits.length === 14) {
      const generatedId = generateIdFornecedorFromCNPJ(digits);
      if (generatedId) {
        form.setValue("idFornecedor", generatedId, { shouldValidate: true });
      }

      // 2. Consulta automática à BrasilAPI se o CNPJ for novo
      if (digits !== lastQueriedCNPJRef.current) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsSearchingCNPJ(true);

        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 8000);

        try {
          const companyData = await fetchCompanyByCNPJ(digits, controller.signal);
          clearTimeout(timeoutId);

          if (companyData && companyData.razaoSocialName) {
            form.setValue("razaoSocial", companyData.razaoSocialName, {
              shouldValidate: true,
            });
            toast.success(`CNPJ localizado: ${companyData.razaoSocialName}`);
            lastQueriedCNPJRef.current = digits;
          } else {
            toast.error("Não foi possível localizar os dados do CNPJ informado.");
            lastQueriedCNPJRef.current = digits;
          }
        } catch (err: unknown) {
          clearTimeout(timeoutId);
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          toast.error("Não foi possível localizar as informações do CNPJ.");
          lastQueriedCNPJRef.current = digits;
        } finally {
          setIsSearchingCNPJ(false);
        }
      }
    }
  };

  const handleFormSubmit = (data: LancamentoNFValues) => {
    setReportData(data);
  };

  const formatBRL = (value: number | undefined) => {
    if (value === undefined) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCopyToEmail = async () => {
    if (!reportData) return;

    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Bom dia!";
      if (hour < 18) return "Boa tarde!";
      return "Boa noite!";
    };

    const tableStyle =
      'style="border-collapse: collapse; width: 1025px; font-family: Arial, sans-serif; font-size: 8pt; table-layout: fixed;"';

    const thStyle =
      'style="background-color: #002060; color: white; border: 1px solid #dddddd; text-align: center; padding: 8px; font-size: 8pt; vertical-align: middle;"';

    const tdBaseStyle =
      'style="border: 1px solid #dddddd; padding: 8px; font-size: 8pt; color: #000066; vertical-align: middle;"';

    const tdRazaoSocialStyle = tdBaseStyle.replace('style="', 'style="text-align: left; ');
    const tdCenteredStyle = tdBaseStyle.replace('style="', 'style="text-align: center; ');

    const colgroup = `
      <colgroup>
        <col style="width: 30%;">
        <col style="width: 9%;">
        <col style="width: 6%;">
        <col style="width: 6%;">
        <col style="width: 6%;">
        <col style="width: 9%;">
        <col style="width: 19%;">
        <col style="width: 15%;">
      </colgroup>
    `;

    const emailBodyHtml = `
      <p style="font-size: 8pt;">${getGreeting()}</p>
      <p style="font-size: 8pt;">&nbsp;</p>
      <p style="font-size: 8pt;">
        Segue a Nota Fiscal para lançamento no sistema Alpha, dando continuidade aos processos administrativos.
        Abaixo, seguem os dados da Nota Fiscal:
      </p>
      <br>
      <table ${tableStyle}>
        ${colgroup}
        <thead>
          <tr>
            <th ${thStyle}>Razão Social</th>
            <th ${thStyle}>ID-Fornecedor</th>
            <th ${thStyle}>N°</th>
            <th ${thStyle}>OC</th>
            <th ${thStyle}>SCDI</th>
            <th ${thStyle}>Valor Total</th>
            <th ${thStyle}>SEI</th>
            <th ${thStyle}>Tipo de Nota</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td ${tdRazaoSocialStyle}>${reportData.razaoSocial}</td>
            <td ${tdCenteredStyle}>${reportData.idFornecedor}</td>
            <td ${tdCenteredStyle}>${reportData.numeroNota}</td>
            <td ${tdCenteredStyle}>${reportData.oc}</td>
            <td ${tdCenteredStyle}>${reportData.scdi}</td>
            <td ${tdCenteredStyle}>${formatBRL(reportData.valorTotal)}</td>
            <td ${tdCenteredStyle}>${reportData.sei}</td>
            <td ${tdCenteredStyle}>${reportData.tipoNota}</td>
          </tr>
        </tbody>
      </table>
    `;

    const fullHtml = `
      <p style="font-size: 9pt;"><strong>Destinatário:</strong> ${EMAIL_DESTINATARIO}</p>
      <p style="font-size: 9pt;"><strong>Cc:</strong> ${EMAIL_CC}</p>
      <p style="font-size: 9pt;"><strong>Título:</strong> ${EMAIL_TITULO}</p>
      <br>
      ${emailBodyHtml}
    `;

    try {
      const htmlBlob = new Blob([fullHtml], { type: "text/html" });
      const clipboardItem = new ClipboardItem({ "text/html": htmlBlob });
      await navigator.clipboard.write([clipboardItem]);
      toast.success("Copiado para E-mail com formatação!");
    } catch (error) {
      console.error("Falha ao copiar para a área de transferência:", error);
      toast.error("Não foi possível copiar com a formatação.");
    }
  };

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {reportData ? "Relatório para E-mail" : "Solicitar Lançamento de NF"}
            </CardTitle>
            <CardDescription>
              {reportData
                ? "Copie o conteúdo abaixo para o seu e-mail."
                : "Preencha os dados da nota fiscal para gerar o e-mail."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Destinatário:</h3>
                  <p className="text-sm bg-muted p-3 rounded-md text-muted-foreground">
                    {EMAIL_DESTINATARIO}
                  </p>

                  <h3 className="font-semibold text-foreground mb-2">Cc:</h3>
                  <p className="text-sm bg-muted p-3 rounded-md text-muted-foreground">
                    {EMAIL_CC}
                  </p>

                  <h3 className="font-semibold text-foreground mb-2">Título do E-mail:</h3>
                  <p className="text-sm bg-muted p-3 rounded-md text-muted-foreground">
                    {EMAIL_TITULO}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Corpo do E-mail (Pré-visualização):
                  </h3>
                  <div className="border rounded-lg p-4 space-y-4 text-sm">
                    <p>
                      {new Date().getHours() < 12
                        ? "Bom dia!"
                        : new Date().getHours() < 18
                        ? "Boa tarde!"
                        : "Boa noite!"}
                    </p>
                    <p>
                      Segue a Nota Fiscal para lançamento no sistema Alpha, dando continuidade aos processos
                      administrativos. Abaixo, seguem os dados da Nota Fiscal:
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              Razão Social
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              ID-Fornecedor
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              N°
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              OC
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              SCDI
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              Valor Total
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              SEI
                            </th>
                            <th className="bg-primary text-primary-foreground p-2 border border-border text-center">
                              Tipo de Nota
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border border-border text-left">
                              {reportData.razaoSocial}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.idFornecedor}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.numeroNota}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.oc}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.scdi}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {formatBRL(reportData.valorTotal)}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.sei}
                            </td>
                            <td className="p-2 border border-border text-center">
                              {reportData.tipoNota}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row-reverse justify-start sm:justify-between items-stretch sm:items-center gap-2 pt-4">
                  <Button onClick={handleCopyToEmail} className="gap-2 justify-center">
                    <Copy className="h-4 w-4" />
                    Copiar para E-mail
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setReportData(null)}
                    className="gap-2 justify-center"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Formulário
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between h-5">
                            <span>CNPJ</span>
                            {isSearchingCNPJ && (
                              <span className="flex items-center gap-1 text-xs text-primary font-normal animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Consultando...
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                                onChange={(e) => handleCNPJChange(e.target.value)}
                                className="border-primary/40 pr-10"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                {isSearchingCNPJ ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : (
                                  <Search className="h-4 w-4 opacity-50" />
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idFornecedor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center h-5">ID Fornecedor</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={10}
                              placeholder="0000000000"
                              onChange={(e) =>
                                field.onChange(e.target.value.replace(/\D/g, ""))
                              }
                              className="border-primary/40"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Razão Social / Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome da empresa" className="border-primary/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numeroNota"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº da Nota</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número da nota" className="border-primary/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="oc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OC</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ordem de Compra" className="border-primary/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scdi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SCDI</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={5}
                              placeholder="00000"
                              onChange={(e) =>
                                field.onChange(e.target.value.replace(/\D/g, ""))
                              }
                              className="border-primary/40"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valorTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Total</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="R$ 0,00"
                              className="border-primary/40"
                              value={field.value ? formatBRL(field.value) : ""}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                const numericValue = rawValue
                                  ? parseFloat(rawValue) / 100
                                  : 0;
                                field.onChange(numericValue);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sei"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEI</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Processo SEI" className="border-primary/40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipoNota"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Tipo de Nota</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-primary/40">
                                <SelectValue placeholder="Selecione o tipo de nota" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Compra de Material">
                                Compra de Material
                              </SelectItem>
                              <SelectItem value="Serviço">Serviço</SelectItem>
                              <SelectItem value="Locação">Locação</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Gerar E-mail</Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LancamentoNF;
