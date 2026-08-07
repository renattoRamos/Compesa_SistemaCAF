import { toast } from "sonner";
import { Processo } from "@/types/processo";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia!";
  if (hour < 18) return "Boa tarde!";
  return "Boa noite!";
};

export const generateSCDIEmailData = (processo: Processo) => {
  const greeting = getGreeting();
  const introText =
    "Em razão da negativa do CD, Almoxarifado GPM, solicito gentilmente a liberação do SCDI:";

  const EMAIL_DESTINATARIO =
    "fgoncalves@compesa.com.br, marianarezende@compesa.com.br, lucidelmamiranda@compesa.com.br";
  const EMAIL_CC =
    "jessicatorres@compesa.com.br, swamirecife@compesa.com.br, luannesilva@compesa.com.br";
  const EMAIL_TITULO = `Material SCDI - CMA SUL/GPM - Proc. ${processo.numeroProcesso}`;

  const renderStatusBadge = (status: string) => {
    const isAvailable =
      status?.toLowerCase() === "disponivel" ||
      status?.toLowerCase() === "disponível";
    if (isAvailable) {
      return `<span style="display: inline-block; box-sizing: border-box; max-width: 100%; padding: 2px 4px; font-size: 7pt; font-weight: bold; color: #15803d; background-color: #dcfce7; border: 1px solid #86efac; border-radius: 3px; text-transform: uppercase; letter-spacing: -0.2px; line-height: 1.2; text-align: center; white-space: nowrap;">DISPONÍVEL</span>`;
    }
    return `<span style="display: inline-block; box-sizing: border-box; max-width: 100%; padding: 2px 4px; font-size: 7pt; font-weight: bold; color: #b91c1c; background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 3px; text-transform: uppercase; letter-spacing: -0.2px; line-height: 1.2; text-align: center; white-space: nowrap;">INDISPONÍVEL</span>`;
  };

  const highlightEmergency = (text: string) => {
    if (!text) return "";
    return text.replace(
      /(emergêncial|emergência|emergencial)/i,
      (match) =>
        `<span style="color: #dc2626; font-weight: bold; background-color: #fef2f2; padding: 2px 6px; border: 1px solid #fca5a5; border-radius: 4px; font-size: 8.5pt;">${match.toUpperCase()}</span>`
    );
  };

  const highlightedAplicacao = highlightEmergency(processo.aplicacao);

  const totalQuantidade = processo.materiais.reduce(
    (acc, item) => acc + (item.quantidade || 0),
    0
  );

  const materialsRowsHtml = processo.materiais
    .map((m, index) => {
      const isEven = index % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#f8fafc";
      const totalItem = (m.quantidade || 0) * (m.valorUnitario || 0);

      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; color: #64748b; vertical-align: middle;">${index + 1}</td>
          <td style="padding: 7px 8px; text-align: left; border: 1px solid #cbd5e1; color: #0f172a; font-weight: 500; vertical-align: middle; word-wrap: break-word;">${m.descricao}</td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; color: #334155; font-family: Arial, sans-serif; font-size: 8.5pt; vertical-align: middle;">${m.codigo}</td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; color: #0f172a; font-weight: bold; vertical-align: middle;">${m.quantidade}</td>
          <td style="padding: 7px 6px; text-align: center; border: 1px solid #cbd5e1; color: #475569; text-transform: uppercase; vertical-align: middle;">${(m.unidadeMedida || "UN").toUpperCase()}</td>
          <td style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; color: #334155; vertical-align: middle; white-space: nowrap;">${formatCurrency(m.valorUnitario)}</td>
          <td style="padding: 7px 8px; text-align: right; border: 1px solid #cbd5e1; color: #0f172a; font-weight: bold; vertical-align: middle; white-space: nowrap;">${formatCurrency(totalItem)}</td>
          <td style="padding: 6px 2px; text-align: center; border: 1px solid #cbd5e1; vertical-align: middle;">${renderStatusBadge(m.almoxarifado)}</td>
          <td style="padding: 6px 2px; text-align: center; border: 1px solid #cbd5e1; vertical-align: middle;">${renderStatusBadge(m.estoqueCD)}</td>
          <td style="padding: 6px 2px; text-align: center; border: 1px solid #cbd5e1; vertical-align: middle;">${renderStatusBadge(m.ataArp)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; max-width: 920px; margin: 0; text-align: left; line-height: 1.5; font-size: 10pt;">
      <!-- Salutation & Introduction -->
      <p style="font-size: 10.5pt; color: #0f172a; margin: 0 0 12px 0; text-align: left;">${greeting}</p>
      <p style="font-size: 10.5pt; color: #0f172a; margin: 0 0 20px 0; line-height: 1.6; text-align: left;">${introText}</p>

      <!-- Process Header Summary Card Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; margin-bottom: 24px; border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; background-color: #ffffff; text-align: left; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06);">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #20409A; color: #ffffff; text-align: left; padding: 11px 14px; font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 3px solid #1a337a;">
              INFORMAÇÕES DO PROCESSO SCDI
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width: 180px; padding: 9px 12px; font-weight: bold; color: #334155; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">Nº Processo SCDI:</td>
            <td style="padding: 9px 12px; font-size: 13pt; font-weight: bold; color: #20409A; border-bottom: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">${processo.numeroProcesso}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: bold; color: #334155; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">Requisição:</td>
            <td style="padding: 9px 12px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">${processo.numeroRequisicao}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: bold; color: #334155; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">Coordenação:</td>
            <td style="padding: 9px 12px; color: #0f172a; border-bottom: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">${processo.coordenacao}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: bold; color: #334155; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; vertical-align: top; text-align: left;">Aplicação:</td>
            <td style="padding: 9px 12px; color: #0f172a; border-bottom: 1px solid #cbd5e1; vertical-align: top; line-height: 1.5; text-align: left;">${highlightedAplicacao}</td>
          </tr>
          <tr>
            <td style="padding: 9px 12px; font-weight: bold; color: #334155; background-color: #f1f5f9; border-right: 1px solid #cbd5e1; vertical-align: middle; text-align: left;">Valor Total:</td>
            <td style="padding: 9px 12px; font-size: 11pt; font-weight: bold; color: #0f766e; vertical-align: middle; text-align: left;">${formatCurrency(processo.valorTotal)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Materials List Section -->
      <div style="margin-bottom: 10px; text-align: left;">
        <h3 style="font-size: 10.5pt; font-weight: bold; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.3px; text-align: left;">
          RELAÇÃO DE MATERIAIS (${processo.materiais.length} ITEM${processo.materiais.length !== 1 ? "S" : ""})
        </h3>
      </div>

      <!-- Materials Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0; font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; table-layout: fixed; background-color: #ffffff; text-align: left; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14), 0 2px 4px rgba(0, 0, 0, 0.06);">
        <thead>
          <tr style="background-color: #20409A; color: #ffffff;">
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 3%;">#</th>
            <th style="padding: 9px 8px; font-weight: bold; text-align: left; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 24%;">Descrição do Material</th>
            <th style="padding: 9px 4px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 9%;">Código</th>
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 4%;">Qtd</th>
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 4%;">Unid</th>
            <th style="padding: 9px 4px; font-weight: bold; text-align: right; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 10%;">Val. Unit.</th>
            <th style="padding: 9px 4px; font-weight: bold; text-align: right; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 11.5%;">Val. Total</th>
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 11.5%;">Almox.</th>
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 11.5%;">Estoque CD</th>
            <th style="padding: 9px 2px; font-weight: bold; text-align: center; border-bottom: 2px solid #1a337a; width: 11.5%;">ATA ARP</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold; color: #0f172a;">
            <td colspan="3" style="padding: 8px 10px; text-align: right; border-top: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 9pt;">TOTAL GERAL:</td>
            <td style="padding: 8px 4px; text-align: center; border-top: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 9pt;">${totalQuantidade}</td>
            <td style="padding: 8px 4px; text-align: center; border-top: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1;">-</td>
            <td style="padding: 8px 6px; text-align: right; border-top: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1;">-</td>
            <td style="padding: 8px 6px; text-align: right; border-top: 2px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 9.5pt; color: #0f766e;">${formatCurrency(processo.valorTotal)}</td>
            <td colspan="3" style="padding: 8px 4px; text-align: center; border-top: 2px solid #cbd5e1;">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Plain Text Version
  const plainTextMaterials = processo.materiais
    .map(
      (m, i) =>
        `${i + 1}. [Código: ${m.codigo}] ${m.descricao}\n` +
        `   Qtd: ${m.quantidade} ${(m.unidadeMedida || "UN").toUpperCase()} | Unit: ${formatCurrency(m.valorUnitario)} | Total: ${formatCurrency(m.quantidade * m.valorUnitario)}\n` +
        `   Almoxarifado: ${(m.almoxarifado || "").toUpperCase()} | CD: ${(m.estoqueCD || "").toUpperCase()} | ATA ARP: ${(m.ataArp || "").toUpperCase()}`
    )
    .join("\n\n");

  const plainText = `${greeting}

${introText}

INFORMAÇÕES DO PROCESSO SCDI:
- Nº Processo SCDI: ${processo.numeroProcesso}
- Requisição: ${processo.numeroRequisicao}
- Coordenação: ${processo.coordenacao}
- Aplicação: ${processo.aplicacao}
- Valor Total: ${formatCurrency(processo.valorTotal)}

MATERIAIS SOLICITADOS (${processo.materiais.length} itens):
--------------------------------------------------
${plainTextMaterials}
--------------------------------------------------
TOTAL GERAL: ${formatCurrency(processo.valorTotal)}`;

  return {
    html,
    plainText,
    destinatarios: EMAIL_DESTINATARIO,
    cc: EMAIL_CC,
    assunto: EMAIL_TITULO,
    greeting,
    introText,
  };
};

export const generateCDEmailData = (processo: Processo) => {
  const greeting = getGreeting();
  const EMAIL_DESTINATARIO = "anamattos@compesa.com.br";
  const EMAIL_CC =
    "jessicatorres@compesa.com.br, swamirecife@compesa.com.br, luannesilva@compesa.com.br";
  const EMAIL_TITULO =
    "Verificação de disponibilidade do material no CD - CPR SUL/GPM";

  const materialsRowsHtml = processo.materiais
    .map((m, index) => {
      const isEven = index % 2 === 0;
      const rowBg = isEven ? "#ffffff" : "#f8fafc";
      return `
        <tr style="background-color: ${rowBg};">
          <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 9pt; font-weight: bold; color: #20409A; vertical-align: middle;">${m.codigo}</td>
          <td style="padding: 8px 12px; text-align: left; border: 1px solid #cbd5e1; color: #0f172a; vertical-align: middle;">${m.descricao}</td>
          <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; color: #0f172a; font-weight: bold; vertical-align: middle;">${m.quantidade} ${(m.unidadeMedida || "UN").toUpperCase()}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; max-width: 800px; margin: 0; text-align: left; line-height: 1.5; font-size: 10pt;">
      <p style="font-size: 10.5pt; color: #0f172a; margin: 0 0 12px 0; text-align: left;">${greeting}</p>
      <p style="font-size: 10.5pt; color: #0f172a; margin: 0 0 16px 0; text-align: left;">Peço, por gentileza, que verifique a disponibilidade do material no CD:</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0; font-family: Arial, Helvetica, sans-serif; font-size: 9pt; border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; margin-bottom: 20px; background-color: #ffffff; text-align: left; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.14), 0 2px 4px rgba(0, 0, 0, 0.06);">
        <thead>
          <tr style="background-color: #20409A; color: #ffffff;">
            <th style="padding: 9px 10px; font-weight: bold; text-align: center; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 25%;">Código</th>
            <th style="padding: 9px 12px; font-weight: bold; text-align: left; border-right: 1px solid #1e3a8a; border-bottom: 2px solid #1a337a; width: 55%;">Descrição do Material</th>
            <th style="padding: 9px 10px; font-weight: bold; text-align: center; border-bottom: 2px solid #1a337a; width: 20%;">Qtd.</th>
          </tr>
        </thead>
        <tbody>
          ${materialsRowsHtml}
        </tbody>
      </table>

      <p style="font-size: 10.5pt; color: #0f172a; margin: 0; line-height: 1.6; text-align: left;">
        Caso disponível apenas em ATA, peço por gentileza informações sobre o prazo de entrega e qual o próximo passo para que possamos seguir com a aquisição.
      </p>
    </div>
  `;

  const plainTextTable = processo.materiais
    .map((m) => `${m.codigo} | ${m.descricao} | ${m.quantidade} ${(m.unidadeMedida || "UN").toUpperCase()}`)
    .join("\n");

  const plainText = `${greeting}

Peço, por gentileza, que verifique a disponibilidade do material no CD:

Código | Descrição | Qtd.
--------------------------------------------------
${plainTextTable}
--------------------------------------------------

Caso disponível apenas em ATA, peço por gentileza informações sobre o prazo de entrega e qual o próximo passo para que possamos seguir com a aquisição.`;

  return {
    html,
    plainText,
    destinatarios: EMAIL_DESTINATARIO,
    cc: EMAIL_CC,
    assunto: EMAIL_TITULO,
    greeting,
  };
};

export const useProcessoCopy = (processo: Processo) => {
  const handleCopyToEmail = async () => {
    const emailData = generateSCDIEmailData(processo);

    try {
      const htmlBlob = new Blob([emailData.html], { type: "text/html" });
      const textBlob = new Blob([emailData.plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      toast.success("E-mail (SCDI) copiado com formatação HTML!");
    } catch (error) {
      console.error("Falha ao copiar para a área de transferência:", error);
      toast.error("Não foi possível copiar com a formatação.");
    }
  };

  const handleCopyToWhatsApp = async () => {
    let text = `*SOLICITAÇÃO DE LIBERAÇÃO SCDI*\n\n`;
    text += `*Nº Processo:* ${processo.numeroProcesso}\n`;
    text += `*Requisição:* ${processo.numeroRequisicao}\n`;
    text += `*Coordenação:* ${processo.coordenacao}\n`;
    text += `*Valor Total:* ${formatCurrency(processo.valorTotal)}\n\n`;
    text += `*Aplicação:*\n${processo.aplicacao}\n\n`;
    text += `*Materiais (${processo.materiais.length} itens):*\n`;

    processo.materiais.forEach((m, i) => {
      text += `${i + 1}. ${m.codigo} - ${m.descricao} (Qtd: ${m.quantidade})\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto para WhatsApp copiado!");
    } catch (error) {
      console.error("Falha ao copiar para a área de transferência:", error);
      toast.error("Não foi possível copiar o texto.");
    }
  };

  const handleCopyToEmailCD = async () => {
    const cdData = generateCDEmailData(processo);

    try {
      const htmlBlob = new Blob([cdData.html], { type: "text/html" });
      const textBlob = new Blob([cdData.plainText], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      toast.success("E-mail para CD copiado com sucesso!");
    } catch (error) {
      console.error("Falha ao copiar E-mail para CD:", error);
      toast.error("Não foi possível copiar o e-mail.");
    }
  };

  return { handleCopyToEmail, handleCopyToWhatsApp, handleCopyToEmailCD };
};
