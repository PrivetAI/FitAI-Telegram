import { Card } from '../components/Card';
import { useAppStore } from '../stores/appStore';
import { FlameIcon, TargetIcon, TrainingIcon, ProgressIcon, SparkleIcon } from '../icons';

export function Dashboard() {
  const profile = useAppStore((s) => s.profile);
  if (!profile) return null;

  const macroTotal = profile.macros.protein + profile.macros.fat + profile.macros.carbs;

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Today's overview</p>
      </div>

      {/* Calories card */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <FlameIcon size={20} color="#00E676" />
            </div>
            <div>
              <div className="text-text-muted text-xs">Calories remaining</div>
              <div className="text-2xl font-bold">{profile.targetCalories}</div>
            </div>
          </div>
          <div className="text-text-muted text-xs text-right">
            0 eaten<br />
            {profile.targetCalories} goal
          </div>
        </div>
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: '0%' }} />
        </div>
      </Card>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <div className="text-accent text-lg font-bold">0</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.protein}g protein</div>
        </Card>
        <Card className="text-center">
          <div className="text-warning text-lg font-bold">0</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.fat}g fat</div>
        </Card>
        <Card className="text-center">
          <div className="text-blue-400 text-lg font-bold">0</div>
          <div className="text-text-muted text-[10px] mt-0.5">/ {profile.macros.carbs}g carbs</div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="flex items-center gap-3" onClick={() => {}}>
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <SparkleIcon size={18} color="#00E676" />
          </div>
          <div>
            <div className="text-sm font-semibold">AI Scan</div>
            <div className="text-text-muted text-[10px]">Photo food log</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3" onClick={() => {}}>
          <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <TrainingIcon size={18} color="#60A5FA" />
          </div>
          <div>
            <div className="text-sm font-semibold">Workout</div>
            <div className="text-text-muted text-[10px]">Start training</div>
          </div>
        </Card>
      </div>

      {/* Progress card */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center">
            <ProgressIcon size={18} color="#C084FC" />
          </div>
          <div>
            <div className="text-sm font-semibold">Weekly Progress</div>
            <div className="text-text-muted text-[10px]">No data yet</div>
          </div>
        </div>
        <div className="h-20 flex items-center justify-center text-text-muted text-xs">
          Start tracking to see your progress
        </div>
      </Card>
    </div>
  );
}
