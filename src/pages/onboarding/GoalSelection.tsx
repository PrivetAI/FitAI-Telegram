import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { TargetIcon, FlameIcon, ScaleIcon, BoltIcon } from '../../icons';
import { useTelegram } from '../../hooks/useTelegram';
import { useTranslation } from '../../i18n';
import type { Goal } from '../../types';

export function GoalSelection() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();
  const { t } = useTranslation();

  const goals: { id: Goal; labelKey: string; descKey: string; Icon: typeof TargetIcon }[] = [
    { id: 'lose_weight', labelKey: 'onboarding.goal_lose', descKey: 'onboarding.goal_lose_desc', Icon: FlameIcon },
    { id: 'gain_muscle', labelKey: 'onboarding.goal_gain', descKey: 'onboarding.goal_gain_desc', Icon: BoltIcon },
    { id: 'maintain', labelKey: 'onboarding.goal_maintain', descKey: 'onboarding.goal_maintain_desc', Icon: ScaleIcon },
    { id: 'recomp', labelKey: 'onboarding.goal_recomp', descKey: 'onboarding.goal_recomp_desc', Icon: TargetIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-slide-left">
      <h2 className="text-2xl font-bold mb-2">{t('onboarding.goal_title')}</h2>
      <p className="text-text-secondary text-sm mb-8">{t('onboarding.goal_subtitle')}</p>

      <div className="flex flex-col gap-3">
        {goals.map(({ id, labelKey, descKey, Icon }, i) => (
          <button
            key={id}
            onClick={() => { haptic('light'); updateData({ goal: id }); }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left animate-stagger-in stagger-${i + 1} ${
              data.goal === id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-light'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${data.goal === id ? 'bg-accent/15' : 'bg-surface-lighter'}`}>
              <Icon size={22} color={data.goal === id ? '#00E676' : '#9E9E9E'} />
            </div>
            <div>
              <div className="font-semibold text-sm">{t(labelKey)}</div>
              <div className="text-text-muted text-xs mt-0.5">{t(descKey)}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!data.goal}>{t('onboarding.continue')}</Button>
      </div>
    </div>
  );
}
