import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../stores/appStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useCycleStore } from '../stores/cycleStore';
import { useAIStore } from '../stores/aiStore';
import {
  ProfileIcon, ChevronRightIcon, ChevronLeftIcon, PillIcon, SyringeIcon,
  CheckIcon, PlusIcon, TrashIcon, EditIcon, DownloadIcon, InfoIcon,
  KeyIcon, SparkleIcon, LoaderIcon, AlertIcon, BeakerIcon, WandIcon,
} from '../icons';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/tdee';
import { testConnection, getSupplementRecommendations, analyzeLabResults } from '../services/ai';
import type { SupplementRecommendation, LabValue, LabAnalysisResult } from '../services/ai';
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

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];
const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

const LAB_MARKERS = [
  { name: 'Total Testosterone', unit: 'ng/dL' },
  { name: 'Free Testosterone', unit: 'pg/mL' },
  { name: 'Estradiol (E2)', unit: 'pg/mL' },
  { name: 'LH', unit: 'mIU/mL' },
  { name: 'FSH', unit: 'mIU/mL' },
  { name: 'SHBG', unit: 'nmol/L' },
  { name: 'TSH', unit: 'mIU/L' },
  { name: 'ALT', unit: 'U/L' },
  { name: 'AST', unit: 'U/L' },
  { name: 'Total Cholesterol', unit: 'mg/dL' },
  { name: 'LDL', unit: 'mg/dL' },
  { name: 'HDL', unit: 'mg/dL' },
  { name: 'Triglycerides', unit: 'mg/dL' },
  { name: 'Hemoglobin', unit: 'g/dL' },
  { name: 'Hematocrit', unit: '%' },
  { name: 'RBC', unit: 'M/uL' },
  { name: 'WBC', unit: 'K/uL' },
  { name: 'Platelets', unit: 'K/uL' },
  { name: 'Creatinine', unit: 'mg/dL' },
  { name: 'Fasting Glucose', unit: 'mg/dL' },
  { name: 'HbA1c', unit: '%' },
  { name: 'Vitamin D', unit: 'ng/mL' },
  { name: 'Ferritin', unit: 'ng/mL' },
];

type View = 'main' | 'editProfile' | 'supplements' | 'addSupplement' | 'cycles' | 'addCycle' | 'cycleDetail' | 'about' | 'aiSettings' | 'aiSupplements' | 'labResults' | 'labAnalysis';

