import { Button } from '../../components/Button';
import { SparkleIcon } from '../../icons';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function Welcome() {
  const { nextStep } = useOnboardingStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-8">
        <SparkleIcon size={40} color="#00E676" />
      </div>

      <h1 className="text-3xl font-bold mb-3 tracking-tight">FitAI</h1>
      <p className="text-text-secondary text-base leading-relaxed mb-2">
        Your AI-powered fitness companion
      </p>
      <p className="text-text-muted text-sm leading-relaxed mb-12 max-w-[280px]">
        Smart calorie tracking, personalized workouts, and nutrition insights — all powered by artificial intelligence.
      </p>

      <Button fullWidth onClick={nextStep}>
        Get Started
      </Button>
    </div>
  );
}
