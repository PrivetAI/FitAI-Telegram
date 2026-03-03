import { useState, useRef } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AIChat } from '../components/AIChat';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useToastStore } from '../stores/toastStore';
import { useTranslation } from '../i18n';
import { useTelegram } from '../hooks/useTelegram';
import { SparkleIcon, PlusIcon, TrashIcon, EditIcon, ChevronLeftIcon, ChevronRightIcon, CameraIcon, MessageIcon, LoaderIcon, AlertIcon, XIcon, EmptyPlateIcon } from '../icons';
import { analyzeFoodPhoto, nutritionChat, isConfigured } from '../services/ai';
import type { ChatMessage } from '../services/ai';
import type { FoodEntry, MealType } from '../types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_KEYS: Record<MealType, string> = {
  breakfast: 'nutrition.meal_breakfast',
  lunch: 'nutrition.meal_lunch',
  dinner: 'nutrition.meal_dinner',
  snack: 'nutrition.meal_snack',
};

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
        <div className="h-full rounded-full animate-progress-fill" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }} />
      </div>
    </div>
  );
}

function FoodForm({ initial, onSave, onCancel, t }: {
  initial?: Partial<FoodEntry>;
  onSave: (data: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  t: (key: string) => string;
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
        <input placeholder={t('nutrition.food_name')} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder={t('nutrition.calories')} type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
          <input placeholder={t('nutrition.portion_size')} value={portion} onChange={(e) => setPortion(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input placeholder={t('nutrition.protein_g')} type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
          <input placeholder={t('nutrition.fat_g')} type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
          <input placeholder={t('nutrition.carbs_g')} type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
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
              {t(MEAL_KEYS[m])}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>{t('common.cancel')}</Button>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => onSave({
            name: name.trim(),
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
            fat: Number(fat) || 0,
            carbs: Number(carbs) || 0,
            portionSize: portion || t('nutrition.serving'),
            mealType: meal,
            date: initial?.date || today(),
          })}
        >
          {initial?.id ? t('nutrition.update') : t('nutrition.add_food')}
        </Button>
      </div>
    </div>
  );
}

export function Nutrition() {
  const { t } = useTranslation();
  const { haptic } = useTelegram();
  const profile = useAppStore((s) => s.profile);
  const { entries, addEntry, updateEntry, deleteEntry } = useNutritionStore();
  const addToast = useToastStore((s) => s.addToast);
  const [viewDate, setViewDate] = useState(today());
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<FoodEntry> | null>(null);
  const [scanError, setScanError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
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

  if (showChat) {
    const handleNutritionChat = async (messages: ChatMessage[]) => {
      return nutritionChat(messages, {
        tdee: profile.tdee, targetCalories: profile.targetCalories, macros: profile.macros, goal: profile.goal, weight: profile.weight,
      }, totals);
    };
    return <AIChat title={t('nutrition.coach_title')} onSend={handleNutritionChat} onClose={() => setShowChat(false)} placeholder={t('nutrition.coach_placeholder')} />;
  }

  if (showScanner) {
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setScanning(true); setScanError(''); setScanResult(null);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const result = await analyzeFoodPhoto(base64, file.type || 'image/jpeg');
        setScanResult({ name: result.name, calories: result.calories, protein: result.protein, fat: result.fat, carbs: result.carbs, portionSize: result.portionSize });
      } catch (err) {
        setScanError(err instanceof Error ? err.message : t('common.error'));
      } finally { setScanning(false); }
    };

    if (scanResult) {
      return (
        <div className="px-5 pt-6 pb-24 animate-slide-left">
          <h1 className="text-xl font-bold mb-1">{t('nutrition.ai_result')}</h1>
          <p className="text-text-muted text-xs mb-4">{t('nutrition.ai_result_desc')}</p>
          <FoodForm t={t} initial={scanResult} onSave={(data) => { addEntry({ ...data, date: viewDate }); haptic('medium'); addToast(t('toast.food_added')); setScanResult(null); setShowScanner(false); }} onCancel={() => { setScanResult(null); setShowScanner(false); }} />
        </div>
      );
    }

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{t('nutrition.ai_scan_title')}</h1>
          <button onClick={() => setShowScanner(false)} className="p-2 rounded-lg active:bg-surface-lighter"><XIcon size={20} /></button>
        </div>
        {!isConfigured() ? (
          <Card className="py-10 text-center">
            <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">{t('ai.no_key')}</div>
            <div className="text-text-muted text-xs">{t('ai.setup_key')}</div>
          </Card>
        ) : scanning ? (
          <Card className="py-16 text-center">
            <LoaderIcon size={32} color="#00E676" className="mx-auto mb-4" />
            <div className="text-sm font-medium">{t('nutrition.analyzing')}</div>
            <div className="text-text-muted text-xs mt-1">{t('nutrition.analyzing_desc')}</div>
          </Card>
        ) : (
          <>
            <Card className="py-12 text-center" onClick={() => fileRef.current?.click()}>
              <CameraIcon size={40} color="#00E676" className="mx-auto mb-4" />
              <div className="text-sm font-medium mb-1">{t('nutrition.take_photo')}</div>
              <div className="text-text-muted text-xs">{t('nutrition.take_photo_desc')}</div>
            </Card>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            {scanError && <Card className="mt-4 bg-danger/10"><div className="text-danger text-xs">{scanError}</div></Card>}
          </>
        )}
      </div>
    );
  }

  if (showForm || editingEntry) {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <h1 className="text-xl font-bold mb-4">{editingEntry ? t('nutrition.edit_food') : t('nutrition.add_food')}</h1>
        <FoodForm
          t={t}
          initial={editingEntry || undefined}
          onSave={(data) => {
            if (editingEntry) { updateEntry(editingEntry.id, data); addToast(t('toast.food_updated')); }
            else { addEntry({ ...data, date: viewDate }); addToast(t('toast.food_added')); }
            haptic('medium');
            setShowForm(false); setEditingEntry(null);
          }}
          onCancel={() => { setShowForm(false); setEditingEntry(null); }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('nutrition.delete_food_title')}
        message={t('nutrition.delete_food_msg')}
        danger
        confirmLabel={t('common.delete')}
        onConfirm={() => { deleteEntry(deleteTarget!); haptic('medium'); addToast(t('toast.food_deleted'), 'info'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{t('nutrition.title')}</h1>
          <p className="text-text-muted text-sm mt-1">{t('nutrition.subtitle')}</p>
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

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(shiftDate(viewDate, -1))} className="p-2 rounded-lg active:bg-surface-lighter">
          <ChevronLeftIcon size={18} />
        </button>
        <span className="text-sm font-medium">{isToday ? t('common.today') : formatDate(viewDate)}</span>
        <button onClick={() => { if (!isToday) setViewDate(shiftDate(viewDate, 1)); }} className={`p-2 rounded-lg active:bg-surface-lighter ${isToday ? 'opacity-30' : ''}`}>
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="animate-stagger-in stagger-1">
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-text-muted text-xs">{t('nutrition.calories_remaining')}</div>
              <div className={`text-2xl font-bold animate-count-up ${remaining < 0 ? 'text-danger' : ''}`}>{remaining}</div>
            </div>
            <div className="text-right text-text-muted text-xs">
              {totals.calories} {t('nutrition.eaten')}<br />
              {profile.targetCalories} {t('nutrition.goal')}
            </div>
          </div>
          <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full animate-progress-fill ${remaining < 0 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${Math.min((totals.calories / profile.targetCalories) * 100, 100)}%` }} />
          </div>
          <div className="space-y-2">
            <MacroBar label={t('onboarding.protein')} current={totals.protein} target={profile.macros.protein} color="#00E676" />
            <MacroBar label={t('onboarding.fat')} current={totals.fat} target={profile.macros.fat} color="#FFD740" />
            <MacroBar label={t('onboarding.carbs')} current={totals.carbs} target={profile.macros.carbs} color="#60A5FA" />
          </div>
        </Card>
      </div>

      <div className="animate-stagger-in stagger-2">
        <Card className="mb-4 flex items-center gap-4" onClick={() => setShowScanner(true)}>
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <CameraIcon size={22} color="#00E676" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              {t('nutrition.ai_scan')}
              <SparkleIcon size={14} color="#00E676" />
            </div>
            <div className="text-text-muted text-xs">{t('nutrition.ai_scan_desc')}</div>
          </div>
          <ChevronRightIcon size={18} color="#616161" />
        </Card>
      </div>

      {grouped.length > 0 ? (
        grouped.map(({ type, items }, gi) => (
          <div key={type} className={`mb-4 animate-stagger-in stagger-${Math.min(gi + 3, 8)}`}>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t(MEAL_KEYS[type])}</div>
            <Card className="divide-y divide-border">
              {items.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{entry.name}</div>
                    <div className="text-text-muted text-xs">{entry.portionSize} &middot; P:{entry.protein}g F:{entry.fat}g C:{entry.carbs}g</div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-sm font-semibold text-accent">{entry.calories}</span>
                    <button onClick={() => setEditingEntry(entry)} className="p-1.5 rounded-lg active:bg-surface-lighter"><EditIcon size={14} color="#616161" /></button>
                    <button onClick={() => setDeleteTarget(entry.id)} className="p-1.5 rounded-lg active:bg-surface-lighter"><TrashIcon size={14} color="#FF5252" /></button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))
      ) : (
        <div className="animate-stagger-in stagger-3">
          <Card className="flex items-center justify-center py-10">
            <div className="text-center">
              <EmptyPlateIcon size={48} color="#616161" className="mx-auto" />
              <div className="text-text-muted text-sm mt-3">{t('nutrition.no_meals')}</div>
              <div className="text-text-muted text-xs mt-1">{t('nutrition.no_meals_desc')}</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
