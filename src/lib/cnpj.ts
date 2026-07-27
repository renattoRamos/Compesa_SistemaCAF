/**
 * Utility functions for CNPJ mask, validation, ID generation, and BrasilAPI fetching.
 */

/**
 * Formats a string of digits into CNPJ mask: 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (!digits) return "";

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Returns digits only from CNPJ string
 */
export function unformatCNPJ(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Validates CNPJ length and check digits (DV)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const digits = unformatCNPJ(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  // Validate first check digit
  let size = digits.length - 2;
  let numbers = digits.substring(0, size);
  const dv = digits.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(dv.charAt(0))) return false;

  // Validate second check digit
  size = size + 1;
  numbers = digits.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(dv.charAt(1))) return false;

  return true;
}

/**
 * Generates ID Fornecedor (8 digits root + 2 digits DV) from CNPJ digits
 * Example: 12.345.678/0001-95 (12345678000195) -> 1234567895
 */
export function generateIdFornecedorFromCNPJ(cnpj: string): string {
  const digits = unformatCNPJ(cnpj);
  if (digits.length === 14) {
    return digits.slice(0, 8) + digits.slice(12, 14);
  }
  return "";
}

export interface BrasilAPICNPJResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  [key: string]: unknown;
}

/**
 * Fetches company details from BrasilAPI with timeout and signal support
 */
export async function fetchCompanyByCNPJ(
  cnpj: string,
  signal?: AbortSignal
): Promise<{ razaoSocialName: string } | null> {
  const digits = unformatCNPJ(cnpj);
  if (digits.length !== 14) return null;

  const url = `https://brasilapi.com.br/api/cnpj/v1/${digits}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return null;
    }

    const data: BrasilAPICNPJResponse = await response.json();

    const nomeFantasia = typeof data.nome_fantasia === "string" ? data.nome_fantasia.trim() : "";
    const razaoSocial = typeof data.razao_social === "string" ? data.razao_social.trim() : "";

    // Priority: Nome Fantasia if non-empty, otherwise Razão Social
    const nameToUse = nomeFantasia || razaoSocial;

    if (!nameToUse) {
      return null;
    }

    return { razaoSocialName: nameToUse };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Let caller know request was aborted
    }
    return null;
  }
}
