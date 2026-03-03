import { Card } from '../components/Card';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useProgressStore } from '../stores/progressStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useTranslation } from '../i18n';
import { ACHIEVEMENTS } from '../types/achievements';
import {
  FlameIcon, SparkleIcon, TrainingIcon, ProgressIcon, PillIcon,
  CheckIcon, DumbbellIcon, FireStreakIcon, TrophyIcon, ChevronRightIcon,
} from '../icons';

export function Dashboard() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const totals = useNutritionStore((s) => s.getTodayTotals());
  const todayEntries = useNutritionStore((s) => s.getTodayEntries());
  const activeWorkout = useTrainingStore((s) => s.activeWorkout);
  const workoutLogs = useTrainingStore((s) => s.workoutLogs);
  const latestWeight = useProgressStore((s) => s.getLatestWeight());
  const trend = useProgressStore((s) => s.getWeightTrend());
  const checklist = useSupplementStore((s) => s.getTodayChecklist());
  const streak = useAchievementStore((s) => s.streak);
  const recentUnlock = useAchievementStore((s) => s.getRecentUnlock());

  if (!profile) return null;

  const remaining = profile.targetCalories - totals.calories;
  const calPct = Math.min((totals.calories / profile.targetCalories) * 100, 100);
  const takenCount = checklist.filter((s) => s.taken).length;
  const currentWeight = latestWeight ?? profile.weight;

  // Find the achievement definition for recent unlock
  const recentDef = recentUnlock ? ACHIEVEMENTS.find((a) => a.id === recentUnlock.achievementId) : null;

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Streak widget */}
      <div className="animate-stagger-in stagger-1">
        <Card className="mb-4 border-[#FF6D00]/20" onClick={() => setActiveTab('achievements')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${streak.currentStreak > 0 ? 'bg-[#FF6D00]/15 streak-glow' : 'bg-surface-lighter'}`}>
                <FireStreakIcon size={24} color={streak.currentStreak > 0 ? '#FF6D00' : '#616161'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold" style={{ color: streak.currentStreak > 0 ? '#FF6D00' : undefined }}>
                    {streak.currentStreak}
                  </span>
                  <span className="text-sm text-text-muted">{t('dashboard.day_streak')}</span>
                </div>
                <div className="text-text-muted text-[10px]">
                  {t('dashboard.best')}: {streak.longestStreak} {t('dashboard.days')}
                </div>
              </div>
            </div>
            <ChevronRightIcon size={16} color="#616161" />
          </div>
        </Card>
      </div>

      {/* Recent achievement */}
      {recentDef && recentUnlock && (
        <div className="animate-stagger-in stagger-1">
          <Card className="mb-4 border-[#FFD700]/20 achievement-shine" onClick={() => setActiveTab('achievements')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 flex items-center justify-center">
                <TrophyIcon size={20} color="#FFD700" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-[#FFD700] font-medium">{t('dashboard.latest_achievement')}</div>
                <div className="text-sm font-semibold">{t(recentDef.titleKey)}</div>
              </div>
              <ChevronRightIcon size={16} color="#616161" />
            </div>
          </Card>
        </div>
      )}

      {activeWorkout && (
        <div className="animate-stagger-in stagger-1">
          <Card className="mb-4 border-accent/30" onClick={() => setActiveTab('training')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center animate-pulse">
                <DumbbellIcon size={20} color="#00E676" />
              </div>
              <div>
                <div className="text-sm font-semibold text-accent">{t('dashboard.workout_in_progress')}</div>
                <div className="text-text-muted text-xs">{activeWorkout.name} -- {t('dashboard.tap_to_continue')}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="animate-stagger-in stagger-2">
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <FlameIcon size={20} color="#00E676" />
              </div>
              <div>
                <div className="text-text-muted text-xs">{t('dashboard.calories_remaining')}</div>
                <div className={`text-2xl font-bold animate-count-up ${remaining < 0 ? 'text-danger' : ''}`}>{remaining}</div>
              </div>
            </div>
            <div className="text-text-muted text-xs text-right">
              {totals.calories} {t('dashboard.eaten')}<br />
              {profile.targetCalories} {t('dashboard.goal')}
            </div>
          </div>
          <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
            <div className={`h-full rounded-full animate-progress-fill ${remaining < 0 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${calPct}%`, transition: 'width 0.8s ease-out' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { value: totals.protein, target: profile.macros.protein, label: t('dashboard.protein'), color: 'text-accent' },
          { value: totals.fat, target: profile.macros.fat, label: t('dashboard.fat'), color: 'text-warning' },
          { value: totals.carbs, target: profile.macros.carbs, label: t('dashboard.carbs'), color: 'text-blue-400' },
        ].map((m, i) => (
          <div key={m.label} className={`animate-stagger-in stagger-${i + 3}`}>
            <Card className="text-center">
              <div className={`${m.color} text-lg font-bold animate-count-up`}>{m.value}</div>
              <div className="text-text-muted text-[10px] mt-0.5">/ {m.target}g {m.label}</div>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="animate-stagger-in stagger-5">
          <Card className="flex items-center gap-3" onClick={() => setActiveTab('nutrition')}>
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <SparkleIcon size={18} color="#00E676" />
            </div>
            <div>
              <div className="text-sm font-semibold">{t('dashboard.ai_scan')}</div>
              <div className="text-text-muted text-[10px]">{todayEntries.length} {t('dashboard.meals_logged')}</div>
            </div>
          </Card>
        </div>
        <div className="animate-stagger-in stagger-6">
          <Card className="flex items-center gap-3" onClick={() => setActiveTab('training')}>
            <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center">
              <TrainingIcon size={18} color="#60A5FA" />
            </div>
            <div>
              <div className="text-sm font-semibold">{t('dashboard.workout')}</div>
              <div className="text-text-muted text-[10px]">{workoutLogs.length} {t('dashboard.completed')}</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="animate-stagger-in stagger-7">
          <Card onClick={() => setActiveTab('progress')}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <ProgressIcon size={18} color="#C084FC" />
              </div>
              <div>
                <div className="text-sm font-semibold animate-count-up">{currentWeight.toFixed(1)} kg</div>
                <div className="text-text-muted text-[10px]">
                  {trend !== null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)} ${t('dashboard.kg_trend')}` : t('dashboard.weight')}
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="animate-stagger-in stagger-8">
          <Card onClick={() => setActiveTab('profile')}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                <PillIcon size={18} color="#FFD740" />
              </div>
              <div>
                <div className="text-sm font-semibold">{takenCount}/{checklist.length}</div>
                <div className="text-text-muted text-[10px]">{t('dashboard.supplements_taken')}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {checklist.length > 0 && (
        <div className="animate-stagger-in stagger-8">
          <Card>
            <div className="text-text-muted text-xs mb-3">{t('dashboard.supplement_checklist')}</div>
            <div className="space-y-2">
              {checklist.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${s.taken ? 'bg-accent' : 'bg-surface-lighter'}`}>
                    {s.taken && <CheckIcon size={10} color="#000" />}
                  </div>
                  <span className={`text-xs ${s.taken ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{s.name}</span>
                </div>
              ))}
              {checklist.length > 4 && (
                <div className="text-text-muted text-[10px]">+{checklist.length - 4} {t('dashboard.more')}</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
