import type { User } from "../auth";
import { signOutUser } from "../auth";
import { calcular } from "../calculator";
import { loadSettings, saveSettings, type UserSettings } from "../settingsStore";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function renderCalculator(root: HTMLElement, user: User): Promise<void> {
  root.innerHTML = `
    <main>
      <header class="app-header">
        <div>
          <div class="eyebrow">Impressão 3D</div>
          <h1>Calculadora de Filamento</h1>
        </div>
        <button class="btn-signout" id="btn-signout" title="Sair" aria-label="Sair">
          ${user.photoURL ? `<img class="avatar" src="${user.photoURL}" alt="" referrerpolicy="no-referrer">` : "Sair"}
        </button>
      </header>

      <div class="tabs" role="tablist">
        <button class="tab-btn" id="tab-calc" role="tab" aria-selected="true" aria-controls="panel-calc">Calculadora</button>
        <button class="tab-btn" id="tab-config" role="tab" aria-selected="false" aria-controls="panel-config">Configurações</button>
      </div>

      <section class="panel active" id="panel-calc" role="tabpanel" aria-labelledby="tab-calc">
        <div class="card">
          <div class="field">
            <label for="preco-kg">Preço do filamento <span class="optional">por kg</span></label>
            <div class="input-wrap">
              <span class="prefix">R$</span>
              <input type="number" id="preco-kg" inputmode="decimal" step="0.01" min="0" placeholder="120,00">
            </div>
          </div>
          <div class="field">
            <label for="gramas">Peso da peça <span class="optional">gramas usadas</span></label>
            <div class="input-wrap">
              <input type="number" id="gramas" inputmode="decimal" step="0.1" min="0" placeholder="35">
              <span class="suffix">g</span>
            </div>
          </div>
          <div class="field" style="margin-bottom: 0;">
            <label for="horas">Tempo de impressão <span class="optional">opcional</span></label>
            <div class="input-wrap">
              <input type="number" id="horas" inputmode="decimal" step="0.1" min="0" placeholder="ex: 3,5">
              <span class="suffix">h</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="field" style="margin-bottom: 0;">
            <label for="preco-venda">Preço de venda <span class="optional">opcional</span></label>
            <div class="input-wrap">
              <span class="prefix">R$</span>
              <input type="number" id="preco-venda" inputmode="decimal" step="0.01" min="0" placeholder="ex: 45,00">
            </div>
          </div>
        </div>

        <div class="card">
          <p class="card-title">Composição do custo</p>
          <div class="result-row">
            <span class="k">Filamento</span>
            <span class="v" id="r-filamento">R$ 0,00</span>
          </div>
          <div class="result-row" id="row-energia" style="display:none;">
            <span class="k">Energia</span>
            <span class="v" id="r-energia">R$ 0,00</span>
          </div>
          <div class="result-row" id="row-falha" style="display:none;">
            <span class="k" id="k-falha">Ajuste por falhas</span>
            <span class="v" id="r-falha">R$ 0,00</span>
          </div>
          <div class="result-row" id="row-roi" style="display:none;">
            <span class="k" id="k-roi">Retorno da impressora</span>
            <span class="v" id="r-roi">R$ 0,00</span>
          </div>
          <div class="result-row total">
            <span class="k">Custo total da peça</span>
            <span class="v" id="r-total">R$ 0,00</span>
          </div>
        </div>

        <div class="profit-card" id="profit-card">
          <p class="k" id="profit-label">Margem de lucro</p>
          <div class="pct" id="profit-pct">—<span class="unit">%</span></div>
          <p class="sub" id="profit-sub"></p>
        </div>
      </section>

      <section class="panel" id="panel-config" role="tabpanel" aria-labelledby="tab-config">
        <div class="card">
          <p class="card-title">Energia</p>
          <p class="card-hint">Preenchida uma vez — usada sempre que você informar o tempo de impressão.</p>
          <div class="field">
            <label for="potencia">Potência da impressora</label>
            <div class="input-wrap">
              <input type="number" id="potencia" inputmode="decimal" step="1" min="0" placeholder="150">
              <span class="suffix">W</span>
            </div>
          </div>
          <div class="field" style="margin-bottom: 0;">
            <label for="tarifa">Tarifa de energia</label>
            <div class="input-wrap">
              <span class="prefix">R$</span>
              <input type="number" id="tarifa" inputmode="decimal" step="0.01" min="0" placeholder="0,75">
              <span class="suffix">/kWh</span>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="card-title">Risco de falha</p>
          <p class="card-hint">Dilui o custo de peças perdidas nas peças que dão certo. Ex: 10% de falha aumenta o custo em ~11%.</p>
          <div class="field" style="margin-bottom: 0;">
            <label for="falha">Taxa de falha estimada</label>
            <div class="input-wrap">
              <input type="number" id="falha" inputmode="decimal" step="1" min="0" max="95" placeholder="10">
              <span class="suffix">%</span>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="card-title">Retorno da impressora</p>
          <p class="card-hint">Acrescenta um percentual sobre o custo final para ajudar a pagar o investimento na máquina.</p>
          <div class="field" style="margin-bottom: 0;">
            <label for="roi">Acréscimo para ROI</label>
            <div class="input-wrap">
              <input type="number" id="roi" inputmode="decimal" step="1" min="0" placeholder="10">
              <span class="suffix">%</span>
            </div>
          </div>
        </div>

        <div class="save-note" id="save-note">
          <span class="dot"></span>
          <span id="save-note-text">Salvo na sua conta</span>
        </div>
      </section>

      <footer>Configurações de energia, falha e ROI ficam salvas na sua conta e aplicadas em todos os cálculos futuros.</footer>
    </main>
  `;

  await wireCalculator(root, user);
}

