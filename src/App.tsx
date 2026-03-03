import { useAppStore } from './stores/appStore';
import { useTelegram } from './hooks/useTelegram';
import { BottomNav } from './components/BottomNav';
import { Onboarding } from './pages/onboarding/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Nutrition } from './pages/Nutrition';
import { Training } from './pages/Training';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';

const pages: Record<string, () => JSX.Element | null> = {
  dashboard: Dashboard,
  nutrition: Nutrition,
  training: Training,
  progress: Progress,
  profile: Profile,
};

export default function App() {
  useTelegram();
  const { onboarded, activeTab } = useAppStore();

  if (!onboarded) {
    return <Onboarding />;
  }

  const Page = pages[activeTab] || Dashboard;

  return (
    <div className="min-h-screen bg-bg">
      <Page />
      <BottomNav />
    </div>
  );
}
