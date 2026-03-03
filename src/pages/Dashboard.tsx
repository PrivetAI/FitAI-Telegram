import { Card } from '../components/Card';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useProgressStore } from '../stores/progressStore';
import { useSupplementStore } from '../stores/supplementStore';
import { FlameIcon, SparkleIcon, TrainingIcon, ProgressIcon, PillIcon, CheckIcon, DumbbellIcon } from '../icons';

export function Dashboard() {
  const profile = useAppStore((s) => s.profile);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const totals = useNutritionStore((s) => s.getTodayTotals());
  const todayEntries = useNutritionStore((s) => s.getTodayEntries());
  const activeWorkout = useTrainingStore((s) => s.activeWorkout);
  const workoutLogs = useTrainingStore((s) => s.workoutLogs);
  const latestWeight = useProgressStore((s) => s.getLatestWeight());
  const trend = useProgressStore((s) => s.getWeightTrend());
  const checklist = useSupplementStore((s) => s.getTodayChecklist());

  if (!profile) return null;

  const remaining = profile.targetCalories - totals.calories;
  const calPct = Math.min((totals.calories / profile.targetCalories) * 100, 100);
  const takenCount = checklist.filter((s) => s.taken).length;
  const currentWeight = latestWeight ?? profile.weight;

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Today's overview</p>
      </div>

      {/* Active workout banner */}
      {activeWorkout && (
        <Card className="mb-4 border-accent/30" onClick={() => setActiveTab('training')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center animate-pulse">
              <DumbbellIcon size={20} color="#00E676" />
            </div>
            <div>
              <div className="text-sm font-semibold text-accent">Workout in Progress</div>
              <div className="text-text-muted text-xs">{activeWorkout.name} -- Tap to continue</div>
            </div>
          </div>
        </Card>
      )}

      {/* Calories card */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <FlameIcon size={20} color="#00E676" />
            </div>
            <div>
              <div className="text-text-muted text-xs">Calories remaining</div>
              <div className={`text-2xl font-bold ${remaining < 0 ? 'text-danger' : ''}`}>{remaining}</div>
            </div>
          </div>
          <div className="text-text-muted text-xs text-right">
            {totals.calories} eaten<br />
            {profile.targetCalories} goal
          </div>
        </div>
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${calPct}%` }} />
        </div>
      </Card>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <div className="text-accent text-lg font-bold">{totals.protein}</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.protein}g protein</div>
        </Card>
        <Card className="text-center">
          <div className="text-warning text-lg font-bold">{totals.fat}</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.fat}g fat</div>
        </Card>
        <Card className="text-center">
          <div className="text-blue-400 text-lg font-bold">{totals.carbs}</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.carbs}g carbs</div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="flex items-center gap-3" onClick={() => setActiveTab('nutrition')}>
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <SparkleIcon size={18} color="#00E676" />
          </div>
          <div>
            <div className="text-sm font-semibold">AI Scan</div>
            <div className="text-text-muted text-[10px]">{todayEntries.length} meals logged</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3" onClick={() => setActiveTab('training')}>
          <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <TrainingIcon size={18} color="#60A5FA" />
          </div>
          <div>
            <div className="text-sm font-semibold">Workout</div>
            <div className="text-text-muted text-[10px]">{workoutLogs.length} completed</div>
          </div>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card onClick={() => setActiveTab('progress')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <ProgressIcon size={18} color="#C084FC" />
            </div>
            <div>
              <div className="text-sm font-semibold">{currentWeight.toFixed(1)} kg</div>
              <div className="text-text-muted text-[10px]">
                {trend !== null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)} kg trend` : 'Weight'}
              </div>
            </div>
          </div>
        </Card>
        <Card onClick={() => setActiveTab('profile')}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center">
              <PillIcon size={18} color="#FFD740" />
            </div>
            <div>
              <div className="text-sm font-semibold">{takenCount}/{checklist.length}</div>
              <div className="text-text-muted text-[10px]">Supplements taken</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplement checklist preview */}
      {checklist.length > 0 && (
        <Card>
          <div className="text-text-muted text-xs mb-3">Supplement Checklist</div>
          <div className="space-y-2">
            {checklist.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${s.taken ? 'bg-accent' : 'bg-surface-lighter'}`}>
                  {s.taken && <CheckIcon size={10} color="#000" />}
                </div>
                <span className={`text-xs ${s.taken ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{s.name}</span>
              </div>
            ))}
            {checklist.length > 4 && (
              <div className="text-text-muted text-[10px]">+{checklist.length - 4} more</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
