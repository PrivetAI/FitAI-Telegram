import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { useTelegram } from '../../hooks/useTelegram';
import type { ExperienceLevel as EL } from '../../types';

const levels: { id: EL; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'New to fitness or returning after a long break' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years of consistent training' },
  { id: 'advanced', label: 'Advanced', desc: '3+ years, deep knowledge of training' },
];

export function ExperienceLevel() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Experience level</h2>
      <p className="text-text-secondary text-sm mb-8">This helps us tailor your training</p>

      <div className="flex flex-col gap-3">
        {levels.map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => { haptic('light'); updateData({ experienceLevel: id }); }}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              data.experienceLevel === id
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
        <Button fullWidth onClick={nextStep} disabled={!data.experienceLevel}>
          Continue
        </Button>
      </div>
    </div>
  );
}
