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
