# Manual do Usuário - Sistema CAF GPM

## 1. Introdução
Bem-vindo ao **Sistema CAF GPM** (Sistema de Solicitação SCDI e Lançamento de Nota Fiscal). Este manual orienta a utilização passo a passo das principais funcionalidades da plataforma.

---

## 2. Módulo de Autorização SCDI

### 2.1 Criar uma nova Autorização
1. Acesse o menu lateral e clique em **Autorização SCDI**.
2. Clique no botão **Nova Autorização SCDI** no canto superior direito.
3. Preencha os dados gerais do processo:
   - **Nº da Requisição:** Digite o código numérico (até 6 dígitos).
   - **Nº do Processo:** Digite o código do processo (até 6 dígitos).
   - **Coordenação:** Selecione entre *CMA NORTE*, *CMA SUL* ou *CMA OESTE*.
   - **Aplicação:** Descreva o destino ou finalidade dos materiais.
   - **Data do Processo:** Selecione a data desejada.
4. Adicione os materiais:
   - Informe a descrição e código numérico.
   - Defina quantidade, unidade de medida e valor unitário (o valor total é calculado automaticamente).
   - Selecione a disponibilidade no Almoxarifado, Estoque CD e Ata ARP.
5. Clique em **Salvar Autorização**.

### 2.2 Alterar Status do Processo
1. Localize o card ou linha do processo desejado.
2. Clique no menu de ações do processo e selecione **Atualizar Status**.
3. Escolha o novo status (*Pendente*, *Aprovado*, *Rejeitado*, *Aguardando Entrega*).
4. Se for *Aguardando Entrega*, informe o prazo previsto.

---

## 3. Módulo de Lançamento de Nota Fiscal (NF)

### 3.1 Preencher e Gerar E-mail para Lançamento no Alpha
1. Acesse o menu lateral e clique em **Lançamento de NF**.
2. Digite o **CNPJ** do fornecedor (os pontos e traços serão formatados automaticamente).
3. O sistema fará a busca automática da **Razão Social** e calculará o **ID Fornecedor**.
4. Informe o **Nº da Nota**, **OC**, **SCDI** (5 dígitos), **Valor Total**, **SEI** e o **Tipo de Nota**.
5. Clique em **Gerar E-mail**.
6. Na tela de pré-visualização, revise os dados e clique em **Copiar para E-mail**.
7. Abra seu cliente de e-mail (Outlook / Webmail) e cole (`Ctrl + V`) no corpo da mensagem. A tabela HTML estilizada e os campos de Destinatário/Título serão aplicados com formatação corporativa.
