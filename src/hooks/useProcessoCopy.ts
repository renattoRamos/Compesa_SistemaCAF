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

    const dataFontColor = "color: #000066;";
    const baseCellStyle =
      "border: 1px solid black; padding: 5px; vertical-align: middle; word-wrap: break-word;";
    const headerCellStyle = `style="background-color: #002060; color: white; font-weight: bold; ${baseCellStyle}"`;
    const dataCellStyle = `style="${baseCellStyle} ${dataFontColor}"`;
    const valueCellStyle = `style="background-color: #002060; color: white; ${baseCellStyle}"`;
    const redBoldStyle = "color: red; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,0.3);";
    const redBoldValueCellStyle = `style="background-color: #002060; ${redBoldStyle} font-size: 18pt; ${baseCellStyle}"`;
    const totalValueCellStyle = `style="background-color: #002060; color: white; font-weight: bold; font-size: 10pt; ${baseCellStyle}"`;

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

  return { handleCopyToEmail, handleCopyToWhatsApp };
};