export function Profile() {
  const { profile, setProfile, setOnboarded } = useAppStore();
  const suppStore = useSupplementStore();
  const cycleStore = useCycleStore();
  const aiStore = useAIStore();
  const [view, setView] = useState<View>('main');
  const [editData, setEditData] = useState({ age: '', height: '', weight: '' });
  const [suppForm, setSuppForm] = useState({ name: '', dosage: '', schedule: [] as SupplementSchedule[], notes: '' });
  const [cycleForm, setCycleForm] = useState({ name: '', startDate: '', notes: '' });
  const [compoundForm, setCompoundForm] = useState({ name: '', dosage: '', frequency: 'weekly' as CycleFrequency, durationWeeks: '' });
  const [selectedCycle, setSelectedCycle] = useState<SteroidCycle | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);

  // AI Settings state
  const [aiKeyInput, setAiKeyInput] = useState(aiStore.getApiKey());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | ''>('');

  // AI Supplements state
  const [suppLoading, setSuppLoading] = useState(false);
  const [suppRecs, setSuppRecs] = useState<SupplementRecommendation[]>([]);
  const [suppError, setSuppError] = useState('');

  // Lab results state
  const [labValues, setLabValues] = useState<Record<string, string>>({});
  const [labLoading, setLabLoading] = useState(false);
  const [labResult, setLabResult] = useState<LabAnalysisResult | null>(null);
  const [labError, setLabError] = useState('');

  if (!profile) return null;

  // === AI SETTINGS ===
  if (view === 'aiSettings') {
    const models = aiStore.provider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS;
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">AI Settings</h1>

        <Card className="mb-4">
          <div className="text-text-muted text-xs mb-2">Provider</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['openai', 'gemini'] as const).map(p => (
              <button key={p} onClick={() => { aiStore.setProvider(p); setAiKeyInput(localStorage.getItem(`fitai-ai-key-${p}`) || ''); }}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${aiStore.provider === p ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                {p === 'openai' ? 'OpenAI' : 'Google Gemini'}
              </button>
            ))}
          </div>

          <div className="text-text-muted text-xs mb-2">Model</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {models.map(m => (
              <button key={m.value} onClick={() => aiStore.setModel(m.value as typeof aiStore.model)}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors ${aiStore.model === m.value ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="text-text-muted text-xs mb-2">API Key</div>
          <input
            type="password"
            placeholder={aiStore.provider === 'openai' ? 'sk-...' : 'AI...'}
            value={aiKeyInput}
            onChange={e => setAiKeyInput(e.target.value)}
            className="mb-3"
          />
          <div className="text-text-muted text-[10px] mb-4">
            Your key is stored locally and never sent to our servers. API calls go directly to {aiStore.provider === 'openai' ? 'OpenAI' : 'Google'}.
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth disabled={!aiKeyInput || testing} onClick={async () => {
              aiStore.setApiKey(aiKeyInput);
              setTesting(true);
              setTestResult('');
              try {
                const ok = await testConnection();
                setTestResult(ok ? 'success' : 'fail');
              } catch {
                setTestResult('fail');
              }
              setTesting(false);
            }}>
              {testing ? <LoaderIcon size={16} /> : 'Test Connection'}
            </Button>
            <Button fullWidth onClick={() => { aiStore.setApiKey(aiKeyInput); setView('main'); }}>
              Save
            </Button>
          </div>

          {testResult === 'success' && <div className="text-accent text-xs mt-3 text-center">Connection successful</div>}
          {testResult === 'fail' && <div className="text-danger text-xs mt-3 text-center">Connection failed. Check your API key.</div>}
        </Card>
      </div>
    );
  }

  // === AI SUPPLEMENT RECOMMENDATIONS ===
  if (view === 'aiSupplements') {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => { setView('supplements'); setSuppRecs([]); setSuppError(''); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">AI Supplement Advice</h1>

        {!aiStore.isConfigured() ? (
          <Card className="py-10 text-center">
            <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">API Key Required</div>
            <div className="text-text-muted text-xs">Go to AI Settings to configure your API key.</div>
          </Card>
        ) : suppRecs.length > 0 ? (
          <div className="space-y-3">
            {suppRecs.map((rec, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold">{rec.name}</div>
                  <button onClick={() => {
                    suppStore.addSupplement({ name: rec.name, dosage: rec.dosage, schedule: ['morning'] });
                  }} className="text-accent text-xs font-medium">+ Add</button>
                </div>
                <div className="text-text-secondary text-xs mb-1">{rec.dosage} -- {rec.timing}</div>
                <div className="text-text-muted text-xs">{rec.reasoning}</div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {suppError && (
              <Card className="mb-4 bg-danger/10">
                <div className="text-danger text-xs">{suppError}</div>
              </Card>
            )}
            <Card className="py-10 text-center">
              <WandIcon size={32} color="#FFD740" className="mx-auto mb-3" />
              <div className="text-sm font-medium mb-1">Get Personalized Recommendations</div>
              <div className="text-text-muted text-xs mb-4">Based on your goal and current supplements</div>
              <Button disabled={suppLoading} onClick={async () => {
                setSuppLoading(true);
                setSuppError('');
                try {
                  const current = suppStore.supplements.filter(s => s.active).map(s => `${s.name} ${s.dosage}`);
                  const recs = await getSupplementRecommendations(profile.goal, current);
                  setSuppRecs(recs);
                } catch (err) {
                  setSuppError(err instanceof Error ? err.message : 'Failed to get recommendations');
                }
                setSuppLoading(false);
              }}>
                {suppLoading ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> Analyzing...</span> : 'Get Recommendations'}
              </Button>
            </Card>
          </>
        )}
      </div>
    );
  }

  // === LAB RESULTS ===
  if (view === 'labResults') {
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-1">Lab Results</h1>
        <p className="text-text-muted text-xs mb-4">Enter your blood work values (leave blank to skip)</p>

        <div className="space-y-2 mb-4">
          {LAB_MARKERS.map(marker => (
            <div key={marker.name} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{marker.name}</div>
                <div className="text-text-muted text-[10px]">{marker.unit}</div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                placeholder="--"
                value={labValues[marker.name] || ''}
                onChange={e => setLabValues(prev => ({ ...prev, [marker.name]: e.target.value }))}
                className="!w-24 !py-2 !px-3 text-sm text-center"
              />
            </div>
          ))}
        </div>

        {!aiStore.isConfigured() ? (
          <Card className="mb-4 py-6 text-center">
            <AlertIcon size={24} color="#FFD740" className="mx-auto mb-2" />
            <div className="text-text-muted text-xs">Configure AI in settings to analyze results.</div>
          </Card>
        ) : (
          <Button fullWidth disabled={labLoading || Object.values(labValues).every(v => !v)} onClick={async () => {
            setLabLoading(true);
            setLabError('');
            try {
              const values: LabValue[] = LAB_MARKERS
                .filter(m => labValues[m.name] && Number(labValues[m.name]))
                .map(m => ({ name: m.name, value: Number(labValues[m.name]), unit: m.unit }));
              const result = await analyzeLabResults(values);
              setLabResult(result);
              setView('labAnalysis');
            } catch (err) {
              setLabError(err instanceof Error ? err.message : 'Failed to analyze');
            }
            setLabLoading(false);
          }}>
            {labLoading ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> Analyzing...</span> : <span className="flex items-center gap-2"><SparkleIcon size={16} color="#000" /> Analyze with AI</span>}
          </Button>
        )}
        {labError && <div className="text-danger text-xs mt-2 text-center">{labError}</div>}
      </div>
    );
  }

  // === LAB ANALYSIS RESULTS ===
  if (view === 'labAnalysis' && labResult) {
    const statusColors = { normal: '#00E676', low: '#FFD740', high: '#FF9800', critical: '#FF5252' };
    return (
      <div className="px-5 pt-6 pb-24 animate-fade-in">
        <button onClick={() => setView('labResults')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> Back
        </button>
        <h1 className="text-xl font-bold mb-4">Lab Analysis</h1>

        <Card className="mb-4">
          <div className="text-sm leading-relaxed">{labResult.summary}</div>
        </Card>

        {labResult.flags.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Markers</div>
            <div className="space-y-2 mb-4">
              {labResult.flags.map((f, i) => (
                <Card key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColors[f.status] || '#9E9E9E' }} />
                  <div>
                    <div className="text-sm font-medium">{f.name} <span className="text-text-muted text-xs uppercase">({f.status})</span></div>
                    <div className="text-text-muted text-xs">{f.note}</div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {labResult.recommendations.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Recommendations</div>
            <Card>
              <ul className="space-y-2">
                {labResult.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2">
                    <span className="text-accent mt-0.5">-</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <Card className="mt-4 bg-surface-lighter">
          <div className="text-text-muted text-[10px] text-center">
            This analysis is for informational purposes only. Always consult a qualified healthcare professional for medical advice.
          </div>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <button onClick={() => setView('aiSupplements')} className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center">
              <WandIcon size={18} color="#FFD740" />
            </button>
            <button onClick={() => setView('addSupplement')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <PlusIcon size={20} color="#000" />
            </button>
          </div>
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

        {maxWeeks > 0 && cycle.active && (
          <Card className="mb-4">
            <div className="text-xs text-text-muted mb-2">Progress: Week {Math.min(weeksElapsed + 1, maxWeeks)} / {maxWeeks}</div>
            <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(((weeksElapsed + 1) / maxWeeks) * 100, 100)}%` }} />
            </div>
          </Card>
        )}

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
            <div className="text-text-muted text-xs mt-1">v3.0.0</div>
          </div>
          <div className="text-text-secondary text-sm leading-relaxed">
            AI-powered fitness companion for Telegram. Track nutrition, workouts, progress, supplements, and more -- all in one place. Now with real AI integration via OpenAI and Google Gemini.
          </div>
        </Card>
        <Card>
          <div className="text-text-muted text-xs">Built with React, TypeScript, and Zustand. AI features powered by OpenAI GPT-4o and Google Gemini.</div>
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
          { label: 'AI Settings', icon: <KeyIcon size={16} color="#00E676" />, action: () => setView('aiSettings') },
          { label: 'Lab Results', icon: <BeakerIcon size={16} color="#60A5FA" />, action: () => setView('labResults') },
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

      {/* AI Status indicator */}
      <Card className="mb-4 flex items-center gap-3">
        <SparkleIcon size={16} color={aiStore.isConfigured() ? '#00E676' : '#616161'} />
        <div className="flex-1">
          <div className="text-xs font-medium">AI: {aiStore.provider === 'openai' ? 'OpenAI' : 'Gemini'}</div>
          <div className="text-text-muted text-[10px]">{aiStore.isConfigured() ? 'Configured' : 'Not configured'}</div>
        </div>
        <button onClick={() => setView('aiSettings')} className="text-accent text-xs font-medium">Setup</button>
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
