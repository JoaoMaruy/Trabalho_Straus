# Block Films — Instruções de instalação e execução (Cross‑platform)

Este repositório contém um site de avaliações de filmes (Node.js + Express + Back4App Parse). As instruções abaixo ajudam a executar o projeto em qualquer computador (Windows/macOS/Linux) com VS Code ou outro editor.

Requisitos mínimos
- Node.js 16+ e npm (ou nvm para gerenciar versões)
- Conexão com internet para Back4App

Passos rápidos
1. Clone o repositório e entre na pasta

```bash
git clone <url-do-repo>
cd Trabalho_Straus
```

2. Instale dependências

```bash
npm install
```

3. Copie o exemplo de variáveis de ambiente e ajuste se necessário

```bash
copy .env.example .env   # Windows (PowerShell/CMD)
# ou
cp .env.example .env     # macOS / Linux
```
Edite `.env` e preencha suas chaves do Back4App se desejar. O projeto tem defaults em `config/database.js` para facilitar testes locais.

4. Popular (seed) a base (opcional)

```bash
npm run seed:back4app
```

5. Iniciar servidor

```bash
npm start
```

6. Executar testes básicos

```bash
npm test
```

URLs úteis
- App: http://localhost:3000
- Endpoint health: http://localhost:3000/api/health

Observações importantes
- Sessões: atualmente usamos `express-session` com `session-file-store`. Funciona localmente e em monolíticos únicos. Para produção/escala recomendamos mover o store para Redis (posso implementar isso).
- Sessões: atualmente usamos `express-session` com `session-file-store` por padrão. Este repositório já suporta opcionalmente Redis como session store — para ativar, defina `REDIS_URL` no `.env` (ex: `redis://:password@hostname:6379/0`) e reinicie o servidor. Quando ativo, o servidor usará Redis em vez de arquivos, o que é recomendado para produção e ambientes com múltiplas instâncias.
- Autenticação mobile: atualmente usa cookie-based sessions. Para mobile nativo recomendamos usar tokens (JWT) — posso adicionar endpoints JWT se desejar.
- Upload de imagens: imagens são salvas como `Parse.File` no Back4App e `filmes.imagem` armazena a URL pública.
- Permissões: hoje qualquer usuário autenticado pode trocar a capa de um filme. Se quer restrição por papel (admin), posso implementar.

Ajuda/Debug
- Se `npm start` falhar, verifique a versão do Node (`node -v`) e remova caches (`npm ci`).
- Para ver logs em tempo real use o terminal do VS Code.

Se quiser, eu implemento: 1) store de sessão Redis; 2) autenticação JWT; 3) restrição de alteração de capa a administradores; 4) testes automatizados completos. Escolha uma opção.