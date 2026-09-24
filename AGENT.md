# AGENT.md — contexto do projeto "Calculadora de Filamento"

Guia para qualquer agente/dev que for trabalhar neste repositório. Leia antes de editar.
Existe **só na branch `develop`** (ver "Branches e fluxo de trabalho") — nunca chega em `main`.

## O que é

Web app **mobile-first** que calcula o custo real de uma peça impressa em 3D (filamento +
energia + ajuste por falhas + retorno da impressora) e, se o usuário informar o preço de venda,
mostra margem de lucro ou prejuízo. Login com Google; as configurações do usuário ficam salvas no
Firestore e voltam em qualquer dispositivo.

- **Autor / usuário principal**: David Ferreira. Toda a UI, commits e docs são em **pt-BR**.
- **Produção**: https://calc-filament.vercel.app (Vercel, branch `main`).
- **Dev**: https://calc-filament-git-develop-davidfdesousas-projects.vercel.app (preview da
  `develop`, protegido por login da Vercel — Deployment Protection).
- **Firebase**: projeto `calc-filament-data` (Auth com Google + Firestore). O Firebase Hosting
  (`calc-filament-data.web.app`, via `firebase.json`/`.firebaserc`) foi usado antes da Vercel e
  ficou de legado — **o host oficial é a Vercel**.

## Stack e comandos

- **Vite 8 + TypeScript 6 (estrito) + CSS puro**. Sem framework de UI (nada de React/Tailwind):
  as telas são template strings em `innerHTML` + `addEventListener`.
- `firebase` v12 (modular: `firebase/auth`, `firebase/firestore`).
- Ambiente do David: **Windows** (PowerShell/Git Bash). Avisos de `LF will be replaced by CRLF`
  no git são normais.

```bash
npm install
npm run dev       # precisa de .env.local com as VITE_FIREBASE_* (ver .env.example)
npm run build     # tsc + vite build — é a única verificação automática (roda no CI também)
npm run preview
```

Não há testes, lint nem formatter configurados. **Sempre rode `npm run build` antes de commitar.**

## Arquitetura

```
index.html              → <div id="app"> + /src/main.ts
src/main.ts             → bootstrap: sem config → tela "Firebase não configurado";
                          senão checkRedirectResult() → watchAuth() → login ou calculadora
src/firebase.ts         → initializeApp com import.meta.env.VITE_FIREBASE_*; exporta auth, db,
                          googleProvider e firebaseReady
src/auth.ts             → signInWithGoogle (popup, fallback redirect), signOutUser, watchAuth,
                          checkRedirectResult, authErrorMessage (código Firebase → texto pt-BR)
src/calculator.ts       → calcular(): lógica PURA do custo (sem DOM, sem Firebase)
src/settingsStore.ts    → loadSettings/saveSettings em users/{uid}/config/settings
src/views/login.ts      → tela de login
src/views/calculator.ts → tela principal (abas Calculadora/Configurações), liga inputs →
                          calcular() → DOM, e persiste configurações com debounce de 500 ms
src/style.css           → todo o visual (tokens em :root, dark mode)
firestore.rules         → cada usuário só lê/escreve em users/{seu uid}/**
poc/calculadora-v1-referencia.html → protótipo original (arquivo único, sem login). Só referência.
```

### Fórmula (`src/calculator.ts`)

1. `custoFilamento = precoKg / 1000 × gramas`
2. `custoEnergia = potenciaW / 1000 × horas × tarifaKwh`
3. `subtotal = filamento + energia`
4. **Falha**: `custoComFalha = subtotal / (1 − falha%)` — dilui peças perdidas nas que dão certo
   (10% de falha ≈ +11%, não +10%). `falhaPct` é limitado a 0–95.
5. **ROI**: `custoFinal = custoComFalha × (1 + roi%)`
6. Se houver preço de venda: `lucro = venda − custoFinal`, `margem% = lucro / custoFinal × 100`
   (margem **sobre o custo**, não sobre o preço de venda).

Mudou a fórmula? Mantenha `calcular()` pura e atualize os textos de ajuda (`card-hint`) na view.

### O que é persistido

`UserSettings` = `precoKg`, `potenciaW`, `tarifaKwh`, `falhaPct`, `roiPct`. Gramas, horas e preço
de venda são **por peça** e não são salvos. Detalhes que pegam:

- `precoKg` fica na aba **Calculadora** mas é salvo como configuração.
- A view salva `parseFloat(valor) || null` → **0 vira `null`** (campo vazio ao recarregar).
- Adicionar um campo persistido = mexer em `UserSettings` + `emptySettings`
  (`settingsStore.ts`) + montagem do objeto em `schedulePersist` + carga em `wireCalculator` +
  a lista de chaves que disparam `schedulePersist`. As regras do Firestore não precisam mudar
  (liberam o documento inteiro do dono).

## Autenticação — GOTCHAS (não repetir bugs antigos)

- **Use `signInWithPopup`**. `signInWithRedirect` quebra fora do Firebase Hosting (bloqueio de
  cookies de terceiros no Chrome/Safari: volta do Google sem usuário logado). O redirect só entra
  como fallback quando o popup é bloqueado (`auth/popup-blocked`).
