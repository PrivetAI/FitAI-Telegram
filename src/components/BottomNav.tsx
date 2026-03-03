import { useAppStore } from '../stores/appStore';
import { HomeIcon, NutritionIcon, TrainingIcon, ProgressIcon, ProfileIcon } from '../icons';
import { useTelegram } from '../hooks/useTelegram';

const tabs = [
  { id: 'dashboard', label: 'Home', Icon: HomeIcon },
  { id: 'nutrition', label: 'Nutrition', Icon: NutritionIcon },
  { id: 'training', label: 'Training', Icon: TrainingIcon },
  { id: 'progress', label: 'Progress', Icon: ProgressIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon },
] as const;

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore();
  const { haptic } = useTelegram();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptic('light'); setActiveTab(id); }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 pt-1 transition-colors duration-200 ${
                active ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
