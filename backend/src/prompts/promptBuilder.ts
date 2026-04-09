import { UserProfile } from '../services/sessionService';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CALORIES_FEMALE = 1200;
const MIN_CALORIES_MALE = 1500;

const IMC_LABELS: Record<string, string> = {
  underweight: 'Abaixo do peso',
  normal: 'Peso normal',
  overweight: 'Sobrepeso',
  obesity_grade_1: 'Obesidade Grau I',
  obesity_grade_2: 'Obesidade Grau II',
  obesity_grade_3: 'Obesidade Grau III',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  weight_loss: 'Perda de peso',
  muscle_gain: 'Ganho de massa muscular',
  maintenance: 'Manutenção',
  conditioning: 'Melhora de condicionamento',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the minimum daily caloric intake for the given sex.
 * 1200 kcal for females, 1500 kcal for males and other.
 */
export function getMinCalories(sex: string): number {
  return sex === 'female' ? MIN_CALORIES_FEMALE : MIN_CALORIES_MALE;
}

function isProfileComplete(profile: Partial<UserProfile>): boolean {
  return (
    profile.objective !== undefined &&
    profile.heightCm !== undefined &&
    profile.weightKg !== undefined &&
    profile.age !== undefined &&
    profile.sex !== undefined &&
    profile.imc !== undefined &&
    profile.imcClassification !== undefined
  );
}

function buildProfileSection(profile: Partial<UserProfile>): string {
  if (Object.keys(profile).length === 0) {
    return 'Nenhum dado coletado ainda. Inicie perguntando sobre o objetivo do usuário.';
  }

  const lines: string[] = [];

  if (profile.objective) {
    lines.push(`- Objetivo: ${OBJECTIVE_LABELS[profile.objective] ?? profile.objective}`);
  }
  if (profile.age !== undefined) {
    lines.push(`- Idade: ${profile.age} anos`);
  }
  if (profile.sex) {
    const sexLabel = profile.sex === 'male' ? 'Masculino' : profile.sex === 'female' ? 'Feminino' : 'Outro';
    lines.push(`- Sexo: ${sexLabel}`);
  }
  if (profile.heightCm !== undefined) {
    lines.push(`- Altura: ${profile.heightCm} cm`);
  }
  if (profile.weightKg !== undefined) {
    lines.push(`- Peso: ${profile.weightKg} kg`);
  }
  if (profile.imc !== undefined) {
    const classLabel = profile.imcClassification ? (IMC_LABELS[profile.imcClassification] ?? profile.imcClassification) : '';
    lines.push(`- IMC: ${profile.imc} (${classLabel})`);
  }
  if (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) {
    lines.push(`- Restrições alimentares: ${profile.dietaryRestrictions.join(', ')}`);
  }
  if (profile.healthConditions && profile.healthConditions.length > 0) {
    lines.push(`- Condições de saúde: ${profile.healthConditions.join(', ')}`);
  }

  return lines.join('\n');
}

function buildRestrictionsSection(profile: Partial<UserProfile>): string {
  const restrictions: string[] = [];

  if (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) {
    restrictions.push(`Restrições alimentares: ${profile.dietaryRestrictions.join(', ')}`);
  }
  if (profile.healthConditions && profile.healthConditions.length > 0) {
    restrictions.push(`Condições de saúde: ${profile.healthConditions.join(', ')}`);
  }

  return restrictions.length > 0 ? restrictions.join('\n') : 'Nenhuma restrição declarada.';
}

function buildCollectionInstruction(profile: Partial<UserProfile>): string {
  if (Object.keys(profile).length === 0) {
    return `
[INSTRUÇÃO DE COLETA]
O perfil do usuário está vazio. Comece perguntando sobre o OBJETIVO do usuário (perda de peso, ganho de massa muscular, manutenção ou melhora de condicionamento).
Em seguida, colete em sequência: altura (cm), peso (kg), idade e sexo.
Após obter altura e peso, calcule e apresente o IMC antes de continuar.
Por fim, pergunte sobre restrições alimentares e condições de saúde.`;
  }

  const missing: string[] = [];
  if (!profile.objective) missing.push('objetivo');
  if (!profile.heightCm) missing.push('altura');
  if (!profile.weightKg) missing.push('peso');
  if (!profile.age) missing.push('idade');
  if (!profile.sex) missing.push('sexo');

  if (missing.length > 0) {
    return `
[INSTRUÇÃO DE COLETA]
Perfil parcialmente preenchido. Continue coletando as informações faltantes: ${missing.join(', ')}.
Mantenha o tom conversacional e progressivo.`;
  }

  if (profile.dietaryRestrictions === undefined || profile.healthConditions === undefined) {
    return `
[INSTRUÇÃO DE COLETA]
Dados básicos coletados. Pergunte sobre restrições alimentares e condições de saúde antes de gerar planos.`;
  }

  return '';
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Builds the system prompt dynamically based on the current session profile.
 *
 * - Empty profile: instructs the LLM to start collecting data (beginning with objective)
 * - Partial profile: includes collected data + instruction to continue collection
 * - Complete profile: includes all data with IMC and classification
 * - Always: professional disclaimer, minimum calorie limit for the user's sex,
 *   refusal of medications/hormonal supplements, SAMU instruction for emergencies
 */
export function buildSystemPrompt(profile: Partial<UserProfile>): string {
  const minCalories = profile.sex ? getMinCalories(profile.sex) : MIN_CALORIES_MALE;
  const profileSection = buildProfileSection(profile);
  const restrictionsSection = buildRestrictionsSection(profile);
  const collectionInstruction = buildCollectionInstruction(profile);
  const complete = isProfileComplete(profile);

  return `Você é um assistente especializado em nutrição e fitness, combinando as funções
de nutricionista e personal trainer. Você deve:

1. Coletar o perfil do usuário de forma conversacional e progressiva
2. Calcular e apresentar o IMC quando peso e altura forem fornecidos
3. Gerar planos alimentares e de treino personalizados
4. Respeitar TODAS as restrições alimentares e condições de saúde declaradas
5. Incluir SEMPRE o aviso de que as orientações não substituem profissionais habilitados
6. Recusar orientações sobre medicamentos, suplementos hormonais ou substâncias controladas
7. Em caso de emergência médica, orientar a ligar para o SAMU (192)
8. Manter tom encorajador, empático e profissional

[PERFIL ATUAL DO USUÁRIO]
${profileSection}

[RESTRIÇÕES ATIVAS]
${restrictionsSection}
${collectionInstruction}
[REGRAS DE SEGURANÇA OBRIGATÓRIAS]
- NUNCA gere planos alimentares com ingestão calórica inferior a ${minCalories} kcal/dia${profile.sex === 'female' ? ' (mínimo para mulheres)' : profile.sex === 'male' ? ' (mínimo para homens)' : ''}.
- SEMPRE inclua o aviso: "Estas orientações não substituem a consulta com profissionais de saúde habilitados (nutricionista, médico, educador físico)."
- RECUSE qualquer solicitação sobre medicamentos, suplementos hormonais ou substâncias controladas, recomendando consulta médica.
- Em caso de emergência médica, oriente imediatamente: "Ligue para o SAMU: 192."
- O serviço é destinado a usuários com 14 anos ou mais.${complete ? `

[PERFIL COMPLETO — PRONTO PARA GERAR PLANOS]
IMC: ${profile.imc} — ${profile.imcClassification ? (IMC_LABELS[profile.imcClassification] ?? profile.imcClassification) : ''}
Utilize todos os dados do perfil para personalizar as recomendações.` : ''}`;
}
