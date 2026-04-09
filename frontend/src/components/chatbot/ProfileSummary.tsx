import React, { useState } from 'react';
import type { UserProfile, IMCClassification } from '../../types';

interface ProfileSummaryProps {
  profile: Partial<UserProfile>;
}

const OBJECTIVE_LABELS: Record<UserProfile['objective'], string> = {
  weight_loss: 'Perda de peso',
  muscle_gain: 'Ganho de massa muscular',
  maintenance: 'Manutenção',
  conditioning: 'Condicionamento físico',
};

const IMC_LABELS: Record<IMCClassification, string> = {
  underweight: 'Abaixo do peso',
  normal: 'Peso normal',
  overweight: 'Sobrepeso',
  obesity_grade_1: 'Obesidade Grau I',
  obesity_grade_2: 'Obesidade Grau II',
  obesity_grade_3: 'Obesidade Grau III',
};

function hasData(profile: Partial<UserProfile>): boolean {
  return !!(
    profile.objective ||
    profile.imc ||
    (profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0) ||
    (profile.healthConditions && profile.healthConditions.length > 0)
  );
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!hasData(profile)) return null;

  return (
    <div className="mx-4 mb-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        aria-expanded={isOpen}
        aria-controls="profile-summary-content"
        aria-label={isOpen ? 'Recolher resumo do perfil' : 'Expandir resumo do perfil'}
      >
        <span className="font-medium">Seu perfil</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div id="profile-summary-content"
          className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-gray-100 pt-2.5"
          role="region" aria-label="Dados do perfil">
          {profile.objective && (
            <div>
              <span className="text-gray-400 block">Objetivo</span>
              <span className="text-gray-700">{OBJECTIVE_LABELS[profile.objective]}</span>
            </div>
          )}
          {profile.imc != null && profile.imcClassification && (
            <div>
              <span className="text-gray-400 block">IMC</span>
              <span className="text-gray-700">{profile.imc.toFixed(1)} — {IMC_LABELS[profile.imcClassification]}</span>
            </div>
          )}
          {profile.dietaryRestrictions && profile.dietaryRestrictions.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-400 block">Restrições alimentares</span>
              <span className="text-gray-700">{profile.dietaryRestrictions.join(', ')}</span>
            </div>
          )}
          {profile.healthConditions && profile.healthConditions.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-400 block">Condições de saúde</span>
              <span className="text-gray-700">{profile.healthConditions.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
