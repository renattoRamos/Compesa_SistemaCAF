import { Processo } from "@/types/processo";

const PROCESSOS_SHEET_NAME = "Processos SCDI";
const ITENS_SHEET_NAME = "Itens dos Processos";

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheets: string[];
}

interface SheetProperties {
  sheetId: number;
  title: string;
}

interface SheetItem {
  properties: SheetProperties;
}

interface SpreadsheetMetadata {
  spreadsheetId: string;
  properties?: {
    title?: string;
  };
  sheets?: SheetItem[];
}

export const PROCESSOS_HEADERS = [
  "ID do Processo",
  "Nº Requisição",
  "Nº Processo",
  "Coordenação",
  "Aplicação",
  "Data do Processo",
  "Valor Total (R$)",
  "Status",
  "Prazo de Entrega",
  "Qtd. Itens",
  "Resumo dos Itens",
  "Data de Sincronização",
];

export const ITENS_HEADERS = [
  "ID do Processo",
  "Nº Processo",
  "Nº Requisição",
  "Código do Item",
  "Descrição do Material",
  "Quantidade",
  "Unidade de Medida",
  "Valor Unitário (R$)",
  "Valor Total (R$)",
  "Almoxarifado",
  "Estoque CD",
  "Ata ARP",
];

/**
 * Cria uma nova planilha no Google Sheets com 2 abas estruturadas e formatadas
 */
