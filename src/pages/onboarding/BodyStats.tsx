import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from '../../components/Button';
import type { Gender } from '../../types';

export function BodyStats() {
  const { data, updateData, nextStep } = useOnboardingStore();

  const valid = data.gender && data.age && data.height && data.weight;

  return (
    <div className="flex flex-col min-h-screen px-6 pt-8 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Your body stats</h2>
      <p className="text-text-secondary text-sm mb-8">We'll use this to calculate your needs</p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-text-secondary text-xs font-medium mb-2 block">Gender</label>
          <div className="flex gap-3">
            {(['male', 'female'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => updateData({ gender: g })}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  data.gender === g
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border bg-surface text-text-secondary'
                }`}
              >
                {g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-text-secondary text-xs font-medium mb-2 block">Age</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="25"
            value={data.age || ''}
            onChange={(e) => updateData({ age: Number(e.target.value) || undefined })}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-text-secondary text-xs font-medium mb-2 block">Height (cm)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="175"
              value={data.height || ''}
              onChange={(e) => updateData({ height: Number(e.target.value) || undefined })}
            />
          </div>
          <div className="flex-1">
            <label className="text-text-secondary text-xs font-medium mb-2 block">Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="75"
              value={data.weight || ''}
              onChange={(e) => updateData({ weight: Number(e.target.value) || undefined })}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button fullWidth onClick={nextStep} disabled={!valid}>
          Continue
        </Button>
      </div>
    </div>
  );
}
