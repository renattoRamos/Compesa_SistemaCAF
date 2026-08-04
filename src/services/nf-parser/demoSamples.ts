import { NFProcessingResult } from "@/types/nf";

export const SAMPLE_NFE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260812345678000195550010000458921000123456" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>00012345</cNF>
        <natOp>Venda de Mercadorias</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>45892</nNF>
        <dhEmi>2026-08-01T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>COMPANHIA DE EQUIPAMENTOS E MATERIAIS INDUSTRIAIS LTDA</xNome>
        <xFant>CEMIL EQUIPAMENTOS</xFant>
        <enderEmit>
          <xLgr>Av. Industrial</xLgr>
          <nro>1500</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>09769035000164</CNPJ>
        <xNome>COMPESA - COMPANHIA PERNAMBUCANA DE SANEAMENTO</xNome>
      </dest>
      <total>
        <ICMSTot>
          <vProd>12450.00</vProd>
          <vNF>12450.00</vNF>
          <vICMS>1494.00</vICMS>
          <vIPI>0.00</vIPI>
        </ICMSTot>
      </total>
      <infAdic>
        <infCpl>ORDEM DE COMPRA: OC-884920. PROCESSO SEI: 00190-008472/2026. SCDI: 04821. FORNECIMENTO DE TUBULAÇÃO DE PEAD DE 200MM.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SAMPLE_NFSE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse201">
  <Nfse>
    <InfNfse>
      <Numero>009841</Numero>
      <CodigoVerificacao>A8B9-C7D6-E5F4</CodigoVerificacao>
      <DataEmissao>2026-08-03T14:15:00</DataEmissao>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <Cnpj>98765432000110</Cnpj>
        </IdentificacaoPrestador>
        <RazaoSocial>SUL ENGENHARIA E SERVIÇOS TÉCNICOS ESPECIALIZADOS EIRELI</RazaoSocial>
        <NomeFantasia>SUL ENGENHARIA</NomeFantasia>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <Cnpj>09769035000164</Cnpj>
        </IdentificacaoTomador>
        <RazaoSocial>COMPESA - COMPANHIA PERNAMBUCANA DE SANEAMENTO</RazaoSocial>
      </TomadorServico>
      <Servico>
        <Valores>
          <ValorServicos>7850.00</ValorServicos>
          <ValorIss>392.50</ValorIss>
          <ValorLiquidoNfse>7850.00</ValorLiquidoNfse>
        </Valores>
        <Discriminacao>PRESTAÇÃO DE SERVIÇOS DE MANUTENÇÃO PREVENTIVA E CORRETIVA EM ESTAÇÕES DE BOMBAMENTO. ORDEM DE COMPRA: OC-99321. SEI: 00190-009182/2026. SCDI: 02931.</Discriminacao>
      </Servico>
    </InfNfse>
  </Nfse>
</CompNfse>`;

export function getSampleNFE(): { file: File; result: NFProcessingResult } {
  const blob = new Blob([SAMPLE_NFE_XML], { type: "text/xml" });
  const file = new File([blob], "NotaFiscal_NFe_Produto_Exemplo.xml", { type: "text/xml" });

  const result: NFProcessingResult = {
    success: true,
    documentType: "NF-e",
    extractedData: {
      cnpjEmitente: "12.345.678/0001-95",
      razaoSocialEmitente: "COMPANHIA DE EQUIPAMENTOS E MATERIAIS INDUSTRIAIS LTDA",
      nomeFantasiaEmitente: "CEMIL EQUIPAMENTOS",
      numeroNota: "45892",
      serie: "1",
      modelo: "55",
      chaveAcesso: "35260812345678000195550010000458921000123456",
      dataEmissao: "2026-08-01",
      valorTotal: 12450.0,
      valorProdutos: 12450.0,
      oc: "OC-884920",
      descricao: "FORNECIMENTO DE TUBULAÇÃO DE PEAD DE 200MM.",
      tipoNotaForm: "Compra de Material",
    },
    confidenceScores: {
      cnpjEmitente: "high",
      razaoSocialEmitente: "high",
      numeroNota: "high",
      valorTotal: "high",
      oc: "high",
      chaveAcesso: "high",
    },
    missingFields: [],
    lowConfidenceFields: [],
    hasText: true,
    usedOCR: false,
  };

  return { file, result };
}

export function getSampleNFSE(): { file: File; result: NFProcessingResult } {
  const blob = new Blob([SAMPLE_NFSE_XML], { type: "text/xml" });
  const file = new File([blob], "NotaFiscal_NFSe_Servico_Exemplo.xml", { type: "text/xml" });

  const result: NFProcessingResult = {
    success: true,
    documentType: "NFS-e",
    extractedData: {
      cnpjEmitente: "98.765.432/0001-10",
      razaoSocialEmitente: "SUL ENGENHARIA E SERVIÇOS TÉCNICOS ESPECIALIZADOS EIRELI",
      nomeFantasiaEmitente: "SUL ENGENHARIA",
      numeroNota: "009841",
      chaveAcesso: "A8B9-C7D6-E5F4",
      dataEmissao: "2026-08-03",
      valorTotal: 7850.0,
      valorServicos: 7850.0,
      valorISS: 392.5,
      oc: "OC-99321",
      descricao: "PRESTAÇÃO DE SERVIÇOS DE MANUTENÇÃO PREVENTIVA E CORRETIVA EM ESTAÇÕES DE BOMBAMENTO.",
      tipoNotaForm: "Serviço",
    },
    confidenceScores: {
      cnpjEmitente: "high",
      razaoSocialEmitente: "high",
      numeroNota: "high",
      valorTotal: "high",
      oc: "high",
    },
    missingFields: [],
    lowConfidenceFields: [],
    hasText: true,
    usedOCR: false,
  };

  return { file, result };
}
