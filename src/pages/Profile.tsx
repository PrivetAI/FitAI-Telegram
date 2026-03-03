import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../stores/appStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useCycleStore } from '../stores/cycleStore';
import {
  ProfileIcon, ChevronRightIcon, ChevronLeftIcon, PillIcon, SyringeIcon,
  CheckIcon, PlusIcon, TrashIcon, EditIcon, DownloadIcon, InfoIcon,
} from '../icons';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/tdee';
import type { Supplement, SupplementSchedule, SteroidCycle, CycleFrequency } from '../types';

const goalLabels = {
  lose_weight: 'Lose Weight',
  gain_muscle: 'Build Muscle',
  maintain: 'Maintain',
  recomp: 'Recomposition',
};

const SCHEDULE_LABELS: Record<SupplementSchedule, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_meal: 'With Meal', before_bed: 'Before Bed',
};

const FREQ_LABELS: Record<CycleFrequency, string> = {
  daily: 'Daily', eod: 'Every Other Day', e3d: 'Every 3 Days', weekly: 'Weekly', biweekly: 'Bi-weekly',
};

type View = 'main' | 'editProfile' | 'supplements' | 'addSupplement' | 'cycles' | 'addCycle' | 'cycleDetail' | 'about';

export function Profile() {
  const { profile, setProfile, setOnboarded } = useAppStore();
  const suppStore = useSupplementStore();
  const cycleStore = useCycleStore();
  const [view, setView] = useState<View>('main');
  const [editData, setEditData] = useState({ age: '', height: '', weight: '' });
  const [suppForm, setSuppForm] = useState({ name: '', dosage: '', schedule: [] as SupplementSchedule[], notes: '' });
  const [cycleForm, setCycleForm] = useState({ name: '', startDate: '', notes: '' });
  const [compoundForm, setCompoundForm] = useState({ name: '', dosage: '', frequency: 'weekly' as CycleFrequency, durationWeeks: '' });
  const [selectedCycle, setSelectedCycle] = useState<SteroidCycle | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);

  if (!profile) return null;

  // === EDIT PROFILE ===
  if (view === 'editProfile') {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">Edit Profile</h1>
        <div className="space-y-3 mb-4">
          <input type="number" inputMode="numeric" placeholder={`Age (${profile.age})`} value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder={`Height cm (${profile.height})`} value={editData.height} onChange={(e) => setEditData({ ...editData, height: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder={`Weight kg (${profile.weight})`} value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} />
        </div>
        <Button fullWidth onClick={() => {
          const age = Number(editData.age) || profile.age;
          const height = Number(editData.height) || profile.height;
          const weight = Number(editData.weight) || profile.weight;
          const bmr = calculateBMR(profile.gender, weight, height, age);
          const tdee = calculateTDEE(bmr, profile.activityLevel);
          const targetCalories = calculateTargetCalories(tdee, profile.goal);
          const macros = calculateMacros(targetCalories, weight, profile.goal);
          setProfile({ ...profile, age, height, weight, tdee, targetCalories, macros });
          setEditData({ age: '', height: '', weight: '' });
          setView('main');
        }}>
          Save & Recalculate
        </Button>
      </div>
    );
  }

  // === SUPPLEMENTS ===
  if (view === 'addSupplement' || editingSupplement) {
    const isEdit = !!editingSupplement;
    const form = isEdit ? { name: editingSupplement!.name, dosage: editingSupplement!.dosage, schedule: editingSupplement!.schedule, notes: editingSupplement!.notes || '' } : suppForm;
    const setForm = isEdit
      ? (f: typeof suppForm) => setEditingSupplement({ ...editingSupplement!, name: f.name, dosage: f.dosage, schedule: f.schedule, notes: f.notes })
      : setSuppForm;

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => { setView('supplements'); setEditingSupplement(null); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">{isEdit ? 'Edit' : 'Add'} Supplement</h1>
        <div className="space-y-3 mb-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Dosage (e.g. 5g, 1000mg)" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
          <div>
            <div className="text-text-muted text-xs mb-2">Schedule</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SCHEDULE_LABELS) as SupplementSchedule[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const has = form.schedule.includes(s);
                    setForm({ ...form, schedule: has ? form.schedule.filter((x) => x !== s) : [...form.schedule, s] });
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium ${form.schedule.includes(s) ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}
                >
                  {SCHEDULE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button fullWidth disabled={!form.name || !form.dosage} onClick={() => {
          if (isEdit) {
            suppStore.updateSupplement(editingSupplement!.id, { name: form.name, dosage: form.dosage, schedule: form.schedule, notes: form.notes || undefined });
            setEditingSupplement(null);
          } else {
            suppStore.addSupplement({ name: form.name, dosage: form.dosage, schedule: form.schedule, notes: form.notes || undefined });
            setSuppForm({ name: '', dosage: '', schedule: [], notes: '' });
          }
          setView('supplements');
        }}>
          {isEdit ? 'Update' : 'Add Supplement'}
        </Button>
      </div>
    );
  }

  if (view === 'supplements') {
    const checklist = suppStore.getTodayChecklist();
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Supplements</h1>
          <button onClick={() => setView('addSupplement')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <PlusIcon size={20} color="#000" />
          </button>
        </div>

        {checklist.length === 0 ? (
          <Card className="py-10 text-center">
            <PillIcon size={32} color="#616161" className="mx-auto mb-3" />
            <div className="text-text-muted text-sm">No supplements added</div>
            <div className="text-text-muted text-xs mt-1">Tap + to add your first</div>
          </Card>
        ) : (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Today's Checklist</div>
            <div className="space-y-2 mb-4">
              {checklist.map((s) => (
                <Card key={s.id} className="flex items-center gap-3">
                  <button
                    onClick={() => suppStore.toggleTaken(s.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${s.taken ? 'bg-accent' : 'bg-surface-lighter'}`}
                  >
                    <CheckIcon size={14} color={s.taken ? '#000' : '#616161'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${s.taken ? 'line-through text-text-muted' : ''}`}>{s.name}</div>
                    <div className="text-text-muted text-xs">{s.dosage} &middot; {s.schedule.map((sc) => SCHEDULE_LABELS[sc]).join(', ')}</div>
                  </div>
                  <button onClick={() => setEditingSupplement(s)} className="p-1.5"><EditIcon size={14} color="#616161" /></button>
                  <button onClick={() => suppStore.deleteSupplement(s.id)} className="p-1.5"><TrashIcon size={14} color="#FF5252" /></button>
                </Card>
              ))}
            </div>
            <div className="text-text-muted text-xs text-center">
              {checklist.filter((s) => s.taken).length}/{checklist.length} taken today
            </div>
          </>
        )}
      </div>
    );
  }

  // === CYCLES ===
  if (view === 'addCycle') {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('cycles')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">New Cycle</h1>
        <div className="space-y-3 mb-4">
          <input placeholder="Cycle name" value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} />
          <input type="date" value={cycleForm.startDate} onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })} />
          <input placeholder="Notes (optional)" value={cycleForm.notes} onChange={(e) => setCycleForm({ ...cycleForm, notes: e.target.value })} />
        </div>
        <Button fullWidth disabled={!cycleForm.name || !cycleForm.startDate} onClick={() => {
          cycleStore.addCycle({ name: cycleForm.name, compounds: [], startDate: cycleForm.startDate, notes: cycleForm.notes || undefined });
          setCycleForm({ name: '', startDate: '', notes: '' });
          setView('cycles');
        }}>
          Create Cycle
        </Button>
      </div>
    );
  }

  if (view === 'cycleDetail' && selectedCycle) {
    const cycle = cycleStore.cycles.find((c) => c.id === selectedCycle.id) || selectedCycle;
    const pctEntries = cycleStore.getPCTForCycle(cycle.id);
    const startDate = new Date(cycle.startDate + 'T00:00:00');
    const maxWeeks = cycle.compounds.length > 0 ? Math.max(...cycle.compounds.map((c) => c.durationWeeks)) : 0;
    const weeksElapsed = Math.floor((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => { setSelectedCycle(null); setView('cycles'); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{cycle.name}</h1>
            <div className="text-text-muted text-xs mt-1">
              Started {cycle.startDate} {cycle.active && `\u00b7 Week ${weeksElapsed + 1}`}
            </div>
          </div>
          {cycle.active && (
            <button onClick={() => cycleStore.endCycle(cycle.id)} className="px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-xs font-medium">
              End Cycle
            </button>
          )}
        </div>

        {/* Timeline bar */}
        {maxWeeks > 0 && cycle.active && (
          <Card className="mb-4">
            <div className="text-xs text-text-muted mb-2">Progress: Week {Math.min(weeksElapsed + 1, maxWeeks)} / {maxWeeks}</div>
            <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(((weeksElapsed + 1) / maxWeeks) * 100, 100)}%` }} />
            </div>
          </Card>
        )}

        {/* Compounds */}
        <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Compounds</div>
        {cycle.compounds.length === 0 ? (
          <Card className="py-6 text-center mb-4">
            <div className="text-text-muted text-sm">No compounds added yet</div>
          </Card>
        ) : (
          <div className="space-y-2 mb-4">
            {cycle.compounds.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-text-muted text-xs">{c.dosage} &middot; {FREQ_LABELS[c.frequency]} &middot; {c.durationWeeks}wk</div>
                </div>
                <button onClick={() => cycleStore.removeCompound(cycle.id, c.id)} className="p-1.5"><TrashIcon size={14} color="#FF5252" /></button>
              </Card>
            ))}
          </div>
        )}

        {/* Add compound form */}
        <Card className="mb-4">
          <div className="text-xs text-text-muted mb-2">Add Compound</div>
          <div className="space-y-2">
            <input placeholder="Compound name" className="!py-2 !text-sm" value={compoundForm.name} onChange={(e) => setCompoundForm({ ...compoundForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Dosage" className="!py-2 !text-sm" value={compoundForm.dosage} onChange={(e) => setCompoundForm({ ...compoundForm, dosage: e.target.value })} />
              <input type="number" inputMode="numeric" placeholder="Weeks" className="!py-2 !text-sm" value={compoundForm.durationWeeks} onChange={(e) => setCompoundForm({ ...compoundForm, durationWeeks: e.target.value })} />
            </div>
            <select value={compoundForm.frequency} onChange={(e) => setCompoundForm({ ...compoundForm, frequency: e.target.value as CycleFrequency })} className="!py-2 !text-sm">
              {(Object.keys(FREQ_LABELS) as CycleFrequency[]).map((f) => (
                <option key={f} value={f}>{FREQ_LABELS[f]}</option>
              ))}
            </select>
          </div>
          <Button className="mt-3" fullWidth disabled={!compoundForm.name || !compoundForm.dosage || !compoundForm.durationWeeks} onClick={() => {
            cycleStore.addCompound(cycle.id, { name: compoundForm.name, dosage: compoundForm.dosage, frequency: compoundForm.frequency, durationWeeks: Number(compoundForm.durationWeeks) });
            setCompoundForm({ name: '', dosage: '', frequency: 'weekly', durationWeeks: '' });
          }}>
            Add Compound
          </Button>
        </Card>

        {/* PCT */}
        <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">PCT</div>
        {pctEntries.length === 0 ? (
          <Card className="py-4 text-center">
            <div className="text-text-muted text-xs">No PCT entries. Add after cycle ends.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {pctEntries.map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.compound}</div>
                  <div className="text-text-muted text-xs">{p.dosage} &middot; {p.durationWeeks}wk from {p.startDate}</div>
                </div>
                <button onClick={() => cycleStore.deletePCT(p.id)} className="p-1.5"><TrashIcon size={14} color="#FF5252" /></button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'cycles') {
    const active = cycleStore.getActiveCycle();
    const history = cycleStore.getCycleHistory();
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Cycle Tracker</h1>
          <button onClick={() => setView('addCycle')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <PlusIcon size={20} color="#000" />
          </button>
        </div>

        {active ? (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Active Cycle</div>
            <Card className="mb-4 border-accent/30" onClick={() => { setSelectedCycle(active); setView('cycleDetail'); }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <SyringeIcon size={18} color="#00E676" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{active.name}</div>
                  <div className="text-text-muted text-xs">{active.compounds.length} compounds &middot; Started {active.startDate}</div>
                </div>
                <ChevronRightIcon size={16} color="#616161" />
              </div>
            </Card>
          </>
        ) : (
          <Card className="mb-4 py-8 text-center">
            <SyringeIcon size={32} color="#616161" className="mx-auto mb-3" />
            <div className="text-text-muted text-sm">No active cycle</div>
            <div className="text-text-muted text-xs mt-1">Tap + to start one</div>
          </Card>
        )}

        {history.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">History</div>
            <div className="space-y-2">
              {history.map((c) => (
                <Card key={c.id} onClick={() => { setSelectedCycle(c); setView('cycleDetail'); }} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-text-muted text-xs">{c.startDate} to {c.endDate}</div>
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

  if (view === 'about') {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">About FitAI</h1>
        <Card className="mb-4">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-accent">FitAI</div>
            <div className="text-text-muted text-xs mt-1">v2.0.0</div>
          </div>
          <div className="text-text-secondary text-sm leading-relaxed">
            AI-powered fitness companion for Telegram. Track nutrition, workouts, progress, supplements, and more -- all in one place.
          </div>
        </Card>
        <Card>
          <div className="text-text-muted text-xs">Built with React, TypeScript, and Zustand. AI features powered by OpenAI (coming soon).</div>
        </Card>
      </div>
    );
  }

  // === MAIN PROFILE VIEW ===
  const todayChecklist = suppStore.getTodayChecklist();
  const takenCount = todayChecklist.filter((s) => s.taken).length;
  const activeCycle = cycleStore.getActiveCycle();

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Profile</h1>
        <p className="text-text-muted text-sm mt-1">Your settings</p>
      </div>

      <Card className="mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-lighter flex items-center justify-center">
          <ProfileIcon size={28} color="#9E9E9E" />
        </div>
        <div>
          <div className="text-sm font-semibold">{profile.gender === 'male' ? 'Male' : 'Female'}, {profile.age}y</div>
          <div className="text-text-muted text-xs">{profile.height}cm / {profile.weight}kg</div>
          <div className="text-accent text-xs mt-0.5">{goalLabels[profile.goal]}</div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="text-text-muted text-xs mb-3">Daily Targets</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Calories</span><span className="font-medium">{profile.targetCalories} kcal</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Protein</span><span className="font-medium">{profile.macros.protein}g</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Fat</span><span className="font-medium">{profile.macros.fat}g</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Carbs</span><span className="font-medium">{profile.macros.carbs}g</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">TDEE</span><span className="font-medium">{profile.tdee} kcal</span></div>
        </div>
      </Card>

      {/* Quick status cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card onClick={() => setView('supplements')} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
            <PillIcon size={18} color="#FFD740" />
          </div>
          <div>
            <div className="text-xs font-semibold">Supplements</div>
            <div className="text-text-muted text-[10px]">{takenCount}/{todayChecklist.length} taken</div>
          </div>
        </Card>
        <Card onClick={() => setView('cycles')} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0">
            <SyringeIcon size={18} color="#FF6B6B" />
          </div>
          <div>
            <div className="text-xs font-semibold">Cycles</div>
            <div className="text-text-muted text-[10px]">{activeCycle ? 'Active' : 'None'}</div>
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        {[
          { label: 'Edit Profile', icon: <EditIcon size={16} color="#9E9E9E" />, action: () => setView('editProfile') },
          { label: 'Supplements & Vitamins', icon: <PillIcon size={16} color="#9E9E9E" />, action: () => setView('supplements') },
          { label: 'Cycle Tracker', icon: <SyringeIcon size={16} color="#9E9E9E" />, action: () => setView('cycles') },
          { label: 'Export Data', icon: <DownloadIcon size={16} color="#9E9E9E" />, action: () => {} },
          { label: 'About', icon: <InfoIcon size={16} color="#9E9E9E" />, action: () => setView('about') },
        ].map((item) => (
          <button key={item.label} onClick={item.action} className="flex items-center justify-between w-full py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            <ChevronRightIcon size={16} color="#616161" />
          </button>
        ))}
      </Card>

      <button
        onClick={() => {
          localStorage.clear();
          setOnboarded(false);
          window.location.reload();
        }}
        className="w-full text-center text-danger text-sm py-3"
      >
        Reset All Data
      </button>
    </div>
  );
}
