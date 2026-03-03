import { useState } from 'react';
import { Card } from '../components/Card';
import { useAchievementStore } from '../stores/achievementStore';
import { useAppStore } from '../stores/appStore';
import { useTranslation } from '../i18n';
import { useTelegram } from '../hooks/useTelegram';
import { ACHIEVEMENTS } from '../types/achievements';
import type { AchievementCategory, AchievementTier } from '../types/achievements';
import {
  TrophyIcon, LockIcon, FireStreakIcon, ChevronLeftIcon,
  NutritionIcon, TrainingIcon, ProgressIcon, PillIcon, StarIcon,
  MedalIcon, CrownIcon, ShieldIcon,
} from '../icons';

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const CATEGORY_ICONS: Record<AchievementCategory, typeof TrophyIcon> = {
  nutrition: NutritionIcon,
  training: TrainingIcon,
  progress: ProgressIcon,
  supplements: PillIcon,
  streak: FireStreakIcon,
};

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  nutrition: '#00E676',
  training: '#60A5FA',
  progress: '#C084FC',
  supplements: '#FFD740',
  streak: '#FF6D00',
};

type Filter = 'all' | AchievementCategory;

export function Achievements() {
  const { t } = useTranslation();
  const { haptic } = useTelegram();
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const { streak, getProgress, getUnlockedCount } = useAchievementStore();
  const [filter, setFilter] = useState<Filter>('all');

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = getUnlockedCount();

  const filtered = filter === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('achievements.all') },
    { key: 'nutrition', label: t('achievements.cat_nutrition') },
    { key: 'training', label: t('achievements.cat_training') },
    { key: 'progress', label: t('achievements.cat_progress') },
    { key: 'supplements', label: t('achievements.cat_supplements') },
    { key: 'streak', label: t('achievements.cat_streak') },
  ];

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <button onClick={() => { setActiveTab('dashboard'); haptic('light'); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
        <ChevronLeftIcon size={16} /> {t('common.back')}
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <TrophyIcon size={24} color="#FFD700" />
          {t('achievements.title')}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <div className="text-lg font-bold text-[#FFD700] animate-count-up">{unlockedCount}/{totalAchievements}</div>
          <div className="text-text-muted text-[10px]">{t('achievements.unlocked')}</div>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-1">
            <FireStreakIcon size={16} color="#FF6D00" />
            <span className="text-lg font-bold text-[#FF6D00] animate-count-up">{streak.currentStreak}</span>
          </div>
          <div className="text-text-muted text-[10px]">{t('achievements.current_streak')}</div>
        </Card>
        <Card className="text-center">
          <div className="text-lg font-bold text-accent animate-count-up">{streak.longestStreak}</div>
          <div className="text-text-muted text-[10px]">{t('achievements.longest_streak')}</div>
        </Card>
      </div>

      {/* Streak freezes */}
      {streak.streakFreezes > 0 && (
        <Card className="mb-4 border-blue-400/30">
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} color="#60A5FA" />
            <span className="text-xs text-text-secondary">
              {streak.streakFreezes} {t('achievements.streak_freezes')}
            </span>
          </div>
        </Card>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); haptic('light'); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-accent text-black'
                : 'bg-surface-lighter text-text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((def, i) => {
          const prog = getProgress(def.id);
          const isUnlocked = !!prog.unlockedAt;
          const pct = Math.min((prog.progress / def.requirement) * 100, 100);
          const CatIcon = CATEGORY_ICONS[def.category];
          const tierColor = TIER_COLORS[def.tier];
          const catColor = CATEGORY_COLORS[def.category];
          const isNew = isUnlocked && prog.unlockedAt && (Date.now() - prog.unlockedAt < 86400000);

          return (
            <div key={def.id} className={`animate-stagger-in stagger-${Math.min(i + 1, 8)}`}>
              <Card className={`relative overflow-hidden ${isNew ? 'achievement-shine' : ''} ${!isUnlocked ? 'opacity-60' : ''}`}>
                {isUnlocked && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-l-[24px] border-t-transparent border-l-transparent"
                    style={{ borderRightWidth: 24, borderRightColor: tierColor, borderBottomWidth: 24, borderBottomColor: 'transparent', top: 0, right: 0, position: 'absolute', width: 0, height: 0, borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0 }}
                  />
                )}
                <div className="flex flex-col items-center text-center py-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${isUnlocked ? '' : 'bg-surface-lighter'}`}
                    style={isUnlocked ? { backgroundColor: `${catColor}15` } : {}}
                  >
                    {isUnlocked ? (
                      <CatIcon size={24} color={catColor} />
                    ) : (
                      <LockIcon size={20} color="#616161" />
                    )}
                  </div>
                  <div className="text-xs font-semibold mb-0.5">{t(def.titleKey)}</div>
                  <div className="text-text-muted text-[9px] mb-2 leading-tight">{t(def.descriptionKey)}</div>

                  {!isUnlocked && (
                    <div className="w-full">
                      <div className="w-full h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: tierColor }}
                        />
                      </div>
                      <div className="text-[9px] text-text-muted mt-1">{prog.progress}/{def.requirement}</div>
                    </div>
                  )}

                  {isUnlocked && prog.unlockedAt && (
                    <div className="flex items-center gap-1 mt-1">
                      <TierBadge tier={def.tier} />
                      <span className="text-[9px] text-text-muted">
                        {new Date(prog.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: AchievementTier }) {
  const color = TIER_COLORS[tier];
  const Icon = tier === 'gold' ? CrownIcon : tier === 'silver' ? StarIcon : MedalIcon;
  return <Icon size={12} color={color} />;
}
