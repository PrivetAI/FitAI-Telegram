import { useEffect } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useTelegram } from '../../hooks/useTelegram';
import { ProgressBar } from '../../components/ProgressBar';
import { Welcome } from './Welcome';
import { GoalSelection } from './GoalSelection';
import { BodyStats } from './BodyStats';
import { ActivityLevel } from './ActivityLevel';
import { ExperienceLevel } from './ExperienceLevel';
import { Summary } from './Summary';

const TOTAL_STEPS = 5;

const steps = [Welcome, GoalSelection, BodyStats, ActivityLevel, ExperienceLevel, Summary];

export function Onboarding() {
  const { step, prevStep } = useOnboardingStore();
  const { showBackButton } = useTelegram();

  useEffect(() => {
    if (step > 0) {
      return showBackButton(prevStep);
    }
  }, [step]);

  const StepComponent = steps[step] || Welcome;

  return (
    <div className="relative">
      {step > 0 && step < steps.length && (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-4">
          <ProgressBar current={step - 1} total={TOTAL_STEPS} />
        </div>
      )}
      <StepComponent />
    </div>
  );
}
