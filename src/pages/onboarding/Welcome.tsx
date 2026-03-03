import { Button } from '../../components/Button';
import { SparkleIcon } from '../../icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useTranslation } from '../../i18n';

export function Welcome() {
  const { nextStep } = useOnboardingStore();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-8 animate-scale-in">
        <SparkleIcon size={40} color="#00E676" />
      </div>

      <h1 className="text-3xl font-bold mb-3 tracking-tight animate-count-up">{t('onboarding.welcome_title')}</h1>
      <p className="text-text-secondary text-base leading-relaxed mb-2">
        {t('onboarding.welcome_subtitle')}
      </p>
      <p className="text-text-muted text-sm leading-relaxed mb-12 max-w-[280px]">
        {t('onboarding.welcome_desc')}
      </p>

      <Button fullWidth onClick={nextStep}>
        {t('onboarding.get_started')}
      </Button>
    </div>
  );
}
