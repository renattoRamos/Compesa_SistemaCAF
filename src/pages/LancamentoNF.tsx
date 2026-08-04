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
import { NFModuleContainer } from "@/components/nf-upload/NFModuleContainer";
import { NFFieldWarningTooltip } from "@/components/nf-upload/NFFieldWarningTooltip";
import { NFExtractedData, ConfidenceScores } from "@/types/nf";

const EMAIL_DESTINATARIO = "lucidelmamiranda@compesa.com.br";
const EMAIL_CC = "fgoncalves@compesa.com.br, marianarezende@compesa.com.br";
const EMAIL_TITULO = "NF para Lançamento da CMA SUL/CPR SUL - GPM";

const LancamentoNF = () => {
  const [reportData, setReportData] = useState<LancamentoNFValues | null>(null);
  const [isSearchingCNPJ, setIsSearchingCNPJ] = useState(false);
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScores>({});
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

  const handleAutoFill = (extractedData: NFExtractedData, confidence: ConfidenceScores) => {
    setConfidenceScores(confidence);

    if (extractedData.razaoSocialEmitente) {
      form.setValue("razaoSocial", extractedData.razaoSocialEmitente, { shouldValidate: true });
    }

    if (extractedData.numeroNota) {
      form.setValue("numeroNota", extractedData.numeroNota, { shouldValidate: true });
    }

    if (extractedData.oc) {
      form.setValue("oc", extractedData.oc, { shouldValidate: true });
    } else {
      form.setValue("oc", "", { shouldValidate: true });
    }

    if (extractedData.valorTotal !== undefined) {
      form.setValue("valorTotal", extractedData.valorTotal, { shouldValidate: true });
    }

    if (extractedData.tipoNotaForm) {
      form.setValue("tipoNota", extractedData.tipoNotaForm, { shouldValidate: true });
    }

    if (extractedData.cnpjEmitente) {
      const formattedCnpj = formatCNPJ(extractedData.cnpjEmitente);
      handleCNPJChange(formattedCnpj);
    }
  };

  const handleClearForm = () => {
    form.reset({
      cnpj: "",
      razaoSocial: "",
      idFornecedor: "",
      numeroNota: "",
      oc: "",
      scdi: "",
      sei: "",
      valorTotal: undefined,
      tipoNota: undefined,
    });
    setConfidenceScores({});
    lastQueriedCNPJRef.current = "";
  };

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

    const formattedValor = formatBRL(reportData.valorTotal);

    const emailTableHtml = `
      <table style="width: 100%; max-width: 680px; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #f1f5f9; font-size: 11pt; font-weight: 700; text-align: left; padding: 12px 16px; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1;">
              DADOS DA NOTA FISCAL PARA LANÇAMENTO (SISTEMA ALPHA)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width: 32%; background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Razão Social:</td>
            <td style="width: 68%; background-color: #ffffff; font-weight: 600; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.razaoSocial || "-"}</td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">ID-Fornecedor:</td>
            <td style="background-color: #ffffff; font-weight: 700; font-size: 10.5pt; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.idFornecedor || "-"}</td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Nº da Nota:</td>
            <td style="background-color: #ffffff; font-weight: 600; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.numeroNota || "-"}</td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Ordem de Compra (OC):</td>
            <td style="background-color: #ffffff; font-weight: 600; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.oc || "-"}</td>
          </tr>
          ${
            reportData.tipoNota !== "Serviço"
              ? `<tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">SCDI:</td>
            <td style="background-color: #ffffff; font-weight: 600; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.scdi || "-"}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Valor Total:</td>
            <td style="background-color: #ffffff; font-weight: 700; font-size: 11pt; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${formattedValor || "R$ 0,00"}</td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Processo SEI:</td>
            <td style="background-color: #ffffff; font-weight: 600; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">${reportData.sei || "-"}</td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; font-weight: 700; padding: 10px 16px; border-right: 1px solid #e2e8f0;">Tipo de Nota:</td>
            <td style="background-color: #ffffff; font-weight: 600; padding: 10px 16px;">${reportData.tipoNota || "-"}</td>
          </tr>
        </tbody>
      </table>
    `;

    const fullHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.5;">
        <p style="margin-bottom: 6px; font-size: 9.5pt;"><strong>Destinatário:</strong> ${EMAIL_DESTINATARIO}</p>
        <p style="margin-bottom: 6px; font-size: 9.5pt;"><strong>Cc:</strong> ${EMAIL_CC}</p>
        <p style="margin-bottom: 14px; font-size: 9.5pt;"><strong>Título:</strong> ${EMAIL_TITULO}</p>
        <br />
        <p style="margin-bottom: 10px; font-size: 10pt;">${getGreeting()}</p>
        <br />
        <p style="margin-bottom: 14px; font-size: 10pt;">
          Segue a Nota Fiscal para lançamento no sistema Alpha, dando continuidade aos processos administrativos. Abaixo, seguem os dados organizados da Nota Fiscal:
        </p>
        <br />
        ${emailTableHtml}
      </div>
    `;

    const plainText = `Destinatário: ${EMAIL_DESTINATARIO}
Cc: ${EMAIL_CC}
Título: ${EMAIL_TITULO}

${getGreeting()}

Segue a Nota Fiscal para lançamento no sistema Alpha, dando continuidade aos processos administrativos. Abaixo, seguem os dados organizados da Nota Fiscal:

DADOS DA NOTA FISCAL PARA LANÇAMENTO:
----------------------------------------
• Razão Social: ${reportData.razaoSocial || "-"}
• ID-Fornecedor: ${reportData.idFornecedor || "-"}
• Nº da Nota: ${reportData.numeroNota || "-"}
• Ordem de Compra (OC): ${reportData.oc || "-"}${
      reportData.tipoNota !== "Serviço" ? `\n• SCDI: ${reportData.scdi || "-"}` : ""
    }
• Valor Total: ${formattedValor || "R$ 0,00"}
• Processo SEI: ${reportData.sei || "-"}
• Tipo de Nota: ${reportData.tipoNota || "-"}
----------------------------------------`;

    try {
      const htmlBlob = new Blob([fullHtml], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      const clipboardItem = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      });
      await navigator.clipboard.write([clipboardItem]);
      toast.success("Copiado para E-mail com formatação premium!");
    } catch (error) {
      console.error("Falha ao copiar para a área de transferência:", error);
      toast.error("Não foi possível copiar com a formatação.");
    }
  };

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-5xl mx-auto shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-xl font-bold text-foreground">
              {reportData ? "Relatório para E-mail" : "Solicitar Lançamento de NF"}
            </CardTitle>
            <CardDescription className="text-xs">
              {reportData
                ? "Copie o conteúdo abaixo para o seu e-mail."
                : "Preencha os dados da nota fiscal para gerar o e-mail."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {reportData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Destinatário:</h4>
                    <p className="text-xs font-mono font-medium text-foreground break-all">
                      {EMAIL_DESTINATARIO}
                    </p>
                  </div>

                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Cc:</h4>
                    <p className="text-xs font-mono font-medium text-foreground break-all">
                      {EMAIL_CC}
                    </p>
                  </div>

                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Título do E-mail:</h4>
                    <p className="text-xs font-semibold text-foreground">
                      {EMAIL_TITULO}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center justify-between">
                    <span>Corpo do E-mail (Pré-visualização):</span>
                    <span className="text-xs font-normal text-muted-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                      Formato em Linhas Separadas (Premium)
                    </span>
                  </h3>
                  <div className="border border-border rounded-xl shadow-xs bg-card overflow-hidden">
                    <div className="bg-[#20409A] text-white px-4 py-3 flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm tracking-wide">
                        DADOS DA NOTA FISCAL PARA LANÇAMENTO (SISTEMA ALPHA)
                      </span>
                      <span className="text-[11px] bg-white/20 text-white font-mono px-2 py-0.5 rounded">
                        Compese GPM
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 space-y-4 text-sm bg-background">
                      <div className="space-y-1.5 text-foreground text-sm">
                        <p className="font-semibold">
                          {new Date().getHours() < 12
                            ? "Bom dia!"
                            : new Date().getHours() < 18
                            ? "Boa tarde!"
                            : "Boa noite!"}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Segue a Nota Fiscal para lançamento no sistema Alpha, dando continuidade aos processos
                          administrativos. Abaixo, seguem os dados organizados da Nota Fiscal:
                        </p>
                      </div>

                      <div className="rounded-lg border border-border overflow-hidden bg-card divide-y divide-border">
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            Razão Social
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                            {reportData.razaoSocial || "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            ID-Fornecedor
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-bold text-[#20409A] dark:text-blue-400">
                            {reportData.idFornecedor || "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            Nº da Nota
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                            {reportData.numeroNota || "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            Ordem de Compra (OC)
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                            {reportData.oc || "-"}
                          </div>
                        </div>

                        {reportData.tipoNota !== "Serviço" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                            <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                              SCDI
                            </div>
                            <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                              {reportData.scdi || "-"}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-[#20409A] text-white p-2.5 sm:p-3 font-bold text-xs uppercase tracking-wider flex items-center">
                            Valor Total
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-base font-bold text-[#20409A] dark:text-blue-300">
                            {formatBRL(reportData.valorTotal) || "R$ 0,00"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            Processo SEI
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                            {reportData.sei || "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                          <div className="bg-muted/50 p-2.5 sm:p-3 font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                            Tipo de Nota
                          </div>
                          <div className="sm:col-span-2 p-2.5 sm:p-3 text-sm font-semibold text-foreground">
                            {reportData.tipoNota || "-"}
                          </div>
                        </div>
                      </div>
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
              <div className="space-y-5">
                <NFModuleContainer onAutoFill={handleAutoFill} onClearForm={handleClearForm} />

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between">
                              <span className="truncate">CNPJ</span>
                              {isSearchingCNPJ && (
                                <span className="flex items-center gap-1 text-[11px] text-primary font-normal animate-pulse shrink-0 ml-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Busca...
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.cnpjEmitente}>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                    onChange={(e) => handleCNPJChange(e.target.value)}
                                    className="border-primary/40 pr-9 text-sm h-9"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-muted-foreground">
                                    {isSearchingCNPJ ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    ) : (
                                      <Search className="h-3.5 w-3.5 opacity-50" />
                                    )}
                                  </div>
                                </div>
                              </NFFieldWarningTooltip>
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
                            <FormLabel className="truncate block">ID Fornecedor</FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.cnpjEmitente}>
                                <Input
                                  {...field}
                                  maxLength={10}
                                  placeholder="0000000000"
                                  onChange={(e) =>
                                    field.onChange(e.target.value.replace(/\D/g, ""))
                                  }
                                  className="border-primary/40 text-sm h-9"
                                />
                              </NFFieldWarningTooltip>
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
                            <FormLabel className="truncate block">Nº da Nota</FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.numeroNota}>
                                <Input {...field} placeholder="Número da nota" className="border-primary/40 text-sm h-9" />
                              </NFFieldWarningTooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="razaoSocial"
                        render={({ field }) => (
                          <FormItem className="lg:col-span-2">
                            <FormLabel className="truncate block">Razão Social / Nome Fantasia</FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.razaoSocialEmitente}>
                                <Input {...field} placeholder="Nome da empresa" className="border-primary/40 text-sm h-9" />
                              </NFFieldWarningTooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tipoNota"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="truncate block">Tipo de Nota</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-primary/40 text-sm h-9">
                                  <SelectValue placeholder="Selecione o tipo" />
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

                      <FormField
                        control={form.control}
                        name="oc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="truncate block">OC</FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.oc}>
                                <Input {...field} placeholder="Ordem de Compra" className="border-primary/40 text-sm h-9" />
                              </NFFieldWarningTooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("tipoNota") !== "Serviço" && (
                        <FormField
                          control={form.control}
                          name="scdi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="truncate block">SCDI (Manual)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  maxLength={5}
                                  placeholder="00000"
                                  onChange={(e) =>
                                    field.onChange(e.target.value.replace(/\D/g, ""))
                                  }
                                  className="border-primary/40 text-sm h-9"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="sei"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="truncate block">SEI (Manual)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Processo SEI" className="border-primary/40 text-sm h-9" />
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
                            <FormLabel className="truncate block">Valor Total</FormLabel>
                            <FormControl>
                              <NFFieldWarningTooltip confidence={confidenceScores.valorTotal}>
                                <Input
                                  placeholder="R$ 0,00"
                                  className="border-primary/40 text-sm h-9"
                                  value={field.value ? formatBRL(field.value) : ""}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, "");
                                    const numericValue = rawValue
                                      ? parseFloat(rawValue) / 100
                                      : 0;
                                    field.onChange(numericValue);
                                  }}
                                />
                              </NFFieldWarningTooltip>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border">
                      <Button type="submit" size="sm">Gerar E-mail</Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LancamentoNF;
