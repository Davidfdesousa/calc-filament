export interface CalcInputs {
  precoKg: number;
  gramas: number;
  horas: number;
  precoVenda: number | null;
  potenciaW: number;
  tarifaKwh: number;
  falhaPct: number;
  roiPct: number;
}

export interface CalcResult {
  custoFilamento: number;
  custoEnergia: number;
  ajusteFalha: number;
  ajusteRoi: number;
  custoFinal: number;
  lucro: number | null;
  margemPct: number | null;
}

export function calcular(inputs: CalcInputs): CalcResult {
  const falhaPct = Math.min(Math.max(inputs.falhaPct, 0), 95);
  const potenciaKw = inputs.potenciaW / 1000;

  const custoFilamento = (inputs.precoKg / 1000) * inputs.gramas;
  const custoEnergia = potenciaKw * inputs.horas * inputs.tarifaKwh;
  const subtotal = custoFilamento + custoEnergia;

  const custoComFalha = falhaPct > 0 ? subtotal / (1 - falhaPct / 100) : subtotal;
  const ajusteFalha = custoComFalha - subtotal;

  const custoComRoi = custoComFalha * (1 + inputs.roiPct / 100);
  const ajusteRoi = custoComRoi - custoComFalha;

  const custoFinal = custoComRoi;

  let lucro: number | null = null;
  let margemPct: number | null = null;
  if (inputs.precoVenda !== null && custoFinal > 0) {
    lucro = inputs.precoVenda - custoFinal;
    margemPct = (lucro / custoFinal) * 100;
  }

  return { custoFilamento, custoEnergia, ajusteFalha, ajusteRoi, custoFinal, lucro, margemPct };
}
