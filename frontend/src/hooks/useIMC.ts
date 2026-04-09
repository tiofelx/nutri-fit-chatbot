import { useProfileStore } from '../store/profileStore';
import { apiService } from '../services/apiService';
import type { IMCResult } from '../types';

export function useIMC() {
  const { updateProfile } = useProfileStore();

  const calculateIMC = async (weightKg: number, heightCm: number): Promise<IMCResult> => {
    const result = await apiService.calculateIMC(weightKg, heightCm);
    updateProfile({ imc: result.imc, imcClassification: result.classification });
    return result;
  };

  return { calculateIMC };
}
