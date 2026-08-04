import { toast } from "sonner";
import { Processo } from "@/types/processo";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// ✅ Novo formatter SEM símbolo monetário
const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const useProcessoCopy = (processo: Processo) => {
  const handleCopyToEmail = async () => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Bom dia!";
      if (hour < 18) return "Boa tarde!";
      return "Boa noite!";
    };

    const greeting = getGreeting();
    const introText =
      "Em razão da negativa do CD, Almoxarifado GPM, solicito gentilmente a liberação do SCDI:";

    const EMAIL_DESTINATARIO =
      "fgoncalves@compesa.com.br, marianarezende@compesa.com.br, lucidelmamiranda@compesa.com.br";
    const EMAIL_CC =
      "jessicatorres@compesa.com.br, swamirecife@compesa.com.br, luannesilva@compesa.com.br";
    const EMAIL_TITULO = "Material SCDI - CMA SUL/GPM";

    const dataFontColor = "";
    const baseCellStyle =
      "border: 1px solid black; padding: 5px; vertical-align: middle; word-wrap: break-word;";
    const headerCellStyle = `style="background-color: #f1f5f9; font-weight: bold; ${baseCellStyle}"`;
    const dataCellStyle = `style="${baseCellStyle}"`;
    const valueCellStyle = `style="${baseCellStyle}"`;
    const redBoldStyle = "font-weight: bold;";
    const redBoldValueCellStyle = `style="${redBoldStyle} font-size: 18pt; ${baseCellStyle}"`;
    const totalValueCellStyle = `style="font-weight: bold; font-size: 10pt; ${baseCellStyle}"`;

    const centeredHeaderCellStyle = `style="text-align: center; ${headerCellStyle.replace(
      'style="',
      ""
    )}"`;
    const rightHeaderCellStyle = `style="text-align: right; ${headerCellStyle.replace(
      'style="',
      ""
    )}"`;
    const centeredDataCellStyle = `style="text-align: center; ${dataCellStyle.replace(
      'style="',
      ""
    )}"`;
    const leftDataCellStyle = `style="text-align: left; ${dataCellStyle.replace(
      'style="',
      ""
    )}"`;

    const tableStyle =
      'style="width: 1025px; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 8pt; table-layout: fixed;"';

    const highlightEmergency = (text: string) =>
      text.replace(
        /(emergêncial|emergência|emergencial)/gi,
        (match) => `<span style="${redBoldStyle}">${match}</span>`
      );

    const highlightedAplicacao = highlightEmergency(processo.aplicacao);

    const infoRows = `
      <tr><td ${rightHeaderCellStyle} colspan="1">Requisição:</td><td ${valueCellStyle} colspan="8">${processo.numeroRequisicao}</td></tr>
      <tr><td ${rightHeaderCellStyle} colspan="1">Nº Processo SCDI:</td><td ${redBoldValueCellStyle} colspan="8">${processo.numeroProcesso}</td></tr>
      <tr><td ${rightHeaderCellStyle} colspan="1">Coordenação:</td><td ${valueCellStyle} colspan="8">${processo.coordenacao}</td></tr>
      <tr><td ${rightHeaderCellStyle} colspan="1">Aplicação:</td><td ${valueCellStyle} colspan="8">${highlightedAplicacao}</td></tr>
      <tr><td ${rightHeaderCellStyle} colspan="1">Valor Total:</td><td ${totalValueCellStyle} colspan="8">${formatCurrency(processo.valorTotal)}</td></tr>
    `;

    const colgroup = `
      <colgroup>
        <col style="width: 38%;"><col style="width: 8%;"><col style="width: 4%;"><col style="width: 6%;"><col style="width: 7%;"><col style="width: 7%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 10%;">
      </colgroup>
    `;

    const materialsHeaderRows = `
      <tr>
        <th ${centeredHeaderCellStyle}>Material</th>
        <th ${centeredHeaderCellStyle}>Código</th>
        <th ${centeredHeaderCellStyle}>Qnt.</th>
        <th ${centeredHeaderCellStyle}>Unid.M</th>
        <th ${centeredHeaderCellStyle}>Unitário</th>
        <th ${centeredHeaderCellStyle}>Total</th>
        <th ${centeredHeaderCellStyle}>Almoxarifado</th>
        <th ${centeredHeaderCellStyle}>Estoque CD</th>
        <th ${centeredHeaderCellStyle}>ATA ARP</th>
      </tr>
    `;

    const materialsBodyRows = processo.materiais
      .map(
        (m) => `
        <tr>
          <td ${leftDataCellStyle}>${m.descricao}</td>
          <td ${centeredDataCellStyle}>${m.codigo}</td>
          <td ${centeredDataCellStyle}>${m.quantidade}</td>
          <td ${centeredDataCellStyle}>${(m.unidadeMedida || "un").toUpperCase()}</td>
          
          <!-- ✅ SEM R$ -->
          <td ${centeredDataCellStyle}>${formatNumber(m.valorUnitario)}</td>
          <td ${centeredDataCellStyle}>${formatNumber(
            m.quantidade * m.valorUnitario
          )}</td>
          
          <td ${centeredDataCellStyle}>${
            m.almoxarifado === "disponivel"
              ? "DISPONÍVEL"
              : "INDISPONÍVEL"
          }</td>
          <td ${centeredDataCellStyle}>${
            m.estoqueCD === "disponivel"
              ? "DISPONÍVEL"
              : "INDISPONÍVEL"
          }</td>
          <td ${centeredDataCellStyle}>${
            m.ataArp === "disponivel"
              ? "DISPONÍVEL"
              : "INDISPONÍVEL"
          }</td>
        </tr>`
      )
      .join("");

    const finalHtml = `
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>Destinatário:</b> ${EMAIL_DESTINATARIO}</p>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>CC:</b> ${EMAIL_CC}</p>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>Assunto:</b> ${EMAIL_TITULO}</p><br>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;">${greeting}</p><br>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;">${introText}</p><br>
      <table ${tableStyle}>
        ${colgroup}
        <tbody>${infoRows}${materialsHeaderRows}${materialsBodyRows}</tbody>
      </table>
    `;

    try {
      const htmlBlob = new Blob([finalHtml], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob }),
      ]);
      toast.success("Copiado para E-mail com formatação!");
    } catch (error) {
      console.error(
        "Falha ao copiar para a área de transferência:",
        error
      );
      toast.error("Não foi possível copiar com a formatação.");
    }
  };

  const handleCopyToWhatsApp = async () => {
    let text = `*SOLICITAÇÃO DE LIBERAÇÃO SCDI*\n\n`;
    text += `*Nº Processo:* ${processo.numeroProcesso}\n`;
    text += `*Requisição:* ${processo.numeroRequisicao}\n`;
    text += `*Coordenação:* ${processo.coordenacao}\n`;
    text += `*Valor Total:* ${formatCurrency(processo.valorTotal)}\n\n`;
    text += `*Aplicação:*\n${processo.aplicacao}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto para WhatsApp copiado!");
    } catch (error) {
      console.error(
        "Falha ao copiar para a área de transferência:",
        error
      );
      toast.error("Não foi possível copiar o texto.");
    }
  };

  const handleCopyToEmailCD = async () => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Bom dia!";
      if (hour < 18) return "Boa tarde!";
      return "Boa noite!";
    };

    const greeting = getGreeting();

    const EMAIL_DESTINATARIO = "anamattos@compesa.com.br";
    const EMAIL_CC =
      "jessicatorres@compesa.com.br, swamirecife@compesa.com.br, luannesilva@compesa.com.br";
    const EMAIL_TITULO =
      "Verificação de disponibilidade do material no CD - CPR SUL/GPM";

    const baseCellStyle =
      "border: 1px solid black; padding: 6px; vertical-align: middle; word-wrap: break-word;";
    const headerCellStyle = `style="background-color: #f1f5f9; font-weight: bold; ${baseCellStyle}"`;
    const dataCellStyle = `style="${baseCellStyle}"`;

    const centeredHeaderCellStyle = `style="text-align: center; ${headerCellStyle.replace(
      'style="',
      ""
    )}"`;
    const leftHeaderCellStyle = `style="text-align: left; ${headerCellStyle.replace(
      'style="',
      ""
    )}"`;
    const centeredDataCellStyle = `style="text-align: center; ${dataCellStyle.replace(
      'style="',
      ""
    )}"`;
    const leftDataCellStyle = `style="text-align: left; ${dataCellStyle.replace(
      'style="',
      ""
    )}"`;

    const tableStyle =
      'style="width: 100%; max-width: 800px; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9pt; table-layout: fixed;"';

    const colgroup = `
      <colgroup>
        <col style="width: 20%;">
        <col style="width: 65%;">
        <col style="width: 15%;">
      </colgroup>
    `;

    const materialsHeaderRows = `
      <tr>
        <th ${centeredHeaderCellStyle}>Código</th>
        <th ${leftHeaderCellStyle}>Descrição</th>
        <th ${centeredHeaderCellStyle}>Qtd.</th>
      </tr>
    `;

    const materialsBodyRows = processo.materiais
      .map(
        (m) => `
        <tr>
          <td ${centeredDataCellStyle}>${m.codigo}</td>
          <td ${leftDataCellStyle}>${m.descricao}</td>
          <td ${centeredDataCellStyle}>${m.quantidade}</td>
        </tr>`
      )
      .join("");

    const finalHtml = `
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>Destinatário:</b> ${EMAIL_DESTINATARIO}</p>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>CC:</b> ${EMAIL_CC}</p>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;"><b>Assunto:</b> ${EMAIL_TITULO}</p><br>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;">${greeting}</p><br>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;">Peço, por gentileza, que verifique a disponibilidade do material no CD:</p><br>
      <table ${tableStyle}>
        ${colgroup}
        <thead>${materialsHeaderRows}</thead>
        <tbody>${materialsBodyRows}</tbody>
      </table><br>
      <p style="font-family: Arial, sans-serif; font-size: 10pt;">Caso disponível apenas em ATA, peço por gentileza informações sobre o prazo de entrega e qual o próximo passo para que possamos seguir com a aquisição.</p>
    `;

    const plainTextTable = processo.materiais
      .map((m) => `${m.codigo} | ${m.descricao} | ${m.quantidade}`)
      .join("\n");

    const plainText = `Destinatário: ${EMAIL_DESTINATARIO}
CC: ${EMAIL_CC}
Assunto: ${EMAIL_TITULO}

${greeting}

Peço, por gentileza, que verifique a disponibilidade do material no CD:

Código | Descrição | Qtd.
${plainTextTable}

Caso disponível apenas em ATA, peço por gentileza informações sobre o prazo de entrega e qual o próximo passo para que possamos seguir com a aquisição.`;

    try {
      const htmlBlob = new Blob([finalHtml], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
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
