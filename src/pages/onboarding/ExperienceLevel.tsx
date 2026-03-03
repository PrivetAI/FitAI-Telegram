import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { useTelegram } from '../../hooks/useTelegram';
import { useTranslation } from '../../i18n';
import type { ExperienceLevel as EL } from '../../types';

export function ExperienceLevel() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();
  const { t } = useTranslation();

  const levels: { id: EL; labelKey: string; descKey: string }[] = [
    { id: 'beginner', labelKey: 'onboarding.experience_beginner', descKey: 'onboarding.experience_beginner_desc' },
    { id: 'intermediate', labelKey: 'onboarding.experience_intermediate', descKey: 'onboarding.experience_intermediate_desc' },
    { id: 'advanced', labelKey: 'onboarding.experience_advanced', descKey: 'onboarding.experience_advanced_desc' },
  ];

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-slide-left">
      <h2 className="text-2xl font-bold mb-2">{t('onboarding.experience_title')}</h2>
      <p className="text-text-secondary text-sm mb-8">{t('onboarding.experience_subtitle')}</p>

      <div className="flex flex-col gap-3">
        {levels.map(({ id, labelKey, descKey }, i) => (
          <button key={id} onClick={() => { haptic('light'); updateData({ experienceLevel: id }); }}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 animate-stagger-in stagger-${i + 1} ${
              data.experienceLevel === id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:bg-surface-light'
            }`}>
            <div className="font-semibold text-sm">{t(labelKey)}</div>
            <div className="text-text-muted text-xs mt-0.5">{t(descKey)}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!data.experienceLevel}>{t('onboarding.continue')}</Button>
      </div>
    </div>
  );
}
