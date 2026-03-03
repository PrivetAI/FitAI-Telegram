export type AchievementCategory = 'nutrition' | 'training' | 'progress' | 'supplements' | 'streak';
export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: AchievementCategory;
  icon: string;
  requirement: number;
  tier: AchievementTier;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  unlockedAt?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;
}

// All achievement definitions
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Nutrition
  { id: 'first_bite', titleKey: 'achievements.first_bite', descriptionKey: 'achievements.first_bite_desc', category: 'nutrition', icon: 'FirstBite', requirement: 1, tier: 'bronze' },
  { id: 'calorie_counter', titleKey: 'achievements.calorie_counter', descriptionKey: 'achievements.calorie_counter_desc', category: 'nutrition', icon: 'CalorieCounter', requirement: 7, tier: 'silver' },
  { id: 'macro_master', titleKey: 'achievements.macro_master', descriptionKey: 'achievements.macro_master_desc', category: 'nutrition', icon: 'MacroMaster', requirement: 1, tier: 'gold' },
  { id: 'meal_prep_pro', titleKey: 'achievements.meal_prep_pro', descriptionKey: 'achievements.meal_prep_pro_desc', category: 'nutrition', icon: 'MealPrepPro', requirement: 1, tier: 'silver' },
  { id: 'century_club', titleKey: 'achievements.century_club', descriptionKey: 'achievements.century_club_desc', category: 'nutrition', icon: 'CenturyClub', requirement: 100, tier: 'gold' },
  { id: 'perfect_week', titleKey: 'achievements.perfect_week', descriptionKey: 'achievements.perfect_week_desc', category: 'nutrition', icon: 'PerfectWeek', requirement: 7, tier: 'gold' },

  // Training
  { id: 'first_rep', titleKey: 'achievements.first_rep', descriptionKey: 'achievements.first_rep_desc', category: 'training', icon: 'FirstRep', requirement: 1, tier: 'bronze' },
  { id: 'iron_regular', titleKey: 'achievements.iron_regular', descriptionKey: 'achievements.iron_regular_desc', category: 'training', icon: 'IronRegular', requirement: 10, tier: 'silver' },
  { id: 'beast_mode', titleKey: 'achievements.beast_mode', descriptionKey: 'achievements.beast_mode_desc', category: 'training', icon: 'BeastMode', requirement: 50, tier: 'gold' },
  { id: 'heavy_lifter', titleKey: 'achievements.heavy_lifter', descriptionKey: 'achievements.heavy_lifter_desc', category: 'training', icon: 'HeavyLifter', requirement: 1, tier: 'gold' },
  { id: 'marathon_session', titleKey: 'achievements.marathon_session', descriptionKey: 'achievements.marathon_session_desc', category: 'training', icon: 'MarathonSession', requirement: 1, tier: 'silver' },
  { id: 'variety_pack', titleKey: 'achievements.variety_pack', descriptionKey: 'achievements.variety_pack_desc', category: 'training', icon: 'VarietyPack', requirement: 8, tier: 'gold' },

  // Progress
  { id: 'scale_starter', titleKey: 'achievements.scale_starter', descriptionKey: 'achievements.scale_starter_desc', category: 'progress', icon: 'ScaleStarter', requirement: 1, tier: 'bronze' },
  { id: 'consistent_tracker', titleKey: 'achievements.consistent_tracker', descriptionKey: 'achievements.consistent_tracker_desc', category: 'progress', icon: 'ConsistentTracker', requirement: 7, tier: 'silver' },
  { id: 'transformation', titleKey: 'achievements.transformation', descriptionKey: 'achievements.transformation_desc', category: 'progress', icon: 'Transformation', requirement: 30, tier: 'gold' },
  { id: 'goal_crusher', titleKey: 'achievements.goal_crusher', descriptionKey: 'achievements.goal_crusher_desc', category: 'progress', icon: 'GoalCrusher', requirement: 1, tier: 'gold' },
  { id: 'measure_up', titleKey: 'achievements.measure_up', descriptionKey: 'achievements.measure_up_desc', category: 'progress', icon: 'MeasureUp', requirement: 5, tier: 'silver' },

  // Supplements
  { id: 'supplement_starter', titleKey: 'achievements.supplement_starter', descriptionKey: 'achievements.supplement_starter_desc', category: 'supplements', icon: 'SupplementStarter', requirement: 1, tier: 'bronze' },
  { id: 'daily_dose', titleKey: 'achievements.daily_dose', descriptionKey: 'achievements.daily_dose_desc', category: 'supplements', icon: 'DailyDose', requirement: 1, tier: 'silver' },
  { id: 'commitment_30', titleKey: 'achievements.commitment_30', descriptionKey: 'achievements.commitment_30_desc', category: 'supplements', icon: 'Commitment30', requirement: 30, tier: 'gold' },

  // Streaks
  { id: 'on_fire', titleKey: 'achievements.on_fire', descriptionKey: 'achievements.on_fire_desc', category: 'streak', icon: 'OnFire', requirement: 7, tier: 'bronze' },
  { id: 'unstoppable', titleKey: 'achievements.unstoppable', descriptionKey: 'achievements.unstoppable_desc', category: 'streak', icon: 'Unstoppable', requirement: 30, tier: 'silver' },
  { id: 'legend', titleKey: 'achievements.legend', descriptionKey: 'achievements.legend_desc', category: 'streak', icon: 'Legend', requirement: 100, tier: 'gold' },
];
