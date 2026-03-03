import { Card } from '../components/Card';
import { useAppStore } from '../stores/appStore';
import { ProfileIcon, ChevronRightIcon } from '../icons';

const goalLabels = {
  lose_weight: 'Lose Weight',
  gain_muscle: 'Build Muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

export function Profile() {
  const profile = useAppStore((s) => s.profile);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  if (!profile) return null;

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-text-muted text-sm mt-1">Your settings</p>
      </div>

      <Card className="mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-lighter flex items-center justify-center">
          <ProfileIcon size={28} color="#9E9E9E" />
        </div>
        <div>
          <div className="text-sm font-semibold">{profile.gender === 'male' ? 'Male' : 'Female'}, {profile.age}y</div>
          <div className="text-text-muted text-xs">{profile.height}cm / {profile.weight}kg</div>
          <div className="text-accent text-xs mt-0.5">{goalLabels[profile.goal]}</div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="text-text-muted text-xs mb-3">Daily Targets</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Calories</span><span className="font-medium">{profile.targetCalories} kcal</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Protein</span><span className="font-medium">{profile.macros.protein}g</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Fat</span><span className="font-medium">{profile.macros.fat}g</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Carbs</span><span className="font-medium">{profile.macros.carbs}g</span></div>
        </div>
      </Card>

      <Card className="mb-4">
        {['Edit Profile', 'Recalculate Goals', 'Units & Preferences'].map((item) => (
          <button key={item} className="flex items-center justify-between w-full py-3 border-b border-border last:border-0">
            <span className="text-sm">{item}</span>
            <ChevronRightIcon size={16} color="#616161" />
          </button>
        ))}
      </Card>

      <button
        onClick={() => {
          localStorage.clear();
          setOnboarded(false);
          window.location.reload();
        }}
        className="w-full text-center text-danger text-sm py-3"
      >
        Reset All Data
      </button>
    </div>
  );
}
