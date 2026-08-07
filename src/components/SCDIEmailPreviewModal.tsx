import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, MessageSquare, ExternalLink, Check, Sparkles } from "lucide-react";
import { Processo } from "@/types/processo";
import {
  useProcessoCopy,
  generateSCDIEmailData,
  generateCDEmailData,
} from "@/hooks/useProcessoCopy";
import { toast } from "sonner";

interface SCDIEmailPreviewModalProps {
  processo: Processo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "scdi" | "cd";
}

export function SCDIEmailPreviewModal({
  processo,
  open,
  onOpenChange,
  defaultTab = "scdi",
}: SCDIEmailPreviewModalProps) {
  const { handleCopyToEmail, handleCopyToEmailCD, handleCopyToWhatsApp } =
    useProcessoCopy(processo);
  
  const [activeTab, setActiveTab] = useState<"scdi" | "cd">(defaultTab);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const scdiData = generateSCDIEmailData(processo);
  const cdData = generateCDEmailData(processo);

  const currentData = activeTab === "scdi" ? scdiData : cdData;

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast.success(`${label} copiado!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao copiar texto.");
    }
  };

  const handleOpenMailClient = () => {
    const { destinatarios, cc, assunto, plainText } = currentData;
    const bodyEncoded = encodeURIComponent(plainText);
    const subjectEncoded = encodeURIComponent(assunto);
    const ccEncoded = encodeURIComponent(cc);
    
    const mailtoUrl = `mailto:${destinatarios}?cc=${ccEncoded}&subject=${subjectEncoded}&body=${bodyEncoded}`;
    window.open(mailtoUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl xl:max-w-6xl w-[96vw] h-[92vh] max-h-[880px] flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
        <DialogHeader className="pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <Mail className="h-6 w-6 text-primary" />
                Visualização de E-mail (SCDI / CD)
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Layout otimizado em HTML pronto para colar no Microsoft Outlook, Webmail ou Gmail.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs sm:text-sm font-medium"
                onClick={handleOpenMailClient}
                title="Abrir no aplicativo de e-mail padrão do sistema"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no E-mail
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "scdi" | "cd")}
          className="flex-1 flex flex-col overflow-hidden mt-3"
        >
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-lg border border-border flex-shrink-0">
            <TabsList className="grid grid-cols-2 w-full md:w-[340px] bg-background shadow-xs">
              <TabsTrigger value="scdi" className="text-xs sm:text-sm font-medium">
                E-mail SCDI
              </TabsTrigger>
              <TabsTrigger value="cd" className="text-xs sm:text-sm font-medium">
                E-mail CD
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm gap-1.5 bg-background hover:bg-muted"
                onClick={() => handleCopyText(currentData.destinatarios, "Destinatários")}
              >
                {copiedField === "Destinatários" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar Para
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm gap-1.5 bg-background hover:bg-muted"
                onClick={() => handleCopyText(currentData.assunto, "Assunto")}
              >
                {copiedField === "Assunto" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar Assunto
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs sm:text-sm gap-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                onClick={activeTab === "scdi" ? handleCopyToEmail : handleCopyToEmailCD}
              >
                <Sparkles className="h-4 w-4" />
                Copiar HTML Formatado
              </Button>
            </div>
          </div>

          {/* Email Body Canvas */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 rounded-lg border border-border bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 shadow-inner">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Header Info Panel (Display only in UI for manual copy) */}
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4 text-xs sm:text-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                    Cabeçalho do E-mail (Copiar para o cliente de e-mail)
                  </span>
                  <span className="text-[11px] text-muted-foreground italic">
                    Não inclui no HTML do corpo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Para:</strong>{" "}
                    <span className="font-mono text-xs select-all">{currentData.destinatarios}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 self-start sm:self-auto hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleCopyText(currentData.destinatarios, "Para")}
                  >
                    {copiedField === "Para" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    Copiar
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">CC:</strong>{" "}
                    <span className="font-mono text-xs select-all">{currentData.cc}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 self-start sm:self-auto hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleCopyText(currentData.cc, "CC")}
                  >
                    {copiedField === "CC" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    Copiar
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Assunto:</strong>{" "}
                    <span className="font-semibold text-primary select-all">{currentData.assunto}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 self-start sm:self-auto hover:bg-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleCopyText(currentData.assunto, "Assunto")}
                  >
                    {copiedField === "Assunto" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    Copiar
                  </Button>
                </div>
              </div>

              {/* Email Body White Canvas */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-8">
                <TabsContent value="scdi" className="m-0 focus-visible:ring-0">
                  <div
                    dangerouslySetInnerHTML={{ __html: scdiData.html }}
                    className="prose prose-slate max-w-none dark:prose-invert"
                  />
                </TabsContent>

                <TabsContent value="cd" className="m-0 focus-visible:ring-0">
                  <div
                    dangerouslySetInnerHTML={{ __html: cdData.html }}
                    className="prose prose-slate max-w-none dark:prose-invert"
                  />
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 flex-shrink-0">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 text-center sm:text-left">
            <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span>O conteúdo copiado mantém tabelas estilizadas, destaque de urgência e bordas corporativas ao colar no Outlook.</span>
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToWhatsApp}
              className="text-xs sm:text-sm gap-1.5 border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={activeTab === "scdi" ? handleCopyToEmail : handleCopyToEmailCD}
              className="text-xs sm:text-sm gap-2 bg-primary hover:bg-primary/90 font-medium"
            >
              <Copy className="h-4 w-4" />
              {activeTab === "scdi" ? "Copiar E-mail SCDI" : "Copiar E-mail CD"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
