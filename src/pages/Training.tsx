import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AIChat } from '../components/AIChat';
import { useAppStore } from '../stores/appStore';
import { useTrainingStore } from '../stores/trainingStore';
import {
  DumbbellIcon, BoltIcon, SparkleIcon, PlayIcon, StopIcon,
  ChevronLeftIcon, CheckIcon, PlusIcon, ClockIcon, ChevronRightIcon,
  MessageIcon, LoaderIcon, AlertIcon, SaveIcon,
} from '../icons';
import { generateWorkout, trainingChat, isConfigured } from '../services/ai';
import type { ChatMessage } from '../services/ai';
import type { WorkoutTemplate, WorkoutLog } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  push: '#FF6B6B', pull: '#4ECDC4', legs: '#FFD93D', upper: '#6C5CE7',
  lower: '#A29BFE', full_body: '#00E676', hiit: '#FF5252', cardio: '#60A5FA',
};

const MUSCLE_OPTIONS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'];
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbells', 'Cables', 'Machines', 'Bodyweight', 'Kettlebell', 'Resistance Bands', 'Pull-up Bar'];

function formatDuration(min?: number) {
  if (!min) return '--';
  if (min < 60) return `${min}min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

type View = 'library' | 'detail' | 'active' | 'history' | 'generate' | 'chat';

export function Training() {
  const profile = useAppStore((s) => s.profile);
  const store = useTrainingStore();
  const [view, setView] = useState<View>('library');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);

  // AI Generate state
  const [genMuscles, setGenMuscles] = useState<string[]>([]);
  const [genEquipment, setGenEquipment] = useState<string[]>([]);
  const [genTime, setGenTime] = useState('45');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genResult, setGenResult] = useState<WorkoutTemplate | null>(null);

  const allTemplates = store.getAllTemplates();

  // AI Chat view
  if (view === 'chat') {
    if (!profile) { setView('library'); return null; }
    const history = store.getWorkoutHistory();
    const handleTrainingChat = async (messages: ChatMessage[]) => {
      return trainingChat(messages, {
        experienceLevel: profile.experienceLevel,
        goal: profile.goal,
        weight: profile.weight,
      }, history.slice(0, 10).map(w => ({ name: w.name, date: w.date, durationMinutes: w.durationMinutes })));
    };
    return <AIChat title="Training Coach" onSend={handleTrainingChat} onClose={() => setView('library')} placeholder="Ask about training..." />;
  }

  // AI Generate view
  if (view === 'generate') {
    if (genResult) {
      return (
        <div className="px-5 pt-6 pb-24 animate-fade-in">
          <button onClick={() => { setGenResult(null); setView('library'); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
            <ChevronLeftIcon size={16} /> Back
          </button>
          <h1 className="text-xl font-bold mb-1">{genResult.name}</h1>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {genResult.targetMuscles.map((m) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-surface-lighter text-text-secondary">{m}</span>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            {genResult.exercises.map((ex) => (
              <Card key={ex.id}>
                <div className="text-sm font-medium">{ex.name}</div>
                <div className="text-text-muted text-xs">{ex.sets} sets x {ex.reps} reps &middot; {ex.restSeconds}s rest</div>
                {ex.notes && <div className="text-text-muted text-xs mt-1 italic">{ex.notes}</div>}
              </Card>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => {
              store.addCustomTemplate({
                name: genResult.name,
                category: genResult.category as WorkoutTemplate['category'],
                targetMuscles: genResult.targetMuscles,
                exercises: genResult.exercises,
              });
              setGenResult(null);
              setView('library');
            }}>
              <span className="flex items-center justify-center gap-2"><SaveIcon size={14} /> Save</span>
            </Button>
            <Button fullWidth onClick={() => { store.startWorkout(genResult); setGenResult(null); setView('active'); }}>
              <span className="flex items-center justify-center gap-2"><PlayIcon size={14} color="#000" /> Start</span>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('library')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-1">AI Generate Workout</h1>
        <p className="text-text-muted text-xs mb-4">Select parameters for your AI-generated workout</p>

        {!isConfigured() ? (
          <Card className="py-10 text-center">
            <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">API Key Required</div>
            <div className="text-text-muted text-xs">Go to Profile &gt; AI Settings to configure your API key.</div>
          </Card>
        ) : (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Target Muscles</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {MUSCLE_OPTIONS.map(m => (
                <button key={m} onClick={() => setGenMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${genMuscles.includes(m) ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                  {m}
                </button>
              ))}
            </div>

            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Equipment</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {EQUIPMENT_OPTIONS.map(e => (
                <button key={e} onClick={() => setGenEquipment(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${genEquipment.includes(e) ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                  {e}
                </button>
              ))}
            </div>

            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Time Limit (minutes)</div>
            <input type="number" inputMode="numeric" value={genTime} onChange={e => setGenTime(e.target.value)} className="mb-4" placeholder="45" />

            {genError && (
              <Card className="mb-4 bg-danger/10">
                <div className="text-danger text-xs">{genError}</div>
              </Card>
            )}

            <Button fullWidth disabled={genMuscles.length === 0 || generating} onClick={async () => {
              setGenerating(true);
              setGenError('');
              try {
                const result = await generateWorkout({
                  targetMuscles: genMuscles,
                  equipment: genEquipment.length > 0 ? genEquipment : ['Any'],
                  timeLimitMinutes: Number(genTime) || 45,
                  goal: profile?.goal || 'gain_muscle',
                  experienceLevel: profile?.experienceLevel || 'intermediate',
                });
                const template: WorkoutTemplate = {
                  id: 'ai-' + Date.now(),
                  name: result.name,
                  category: (result.category as WorkoutTemplate['category']) || 'full_body',
                  targetMuscles: result.targetMuscles,
                  exercises: result.exercises.map((ex, i) => ({
                    id: `aie-${i}`,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    restSeconds: ex.restSeconds,
                    notes: ex.notes,
                  })),
                };
                setGenResult(template);
              } catch (err) {
                setGenError(err instanceof Error ? err.message : 'Failed to generate workout');
              } finally {
                setGenerating(false);
              }
            }}>
              {generating ? (
                <span className="flex items-center justify-center gap-2"><LoaderIcon size={16} color="#000" /> Generating...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><SparkleIcon size={16} color="#000" /> Generate Workout</span>
              )}
            </Button>
          </>
        )}
      </div>
    );
  }

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
                  <input type="number" inputMode="numeric" placeholder="kg" value={s.weight || ''} onChange={(e) => store.updateActiveExercise(exIdx, sIdx, { weight: Number(e.target.value) || 0 })} className="!w-20 !py-2 !px-3 text-sm text-center" />
                  <span className="text-text-muted text-xs">x</span>
                  <input type="number" inputMode="numeric" placeholder="reps" value={s.reps || ''} onChange={(e) => store.updateActiveExercise(exIdx, sIdx, { reps: Number(e.target.value) || 0 })} className="!w-20 !py-2 !px-3 text-sm text-center" />
                  <button onClick={() => store.updateActiveExercise(exIdx, sIdx, { completed: !s.completed })} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${s.completed ? 'bg-accent' : 'bg-surface-lighter'}`}>
                    <CheckIcon size={14} color={s.completed ? '#000' : '#616161'} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => store.addSetToExercise(exIdx)} className="flex items-center gap-1 text-text-muted text-xs mt-3 py-1">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Training</h1>
          <p className="text-text-muted text-sm mt-1">Your workout programs</p>
        </div>
        <button onClick={() => setView('chat')} className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center active:scale-95 transition-transform">
          <MessageIcon size={18} color="#60A5FA" />
        </button>
      </div>

      {/* AI Generate */}
      <Card className="mb-4 flex items-center gap-4" onClick={() => setView('generate')}>
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
          <Card key={t.id} className="relative overflow-hidden" onClick={() => { setSelectedTemplate(t); setView('detail'); }}>
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
