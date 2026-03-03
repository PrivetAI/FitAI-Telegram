import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAppStore } from '../stores/appStore';
import { useSupplementStore } from '../stores/supplementStore';
import { useCycleStore } from '../stores/cycleStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useAIStore } from '../stores/aiStore';
import { useLangStore } from '../stores/langStore';
import { useToastStore } from '../stores/toastStore';
import { useTranslation } from '../i18n';
import { useTelegram } from '../hooks/useTelegram';
import {
  ProfileIcon, ChevronRightIcon, ChevronLeftIcon, PillIcon, SyringeIcon,
  CheckIcon, PlusIcon, TrashIcon, EditIcon, DownloadIcon, InfoIcon,
  KeyIcon, SparkleIcon, LoaderIcon, AlertIcon, BeakerIcon, WandIcon, GlobeIcon,
  CloudIcon, SyncIcon, LinkIcon,
} from '../icons';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/tdee';
import { testConnection, getSupplementRecommendations, analyzeLabResults } from '../services/ai';
import type { SupplementRecommendation, LabValue, LabAnalysisResult } from '../services/ai';
import { useSupabaseStore } from '../stores/supabaseStore';
import { syncAll } from '../services/supabase/sync';
import { useNutritionStore } from '../stores/nutritionStore';
import { useTrainingStore } from '../stores/trainingStore';
import { useProgressStore } from '../stores/progressStore';
import type { Supplement, SupplementSchedule, SteroidCycle, CycleFrequency } from '../types';

const LAB_MARKERS = [
  { name: 'Total Testosterone', unit: 'ng/dL', key: 'labs.testosterone' },
  { name: 'Free Testosterone', unit: 'pg/mL', key: 'labs.free_testosterone' },
  { name: 'Estradiol (E2)', unit: 'pg/mL', key: 'labs.estrogen' },
  { name: 'LH', unit: 'mIU/mL', key: 'labs.lh' },
  { name: 'FSH', unit: 'mIU/mL', key: 'labs.fsh' },
  { name: 'SHBG', unit: 'nmol/L', key: 'labs.shbg' },
  { name: 'TSH', unit: 'mIU/L', key: 'labs.tsh' },
  { name: 'ALT', unit: 'U/L', key: 'labs.alt' },
  { name: 'AST', unit: 'U/L', key: 'labs.ast' },
  { name: 'Total Cholesterol', unit: 'mg/dL', key: 'labs.total_cholesterol' },
  { name: 'LDL', unit: 'mg/dL', key: 'labs.ldl' },
  { name: 'HDL', unit: 'mg/dL', key: 'labs.hdl' },
  { name: 'Triglycerides', unit: 'mg/dL', key: 'labs.triglycerides' },
  { name: 'Hemoglobin', unit: 'g/dL', key: 'labs.hemoglobin' },
  { name: 'Hematocrit', unit: '%', key: 'labs.hematocrit' },
  { name: 'RBC', unit: 'M/uL', key: 'labs.rbc' },
  { name: 'WBC', unit: 'K/uL', key: 'labs.wbc' },
  { name: 'Platelets', unit: 'K/uL', key: 'labs.platelets' },
  { name: 'Creatinine', unit: 'mg/dL', key: 'labs.creatinine' },
  { name: 'Fasting Glucose', unit: 'mg/dL', key: 'labs.fasting_glucose' },
  { name: 'HbA1c', unit: '%', key: 'labs.hba1c' },
  { name: 'Vitamin D', unit: 'ng/mL', key: 'labs.vitamin_d' },
  { name: 'Ferritin', unit: 'ng/mL', key: 'labs.ferritin' },
];

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
];
const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

type View = 'main' | 'editProfile' | 'supplements' | 'addSupplement' | 'cycles' | 'addCycle' | 'cycleDetail' | 'about' | 'aiSettings' | 'aiSupplements' | 'labResults' | 'labAnalysis' | 'language' | 'cloudSync';

