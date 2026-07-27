import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Download, Share2, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export function PWAInstallPrompt() {
  const { deferredPrompt, isInstalled, promptInstall } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Abre o modal automaticamente se o prompt estiver disponível e não estiver instalado
  useEffect(() => {
    if (deferredPrompt && !isInstalled) {
      setIsOpen(true);
    }
  }, [deferredPrompt, isInstalled]);

  if (isInstalled) {
    return null;
  }

  const installDescription = "Instale o app na tela inicial para acesso rápido e uma experiência de aplicativo nativo.";

  // 1. Implementação para navegadores que suportam o prompt (Chrome/Desktop/Android)
  if (deferredPrompt) {
    const handleInstall = () => {
      promptInstall();
      setIsOpen(false);
    };

    // Usamos o Dialog, mas com a propriedade nonModal para remover o overlay e aplicar o posicionamento fixo
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent nonModal className="max-w-sm rounded-lg p-6">
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar App
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {installDescription}
          </DialogDescription>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Agora não
            </Button>
            <Button onClick={handleInstall} className="gap-2">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 2. Implementação para iOS/Safari (que exige instruções manuais)
  // Mantemos o fluxo de Dialog padrão para iOS, pois ele é acionado por um botão e não é persistente.
  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="shadow-lg gap-2">
              <Download className="h-4 w-4" />
              Instalar App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Instalar Sistema CAF GPM
              </DialogTitle>
              <DialogDescription>
                {installDescription}
              </DialogDescription>
            </DialogHeader>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm">1. Toque no ícone de **Compartilhamento** (<Share2 className="inline h-4 w-4" />) na barra de navegação do Safari.</p>
                <p className="text-sm">2. Selecione **Adicionar à Tela de Início**.</p>
                <p className="text-sm">3. Confirme o nome e toque em **Adicionar**.</p>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return null;
}