import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import { TargetIcon, FlameIcon, ScaleIcon, BoltIcon } from '../../icons';
import { useTelegram } from '../../hooks/useTelegram';
import type { Goal } from '../../types';

const goals: { id: Goal; label: string; desc: string; Icon: typeof TargetIcon }[] = [
  { id: 'lose_weight', label: 'Lose Weight', desc: 'Burn fat, get lean', Icon: FlameIcon },
  { id: 'gain_muscle', label: 'Build Muscle', desc: 'Gain size and strength', Icon: BoltIcon },
  { id: 'maintain', label: 'Maintain', desc: 'Keep current shape', Icon: ScaleIcon },
  { id: 'recomp', label: 'Recomposition', desc: 'Lose fat, gain muscle', Icon: TargetIcon },
];

export function GoalSelection() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const { haptic } = useTelegram();

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">What's your goal?</h2>
      <p className="text-text-secondary text-sm mb-8">This helps us personalize your plan</p>

      <div className="flex flex-col gap-3">
        {goals.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            onClick={() => { haptic('light'); updateData({ goal: id }); }}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left ${
              data.goal === id
                ? 'border-accent bg-accent/5'
                : 'border-border bg-surface hover:bg-surface-light'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              data.goal === id ? 'bg-accent/15' : 'bg-surface-lighter'
            }`}>
              <Icon size={22} color={data.goal === id ? '#00E676' : '#9E9E9E'} />
            </div>
            <div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-text-muted text-xs mt-0.5">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!data.goal}>
          Continue
        </Button>
      </div>
    </div>
  );
}
