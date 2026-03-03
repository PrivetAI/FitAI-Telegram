import { Card } from '../components/Card';
import { SparkleIcon, NutritionIcon } from '../icons';

export function Nutrition() {
  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Nutrition</h1>
        <p className="text-text-muted text-sm mt-1">Track your meals</p>
      </div>

      <Card className="mb-4 flex flex-col items-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <SparkleIcon size={28} color="#00E676" />
        </div>
        <div className="text-sm font-semibold mb-1">AI Food Scanner</div>
        <div className="text-text-muted text-xs text-center max-w-[200px]">
          Take a photo of your meal and AI will analyze calories and macros
        </div>
      </Card>

      <Card className="flex items-center justify-center py-12">
        <div className="text-center">
          <NutritionIcon size={32} color="#616161" className="mx-auto mb-3" />
          <div className="text-text-muted text-sm">No meals logged today</div>
          <div className="text-text-muted text-xs mt-1">Tap the scanner above to start</div>
        </div>
      </Card>
    </div>
  );
}
