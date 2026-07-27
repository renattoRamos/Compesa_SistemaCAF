# Integração de API - Sistema CAF GPM

## 1. Visão Geral
O **Sistema CAF GPM** realiza consumo de serviços externos para enriquecimento de dados cadastrais de fornecedores de forma transparente ao usuário.

## 2. API do CNPJ (BrasilAPI)

### Endpoint
`GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}`

### Parâmetros de Entrada
- `cnpj` (string, obrigatório): Número do CNPJ contendo exatamente 14 dígitos numéricos (sem pontuação).

### Exemplo de Requisição
```bash
curl -X GET "https://brasilapi.com.br/api/cnpj/v1/00000000000191" \
  -H "accept: application/json"
```

### Exemplo de Resposta (Sucesso - 200 OK)
```json
{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL SA",
  "nome_fantasia": "DIRECAO GERAL",
  "situacao_cadastral": 2,
  "descricao_situacao_cadastral": "ATIVA",
  "cnae_fiscal": 6422100,
  "cnae_fiscal_descricao": "Bancos múltiplos, com carteira comercial",
  "uf": "DF",
  "municipio": "BRASILIA"
}
```

### Tratamento de Erros e Timeout
- **Timeout Limite:** Configurado para 8 segundos utilizando `AbortController`.
- **Cancelamento Ativo:** Se o usuário alterar o CNPJ enquanto uma requisição anterior estiver em andamento, a requisição anterior é abortada para evitar respostas fora de ordem (race conditions).
- **Fallback:** Em caso de erro na consulta (ex: API offline ou CNPJ não encontrado), o sistema exibe notificação amigável via Sonner toast e permite o preenchimento manual da Razão Social pelo operador.
