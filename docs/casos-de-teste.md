# Casos de Teste - Sistema CAF GPM

## Plano de Testes
Este documento reúne os cenários e casos de teste automatizados e manuais para validação das funcionalidades do Sistema CAF GPM.

| ID | Cenário | Passos | Resultado Esperado | Status |
|---|---|---|---|---|
| **CT-01** | Validação de CNPJ Válido | Digitar `00.000.000/0001-91` no campo CNPJ | Razão Social preenchida como "BANCO DO BRASIL SA" e ID Fornecedor calculado | Passou |
| **CT-02** | Formatação Monetária | Inserir valor unitário e quantidade na tabela de materiais | Valor total do processo atualizado instantaneamente em Reais (R$) | Passou |
| **CT-03** | Inserção de SCDI com Sucesso | Preencher campos obrigatórios da SCDI e salvar | Processo listado na tabela e nos cards com estatísticas atualizadas no painel | Passou |
| **CT-04** | Cópia HTML para E-mail | Gerar e-mail de NF e clicar em "Copiar para E-mail" | Conteúdo HTML com tabela e estilos `#002060` gravado na área de transferência | Passou |
| **CT-05** | Persistência Local | Recarregar a página após criar uma SCDI | Os dados salvos permanecem visíveis sem perda de informações | Passou |
| **CT-06** | Alternância de Visualização | Alternar entre visualização em Grade e Tabela | O modo selecionado é salvo no `localStorage` e mantido entre sessões | Passou |
