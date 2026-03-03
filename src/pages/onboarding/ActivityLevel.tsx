import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { useTranslation } from '../../i18n';
import type { ActivityLevel as AL } from '../../types';

export function ActivityLevel() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();
  const { t } = useTranslation();

  const levels: { id: AL; labelKey: string; descKey: string }[] = [
    { id: 'sedentary', labelKey: 'onboarding.activity_sedentary', descKey: 'onboarding.activity_sedentary_desc' },
    { id: 'light', labelKey: 'onboarding.activity_light', descKey: 'onboarding.activity_light_desc' },
    { id: 'moderate', labelKey: 'onboarding.activity_moderate', descKey: 'onboarding.activity_moderate_desc' },
    { id: 'active', labelKey: 'onboarding.activity_active', descKey: 'onboarding.activity_active_desc' },
    { id: 'very_active', labelKey: 'onboarding.activity_very_active', descKey: 'onboarding.activity_very_active_desc' },
  ];

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-slide-left">
      <h2 className="text-2xl font-bold mb-2">{t('onboarding.activity_title')}</h2>
      <p className="text-text-secondary text-sm mb-8">{t('onboarding.activity_subtitle')}</p>

      <div className="flex flex-col gap-3">
        {levels.map(({ id, labelKey, descKey }, i) => (
          <button key={id} onClick={() => { haptic('light'); updateData({ activityLevel: id }); }}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 animate-stagger-in stagger-${i + 1} ${
              data.activityLevel === id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-light'
            }`}>
            <div className="font-semibold text-sm">{t(labelKey)}</div>
            <div className="text-text-muted text-xs mt-0.5">{t(descKey)}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!data.activityLevel}>{t('onboarding.continue')}</Button>
      </div>
    </div>
  );
}
