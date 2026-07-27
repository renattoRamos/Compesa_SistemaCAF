# Requisitos Funcionais - Sistema CAF GPM

## 1. Visão Geral
Este documento especifica os requisitos funcionais do Sistema CAF GPM, responsável pelo gerenciamento de Solicitações de Compra Direta/Indireta (SCDI) e Lançamento de Notas Fiscais (NF) para a COMPESA (GPM / CMA SUL / CPR SUL).

## 2. Requisitos Funcionais (RF)

| ID | Nome | Descrição | Prioridade |
|---|---|---|---|
| **RF-001** | Cadastro de Autorização SCDI | O sistema deve permitir criar novas requisições SCDI contendo número da requisição (até 6 dígitos), número do processo (até 6 dígitos), coordenação (CMA NORTE, CMA SUL, CMA OESTE), aplicação e lista de materiais. | Alta |
| **RF-002** | Gestão de Materiais da SCDI | Permite adicionar múltiplos materiais por requisição com descrição, código numérico (até 10 dígitos), quantidade, unidade de medida, valor unitário e status de disponibilidade (Almoxarifado, Estoque CD, Ata ARP). | Alta |
| **RF-003** | Edição e Exclusão de SCDI | Permite alterar ou excluir requisições SCDI existentes armazenadas localmente no navegador do usuário. | Alta |
| **RF-004** | Atualização de Status | O sistema deve permitir alterar o status do processo entre: *Pendente*, *Aprovado*, *Rejeitado* e *Aguardando Entrega* (com registro opcional de prazo de entrega). | Alta |
| **RF-005** | Filtro e Visualização de Processos | Permite filtrar requisições por status e alternar entre a visualização em Grade (Cards) e Tabela. | Média |
| **RF-006** | Solicitação de Compra ao ADM | O sistema deve disponibilizar um formulário de solicitação de compra de materiais com justificativa detalhada e itens opcionais. | Média |
| **RF-007** | Lançamento de Nota Fiscal (NF) | Formulário para emissão de relatório formatado para e-mail administrativo do lançamento da NF no sistema Alpha. | Alta |
| **RF-008** | Consulta Automática de CNPJ | Ao digitar 14 dígitos válidos de CNPJ no formulário de NF, o sistema deve consultar a Razão Social na API externa (BrasilAPI) e preencher automaticamente o campo. | Alta |
| **RF-009** | Cálculo Automático do ID Fornecedor | Ao preencher o CNPJ, o sistema deve calcular automaticamente o ID do Fornecedor baseado na raiz do CNPJ (8 dígitos) e seus 2 dígitos verificadores. | Alta |
| **RF-010** | Geração de E-mail Formatado em HTML | O sistema deve gerar o corpo do e-mail com a tabela formatada (estilo corporativo com cabeçalhos `#002060`) e copiar diretamente para a área de transferência com suporte a Rich Text HTML. | Alta |
| **RF-011** | Funcionamento Offline (PWA) | O aplicativo deve suportar instalação PWA, armazenamento local em `localStorage` e indicar a situação da conexão do usuário em tempo real. | Média |

## 3. Requisitos Não Funcionais (RNF)

| ID | Nome | Descrição |
|---|---|---|
| **RNF-001** | Desempenho | As consultas locais e atualizações do DOM devem responder em menos de 100ms. |
| **RNF-002** | Usabilidade | Interface limpa, responsiva (Desktop e Mobile) utilizando Tailwind CSS e componentes acessíveis baseados em Radix UI / shadcn. |
| **RNF-003** | Compatibilidade | Compatível com Google Chrome, Microsoft Edge, Mozilla Firefox e Safari em suas versões recentes. |
| **RNF-004** | Portabilidade | Suporte a instalação Progressive Web App (PWA) com Service Workers e manifesto web. |
