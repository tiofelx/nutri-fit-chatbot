export type IMCClassification =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obesity_grade_1'
  | 'obesity_grade_2'
  | 'obesity_grade_3';

export interface IMCResult {
  imc: number;
  classification: IMCClassification;
  label: string;
  range: string;
}

const CLASSIFICATION_LABELS: Record<IMCClassification, { label: string; range: string }> = {
  underweight:     { label: 'Abaixo do peso',    range: '< 18.5' },
  normal:          { label: 'Peso normal',        range: '18.5 – 24.9' },
  overweight:      { label: 'Sobrepeso',          range: '25.0 – 29.9' },
  obesity_grade_1: { label: 'Obesidade Grau I',   range: '30.0 – 34.9' },
  obesity_grade_2: { label: 'Obesidade Grau II',  range: '35.0 – 39.9' },
  obesity_grade_3: { label: 'Obesidade Grau III', range: '≥ 40.0' },
};

export function classify(imc: number): IMCClassification {
  if (imc < 18.5) return 'underweight';
  if (imc < 25.0) return 'normal';
  if (imc < 30.0) return 'overweight';
  if (imc < 35.0) return 'obesity_grade_1';
  if (imc < 40.0) return 'obesity_grade_2';
  return 'obesity_grade_3';
}

export function calculateIMC(weightKg: number, heightCm: number): IMCResult {
  if (weightKg < 20 || weightKg > 500) {
    throw new Error(`Peso inválido: ${weightKg} kg. O peso deve estar entre 20 e 500 kg.`);
  }
  if (heightCm < 100 || heightCm > 250) {
    throw new Error(`Altura inválida: ${heightCm} cm. A altura deve estar entre 100 e 250 cm.`);
  }

  const heightM = heightCm / 100;
  const imc = weightKg / (heightM * heightM);
  const rounded = Math.round(imc * 10) / 10;
  const classification = classify(rounded);
  const { label, range } = CLASSIFICATION_LABELS[classification];

  return { imc: rounded, classification, label, range };
}
