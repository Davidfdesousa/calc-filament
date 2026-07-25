import "./style.css";
import { firebaseReady } from "./firebase";
import { watchAuth, type User } from "./auth";
import { renderLogin } from "./views/login";
import { renderCalculator } from "./views/calculator";

const root = document.querySelector<HTMLDivElement>("#app")!;

function renderLoading() {
  root.innerHTML = `<main class="login-screen"><p class="loading">Carregando…</p></main>`;
}

function renderSetupNeeded() {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <div class="eyebrow">Configuração pendente</div>
        <h1>Firebase não configurado</h1>
        <p>Copie <code>.env.example</code> para <code>.env.local</code> e preencha as chaves do seu projeto Firebase para habilitar o login.</p>
      </div>
    </main>
  `;
}

if (!firebaseReady) {
  renderSetupNeeded();
} else {
  renderLoading();
  watchAuth((user: User | null) => {
    if (user) {
      void renderCalculator(root, user);
    } else {
      renderLogin(root);
    }
  });
}
