import React from 'react';
import { useAppStore } from './stores/appStore';
import { useTelegram } from './hooks/useTelegram';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { Onboarding } from './pages/onboarding/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Nutrition } from './pages/Nutrition';
import { Training } from './pages/Training';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';
import { Achievements } from './pages/Achievements';
import { useAchievementCheck } from './hooks/useAchievementCheck';

const pages: Record<string, () => React.JSX.Element | null> = {
  dashboard: Dashboard,
  nutrition: Nutrition,
  training: Training,
  progress: Progress,
  profile: Profile,
  achievements: Achievements,
};

export default function App() {
  useTelegram();
  useAchievementCheck();
  const { onboarded, activeTab } = useAppStore();

  if (!onboarded) {
    return (
      <>
        <ToastContainer />
        <Onboarding />
      </>
    );
  }

  const Page = pages[activeTab] || Dashboard;

  return (
    <div className="min-h-screen bg-bg">
      <ToastContainer />
      <div className="tab-content">
        <Page />
      </div>
      <BottomNav />
    </div>
  );
}
