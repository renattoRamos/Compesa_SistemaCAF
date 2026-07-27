# Infraestrutura e Implantação - Sistema CAF GPM

## 1. Visão Geral da Infraestrutura
O **Sistema CAF GPM** é empacotado como uma aplicação web estática (SPA) moderna otimizada para execução em plataformas de nuvem, contêineres Docker / Cloud Run e provedores estáticos como Netlify e Vercel.

## 2. Especificação do Ambiente de Execução
- **Node.js:** v18.x ou v20.x LTS
- **Gerenciador de Pacotes:** npm v9.x+
- **Servidor Web Interno:** Nginx ou servidor de arquivos estáticos SPA na porta `3000` (com fallback de roteamento para `index.html`)

## 3. Variáveis de Ambiente
As variáveis de ambiente configuráveis estão definidas em `.env.example`:

```env
# Porta de execução do servidor de desenvolvimento ou proxy estático
PORT=3000

# Modo de execução
NODE_ENV=production
```

## 4. Pipeline de CI/CD e Build
```bash
# 1. Instalação de Dependências
npm ci

# 2. Análise Estática de Código (Linter)
npm run lint

# 3. Compilação e Geração de Artefato Estático
npm run build
```

Os arquivos gerados na pasta `dist/` podem ser servidos diretamente por qualquer CDN ou servidor Nginx com suporte a SPA fallback.
