import { useAppStore } from '../stores/appStore';
import { HomeIcon, NutritionIcon, TrainingIcon, ProgressIcon, ProfileIcon } from '../icons';
import { useTelegram } from '../hooks/useTelegram';
import { useTranslation } from '../i18n';

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore();
  const { haptic } = useTelegram();
  const { t } = useTranslation();

  const tabs = [
    { id: 'dashboard', labelKey: 'nav.dashboard' as const, Icon: HomeIcon },
    { id: 'nutrition', labelKey: 'nav.nutrition' as const, Icon: NutritionIcon },
    { id: 'training', labelKey: 'nav.training' as const, Icon: TrainingIcon },
    { id: 'progress', labelKey: 'nav.progress' as const, Icon: ProgressIcon },
    { id: 'profile', labelKey: 'nav.profile' as const, Icon: ProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ id, labelKey, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { haptic('light'); setActiveTab(id); }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 pt-1 transition-all duration-200 ${
                active ? 'text-accent scale-105' : 'text-text-muted'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