- **Todo domínio novo** onde o login precisa funcionar tem que entrar em Firebase Console →
  Authentication → Settings → **Authorized domains**. Hoje: `localhost`,
  `calc-filament.vercel.app`, a URL fixa da `develop` e domínios antigos de túnel (`loca.lt`,
  `trycloudflare.com`). Previews com hash (`calc-filament-xxxx-….vercel.app`) **não** estão —
  login falha neles com `auth/unauthorized-domain` (a tela mostra a mensagem certa).
- `VITE_FIREBASE_AUTH_DOMAIN` = `calc-filament-data.firebaseapp.com`. `vercel.json` também faz
  proxy de `/__/auth/*` e `/__/firebase/*` pro firebaseapp.com — só é usado se um dia o
  authDomain passar a ser o próprio domínio da Vercel (aí também precisa cadastrar
  `https://<domínio>/__/auth/handler` como redirect URI no OAuth client do Google Cloud).
- Erros de login viram texto por `authErrorMessage()`; fechar o popup não mostra erro.

## Variáveis de ambiente

- Local: `.env.local` (ignorado pelo git; também guarda um `VERCEL_OIDC_TOKEN` criado pela CLI).
- Vercel: as 6 `VITE_FIREBASE_*` estão em **Production e Preview**, tipo `config`. A API key
  web do Firebase é pública por natureza (vai no bundle) — a CLI da Vercel pergunta, e a resposta
  é `--type config`, nunca renomear pra tirar o prefixo `VITE_`.
- Variável nova: adicionar em `.env.example`, `src/vite-env.d.ts` e na Vercel:
  `npx vercel env add NOME production --type config --value "..." --yes` (repita pra `preview`).
  Vite embute no build → precisa de novo deploy pra valer.

## Branches e fluxo de trabalho (mesmo modelo do projeto ggsetup)

- **Trabalhe sempre em `develop`** (ou branch de feature → PR pra `develop` com **"Rebase and
  merge"**; squash está desabilitado no repo).
- **Conventional Commits em pt-BR**, validados pelo `commitlint` no hook `.husky/commit-msg`.
  Ex.: `feat(calc): adiciona custo de mão de obra`, `fix(auth): ...`, `docs: ...`.
  `feat` → minor, `fix` → patch, `chore`/`docs`/`refactor`/`style`/`ci` → sem release.
  Termine a mensagem com o trailer `Co-Authored-By` quando o commit for feito pelo Claude.
- Push em `develop` → `.github/workflows/release.yml` gera pré-release (`x.y.z-develop.n`) e a
  Vercel publica o preview.
- **Produção**: `bash scripts/promote-to-main.sh` abre PR `develop → main` (resolve conflitos de
  `CHANGELOG.md`/`package.json` e remove `AGENT.md`/`CLAUDE.md`). Mergear com **"Create a merge
  commit"** → release real + deploy de produção.
- **Nunca** editar à mão `version` do `package.json` nem `CHANGELOG.md` — são do semantic-release.
- Nunca dar push direto em `main` sem o David pedir.

## Como fazer tarefas comuns

- **Novo campo no cálculo**: `CalcInputs`/`CalcResult` + `calcular()` → input na view →
  leitura em `calcularEExibir()` → linha em "Composição do custo" (padrão `result-row`, escondida
  quando zero). Se for configuração fixa, ver "O que é persistido".
- **Visual**: só `src/style.css`. Cores via tokens (`--bg`, `--surface`, `--ink`, `--accent`,
  `--good`, `--bad`…) definidos pra claro, escuro (`prefers-color-scheme`) e `data-theme`.
  Mudou um token? Mude nos **três** blocos. Moeda sempre via `brl()` (pt-BR/BRL).
- **Regras do Firestore**: editar `firestore.rules` **e** publicar no console (Firestore →
  Regras). A CLI `firebase` não está instalada na máquina.
- **Verificar em produção**: `npm run build` local; depois do push, `gh run list --workflow
  release.yml` e `npx vercel ls calc-filament`.

## Limitações conhecidas

- Bundle único ~570 kB (Firebase inteiro); o Vite avisa de chunk > 500 kB. Não é erro.
- Sem testes automatizados — `calcular()` é o melhor candidato se um dia entrarem (vitest).
- `innerHTML` recebe `user.photoURL` sem escape (vem do Google, baixo risco).
- `initializeApp` roda mesmo sem config; `firebaseReady` só evita usar Auth/Firestore.

## Histórico

- **2026-07-24** — MVP: port do protótipo `poc/` pra Vite + TS, login Google, Firestore por
  usuário, deploy inicial no Firebase Hosting.
- **2026-09-23** — Deploy na Vercel; login trocado de redirect pra popup (redirect quebrava fora
  do Firebase Hosting); `master` renomeada pra `main`, criada `develop`; semantic-release,
  commitlint e husky no mesmo modelo do ggsetup (releases `v1.0.0` e `v1.0.0-develop.1`); este
  arquivo criado.

Ao terminar uma rodada de ajustes relevante, adicione uma linha aqui (data + o que mudou e por quê).