export function Profile() {
  const { t } = useTranslation();
  const { haptic, user } = useTelegram();
  const { profile, setProfile, setOnboarded } = useAppStore();
  const suppStore = useSupplementStore();
  const cycleStore = useCycleStore();
  const aiStore = useAIStore();
  const langStore = useLangStore();
  const supaStore = useSupabaseStore();
  const nutritionStore = useNutritionStore();
  const trainingStore = useTrainingStore();
  const progressStore = useProgressStore();
  const addToast = useToastStore((s) => s.addToast);
  const [view, setView] = useState<View>('main');
  const [editData, setEditData] = useState({ age: '', height: '', weight: '' });
  const [suppForm, setSuppForm] = useState({ name: '', dosage: '', schedule: [] as SupplementSchedule[], notes: '' });
  const [cycleForm, setCycleForm] = useState({ name: '', startDate: '', notes: '' });
  const [compoundForm, setCompoundForm] = useState({ name: '', dosage: '', frequency: 'weekly' as CycleFrequency, durationWeeks: '' });
  const [selectedCycle, setSelectedCycle] = useState<SteroidCycle | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmEndCycle, setConfirmEndCycle] = useState(false);
  const [confirmDeleteSupp, setConfirmDeleteSupp] = useState<string | null>(null);

  const [aiKeyInput, setAiKeyInput] = useState(aiStore.getApiKey());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | ''>('');

  const [suppLoading, setSuppLoading] = useState(false);
  const [suppRecs, setSuppRecs] = useState<SupplementRecommendation[]>([]);
  const [suppError, setSuppError] = useState('');

  const [labValues, setLabValues] = useState<Record<string, string>>({});
  const [labLoading, setLabLoading] = useState(false);
  const [labResult, setLabResult] = useState<LabAnalysisResult | null>(null);
  const [labError, setLabError] = useState('');

  if (!profile) return null;

  const goalLabels: Record<string, string> = {
    lose_weight: t('profile.goal_lose'),
    gain_muscle: t('profile.goal_gain'),
    maintain: t('profile.goal_maintain'),
    recomp: t('profile.goal_recomp'),
  };

  const SCHEDULE_LABELS: Record<SupplementSchedule, string> = {
    morning: t('supplements.schedule_morning'),
    afternoon: t('supplements.schedule_afternoon'),
    evening: t('supplements.schedule_evening'),
    with_meal: t('supplements.schedule_with_meal'),
    before_bed: t('supplements.schedule_before_bed'),
  };

  const FREQ_LABELS: Record<CycleFrequency, string> = {
    daily: t('cycles.freq_daily'),
    eod: t('cycles.freq_eod'),
    e3d: t('cycles.freq_e3d'),
    weekly: t('cycles.freq_weekly'),
    biweekly: t('cycles.freq_biweekly'),
  };

  // === CLOUD SYNC ===
  if (view === 'cloudSync') {
    const statusColors: Record<string, string> = {
      disconnected: '#616161', connecting: '#FFD740', connected: '#00E676', error: '#FF5252',
    };
    const statusLabels: Record<string, string> = {
      disconnected: t('sync.status_disconnected'), connecting: t('sync.status_connecting'),
      connected: t('sync.status_connected'), error: t('sync.status_error'),
    };

    const handleSync = async () => {
      if (supaStore.connectionStatus !== 'connected') return;
      supaStore.setSyncInProgress(true);
      try {
        const tgUser = user;
        await syncAll({
          getTelegramUser: () => tgUser ? { id: tgUser.id, username: tgUser.username } : undefined,
          getLanguage: () => langStore.language,
          getNutritionEntries: () => nutritionStore.entries,
          getWorkoutLogs: () => trainingStore.workoutLogs,
          getWeightEntries: () => progressStore.weightEntries,
          getMeasurements: () => progressStore.measurements,
          getSupplements: () => suppStore.supplements,
          getSupplementLogs: () => suppStore.logs,
          getCycles: () => cycleStore.cycles,
          getPCTEntries: () => cycleStore.pctEntries,
          getProfile: () => profile,
          getAchievements: () => useAchievementStore.getState().progress,
          getStreak: () => useAchievementStore.getState().streak,
          setNutritionEntries: (entries) => useNutritionStore.setState({ entries }),
          setWorkoutLogs: (workoutLogs) => useTrainingStore.setState({ workoutLogs }),
          setWeightEntries: (weightEntries) => useProgressStore.setState({ weightEntries }),
          setMeasurements: (measurements) => useProgressStore.setState({ measurements }),
          setSupplements: (supplements) => useSupplementStore.setState({ supplements }),
          setSupplementLogs: (logs) => useSupplementStore.setState({ logs }),
          setCycles: (cycles) => useCycleStore.setState({ cycles }),
          setPCTEntries: (pctEntries) => useCycleStore.setState({ pctEntries }),
          setProfile: (p) => setProfile(p),
          setAchievements: (a) => useAchievementStore.setState({ progress: a }),
          setStreak: (s) => useAchievementStore.setState({ streak: s }),
        });
        supaStore.setLastSyncedAt(Date.now());
        haptic('medium');
        addToast(t('sync.sync_complete'));
      } catch (err) {
        console.error('[Sync]', err);
        addToast(t('sync.sync_failed'), 'error');
      } finally {
        supaStore.setSyncInProgress(false);
      }
    };

    const handleConnect = async () => {
      const ok = await supaStore.connect();
      if (ok) {
        haptic('medium');
        addToast(t('sync.connected'));
      } else {
        addToast(t('sync.connection_failed'), 'error');
      }
    };

    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-1">{t('sync.title')}</h1>
        <p className="text-text-muted text-xs mb-4">{t('sync.subtitle')}</p>

        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[supaStore.connectionStatus] }} />
            <span className="text-sm font-medium">{statusLabels[supaStore.connectionStatus]}</span>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <div className="text-text-muted text-xs mb-1">{t('sync.supabase_url')}</div>
              <input
                type="url"
                placeholder="https://xxxxx.supabase.co"
                value={supaStore.url}
                onChange={(e) => supaStore.setUrl(e.target.value)}
              />
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">{t('sync.anon_key')}</div>
              <input
                type="password"
                placeholder="eyJhbGci..."
                value={supaStore.anonKey}
                onChange={(e) => supaStore.setAnonKey(e.target.value)}
              />
            </div>
          </div>

          <div className="text-text-muted text-[10px] mb-4">{t('sync.config_notice')}</div>

          {supaStore.connectionStatus === 'connected' ? (
            <Button variant="secondary" fullWidth onClick={() => supaStore.disconnect()}>
              {t('sync.disconnect')}
            </Button>
          ) : (
            <Button fullWidth disabled={!supaStore.url || !supaStore.anonKey || supaStore.connectionStatus === 'connecting'} onClick={handleConnect}>
              {supaStore.connectionStatus === 'connecting'
                ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> {t('sync.status_connecting')}</span>
                : <span className="flex items-center gap-2"><LinkIcon size={16} color="#000" /> {t('sync.connect')}</span>
              }
            </Button>
          )}
        </Card>

        {supaStore.connectionStatus === 'connected' && (
          <>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{t('sync.auto_sync')}</span>
                <button
                  onClick={() => { supaStore.setAutoSync(!supaStore.autoSync); haptic('light'); }}
                  className={`w-12 h-7 rounded-full transition-colors relative ${supaStore.autoSync ? 'bg-accent' : 'bg-surface-lighter'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${supaStore.autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {supaStore.lastSyncedAt && (
                <div className="text-text-muted text-xs">
                  {t('sync.last_synced')}: {new Date(supaStore.lastSyncedAt).toLocaleString()}
                </div>
              )}
            </Card>

            <Button fullWidth disabled={supaStore.syncInProgress} onClick={handleSync}>
              {supaStore.syncInProgress
                ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> {t('sync.syncing')}</span>
                : <span className="flex items-center gap-2"><SyncIcon size={16} color="#000" /> {t('sync.sync_now')}</span>
              }
            </Button>
          </>
        )}

        <Card className="mt-4 bg-surface-lighter">
          <div className="text-text-muted text-[10px] text-center">{t('sync.setup_notice')}</div>
        </Card>
      </div>
    );
  }

  // === LANGUAGE ===
  if (view === 'language') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('profile.language')}</h1>
        <div className="space-y-2">
          {([{ code: 'en' as const, label: 'English' }, { code: 'ru' as const, label: 'Русский' }]).map(({ code, label }) => (
            <Card
              key={code}
              onClick={() => { langStore.setLanguage(code); haptic('light'); }}
              className={`flex items-center justify-between ${langStore.language === code ? 'border-accent/50' : ''}`}
            >
              <span className="text-sm font-medium">{label}</span>
              {langStore.language === code && <CheckIcon size={18} color="#00E676" />}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // === AI SETTINGS ===
  if (view === 'aiSettings') {
    const models = aiStore.provider === 'openai' ? OPENAI_MODELS : GEMINI_MODELS;
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('profile.ai_settings')}</h1>
        <Card className="mb-4">
          <div className="text-text-muted text-xs mb-2">{t('ai.provider')}</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['openai', 'gemini'] as const).map(p => (
              <button key={p} onClick={() => { aiStore.setProvider(p); setAiKeyInput(localStorage.getItem(`fitai-ai-key-${p}`) || ''); }}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${aiStore.provider === p ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                {p === 'openai' ? 'OpenAI' : 'Google Gemini'}
              </button>
            ))}
          </div>
          <div className="text-text-muted text-xs mb-2">{t('ai.model')}</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {models.map(m => (
              <button key={m.value} onClick={() => aiStore.setModel(m.value as typeof aiStore.model)}
                className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors ${aiStore.model === m.value ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="text-text-muted text-xs mb-2">{t('ai.api_key')}</div>
          <input type="password" placeholder={aiStore.provider === 'openai' ? 'sk-...' : 'AI...'} value={aiKeyInput} onChange={e => setAiKeyInput(e.target.value)} className="mb-3" />
          <div className="text-text-muted text-[10px] mb-4">
            {t('ai.key_notice')} {t('ai.calls_direct')} {aiStore.provider === 'openai' ? 'OpenAI' : 'Google'}.
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth disabled={!aiKeyInput || testing} onClick={async () => {
              aiStore.setApiKey(aiKeyInput); setTesting(true); setTestResult('');
              try { const ok = await testConnection(); setTestResult(ok ? 'success' : 'fail'); } catch { setTestResult('fail'); }
              setTesting(false);
            }}>
              {testing ? <LoaderIcon size={16} /> : t('ai.test_connection')}
            </Button>
            <Button fullWidth onClick={() => { aiStore.setApiKey(aiKeyInput); haptic('medium'); addToast(t('toast.saved')); setView('main'); }}>
              {t('common.save')}
            </Button>
          </div>
          {testResult === 'success' && <div className="text-accent text-xs mt-3 text-center">{t('ai.test_success')}</div>}
          {testResult === 'fail' && <div className="text-danger text-xs mt-3 text-center">{t('ai.test_fail')}</div>}
        </Card>
      </div>
    );
  }

  // === AI SUPPLEMENT RECOMMENDATIONS ===
  if (view === 'aiSupplements') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => { setView('supplements'); setSuppRecs([]); setSuppError(''); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('supplements.ai_advice')}</h1>
        {!aiStore.isConfigured() ? (
          <Card className="py-10 text-center">
            <AlertIcon size={32} color="#FFD740" className="mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">{t('ai.no_key')}</div>
            <div className="text-text-muted text-xs">{t('ai.setup_key')}</div>
          </Card>
        ) : suppRecs.length > 0 ? (
          <div className="space-y-3">
            {suppRecs.map((rec, i) => (
              <div key={i} className={`animate-stagger-in stagger-${Math.min(i + 1, 8)}`}>
                <Card>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold">{rec.name}</div>
                    <button onClick={() => { suppStore.addSupplement({ name: rec.name, dosage: rec.dosage, schedule: ['morning'] }); haptic('light'); addToast(t('toast.supplement_added')); }} className="text-accent text-xs font-medium">{t('supplements.add_to_list')}</button>
                  </div>
                  <div className="text-text-secondary text-xs mb-1">{rec.dosage} -- {rec.timing}</div>
                  <div className="text-text-muted text-xs">{rec.reasoning}</div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <>
            {suppError && <Card className="mb-4 bg-danger/10"><div className="text-danger text-xs">{suppError}</div></Card>}
            <Card className="py-10 text-center">
              <WandIcon size={32} color="#FFD740" className="mx-auto mb-3" />
              <div className="text-sm font-medium mb-1">{t('supplements.ai_advice_subtitle')}</div>
              <div className="text-text-muted text-xs mb-4">{t('supplements.ai_advice_desc')}</div>
              <Button disabled={suppLoading} onClick={async () => {
                setSuppLoading(true); setSuppError('');
                try {
                  const current = suppStore.supplements.filter(s => s.active).map(s => `${s.name} ${s.dosage}`);
                  const recs = await getSupplementRecommendations(profile.goal, current);
                  setSuppRecs(recs);
                } catch (err) { setSuppError(err instanceof Error ? err.message : t('common.error')); }
                setSuppLoading(false);
              }}>
                {suppLoading ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> {t('ai.analyzing')}</span> : t('supplements.get_recs')}
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
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-1">{t('labs.title')}</h1>
        <p className="text-text-muted text-xs mb-4">{t('labs.subtitle')}</p>
        <div className="space-y-2 mb-4">
          {LAB_MARKERS.map(marker => (
            <div key={marker.name} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{t(marker.key)}</div>
                <div className="text-text-muted text-[10px]">{marker.unit}</div>
              </div>
              <input type="number" inputMode="decimal" placeholder="--" value={labValues[marker.name] || ''} onChange={e => setLabValues(prev => ({ ...prev, [marker.name]: e.target.value }))} className="!w-24 !py-2 !px-3 text-sm text-center" />
            </div>
          ))}
        </div>
        {!aiStore.isConfigured() ? (
          <Card className="mb-4 py-6 text-center">
            <AlertIcon size={24} color="#FFD740" className="mx-auto mb-2" />
            <div className="text-text-muted text-xs">{t('labs.configure_ai')}</div>
          </Card>
        ) : (
          <Button fullWidth disabled={labLoading || Object.values(labValues).every(v => !v)} onClick={async () => {
            setLabLoading(true); setLabError('');
            try {
              const values: LabValue[] = LAB_MARKERS.filter(m => labValues[m.name] && Number(labValues[m.name])).map(m => ({ name: m.name, value: Number(labValues[m.name]), unit: m.unit }));
              const result = await analyzeLabResults(values);
              setLabResult(result); setView('labAnalysis');
            } catch (err) { setLabError(err instanceof Error ? err.message : t('common.error')); }
            setLabLoading(false);
          }}>
            {labLoading ? <span className="flex items-center gap-2"><LoaderIcon size={16} color="#000" /> {t('labs.analyzing')}</span> : <span className="flex items-center gap-2"><SparkleIcon size={16} color="#000" /> {t('labs.analyze')}</span>}
          </Button>
        )}
        {labError && <div className="text-danger text-xs mt-2 text-center">{labError}</div>}
      </div>
    );
  }

  // === LAB ANALYSIS ===
  if (view === 'labAnalysis' && labResult) {
    const statusColors = { normal: '#00E676', low: '#FFD740', high: '#FF9800', critical: '#FF5252' };
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('labResults')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('labs.analysis_title')}</h1>
        <Card className="mb-4"><div className="text-sm leading-relaxed">{labResult.summary}</div></Card>
        {labResult.flags.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('labs.markers')}</div>
            <div className="space-y-2 mb-4">
              {labResult.flags.map((f, i) => (
                <div key={i} className={`animate-stagger-in stagger-${Math.min(i + 1, 8)}`}>
                  <Card className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statusColors[f.status] || '#9E9E9E' }} />
                    <div>
                      <div className="text-sm font-medium">{f.name} <span className="text-text-muted text-xs uppercase">({f.status})</span></div>
                      <div className="text-text-muted text-xs">{f.note}</div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}
        {labResult.recommendations.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('labs.recommendations')}</div>
            <Card>
              <ul className="space-y-2">
                {labResult.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-accent mt-0.5">-</span><span>{r}</span></li>
                ))}
              </ul>
            </Card>
          </>
        )}
        <Card className="mt-4 bg-surface-lighter">
          <div className="text-text-muted text-[10px] text-center">{t('labs.disclaimer')}</div>
        </Card>
      </div>
    );
  }

  // === EDIT PROFILE ===
  if (view === 'editProfile') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('profile.edit_profile')}</h1>
        <div className="space-y-3 mb-4">
          <input type="number" inputMode="numeric" placeholder={`${t('onboarding.age')} (${profile.age})`} value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder={`${t('onboarding.height')} (${profile.height})`} value={editData.height} onChange={(e) => setEditData({ ...editData, height: e.target.value })} />
          <input type="number" inputMode="decimal" placeholder={`${t('onboarding.weight')} (${profile.weight})`} value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} />
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
          haptic('medium'); addToast(t('toast.profile_updated'));
          setEditData({ age: '', height: '', weight: '' }); setView('main');
        }}>
          {t('profile.save_recalculate')}
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
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => { setView('supplements'); setEditingSupplement(null); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{isEdit ? t('supplements.edit') : t('supplements.add')}</h1>
        <div className="space-y-3 mb-4">
          <input placeholder={t('supplements.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder={t('supplements.dosage_placeholder')} value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
          <div>
            <div className="text-text-muted text-xs mb-2">{t('supplements.schedule')}</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SCHEDULE_LABELS) as SupplementSchedule[]).map((s) => (
                <button key={s} onClick={() => {
                  const has = form.schedule.includes(s);
                  setForm({ ...form, schedule: has ? form.schedule.filter((x) => x !== s) : [...form.schedule, s] });
                }} className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${form.schedule.includes(s) ? 'bg-accent text-black' : 'bg-surface-lighter text-text-secondary'}`}>
                  {SCHEDULE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <input placeholder={t('supplements.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button fullWidth disabled={!form.name || !form.dosage} onClick={() => {
          if (isEdit) { suppStore.updateSupplement(editingSupplement!.id, { name: form.name, dosage: form.dosage, schedule: form.schedule, notes: form.notes || undefined }); setEditingSupplement(null); }
          else { suppStore.addSupplement({ name: form.name, dosage: form.dosage, schedule: form.schedule, notes: form.notes || undefined }); setSuppForm({ name: '', dosage: '', schedule: [], notes: '' }); }
          haptic('medium'); addToast(t('toast.saved')); setView('supplements');
        }}>
          {isEdit ? t('supplements.update_supplement') : t('supplements.add_supplement')}
        </Button>
      </div>
    );
  }

  if (view === 'supplements') {
    const checklist = suppStore.getTodayChecklist();
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <ConfirmDialog
          open={!!confirmDeleteSupp}
          title={t('supplements.delete_title')}
          message={t('supplements.delete_msg')}
          danger confirmLabel={t('common.delete')}
          onConfirm={() => { suppStore.deleteSupplement(confirmDeleteSupp!); haptic('medium'); addToast(t('toast.deleted'), 'info'); setConfirmDeleteSupp(null); }}
          onCancel={() => setConfirmDeleteSupp(null)}
        />
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{t('supplements.title')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('aiSupplements')} className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center"><WandIcon size={18} color="#FFD740" /></button>
            <button onClick={() => setView('addSupplement')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"><PlusIcon size={20} color="#000" /></button>
          </div>
        </div>
        {checklist.length === 0 ? (
          <Card className="py-10 text-center">
            <PillIcon size={32} color="#616161" className="mx-auto mb-3" />
            <div className="text-text-muted text-sm">{t('supplements.no_supplements')}</div>
            <div className="text-text-muted text-xs mt-1">{t('supplements.no_supplements_desc')}</div>
          </Card>
        ) : (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('supplements.today_checklist')}</div>
            <div className="space-y-2 mb-4">
              {checklist.map((s, i) => (
                <div key={s.id} className={`animate-stagger-in stagger-${Math.min(i + 1, 8)}`}>
                  <Card className="flex items-center gap-3">
                    <button onClick={() => { suppStore.toggleTaken(s.id); haptic('light'); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${s.taken ? 'bg-accent' : 'bg-surface-lighter'}`}>
                      <CheckIcon size={14} color={s.taken ? '#000' : '#616161'} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${s.taken ? 'line-through text-text-muted' : ''}`}>{s.name}</div>
                      <div className="text-text-muted text-xs">{s.dosage} &middot; {s.schedule.map((sc) => SCHEDULE_LABELS[sc]).join(', ')}</div>
                    </div>
                    <button onClick={() => setEditingSupplement(s)} className="p-1.5"><EditIcon size={14} color="#616161" /></button>
                    <button onClick={() => setConfirmDeleteSupp(s.id)} className="p-1.5"><TrashIcon size={14} color="#FF5252" /></button>
                  </Card>
                </div>
              ))}
            </div>
            <div className="text-text-muted text-xs text-center">
              {checklist.filter((s) => s.taken).length}/{checklist.length} {t('supplements.taken_today')}
            </div>
          </>
        )}
      </div>
    );
  }

  // === CYCLES ===
  if (view === 'addCycle') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('cycles')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('cycles.add_cycle')}</h1>
        <div className="space-y-3 mb-4">
          <input placeholder={t('cycles.cycle_name')} value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} />
          <input type="date" value={cycleForm.startDate} onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })} />
          <input placeholder={t('cycles.notes')} value={cycleForm.notes} onChange={(e) => setCycleForm({ ...cycleForm, notes: e.target.value })} />
        </div>
        <Button fullWidth disabled={!cycleForm.name || !cycleForm.startDate} onClick={() => {
          cycleStore.addCycle({ name: cycleForm.name, compounds: [], startDate: cycleForm.startDate, notes: cycleForm.notes || undefined });
          haptic('medium'); addToast(t('toast.cycle_created'));
          setCycleForm({ name: '', startDate: '', notes: '' }); setView('cycles');
        }}>
          {t('cycles.create')}
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
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <ConfirmDialog
          open={confirmEndCycle}
          title={t('cycles.end_cycle_title')}
          message={t('cycles.end_cycle_msg')}
          danger confirmLabel={t('cycles.end_cycle')}
          onConfirm={() => { cycleStore.endCycle(cycle.id); haptic('heavy'); addToast(t('toast.cycle_ended'), 'info'); setConfirmEndCycle(false); }}
          onCancel={() => setConfirmEndCycle(false)}
        />
        <button onClick={() => { setSelectedCycle(null); setView('cycles'); }} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{cycle.name}</h1>
            <div className="text-text-muted text-xs mt-1">
              {t('cycles.started')} {cycle.startDate} {cycle.active && `\u00b7 ${t('cycles.week')} ${weeksElapsed + 1}`}
            </div>
          </div>
          {cycle.active && (
            <button onClick={() => setConfirmEndCycle(true)} className="px-3 py-1.5 rounded-lg bg-danger/20 text-danger text-xs font-medium">
              {t('cycles.end_cycle')}
            </button>
          )}
        </div>

        {maxWeeks > 0 && cycle.active && (
          <Card className="mb-4">
            <div className="text-xs text-text-muted mb-2">{t('cycles.progress')}: {t('cycles.week')} {Math.min(weeksElapsed + 1, maxWeeks)} / {maxWeeks}</div>
            <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full animate-progress-fill" style={{ width: `${Math.min(((weeksElapsed + 1) / maxWeeks) * 100, 100)}%` }} />
            </div>
          </Card>
        )}

        <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('cycles.compounds')}</div>
        {cycle.compounds.length === 0 ? (
          <Card className="py-6 text-center mb-4"><div className="text-text-muted text-sm">{t('cycles.no_compounds')}</div></Card>
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
          <div className="text-xs text-text-muted mb-2">{t('cycles.add_compound')}</div>
          <div className="space-y-2">
            <input placeholder={t('cycles.compound_name')} className="!py-2 !text-sm" value={compoundForm.name} onChange={(e) => setCompoundForm({ ...compoundForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={t('cycles.dosage')} className="!py-2 !text-sm" value={compoundForm.dosage} onChange={(e) => setCompoundForm({ ...compoundForm, dosage: e.target.value })} />
              <input type="number" inputMode="numeric" placeholder={t('cycles.weeks')} className="!py-2 !text-sm" value={compoundForm.durationWeeks} onChange={(e) => setCompoundForm({ ...compoundForm, durationWeeks: e.target.value })} />
            </div>
            <select value={compoundForm.frequency} onChange={(e) => setCompoundForm({ ...compoundForm, frequency: e.target.value as CycleFrequency })} className="!py-2 !text-sm">
              {(Object.keys(FREQ_LABELS) as CycleFrequency[]).map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <Button className="mt-3" fullWidth disabled={!compoundForm.name || !compoundForm.dosage || !compoundForm.durationWeeks} onClick={() => {
            cycleStore.addCompound(cycle.id, { name: compoundForm.name, dosage: compoundForm.dosage, frequency: compoundForm.frequency, durationWeeks: Number(compoundForm.durationWeeks) });
            haptic('light'); setCompoundForm({ name: '', dosage: '', frequency: 'weekly', durationWeeks: '' });
          }}>
            {t('cycles.add_compound')}
          </Button>
        </Card>

        <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('cycles.pct')}</div>
        {pctEntries.length === 0 ? (
          <Card className="py-4 text-center"><div className="text-text-muted text-xs">{t('cycles.no_pct')}</div></Card>
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
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{t('cycles.title')}</h1>
          <button onClick={() => setView('addCycle')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"><PlusIcon size={20} color="#000" /></button>
        </div>
        {active ? (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('cycles.active_cycle')}</div>
            <Card className="mb-4 border-accent/30" onClick={() => { setSelectedCycle(active); setView('cycleDetail'); }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><SyringeIcon size={18} color="#00E676" /></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{active.name}</div>
                  <div className="text-text-muted text-xs">{active.compounds.length} {t('cycles.compounds').toLowerCase()} &middot; {t('cycles.started')} {active.startDate}</div>
                </div>
                <ChevronRightIcon size={16} color="#616161" />
              </div>
            </Card>
          </>
        ) : (
          <Card className="mb-4 py-8 text-center">
            <SyringeIcon size={32} color="#616161" className="mx-auto mb-3" />
            <div className="text-text-muted text-sm">{t('cycles.no_active')}</div>
            <div className="text-text-muted text-xs mt-1">{t('cycles.no_active_desc')}</div>
          </Card>
        )}
        {history.length > 0 && (
          <>
            <div className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">{t('cycles.history')}</div>
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
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('profile.about_title')}</h1>
        <Card className="mb-4">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-accent">{t('onboarding.welcome_title')}</div>
            <div className="text-text-muted text-xs mt-1">{t('profile.about_version')}</div>
          </div>
          <div className="text-text-secondary text-sm leading-relaxed">{t('profile.about_desc')}</div>
        </Card>
        <Card><div className="text-text-muted text-xs">{t('profile.about_tech')}</div></Card>
      </div>
    );
  }

  // === MAIN PROFILE VIEW ===
  const todayChecklist = suppStore.getTodayChecklist();
  const takenCount = todayChecklist.filter((s) => s.taken).length;
  const activeCycle = cycleStore.getActiveCycle();

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <ConfirmDialog
        open={confirmReset}
        title={t('profile.reset_title')}
        message={t('profile.reset_msg')}
        danger confirmLabel={t('common.reset')}
        onConfirm={() => {
          localStorage.clear(); setOnboarded(false);
          addToast(t('toast.data_reset'), 'info');
          window.location.reload();
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('profile.subtitle')}</p>
      </div>

      <div className="animate-stagger-in stagger-1">
        <Card className="mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-surface-lighter flex items-center justify-center">
            <ProfileIcon size={28} color="#9E9E9E" />
          </div>
          <div>
            <div className="text-sm font-semibold">{profile.gender === 'male' ? t('onboarding.male') : t('onboarding.female')}, {profile.age}{t('onboarding.age').charAt(0).toLowerCase()}</div>
            <div className="text-text-muted text-xs">{profile.height}cm / {profile.weight}kg</div>
            <div className="text-accent text-xs mt-0.5">{goalLabels[profile.goal]}</div>
          </div>
        </Card>
      </div>

      <div className="animate-stagger-in stagger-2">
        <Card className="mb-4">
          <div className="text-text-muted text-xs mb-3">{t('profile.daily_targets')}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">{t('profile.calories')}</span><span className="font-medium">{profile.targetCalories} kcal</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">{t('profile.protein')}</span><span className="font-medium">{profile.macros.protein}g</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fat')}</span><span className="font-medium">{profile.macros.fat}g</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">{t('profile.carbs')}</span><span className="font-medium">{profile.macros.carbs}g</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">{t('profile.tdee')}</span><span className="font-medium">{profile.tdee} kcal</span></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="animate-stagger-in stagger-3">
          <Card onClick={() => setView('supplements')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center flex-shrink-0"><PillIcon size={18} color="#FFD740" /></div>
            <div>
              <div className="text-xs font-semibold">{t('supplements.title')}</div>
              <div className="text-text-muted text-[10px]">{takenCount}/{todayChecklist.length} {t('supplements.taken_today')}</div>
            </div>
          </Card>
        </div>
        <div className="animate-stagger-in stagger-4">
          <Card onClick={() => setView('cycles')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0"><SyringeIcon size={18} color="#FF6B6B" /></div>
            <div>
              <div className="text-xs font-semibold">{t('cycles.title')}</div>
              <div className="text-text-muted text-[10px]">{activeCycle ? t('cycles.active') : t('common.noData')}</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="animate-stagger-in stagger-5">
        <Card className="mb-4">
          {[
            { label: t('profile.ai_settings'), icon: <KeyIcon size={16} color="#00E676" />, action: () => setView('aiSettings') },
            { label: t('sync.title'), icon: <CloudIcon size={16} color="#60A5FA" />, action: () => setView('cloudSync') },
            { label: t('labs.title'), icon: <BeakerIcon size={16} color="#60A5FA" />, action: () => setView('labResults') },
            { label: t('profile.edit_profile'), icon: <EditIcon size={16} color="#9E9E9E" />, action: () => setView('editProfile') },
            { label: t('profile.supplements_vitamins'), icon: <PillIcon size={16} color="#9E9E9E" />, action: () => setView('supplements') },
            { label: t('profile.cycle_tracker'), icon: <SyringeIcon size={16} color="#9E9E9E" />, action: () => setView('cycles') },
            { label: t('profile.language'), icon: <GlobeIcon size={16} color="#9E9E9E" />, action: () => setView('language') },
            { label: t('profile.export_data'), icon: <DownloadIcon size={16} color="#9E9E9E" />, action: () => {} },
            { label: t('profile.about'), icon: <InfoIcon size={16} color="#9E9E9E" />, action: () => setView('about') },
          ].map((item) => (
            <button key={item.label} onClick={item.action} className="flex items-center justify-between w-full py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">{item.icon}<span className="text-sm">{item.label}</span></div>
              <ChevronRightIcon size={16} color="#616161" />
            </button>
          ))}
        </Card>
      </div>

      <div className="animate-stagger-in stagger-6">
        <Card className="mb-4 flex items-center gap-3">
          <SparkleIcon size={16} color={aiStore.isConfigured() ? '#00E676' : '#616161'} />
          <div className="flex-1">
            <div className="text-xs font-medium">AI: {aiStore.provider === 'openai' ? 'OpenAI' : 'Gemini'}</div>
            <div className="text-text-muted text-[10px]">{aiStore.isConfigured() ? t('ai.configured') : t('ai.not_configured')}</div>
          </div>
          <button onClick={() => setView('aiSettings')} className="text-accent text-xs font-medium">{t('ai.setup')}</button>
        </Card>
      </div>

      <div className="animate-stagger-in stagger-7">
        <Card className="mb-4 flex items-center gap-3">
          <CloudIcon size={16} color={supaStore.connectionStatus === 'connected' ? '#00E676' : '#616161'} />
          <div className="flex-1">
            <div className="text-xs font-medium">{t('sync.title')}</div>
            <div className="text-text-muted text-[10px]">
              {supaStore.connectionStatus === 'connected' ? t('sync.status_connected') : t('sync.status_disconnected')}
            </div>
          </div>
          <button onClick={() => setView('cloudSync')} className="text-accent text-xs font-medium">{t('ai.setup')}</button>
        </Card>
      </div>

      <button onClick={() => setConfirmReset(true)} className="w-full text-center text-danger text-sm py-3">
        {t('profile.reset_all')}
      </button>
    </div>
  );
}
