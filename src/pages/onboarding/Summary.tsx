import { useMemo } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FlameIcon, TargetIcon, BoltIcon } from '../../icons';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../../utils/tdee';
import { useTelegram } from '../../hooks/useTelegram';
import type { UserProfile } from '../../types';

const goalLabels = {
  lose_weight: 'Lose Weight',
  gain_muscle: 'Build Muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

export function Summary() {
  const { data } = useOnboardingStore();
  const setProfile = useAppStore((s) => s.setProfile);
  const { haptic } = useTelegram();

  const result = useMemo(() => {
    if (!data.gender || !data.weight || !data.height || !data.age || !data.activityLevel || !data.goal) return null;
    const bmr = calculateBMR(data.gender, data.weight, data.height, data.age);
    const tdee = calculateTDEE(bmr, data.activityLevel);
    const target = calculateTargetCalories(tdee, data.goal);
    const macros = calculateMacros(target, data.weight, data.goal);
    return { tdee, target, macros };
  }, [data]);

  if (!result) return null;

  const finish = () => {
    haptic('heavy');
    const profile: UserProfile = {
      gender: data.gender!,
      age: data.age!,
      height: data.height!,
      weight: data.weight!,
      goal: data.goal!,
      activityLevel: data.activityLevel!,
      experienceLevel: data.experienceLevel!,
      tdee: result.tdee,
      targetCalories: result.target,
      macros: result.macros,
    };
    setProfile(profile);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Your plan is ready</h2>
      <p className="text-text-secondary text-sm mb-8">{goalLabels[data.goal!]}</p>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <FlameIcon size={20} color="#00E676" />
          </div>
          <div>
            <div className="text-text-muted text-xs">Daily Calories</div>
            <div className="text-2xl font-bold">{result.target} <span className="text-sm font-normal text-text-muted">kcal</span></div>
          </div>
        </div>
        <div className="text-text-muted text-xs">TDEE: {result.tdee} kcal/day</div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          <div className="text-accent text-lg font-bold">{result.macros.protein}g</div>
          <div className="text-text-muted text-xs mt-1">Protein</div>
        </Card>
        <Card className="text-center">
          <div className="text-warning text-lg font-bold">{result.macros.fat}g</div>
          <div className="text-text-muted text-xs mt-1">Fat</div>
        </Card>
        <Card className="text-center">
          <div className="text-blue-400 text-lg font-bold">{result.macros.carbs}g</div>
          <div className="text-text-muted text-xs mt-1">Carbs</div>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="text-text-muted text-xs mb-3">Your stats</div>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-text-secondary">Height</div>
          <div className="text-right font-medium">{data.height} cm</div>
          <div className="text-text-secondary">Weight</div>
          <div className="text-right font-medium">{data.weight} kg</div>
          <div className="text-text-secondary">Age</div>
          <div className="text-right font-medium">{data.age}</div>
        </div>
      </Card>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={finish}>
          Start My Journey
        </Button>
      </div>
    </div>
  );
}
