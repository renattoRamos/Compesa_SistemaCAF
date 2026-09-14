import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setCachedAccessToken,
} from "@/services/googleAuth";
import {
  createSCDISpreadsheet,
  getSpreadsheetInfo,
  syncAllProcessosToSheet,
  readProcessosFromSheet,
  extractSpreadsheetId,
} from "@/services/googleSheetsService";
import { Processo } from "@/types/processo";
import { toast } from "sonner";

const STORAGE_SPREADSHEET_ID_KEY = "scdi_google_spreadsheet_id";
const STORAGE_SPREADSHEET_TITLE_KEY = "scdi_google_spreadsheet_title";
const STORAGE_LAST_SYNC_KEY = "scdi_google_last_sync";
const STORAGE_AUTO_SYNC_KEY = "scdi_google_auto_sync";

export function useGoogleSheets() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_SPREADSHEET_ID_KEY);
  });

  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_SPREADSHEET_TITLE_KEY) || "Planilha Processos SCDI";
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_LAST_SYNC_KEY);
  });

  const [autoSync, setAutoSyncState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_AUTO_SYNC_KEY) === "true";
  });

  // Listener de Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        toast.success(`Conectado ao Google como ${result.user.displayName || result.user.email}!`);
        return result.accessToken;
      }
      return null;
    } catch (err: unknown) {
      console.error("Falha na autenticação Google:", err);
      const msg = err instanceof Error ? err.message : "Erro ao conectar conta Google.";
      toast.error(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      toast.info("Desconectado da conta Google.");
    } catch (err: unknown) {
      console.error("Erro ao desconectar:", err);
    }
  }, []);

  const ensureToken = useCallback(async (): Promise<string> => {
    const currentToken = await getAccessToken();
    if (currentToken) return currentToken;

    // Se não tem token em memória, solicitar autenticação
    const loginResult = await handleLogin();
    if (!loginResult) {
      throw new Error("Autenticação com o Google é necessária para esta operação.");
    }
    return loginResult;
  }, [handleLogin]);

  // Criar nova planilha oficial formatada
  const createNewSheet = useCallback(
    async (customTitle?: string): Promise<string> => {
      setIsCreatingSheet(true);
      try {
        const activeToken = await ensureToken();
        const title = customTitle || "Processos SCDI - CAF GPM";
        const sheetInfo = await createSCDISpreadsheet(title, activeToken);

        setSpreadsheetId(sheetInfo.id);
        setSpreadsheetTitle(sheetInfo.title);
        localStorage.setItem(STORAGE_SPREADSHEET_ID_KEY, sheetInfo.id);
        localStorage.setItem(STORAGE_SPREADSHEET_TITLE_KEY, sheetInfo.title);

        toast.success(`Planilha "${sheetInfo.title}" criada com sucesso no seu Google Drive!`);
        return sheetInfo.id;
      } catch (err: unknown) {
        console.error("Erro ao criar planilha:", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Erro ao criar planilha: ${msg}`);
        throw err;
      } finally {
        setIsCreatingSheet(false);
      }
    },
    [ensureToken]
  );

  // Vincular planilha existente
  const connectExistingSheet = useCallback(
    async (inputUrlOrId: string): Promise<boolean> => {
      const extractedId = extractSpreadsheetId(inputUrlOrId);
      if (!extractedId) {
        toast.error("Formato inválido. Insira o link da planilha ou o ID da planilha do Google.");
        return false;
      }

      setIsSyncing(true);
      try {
        const activeToken = await ensureToken();
        const info = await getSpreadsheetInfo(extractedId, activeToken);

        setSpreadsheetId(info.id);
        setSpreadsheetTitle(info.title);
        localStorage.setItem(STORAGE_SPREADSHEET_ID_KEY, info.id);
        localStorage.setItem(STORAGE_SPREADSHEET_TITLE_KEY, info.title);

        toast.success(`Planilha "${info.title}" vinculada com sucesso!`);
        return true;
      } catch (err: unknown) {
        console.error("Erro ao vincular planilha existente:", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Falha ao conectar planilha: ${msg}`);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [ensureToken]
  );

  // Desconectar planilha atual
  const disconnectSheet = useCallback(() => {
    setSpreadsheetId(null);
    setLastSyncTime(null);
    localStorage.removeItem(STORAGE_SPREADSHEET_ID_KEY);
    localStorage.removeItem(STORAGE_SPREADSHEET_TITLE_KEY);
    localStorage.removeItem(STORAGE_LAST_SYNC_KEY);
    toast.info("Vínculo com a planilha removido.");
  }, []);

  // Sincronizar todos os processos para a planilha
  const syncProcessos = useCallback(
    async (processos: Processo[]): Promise<boolean> => {
      if (!spreadsheetId) {
        toast.error("Nenhuma planilha selecionada. Crie uma nova planilha ou vincule uma existente.");
        return false;
      }

      setIsSyncing(true);
      try {
        const activeToken = await ensureToken();
        const res = await syncAllProcessosToSheet(spreadsheetId, processos, activeToken);

        const now = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        setLastSyncTime(now);
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, now);

        toast.success(
          `Sincronizado! ${res.processosCount} processos e ${res.itensCount} itens enviados para a Planilha Google.`
        );
        return true;
      } catch (err: unknown) {
        console.error("Erro ao sincronizar processos:", err);
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Falha na sincronização: ${msg}`);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [spreadsheetId, ensureToken]
  );

  // Importar processos da planilha para o sistema local
  const importProcessos = useCallback(async (): Promise<Processo[] | null> => {
    if (!spreadsheetId) {
      toast.error("Nenhuma planilha conectada para importar.");
      return null;
    }

    setIsImporting(true);
    try {
      const activeToken = await ensureToken();
      const loadedProcessos = await readProcessosFromSheet(spreadsheetId, activeToken);

      toast.success(`${loadedProcessos.length} processos importados da Planilha Google!`);
      return loadedProcessos;
    } catch (err: unknown) {
      console.error("Erro ao importar da planilha:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao importar: ${msg}`);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [spreadsheetId, ensureToken]);

  // Alternar auto-sincronização
  const setAutoSync = useCallback((enabled: boolean) => {
    setAutoSyncState(enabled);
    localStorage.setItem(STORAGE_AUTO_SYNC_KEY, enabled ? "true" : "false");
    if (enabled) {
      toast.success("Sincronização automática com a Planilha Google ativada.");
    } else {
      toast.info("Sincronização automática desativada.");
    }
  }, []);

  const spreadsheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null;

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isSigningIn,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    lastSyncTime,
    isSyncing,
    isImporting,
    isCreatingSheet,
    autoSync,
    login: handleLogin,
    logout: handleLogout,
    createSpreadsheet: createNewSheet,
    connectSpreadsheet: connectExistingSheet,
    disconnectSpreadsheet: disconnectSheet,
    syncProcessos,
    importProcessos,
    setAutoSync,
  };
}
