import { useState, useRef } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AIChat } from '../components/AIChat';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { SparkleIcon, PlusIcon, TrashIcon, EditIcon, ChevronLeftIcon, ChevronRightIcon, CameraIcon, MessageIcon, LoaderIcon, AlertIcon, XIcon } from '../icons';
import { analyzeFoodPhoto, nutritionChat, isConfigured } from '../services/ai';
import type { ChatMessage } from '../services/ai';
import type { FoodEntry, MealType } from '../types';

const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function today() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function shiftDate(d: string, days: number) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">{current} / {target}g</span>
      </div>
      <div className="w-full h-1.5 bg-surface-lighter rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function FoodForm({ initial, onSave, onCancel }: {
  initial?: Partial<FoodEntry>;
  onSave: (data: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [calories, setCalories] = useState(initial?.calories?.toString() || '');
  const [protein, setProtein] = useState(initial?.protein?.toString() || '');
  const [fat, setFat] = useState(initial?.fat?.toString() || '');
  const [carbs, setCarbs] = useState(initial?.carbs?.toString() || '');
  const [portion, setPortion] = useState(initial?.portionSize || '');
  const [meal, setMeal] = useState<MealType>(initial?.mealType || 'lunch');

  const valid = name.trim() && calories;

  return (
    <div className="animate-fade-in">
      <div className="space-y-3 mb-4">
        <input placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Calories" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <input placeholder="Portion size" value={portion} onChange={(e) => setPortion(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input placeholder="Protein (g)" type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <input placeholder="Fat (g)" type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
          <input placeholder="Carbs (g)" type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_ORDER.map((m) => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors ${
                meal === m ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'
              }`}
            >
              {MEAL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>Cancel</Button>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => onSave({
            name: name.trim(),
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
            fat: Number(fat) || 0,
            carbs: Number(carbs) || 0,
            portionSize: portion || '1 serving',
            mealType: meal,
            date: initial?.date || today(),
          })}
        >
          {initial?.id ? 'Update' : 'Add Food'}
        </Button>
      </div>
    </div>
  );
}

export function Nutrition() {
  const profile = useAppStore((s) => s.profile);
  const { entries, addEntry, updateEntry, deleteEntry } = useNutritionStore();
  const [viewDate, setViewDate] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<FoodEntry> | null>(null);
  const [scanError, setScanError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const dayEntries = entries.filter((e) => e.date === viewDate);
  const totals = dayEntries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, fat: acc.fat + e.fat, carbs: acc.carbs + e.carbs }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  const remaining = profile.targetCalories - totals.calories;
  const grouped = MEAL_ORDER.map((m) => ({ type: m, items: dayEntries.filter((e) => e.mealType === m) })).filter((g) => g.items.length > 0);
  const isToday = viewDate === today();

  // AI Chat view
  if (showChat) {
    const handleNutritionChat = async (messages: ChatMessage[]) => {
      return nutritionChat(messages, {
        tdee: profile.tdee,
        targetCalories: profile.targetCalories,
        macros: profile.macros,
        goal: profile.goal,
        weight: profile.weight,
      }, totals);
    };
    return <AIChat title="Nutrition Coach" onSend={handleNutritionChat} onClose={() => setShowChat(false)} placeholder="Ask about nutrition..." />;
  }

  // Scanner view
  if (showScanner) {
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setScanning(true);
      setScanError('');
      setScanResult(null);

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const result = await analyzeFoodPhoto(base64, file.type || 'image/jpeg');
        setScanResult({
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          fat: result.fat,
          carbs: result.carbs,
          portionSize: result.portionSize,
        });
      } catch (err) {
        setScanError(err instanceof Error ? err.message : 'Failed to analyze photo');
      } finally {
        setScanning(false);
      }
    };

    if (scanResult) {
      return (
        <div className="px-5 pt-6 pb-24 animate-fade-in">
          <h1 className="text-xl font-bold mb-1">AI Analysis Result</h1>
          <p className="text-text-muted text-xs mb-4">Review and edit before saving</p>
          <FoodForm
            initial={scanResult}
            onSave={(data) => {
              addEntry({ ...data, date: viewDate });
              setScanResult(null);
              setShowScanner(false);
            }}
            onCancel={() => { setScanResult(null); setShowScanner(false); }}
          />
        </div>
      );
    }

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">AI Food Scanner</h1>
          <button onClick={() => setShowScanner(false)} className="p-2 rounded-lg active:bg-surface-lighter">
            <XIcon size={20} />
          </button>
        </div>

        {!isConfigured() ? (
          <Card className="py-10 text-center">
            <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">API Key Required</div>
            <div className="text-text-muted text-xs">Go to Profile &gt; AI Settings to configure your API key.</div>
          </Card>
        ) : scanning ? (
          <Card className="py-16 text-center">
            <LoaderIcon size={32} color="#00E676" className="mx-auto mb-4" />
            <div className="text-sm font-medium">Analyzing food...</div>
            <div className="text-text-muted text-xs mt-1">This may take a few seconds</div>
          </Card>
        ) : (
          <>
            <Card className="py-12 text-center" onClick={() => fileRef.current?.click()}>
              <CameraIcon size={40} color="#00E676" className="mx-auto mb-4" />
              <div className="text-sm font-medium mb-1">Take a Photo</div>
              <div className="text-text-muted text-xs">Tap to capture or select a food photo</div>
            </Card>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            {scanError && (
              <Card className="mt-4 bg-danger/10">
                <div className="text-danger text-xs">{scanError}</div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  if (showForm || editingEntry) {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <h1 className="text-xl font-bold mb-4">{editingEntry ? 'Edit Food' : 'Add Food'}</h1>
        <FoodForm
          initial={editingEntry || undefined}
          onSave={(data) => {
            if (editingEntry) {
              updateEntry(editingEntry.id, data);
            } else {
              addEntry({ ...data, date: viewDate });
            }
            setShowForm(false);
            setEditingEntry(null);
          }}
          onCancel={() => { setShowForm(false); setEditingEntry(null); }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Nutrition</h1>
          <p className="text-text-muted text-sm mt-1">Track your meals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChat(true)} className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center active:scale-95 transition-transform">
            <MessageIcon size={18} color="#00E676" />
          </button>
          <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center active:scale-95 transition-transform">
            <PlusIcon size={20} color="#000" />
          </button>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(shiftDate(viewDate, -1))} className="p-2 rounded-lg active:bg-surface-lighter">
          <ChevronLeftIcon size={18} />
        </button>
        <span className="text-sm font-medium">{isToday ? 'Today' : formatDate(viewDate)}</span>
        <button
          onClick={() => { if (!isToday) setViewDate(shiftDate(viewDate, 1)); }}
          className={`p-2 rounded-lg active:bg-surface-lighter ${isToday ? 'opacity-30' : ''}`}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Daily summary */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-text-muted text-xs">Calories remaining</div>
            <div className={`text-2xl font-bold ${remaining < 0 ? 'text-danger' : ''}`}>{remaining}</div>
          </div>
          <div className="text-right text-text-muted text-xs">
            {totals.calories} eaten<br />
            {profile.targetCalories} goal
          </div>
        </div>
        <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? 'bg-danger' : 'bg-accent'}`}
            style={{ width: `${Math.min((totals.calories / profile.targetCalories) * 100, 100)}%` }}
          />
        </div>
        <div className="space-y-2">
          <MacroBar label="Protein" current={totals.protein} target={profile.macros.protein} color="#00E676" />
          <MacroBar label="Fat" current={totals.fat} target={profile.macros.fat} color="#FFD740" />
          <MacroBar label="Carbs" current={totals.carbs} target={profile.macros.carbs} color="#60A5FA" />
        </div>
      </Card>

      {/* AI Scan button */}
      <Card className="mb-4 flex items-center gap-4" onClick={() => setShowScanner(true)}>
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <CameraIcon size={22} color="#00E676" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold flex items-center gap-2">
            AI Food Scanner
            <SparkleIcon size={14} color="#00E676" />
          </div>
          <div className="text-text-muted text-xs">Take a photo to auto-analyze meals</div>
        </div>
        <ChevronRightIcon size={18} color="#616161" />
      </Card>

      {/* Meal groups */}
      {grouped.length > 0 ? (
        grouped.map(({ type, items }) => (
          <div key={type} className="mb-4">
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{MEAL_LABELS[type]}</div>
            <Card className="divide-y divide-border">
              {items.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entry.name}</div>
                    <div className="text-text-muted text-xs">{entry.portionSize} &middot; P:{entry.protein}g F:{entry.fat}g C:{entry.carbs}g</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-semibold text-accent">{entry.calories}</span>
                    <button onClick={() => setEditingEntry(entry)} className="p-1.5 rounded-lg active:bg-surface-lighter">
                      <EditIcon size={14} color="#616161" />
                    </button>
                    <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg active:bg-surface-lighter">
                      <TrashIcon size={14} color="#FF5252" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))
      ) : (
        <Card className="flex items-center justify-center py-10">
          <div className="text-center">
            <NutritionIconEmpty />
            <div className="text-text-muted text-sm mt-3">No meals logged</div>
            <div className="text-text-muted text-xs mt-1">Tap + to add food</div>
          </div>
        </Card>
      )}
    </div>
  );
}

function NutritionIconEmpty() {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#616161" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}
