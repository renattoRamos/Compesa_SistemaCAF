import { formatCNPJ, isValidCNPJ } from "@/lib/cnpj";

export interface ParsedAccessKey {
  isValid: boolean;
  chave: string;
  ufCode?: string;
  ufSigla?: string;
  anoMes?: string; // "MM/20YY"
  ano?: string; // "20YY"
  mes?: string; // "MM"
  cnpjEmitente?: string;
  modelo?: string;
  serie?: string;
  numeroNota?: string;
  codigoNumerico?: string;
  dv?: string;
}

const UF_CODES: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL",
  "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP", "41": "PR",
  "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF",
};

/**
 * Extracts structured data from a 44-digit NF-e Access Key locally (100% offline).
 * Chave structure (44 digits):
 * 1-2: UF (2)
 * 3-6: AAMM (4) -> YYMM
 * 7-20: CNPJ Emitente (14)
 * 21-22: Modelo (2) (55 = NF-e, 65 = NFC-e)
 * 23-25: Série (3)
 * 26-34: Número da Nota (9)
 * 35-43: Código Numérico (9)
 * 44: DV (1)
 */
export function parseNFeAccessKey(rawChave: string): ParsedAccessKey {
  const digits = rawChave.replace(/\D/g, "");

  if (digits.length === 50) {
    // NFS-e Nacional 50-digit Chave de Acesso
    const ufCode = digits.substring(0, 2);
    const ufSigla = UF_CODES[ufCode] || undefined;

    // Search for a valid 14-digit CNPJ sequence in the 50-digit key
    let cnpjEmitente: string | undefined;
    for (let i = 6; i <= 25; i++) {
      const candidate = digits.substring(i, i + 14);
      if (candidate.length === 14 && isValidCNPJ(candidate)) {
        cnpjEmitente = formatCNPJ(candidate);
        break;
      }
    }

    return {
      isValid: true,
      chave: digits,
      ufCode,
      ufSigla,
      cnpjEmitente,
      modelo: "NFS-e",
    };
  }

  if (digits.length !== 44) {
    return {
      isValid: false,
      chave: rawChave,
    };
  }

  const ufCode = digits.substring(0, 2);
  const yy = digits.substring(2, 4);
  const mm = digits.substring(4, 6);
  const cnpjDigits = digits.substring(6, 20);
  const modelo = digits.substring(20, 22);
  const serieRaw = digits.substring(22, 25);
  const numeroRaw = digits.substring(25, 34);
  const codigoNumerico = digits.substring(34, 43);
  const dv = digits.substring(43, 44);

  const ufSigla = UF_CODES[ufCode] || undefined;

  // Year & Month parsing: e.g. YY=26 -> 2026, MM=07 -> 07
  const yearFull = `20${yy}`;
  const monthFull = mm;
  const anoMes = `${monthFull}/${yearFull}`;

  // CNPJ check
  let cnpjEmitente: string | undefined;
  if (isValidCNPJ(cnpjDigits)) {
    cnpjEmitente = formatCNPJ(cnpjDigits);
  } else {
    cnpjEmitente = formatCNPJ(cnpjDigits);
  }

  // Format Serie and Numero
  const serie = serieRaw;
  const numeroNota = String(parseInt(numeroRaw, 10));

  return {
    isValid: true,
    chave: digits,
    ufCode,
    ufSigla,
    anoMes,
    ano: yearFull,
    mes: monthFull,
    cnpjEmitente,
    modelo,
    serie,
    numeroNota,
    codigoNumerico,
    dv,
  };
}
