import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AutorizacaoSCDI from "./pages/AutorizacaoSCDI";
import LancamentoNF from "./pages/LancamentoNF";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas que usam o layout principal (Sidebar) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/autorizacao-scdi" replace />} />
            <Route path="autorizacao-scdi" element={<AutorizacaoSCDI />} />
            <Route path="lancamento-nf" element={<LancamentoNF />} />
          </Route>
          
          {/* Rotas de tela cheia (como 404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PWAInstallPrompt />
        <NetworkStatusIndicator />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;