async function wireCalculator(root: HTMLElement, user: User): Promise<void> {
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

  const inputs = {
    precoKg: q<HTMLInputElement>("#preco-kg"),
    gramas: q<HTMLInputElement>("#gramas"),
    horas: q<HTMLInputElement>("#horas"),
    precoVenda: q<HTMLInputElement>("#preco-venda"),
    potencia: q<HTMLInputElement>("#potencia"),
    tarifa: q<HTMLInputElement>("#tarifa"),
    falha: q<HTMLInputElement>("#falha"),
    roi: q<HTMLInputElement>("#roi"),
  };

  // --- Tabs ---
  const tabCalc = q<HTMLButtonElement>("#tab-calc");
  const tabConfig = q<HTMLButtonElement>("#tab-config");
  const panelCalc = q<HTMLElement>("#panel-calc");
  const panelConfig = q<HTMLElement>("#panel-config");

  function selectTab(tab: "calc" | "config") {
    const calcActive = tab === "calc";
    tabCalc.setAttribute("aria-selected", String(calcActive));
    tabConfig.setAttribute("aria-selected", String(!calcActive));
    panelCalc.classList.toggle("active", calcActive);
    panelConfig.classList.toggle("active", !calcActive);
  }
  tabCalc.addEventListener("click", () => selectTab("calc"));
  tabConfig.addEventListener("click", () => selectTab("config"));

  // --- Sign out ---
  q<HTMLButtonElement>("#btn-signout").addEventListener("click", () => {
    void signOutUser();
  });

  // --- Calculation ---
  function calcularEExibir() {
    const result = calcular({
      precoKg: parseFloat(inputs.precoKg.value) || 0,
      gramas: parseFloat(inputs.gramas.value) || 0,
      horas: parseFloat(inputs.horas.value) || 0,
      precoVenda: inputs.precoVenda.value === "" ? null : parseFloat(inputs.precoVenda.value),
      potenciaW: parseFloat(inputs.potencia.value) || 0,
      tarifaKwh: parseFloat(inputs.tarifa.value) || 0,
      falhaPct: parseFloat(inputs.falha.value) || 0,
      roiPct: parseFloat(inputs.roi.value) || 0,
    });

    q<HTMLElement>("#r-filamento").textContent = brl(result.custoFilamento);
    q<HTMLElement>("#r-total").textContent = brl(result.custoFinal);

    const rowEnergia = q<HTMLElement>("#row-energia");
    if (result.custoEnergia > 0) {
      rowEnergia.style.display = "flex";
      q<HTMLElement>("#r-energia").textContent = brl(result.custoEnergia);
    } else {
      rowEnergia.style.display = "none";
    }

    const falhaPct = Math.min(parseFloat(inputs.falha.value) || 0, 95);
    const rowFalha = q<HTMLElement>("#row-falha");
    if (result.ajusteFalha > 0) {
      rowFalha.style.display = "flex";
      q<HTMLElement>("#k-falha").textContent = `Ajuste por falhas (${falhaPct}%)`;
      q<HTMLElement>("#r-falha").textContent = "+ " + brl(result.ajusteFalha);
    } else {
      rowFalha.style.display = "none";
    }

    const roiPct = parseFloat(inputs.roi.value) || 0;
    const rowRoi = q<HTMLElement>("#row-roi");
    if (result.ajusteRoi > 0) {
      rowRoi.style.display = "flex";
      q<HTMLElement>("#k-roi").textContent = `Retorno da impressora (${roiPct}%)`;
      q<HTMLElement>("#r-roi").textContent = "+ " + brl(result.ajusteRoi);
    } else {
      rowRoi.style.display = "none";
    }

    const profitCard = q<HTMLElement>("#profit-card");
    if (result.lucro !== null && result.margemPct !== null) {
      profitCard.classList.add("show");
      profitCard.classList.toggle("positive", result.lucro >= 0);
      profitCard.classList.toggle("negative", result.lucro < 0);
      q<HTMLElement>("#profit-label").textContent = result.lucro >= 0 ? "Margem de lucro" : "Prejuízo";
      q<HTMLElement>("#profit-pct").innerHTML =
        `${result.margemPct >= 0 ? "+" : ""}${result.margemPct.toFixed(1)}<span class="unit">%</span>`;
      q<HTMLElement>("#profit-sub").textContent = `Lucro de ${brl(result.lucro)} sobre o custo total da peça`;
    } else {
      profitCard.classList.remove("show");
    }
  }

  // --- Persistence (Firestore, debounced) ---
  let saveTimeout: number | undefined;
  const saveNote = q<HTMLElement>("#save-note");

  function schedulePersist() {
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(async () => {
      const settings: UserSettings = {
        precoKg: parseFloat(inputs.precoKg.value) || null,
        potenciaW: parseFloat(inputs.potencia.value) || null,
        tarifaKwh: parseFloat(inputs.tarifa.value) || null,
        falhaPct: parseFloat(inputs.falha.value) || null,
        roiPct: parseFloat(inputs.roi.value) || null,
      };
      try {
        await saveSettings(user.uid, settings);
        saveNote.classList.add("show");
        window.setTimeout(() => saveNote.classList.remove("show"), 1500);
      } catch (err) {
        console.error("Falha ao salvar configurações:", err);
      }
    }, 500);
  }

  Object.values(inputs).forEach((el) => {
    el.addEventListener("input", () => {
      calcularEExibir();
    });
  });

  (["precoKg", "potencia", "tarifa", "falha", "roi"] as const).forEach((key) => {
    inputs[key].addEventListener("input", schedulePersist);
  });

  // --- Load stored settings, then calculate ---
  try {
    const stored = await loadSettings(user.uid);
    if (stored.precoKg !== null) inputs.precoKg.value = String(stored.precoKg);
    if (stored.potenciaW !== null) inputs.potencia.value = String(stored.potenciaW);
    if (stored.tarifaKwh !== null) inputs.tarifa.value = String(stored.tarifaKwh);
    if (stored.falhaPct !== null) inputs.falha.value = String(stored.falhaPct);
    if (stored.roiPct !== null) inputs.roi.value = String(stored.roiPct);
  } catch (err) {
    console.error("Falha ao carregar configurações:", err);
  }

  calcularEExibir();
}
