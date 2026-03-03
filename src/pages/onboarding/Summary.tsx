import { useMemo } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FlameIcon } from '../../icons';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../../utils/tdee';
import { useTelegram } from '../../hooks/useTelegram';
import { useTranslation } from '../../i18n';
import type { UserProfile } from '../../types';

export function Summary() {
  const { data } = useOnboardingStore();
  const setProfile = useAppStore((s) => s.setProfile);
  const { haptic } = useTelegram();
  const { t } = useTranslation();

  const goalLabels: Record<string, string> = {
    lose_weight: t('profile.goal_lose'),
    gain_muscle: t('profile.goal_gain'),
    maintain: t('profile.goal_maintain'),
    recomp: t('profile.goal_recomp'),
  };

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
      gender: data.gender!, age: data.age!, height: data.height!, weight: data.weight!,
      goal: data.goal!, activityLevel: data.activityLevel!, experienceLevel: data.experienceLevel!,
      tdee: result.tdee, targetCalories: result.target, macros: result.macros,
    };
    setProfile(profile);
  };

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-slide-left">
      <h2 className="text-2xl font-bold mb-2">{t('onboarding.plan_ready')}</h2>
      <p className="text-text-secondary text-sm mb-8">{goalLabels[data.goal!]}</p>

      <div className="animate-stagger-in stagger-1">
        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <FlameIcon size={20} color="#00E676" />
            </div>
            <div>
              <div className="text-text-muted text-xs">{t('onboarding.daily_calories')}</div>
              <div className="text-2xl font-bold animate-count-up">{result.target} <span className="text-sm font-normal text-text-muted">kcal</span></div>
            </div>
          </div>
          <div className="text-text-muted text-xs">TDEE: {result.tdee} kcal/day</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { value: result.macros.protein, label: t('onboarding.protein'), color: 'text-accent' },
          { value: result.macros.fat, label: t('onboarding.fat'), color: 'text-warning' },
          { value: result.macros.carbs, label: t('onboarding.carbs'), color: 'text-blue-400' },
        ].map((m, i) => (
          <div key={m.label} className={`animate-stagger-in stagger-${i + 2}`}>
            <Card className="text-center">
              <div className={`${m.color} text-lg font-bold animate-count-up`}>{m.value}g</div>
              <div className="text-text-muted text-xs mt-1">{m.label}</div>
            </Card>
          </div>
        ))}
      </div>

      <div className="animate-stagger-in stagger-5">
        <Card className="mb-4">
          <div className="text-text-muted text-xs mb-3">{t('onboarding.your_stats')}</div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-text-secondary">{t('onboarding.height')}</div>
            <div className="text-right font-medium">{data.height} cm</div>
            <div className="text-text-secondary">{t('onboarding.weight')}</div>
            <div className="text-right font-medium">{data.weight} kg</div>
            <div className="text-text-secondary">{t('onboarding.age')}</div>
            <div className="text-right font-medium">{data.age}</div>
          </div>
        </Card>
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={finish}>{t('onboarding.start_journey')}</Button>
      </div>
    </div>
  );
}
