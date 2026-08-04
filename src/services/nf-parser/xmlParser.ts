import { DocumentType, NFExtractedData, NFProcessingResult, ConfidenceScores } from "@/types/nf";
import { formatCNPJ } from "@/lib/cnpj";
import { parseNFeAccessKey } from "./accessKeyParser";

export function parseXMLInvoice(xmlContent: string): NFProcessingResult {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      return {
        success: false,
        documentType: "NF-e",
        extractedData: {},
        confidenceScores: {},
        missingFields: ["documento"],
        lowConfidenceFields: [],
        errorMessage: "XML inválido ou corrompido.",
        hasText: true,
        usedOCR: false,
      };
    }

    const data: NFExtractedData = {};
    const confidence: ConfidenceScores = {};

    // 1. Detect Document Type
    let documentType: DocumentType = "NF-e";
    const rootName = xmlDoc.documentElement.localName.toLowerCase();

    if (
      rootName.includes("nfse") ||
      xmlDoc.querySelector("Nfse") ||
      xmlDoc.querySelector("tcCompNfse") ||
      xmlDoc.querySelector("PrestadorServico") ||
      xmlDoc.querySelector("InfNfse")
    ) {
      documentType = "NFS-e";
      data.tipoNotaForm = "Serviço";
    } else {
      documentType = "DANFE";
      data.tipoNotaForm = "Compra de Material";
    }

    // Helper tag finder
    const getTagText = (parent: Element | Document, tagNames: string[]): string => {
      for (const tag of tagNames) {
        const el = parent.querySelector(tag);
        if (el && el.textContent) {
          return el.textContent.trim();
        }
      }
      return "";
    };

    // Helper tag finder inside a specific parent
    const getChildText = (parent: Element | null, tagNames: string[]): string => {
      if (!parent) return "";
      return getTagText(parent, tagNames);
    };

    if (documentType === "NFS-e") {
      // Extract Prestador (Emitente)
      const prestadorEl =
        xmlDoc.querySelector("PrestadorServico") ||
        xmlDoc.querySelector("Prestador") ||
        xmlDoc.querySelector("InfDeclaracaoPrestacaoServico > Prestador");

      let cnpjEmit = getChildText(prestadorEl, ["Cnpj", "CNPJ", "Cpf", "CPF"]);
      if (!cnpjEmit) {
        // Fallback search first CNPJ tag under prestador or overall
        const allCnpjs = xmlDoc.querySelectorAll("Cnpj, CNPJ");
        if (allCnpjs.length > 0) cnpjEmit = allCnpjs[0].textContent?.trim() || "";
      }
      if (cnpjEmit) {
        data.cnpjEmitente = formatCNPJ(cnpjEmit);
        confidence.cnpjEmitente = "high";
      }

      const razaoEmit = getChildText(prestadorEl, ["RazaoSocial", "xNome", "NomeFantasia"]);
      if (razaoEmit) {
        data.razaoSocialEmitente = razaoEmit;
        confidence.razaoSocialEmitente = "high";
      }

      // Numero Nota
      const numero = getTagText(xmlDoc, ["Numero", "nNF", "NumeroNfe", "NfseNumero"]);
      if (numero) {
        data.numeroNota = numero;
        confidence.numeroNota = "high";
      }

      // Data Emissao
      const dataEmi = getTagText(xmlDoc, ["DataEmissao", "dhEmi", "dEmi", "DataEmissaoRps"]);
      if (dataEmi) {
        data.dataEmissao = dataEmi.split("T")[0];
        confidence.dataEmissao = "high";
      }

      // Valor Total / Servico
      const valServText = getTagText(xmlDoc, [
        "ValorServicos",
        "vServ",
        "ValorLiquidoNfse",
        "vNF",
        "ValorTotal",
      ]);
      if (valServText) {
        const parsedVal = parseFloat(valServText.replace(",", "."));
        if (!isNaN(parsedVal)) {
          data.valorTotal = parsedVal;
          data.valorServicos = parsedVal;
          confidence.valorTotal = "high";
        }
      }

      // Chave / Codigo Verificacao
      const chave = getTagText(xmlDoc, ["CodigoVerificacao", "ChaveAcesso", "ChaveNfse"]);
      if (chave) {
        data.chaveAcesso = chave;
        confidence.chaveAcesso = "high";
      }

      // Discriminacao / Descricao
      const desc = getTagText(xmlDoc, ["Discriminacao", "xServ", "OutrasInformacoes"]);
      if (desc) {
        data.descricao = desc;
      }
    } else {
      // NF-e (Produto) / DANFE
      const emitEl = xmlDoc.querySelector("emit");
      if (emitEl) {
        const cnpj = getChildText(emitEl, ["CNPJ", "CPF"]);
        if (cnpj) {
          data.cnpjEmitente = formatCNPJ(cnpj);
          confidence.cnpjEmitente = "high";
        }
        const razao = getChildText(emitEl, ["xNome"]);
        if (razao) {
          data.razaoSocialEmitente = razao;
          confidence.razaoSocialEmitente = "high";
        }
        const fant = getChildText(emitEl, ["xFant"]);
        if (fant) {
          data.nomeFantasiaEmitente = fant;
        }
      }

      const destEl = xmlDoc.querySelector("dest");
      if (destEl) {
        const cnpjDest = getChildText(destEl, ["CNPJ", "CPF"]);
        if (cnpjDest) data.cnpjDestinatario = formatCNPJ(cnpjDest);
      }

      // Ide (Identificação da NF-e)
      const ideEl = xmlDoc.querySelector("ide");
      if (ideEl) {
        const serie = getChildText(ideEl, ["serie"]);
        if (serie) data.serie = serie;
        const nNF = getChildText(ideEl, ["nNF"]);
        if (nNF) {
          data.numeroNota = serie && !nNF.includes("/") ? `${serie}/${nNF}` : nNF;
          confidence.numeroNota = "high";
        }
        const mod = getChildText(ideEl, ["mod"]);
        if (mod) data.modelo = mod;

        const dhEmi = getChildText(ideEl, ["dhEmi", "dEmi"]);
        if (dhEmi) {
          data.dataEmissao = dhEmi.split("T")[0];
          confidence.dataEmissao = "high";
        }
      }

      // Chave de Acesso attribute in <infNFe Id="NFe3521...">
      const infNFeEl = xmlDoc.querySelector("infNFe");
      if (infNFeEl) {
        const idAttr = infNFeEl.getAttribute("Id");
        if (idAttr) {
          const rawChave = idAttr.replace(/\D/g, "");
          if (rawChave.length === 44) {
            data.chaveAcesso = rawChave;
            confidence.chaveAcesso = "high";
          }
        }
      }
      if (!data.chaveAcesso) {
        const chNFe = getTagText(xmlDoc, ["chNFe"]);
        if (chNFe) {
          data.chaveAcesso = chNFe;
          confidence.chaveAcesso = "high";
        }
      }

      if (data.chaveAcesso) {
        const parsedKey = parseNFeAccessKey(data.chaveAcesso);
        if (parsedKey.isValid) {
          if (!data.cnpjEmitente && parsedKey.cnpjEmitente) {
            data.cnpjEmitente = parsedKey.cnpjEmitente;
            confidence.cnpjEmitente = "high";
          }
          if (parsedKey.serie) {
            data.serie = parsedKey.serie;
          }
          if (parsedKey.numeroNota) {
            const rawNum = parsedKey.numeroNota;
            data.numeroNota = parsedKey.serie && !rawNum.includes("/")
              ? `${parsedKey.serie}/${rawNum}`
              : rawNum;
            confidence.numeroNota = "high";
          }
          if (!data.modelo && parsedKey.modelo) {
            data.modelo = parsedKey.modelo;
          }
        }
      }

      // Total values
      const totalEl = xmlDoc.querySelector("total > ICMSTot");
      if (totalEl) {
        const vNF = getChildText(totalEl, ["vNF"]);
        if (vNF) {
          const val = parseFloat(vNF.replace(",", "."));
          if (!isNaN(val)) {
            data.valorTotal = val;
            confidence.valorTotal = "high";
          }
        }
        const vProd = getChildText(totalEl, ["vProd"]);
        if (vProd) data.valorProdutos = parseFloat(vProd.replace(",", "."));
        const vICMS = getChildText(totalEl, ["vICMS"]);
        if (vICMS) data.valorICMS = parseFloat(vICMS.replace(",", "."));
        const vIPI = getChildText(totalEl, ["vIPI"]);
        if (vIPI) data.valorIPI = parseFloat(vIPI.replace(",", "."));
      }

      // Commercial Data from xPed or infCpl (Informações Complementares / Dados Adicionais)
      const xPed = getTagText(xmlDoc, ["xPed"]);
      if (xPed) {
        data.oc = xPed;
        confidence.oc = "high";
      }

      const infCpl = getTagText(xmlDoc, ["infCpl", "infAdFisco"]);
      if (infCpl) {
        data.descricao = infCpl;
        if (!data.oc) {
          const ocMatch = infCpl.match(/ORDEM DE COMPRA\s*[:#.-]?\s*([A-Za-z0-9/-]+)/i);
          if (ocMatch && ocMatch[1]) {
            const candidate = ocMatch[1].trim();
            if (candidate.length >= 2 && !/^(VALOR|NOTA|TOTAL|FISCAL|IMPOSTO)$/i.test(candidate)) {
              data.oc = candidate;
              confidence.oc = "high";
            }
          }
        }
      }
    }

    // Determine missing and low confidence fields
    const missingFields: string[] = [];
    const lowConfidenceFields: string[] = [];

    if (!data.cnpjEmitente) missingFields.push("CNPJ");
    if (!data.razaoSocialEmitente) missingFields.push("Razão Social");
    if (!data.numeroNota) missingFields.push("Nº da Nota");
    if (!data.valorTotal) missingFields.push("Valor Total");
    if (!data.oc) missingFields.push("OC");

    Object.entries(confidence).forEach(([key, val]) => {
      if (val === "low") {
        lowConfidenceFields.push(key);
      }
    });

    return {
      success: true,
      documentType,
      extractedData: data,
      confidenceScores: confidence,
      missingFields,
      lowConfidenceFields,
      hasText: true,
      usedOCR: false,
    };
  } catch (err) {
    console.error("XML parse error:", err);
    return {
      success: false,
      documentType: "NF-e",
      extractedData: {},
      confidenceScores: {},
      missingFields: ["documento"],
      lowConfidenceFields: [],
      errorMessage: "Erro ao processar o arquivo XML.",
      hasText: false,
      usedOCR: false,
    };
  }
}
