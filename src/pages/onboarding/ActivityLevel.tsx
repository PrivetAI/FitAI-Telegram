import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { useTelegram } from '../../hooks/useTelegram';
import type { ActivityLevel as AL } from '../../types';

const levels: { id: AL; label: string; desc: string }[] = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { id: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
  { id: 'active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  { id: 'very_active', label: 'Extremely Active', desc: 'Athlete / physical job + training' },
];

export function ActivityLevel() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Activity level</h2>
      <p className="text-text-secondary text-sm mb-8">How active are you on a typical week?</p>

      <div className="flex flex-col gap-3">
        {levels.map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => { haptic('light'); updateData({ activityLevel: id }); }}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              data.activityLevel === id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-surface hover:bg-surface-light'
            }`}
          >
            <div className="font-semibold text-sm">{label}</div>
            <div className="text-text-muted text-xs mt-0.5">{desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!data.activityLevel}>
          Continue
        </Button>
      </div>
    </div>
  );
}
