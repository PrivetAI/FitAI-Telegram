import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTrainingStore } from '../stores/trainingStore';
import {
  DumbbellIcon, BoltIcon, SparkleIcon, PlayIcon, StopIcon,
  ChevronLeftIcon, CheckIcon, PlusIcon, ClockIcon, ChevronRightIcon,
} from '../icons';
import type { WorkoutTemplate, WorkoutLog } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  push: '#FF6B6B', pull: '#4ECDC4', legs: '#FFD93D', upper: '#6C5CE7',
  lower: '#A29BFE', full_body: '#00E676', hiit: '#FF5252', cardio: '#60A5FA',
};

function formatDuration(min?: number) {
  if (!min) return '--';
  if (min < 60) return `${min}min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

type View = 'library' | 'detail' | 'active' | 'history';

export function Training() {
  const store = useTrainingStore();
  const [view, setView] = useState<View>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);

  const allTemplates = store.getAllTemplates();

  // Active workout view
  if (store.activeWorkout || view === 'active') {
    const workout = store.activeWorkout;
    if (!workout) { setView('library'); return null; }

    const elapsed = Math.floor((Date.now() - workout.startedAt) / 60000);
    const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);
    const completedSets = workout.exercises.reduce((s, e) => s + e.sets.filter((st) => st.completed).length, 0);

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{workout.name}</h1>
            <div className="flex items-center gap-3 text-text-muted text-xs mt-1">
              <span className="flex items-center gap-1"><ClockIcon size={12} /> {elapsed} min</span>
              <span>{completedSets}/{totalSets} sets</span>
            </div>
          </div>
          <button
            onClick={() => { store.finishWorkout(); setView('library'); }}
            className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
          >
            <StopIcon size={14} color="#000" /> Finish
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface-lighter rounded-full overflow-hidden mb-6">
          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }} />
        </div>

        {workout.exercises.map((ex, exIdx) => (
          <Card key={exIdx} className="mb-3">
            <div className="text-sm font-semibold mb-3">{ex.exerciseName}</div>
            <div className="space-y-2">
              {ex.sets.map((s, sIdx) => (
                <div key={sIdx} className="flex items-center gap-3">
                  <span className="text-text-muted text-xs w-6">#{sIdx + 1}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="kg"
                    value={s.weight || ''}
                    onChange={(e) => store.updateActiveExercise(exIdx, sIdx, { weight: Number(e.target.value) || 0 })}
                    className="!w-20 !py-2 !px-3 text-sm text-center"
                  />
                  <span className="text-text-muted text-xs">x</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={s.reps || ''}
                    onChange={(e) => store.updateActiveExercise(exIdx, sIdx, { reps: Number(e.target.value) || 0 })}
                    className="!w-20 !py-2 !px-3 text-sm text-center"
                  />
                  <button
                    onClick={() => store.updateActiveExercise(exIdx, sIdx, { completed: !s.completed })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      s.completed ? 'bg-accent' : 'bg-surface-lighter'
                    }`}
                  >
                    <CheckIcon size={14} color={s.completed ? '#000' : '#616161'} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => store.addSetToExercise(exIdx)}
              className="flex items-center gap-1 text-text-muted text-xs mt-3 py-1"
            >
              <PlusIcon size={12} /> Add set
            </button>
          </Card>
        ))}

        <Button variant="secondary" fullWidth onClick={() => { store.cancelWorkout(); setView('library'); }} className="mt-2">
          Cancel Workout
        </Button>
      </div>
    );
  }

  // Template detail view
  if (view === 'detail' && selectedTemplate) {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('library')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-1">{selectedTemplate.name}</h1>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedTemplate.targetMuscles.map((m) => (
            <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-surface-lighter text-text-secondary">{m}</span>
          ))}
        </div>
        <div className="space-y-2 mb-6">
          {selectedTemplate.exercises.map((ex) => (
            <Card key={ex.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-text-muted text-xs">{ex.sets} sets x {ex.reps} reps &middot; {ex.restSeconds}s rest</div>
              </div>
            </Card>
          ))}
        </div>
        <Button fullWidth onClick={() => { store.startWorkout(selectedTemplate); setView('active'); }}>
          <span className="flex items-center justify-center gap-2">
            <PlayIcon size={16} color="#000" /> Start Workout
          </span>
        </Button>
      </div>
    );
  }

  // History detail
  if (view === 'history' && selectedLog) {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => { setSelectedLog(null); setView('library'); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-1">{selectedLog.name}</h1>
        <div className="text-text-muted text-xs mb-4">
          {new Date(selectedLog.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {selectedLog.durationMinutes ? ` \u00b7 ${formatDuration(selectedLog.durationMinutes)}` : ''}
        </div>
        <div className="space-y-2">
          {selectedLog.exercises.map((ex, i) => (
            <Card key={i}>
              <div className="text-sm font-medium mb-2">{ex.exerciseName}</div>
              {ex.sets.filter((s) => s.completed).map((s, si) => (
                <div key={si} className="text-text-secondary text-xs">Set {si + 1}: {s.weight}kg x {s.reps} reps</div>
              ))}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Library view
  const history = store.getWorkoutHistory();

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Training</h1>
        <p className="text-text-muted text-sm mt-1">Your workout programs</p>
      </div>

      {/* AI Generate */}
      <Card className="mb-4 flex items-center gap-4" onClick={() => {}}>
        <div className="w-12 h-12 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0">
          <BoltIcon size={22} color="#60A5FA" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold flex items-center gap-2">
            AI Generate Workout
            <SparkleIcon size={14} color="#60A5FA" />
          </div>
          <div className="text-text-muted text-xs">Get a personalized plan</div>
        </div>
        <ChevronRightIcon size={18} color="#616161" />
      </Card>

      {/* Templates */}
      <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Workout Templates</div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {allTemplates.map((t) => (
          <Card
            key={t.id}
            className="relative overflow-hidden"
            onClick={() => { setSelectedTemplate(t); setView('detail'); }}
          >
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: CATEGORY_COLORS[t.category] || '#00E676' }} />
            <div className="pl-2">
              <DumbbellIcon size={18} color={CATEGORY_COLORS[t.category] || '#00E676'} className="mb-2" />
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-text-muted text-[10px] mt-0.5">{t.exercises.length} exercises</div>
              <div className="text-text-muted text-[10px]">{t.targetMuscles.join(', ')}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Recent Workouts</div>
          <div className="space-y-2">
            {history.slice(0, 10).map((log) => (
              <Card key={log.id} onClick={() => { setSelectedLog(log); setView('history'); }} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{log.name}</div>
                  <div className="text-text-muted text-xs">
                    {new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {log.durationMinutes ? ` \u00b7 ${formatDuration(log.durationMinutes)}` : ''}
                  </div>
                </div>
                <ChevronRightIcon size={16} color="#616161" />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
