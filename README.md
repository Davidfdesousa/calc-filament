# Calculadora de Filamento — MVP

Vite + TypeScript + CSS puro, com login via Google (Firebase Auth) e configurações
avançadas (energia, taxa de falha, ROI) persistidas por usuário no Firestore.

## Setup

1. Instale as dependências:
   ```
   npm install
   ```

2. Crie um projeto em https://console.firebase.google.com
   - Em **Authentication > Sign-in method**, ative o provedor **Google**.
   - Em **Firestore Database**, crie o banco (modo produção) e publique as regras
     de `firestore.rules` deste projeto (Console > Firestore > Regras).
   - Em **Configurações do projeto > Seus apps**, crie um app Web e copie as chaves.

3. Copie `.env.example` para `.env.local` e preencha com as chaves do passo anterior:
   ```
   cp .env.example .env.local
   ```

4. Rode o projeto:
   ```
   npm run dev
   ```

## Branches: `main` (produção) / `develop` (desenvolvimento)

- **`develop`** é onde o dia a dia acontece — commits e PRs de feature/fix entram aqui. É o
  ambiente de **dev**, publicado como Preview Deployment da Vercel.
- **`main`** só recebe promoções de `develop` via Pull Request aberto por
  `scripts/promote-to-main.sh` (o script faz o merge numa branch temporária, resolve os
  conflitos esperados em `CHANGELOG.md`/`package.json` e abre o PR pronto pra revisar). É o
  ambiente de **produção**.

### Estratégia de merge dos PRs

- **PRs de feature/fix/chore → `develop`**: usar **"Rebase and merge"**. Mantém cada commit
  (já validado pelo `commitlint`) sem commit de merge extra — o semantic-release lê cada
  mensagem certinho.
- **"Squash and merge" fica desabilitado no repositório**: ele usa o título do PR como mensagem
  e, se o título não seguir Conventional Commits, o release é perdido sem aviso.
- **PR de promoção `develop` → `main`**: já nasce com um commit de merge, então a única opção
  disponível é **"Create a merge commit"**. É esperado.

## Deploy: Vercel (produção em `main`, dev em `develop`)

O projeto na Vercel (`davidfdesousas-projects/calc-filament`) está ligado ao repositório do
GitHub — não há workflow de deploy no repo:

- Push em **`main`** publica em produção: **https://calc-filament.vercel.app**.
- Push em qualquer outra branch gera uma **Preview Deployment**. A `develop` tem URL fixa:
  **https://calc-filament-git-develop-davidfdesousas-projects.vercel.app**.
- As variáveis `VITE_FIREBASE_*` estão cadastradas na Vercel (Production e Preview). Pra mudar:
  `vercel env add <NOME> production --force`.
- `vercel.json` encaminha `/__/auth/*` e `/__/firebase/*` pro `calc-filament-data.firebaseapp.com`.

Deploy manual, se precisar fora do fluxo automático:

```bash
npx vercel login
npx vercel link --project calc-filament
npx vercel --prod
```

### Login com Google fora do localhost

O Firebase só aceita login a partir de domínios listados em **Authentication → Settings →
Authorized domains**. Já estão lá `calc-filament.vercel.app` e a URL fixa da `develop`. Previews
de outras branches (URLs com hash) **não** estão — adicione o domínio se precisar testar login
num preview específico.

O login usa `signInWithPopup` (funciona em qualquer domínio). `signInWithRedirect` fica só como
fallback quando o navegador bloqueia o popup, porque o redirect depende de cookies de terceiros
fora do Firebase Hosting.

## Versionamento e changelog (semantic-release)

Versão (`package.json`), tag, GitHub Release e `CHANGELOG.md` são gerados automaticamente a
partir das mensagens de commit — nunca escritos à mão.

- **Conventional Commits obrigatório**: `commitlint` + `husky` (`.husky/commit-msg`) barram
  localmente qualquer commit fora do padrão. `feat` → minor, `fix` → patch,
  `chore`/`docs`/`style`/`refactor`/`test`/... → sem bump, `BREAKING CHANGE:` (ou `!`) → major.
- **`develop`** roda em canal de **pré-release** (`.releaserc.json`) — cada push com commit
  relevante gera uma versão tipo `1.1.0-develop.2`, com tag, GitHub Release pre-release e
  entrada no `CHANGELOG.md`.
- **`main`** gera a versão real (ex. `1.1.0`) quando o PR de promoção é mergeado.
- Workflow: [`.github/workflows/release.yml`](.github/workflows/release.yml), roda nas duas
  branches.

## Estrutura

- `src/firebase.ts` — inicialização do Firebase (Auth + Firestore).
- `src/auth.ts` — login/logout com Google.
- `src/calculator.ts` — lógica pura de cálculo de custo e margem.
- `src/settingsStore.ts` — leitura/gravação das configurações do usuário em
  `users/{uid}/config/settings` no Firestore.
- `src/views/login.ts` e `src/views/calculator.ts` — telas.

## Referência

O primeiro protótipo (HTML/CSS/JS único arquivo, sem login) está em
`../poc/calculadora-v1-referencia.html`.
