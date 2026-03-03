import { Card } from '../components/Card';
import { ProgressIcon, ScaleIcon } from '../icons';

export function Progress() {
  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-text-muted text-sm mt-1">Track your transformation</p>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
            <ScaleIcon size={20} color="#C084FC" />
          </div>
          <div>
            <div className="text-sm font-semibold">Weight Tracking</div>
            <div className="text-text-muted text-xs">Log daily weigh-ins</div>
          </div>
        </div>
        <div className="h-32 flex items-center justify-center border border-border rounded-xl">
          <div className="text-text-muted text-xs">Chart will appear here</div>
        </div>
      </Card>

      <Card className="flex items-center justify-center py-12">
        <div className="text-center">
          <ProgressIcon size={32} color="#616161" className="mx-auto mb-3" />
          <div className="text-text-muted text-sm">Start logging to see trends</div>
        </div>
      </Card>
    </div>
  );
}