export async function createSCDISpreadsheet(
  title: string = "Processos SCDI - CAF GPM",
  accessToken: string
): Promise<SpreadsheetInfo> {
  const requestBody = {
    properties: {
      title,
      locale: "pt_BR",
      timeZone: "America/Sao_Paulo",
    },
    sheets: [
      {
        properties: {
          title: PROCESSOS_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 1000,
            columnCount: 15,
          },
        },
      },
      {
        properties: {
          title: ITENS_SHEET_NAME,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 2000,
            columnCount: 15,
          },
        },
      },
    ],
  };

  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Falha ao criar planilha Google: ${response.statusText}`
    );
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;

  // Inicializa os cabeçalhos das duas abas com formatação bonita
  await initializeHeadersAndStyling(spreadsheetId, accessToken, result);

  return {
    id: spreadsheetId,
    title: result.properties?.title || title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets: [PROCESSOS_SHEET_NAME, ITENS_SHEET_NAME],
  };
}

/**
 * Inicializa cabeçalhos e formatações visuais elegantes nas abas
 */
async function initializeHeadersAndStyling(
  spreadsheetId: string,
  accessToken: string,
  spreadsheetData: SpreadsheetMetadata
) {
  // Escrever cabeçalhos
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `'${PROCESSOS_SHEET_NAME}'!A1:L1`,
            values: [PROCESSOS_HEADERS],
          },
          {
            range: `'${ITENS_SHEET_NAME}'!A1:L1`,
            values: [ITENS_HEADERS],
          },
        ],
      }),
    }
  );

  // Estilização dos cabeçalhos (fundo escuro verde/azul elegante e texto em negrito)
  const sheets = spreadsheetData.sheets || [];
  const requests: Record<string, unknown>[] = [];

  sheets.forEach((sheet: SheetItem) => {
    const sheetId = sheet.properties.sheetId;
    // Formatar cabeçalho
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.28, blue: 0.22 }, // Verde escuro profissional
            horizontalAlignment: "CENTER",
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10,
            },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    });

    // Auto resize colunas básicas
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: 12,
        },
      },
    });
  });

  if (requests.length > 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    ).catch((e) => {
      console.warn("Aviso ao aplicar estilização na planilha:", e);
    });
  }
}

/**
 * Obtém informações da planilha existente para validação
 */
export async function getSpreadsheetInfo(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetInfo> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || "Não foi possível acessar a planilha. Verifique o ID e suas permissões."
    );
  }

  const data = await response.json();
  const sheets = (data.sheets || []).map((s: SheetItem) => s.properties.title);

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || "Planilha do Google",
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Garante que as abas necessárias existam na planilha conectada
 */
export async function ensureRequiredSheetsExist(
  spreadsheetId: string,
  accessToken: string
) {
  const info = await getSpreadsheetInfo(spreadsheetId, accessToken);
  const missingSheets: string[] = [];

  if (!info.sheets.includes(PROCESSOS_SHEET_NAME)) {
    missingSheets.push(PROCESSOS_SHEET_NAME);
  }
  if (!info.sheets.includes(ITENS_SHEET_NAME)) {
    missingSheets.push(ITENS_SHEET_NAME);
  }

  if (missingSheets.length > 0) {
    const requests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    }));

    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (addRes.ok) {
      // Grava cabeçalhos nas novas abas
      const valueUpdates: Array<{ range: string; values: string[][] }> = [];
      if (missingSheets.includes(PROCESSOS_SHEET_NAME)) {
        valueUpdates.push({
          range: `'${PROCESSOS_SHEET_NAME}'!A1:L1`,
          values: [PROCESSOS_HEADERS],
        });
      }
      if (missingSheets.includes(ITENS_SHEET_NAME)) {
        valueUpdates.push({
          range: `'${ITENS_SHEET_NAME}'!A1:L1`,
          values: [ITENS_HEADERS],
        });
      }

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valueInputOption: "USER_ENTERED",
            data: valueUpdates,
          }),
        }
      );
    }
  }
}

/**
 * Converte Processos em linhas da tabela de processos e de itens
 */
export function formatProcessosForSheets(processos: Processo[]) {
  const nowStr = new Date().toLocaleString("pt-BR");

  const processosRows = processos.map((p) => {
    const resumoItens = (p.materiais || [])
      .map((m) => `${m.quantidade}x ${m.descricao} (${m.codigo})`)
      .join(" | ");

    return [
      p.id,
      p.numeroRequisicao || "",
      p.numeroProcesso || "",
      p.coordenacao || "",
      p.aplicacao || "",
      p.dataProcesso || "",
      p.valorTotal ?? 0,
      p.status || "Pendente",
      p.prazoEntrega || "",
      (p.materiais || []).length,
      resumoItens,
      nowStr,
    ];
  });

  const itensRows: (string | number)[][] = [];

  processos.forEach((p) => {
    (p.materiais || []).forEach((m) => {
      const valorTotalItem = (m.quantidade || 0) * (m.valorUnitario || 0);
      itensRows.push([
        p.id,
        p.numeroProcesso || "",
        p.numeroRequisicao || "",
        m.codigo || "",
        m.descricao || "",
        m.quantidade || 0,
        m.unidadeMedida || "un",
        m.valorUnitario || 0,
        valorTotalItem,
        m.almoxarifado || "",
        m.estoqueCD || "",
        m.ataArp || "",
      ]);
    });
  });

  return { processosRows, itensRows };
}

/**
 * Sincroniza todos os processos com a Planilha Google (limpa dados anteriores e grava tudo atualizado)
 */
export async function syncAllProcessosToSheet(
  spreadsheetId: string,
  processos: Processo[],
  accessToken: string
): Promise<{ processosCount: number; itensCount: number }> {
  await ensureRequiredSheetsExist(spreadsheetId, accessToken);

  const { processosRows, itensRows } = formatProcessosForSheets(processos);

  // 1. Limpar conteúdos existentes mantendo a linha de cabeçalho
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ranges: [
          `'${PROCESSOS_SHEET_NAME}'!A2:Z10000`,
          `'${ITENS_SHEET_NAME}'!A2:Z20000`,
        ],
      }),
    }
  );

  // 2. Preparar payload de inserção
  const dataPayload: Array<{ range: string; values: (string | number)[][] }> = [
    {
      range: `'${PROCESSOS_SHEET_NAME}'!A1:L1`,
      values: [PROCESSOS_HEADERS],
    },
    {
      range: `'${ITENS_SHEET_NAME}'!A1:L1`,
      values: [ITENS_HEADERS],
    },
  ];

  if (processosRows.length > 0) {
    dataPayload.push({
      range: `'${PROCESSOS_SHEET_NAME}'!A2:L${processosRows.length + 1}`,
      values: processosRows,
    });
  }

  if (itensRows.length > 0) {
    dataPayload.push({
      range: `'${ITENS_SHEET_NAME}'!A2:L${itensRows.length + 1}`,
      values: itensRows,
    });
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: dataPayload,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || "Erro ao gravar dados dos processos na planilha."
    );
  }

  return {
    processosCount: processosRows.length,
    itensCount: itensRows.length,
  };
}

/**
 * Lê os dados da planilha e converte de volta para objetos Processo[]
 */
export async function readProcessosFromSheet(
  spreadsheetId: string,
  accessToken: string
): Promise<Processo[]> {
  await ensureRequiredSheetsExist(spreadsheetId, accessToken);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges='${PROCESSOS_SHEET_NAME}'!A2:L10000&ranges='${ITENS_SHEET_NAME}'!A2:L20000`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || "Erro ao ler dados da planilha do Google."
    );
  }

  const result = await response.json();
  const processosValues = (result.valueRanges?.[0]?.values || []) as unknown[][];
  const itensValues = (result.valueRanges?.[1]?.values || []) as unknown[][];

  // Mapear itens agrupados por processoId
  const itensByProcessoId = new Map<string, Processo["materiais"]>();

  itensValues.forEach((row: unknown[]) => {
    const procId = String(row[0] || "").trim();
    if (!procId) return;

    const item = {
      codigo: String(row[3] || ""),
      descricao: String(row[4] || ""),
      quantidade: Number(row[5]) || 1,
      unidadeMedida: String(row[6] || "un"),
      valorUnitario: Number(row[7]) || 0,
      almoxarifado: String(row[9] || "indisponivel"),
      estoqueCD: String(row[10] || "indisponivel"),
      ataArp: String(row[11] || "indisponivel"),
    };

    if (!itensByProcessoId.has(procId)) {
      itensByProcessoId.set(procId, []);
    }
    itensByProcessoId.get(procId)!.push(item);
  });

  const validStatuses: Processo["status"][] = [
    "Pendente",
    "Aprovado",
    "Rejeitado",
    "Aguardando Entrega",
  ];

  // Mapear processos
  const processos: Processo[] = processosValues.map((row: unknown[], index: number) => {
    const id = String(row[0] || "").trim() || `proc-import-${Date.now()}-${index}`;
    const materiais = itensByProcessoId.get(id) || [];

    const rawStatus = String(row[7] || "Pendente").trim() as Processo["status"];
    const validStatus: Processo["status"] = validStatuses.includes(rawStatus)
      ? rawStatus
      : "Pendente";

    return {
      id,
      numeroRequisicao: String(row[1] || ""),
      numeroProcesso: String(row[2] || ""),
      coordenacao: String(row[3] || "CMA SUL"),
      aplicacao: String(row[4] || ""),
      dataProcesso: String(row[5] || new Date().toISOString().split("T")[0]),
      valorTotal: Number(row[6]) || 0,
      status: validStatus,
      prazoEntrega: row[8] ? String(row[8]) : null,
      materiais,
    };
  });

  return processos;
}

/**
 * Extrai o ID da planilha a partir de uma URL ou string do ID
 */
export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Se já for apenas o ID (letras, números, traços e underscores de tamanho ~44)
  if (/^[a-zA-Z0-9-_]{25,60}$/.test(trimmed)) {
    return trimmed;
  }

  // Se for uma URL do Google Sheets (ex: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}
