import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../stores/appStore';
import { useProgressStore } from '../stores/progressStore';
import { useToastStore } from '../stores/toastStore';
import { useTranslation } from '../i18n';
import { useTelegram } from '../hooks/useTelegram';
import {
  ScaleIcon, PlusIcon, TrendUpIcon, TrendDownIcon, RulerIcon,
  TrophyIcon, TrashIcon, ChevronLeftIcon, EmptyChartIcon,
} from '../icons';
import type { MeasurementEntry } from '../types';

function today() { return new Date().toISOString().slice(0, 10); }

function WeightChart({ entries, emptyLabel }: { entries: { date: string; weight: number }[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center border border-border rounded-xl">
        <EmptyChartIcon size={32} color="#616161" className="mb-2" />
        <div className="text-text-muted text-xs">{emptyLabel}</div>
      </div>
    );
  }

  const weights = entries.map((e) => e.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const range = max - min || 1;
  const w = 300, h = 130, padding = 4;

  const points = entries.map((e, i) => {
    const x = padding + (i / Math.max(entries.length - 1, 1)) * (w - padding * 2);
    const y = h - padding - ((e.weight - min) / range) * (h - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');
  const areaD = `${pathD} L${padding + ((entries.length - 1) / Math.max(entries.length - 1, 1)) * (w - padding * 2)},${h - padding} L${padding},${h - padding} Z`;

  return (
    <div className="border border-border rounded-xl p-3 overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-progress-fill" />
        {entries.map((e, i) => {
          const x = padding + (i / Math.max(entries.length - 1, 1)) * (w - padding * 2);
          const y = h - padding - ((e.weight - min) / range) * (h - padding * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill="#00E676" />;
        })}
      </svg>
      <div className="flex justify-between text-text-muted text-[9px] mt-1 px-1">
        <span>{entries[0]?.date.slice(5)}</span>
        <span>{entries[entries.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

type View = 'main' | 'addWeight' | 'measurements' | 'addMeasurement';

export function Progress() {
  const { t } = useTranslation();
  const { haptic } = useTelegram();
  const profile = useAppStore((s) => s.profile);
  const { weightEntries, measurements, addWeight, deleteWeight, addMeasurement, deleteMeasurement, getLast30DaysWeights, getLatestWeight, getWeightTrend } = useProgressStore();
  const addToast = useToastStore((s) => s.addToast);
  const [view, setView] = useState<View>('main');
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(today());
  const [mForm, setMForm] = useState<Partial<MeasurementEntry>>({});

  if (!profile) return null;

  const latest = getLatestWeight() ?? profile.weight;
  const trend = getWeightTrend();
  const bmi = latest / ((profile.height / 100) ** 2);
  const last30 = getLast30DaysWeights();

  const measurementFields = [
    { key: 'chest' as const, label: t('progress.chest') },
    { key: 'waist' as const, label: t('progress.waist') },
    { key: 'hips' as const, label: t('progress.hips') },
    { key: 'leftArm' as const, label: t('progress.left_arm') },
    { key: 'rightArm' as const, label: t('progress.right_arm') },
    { key: 'leftThigh' as const, label: t('progress.left_thigh') },
    { key: 'rightThigh' as const, label: t('progress.right_thigh') },
  ];

  if (view === 'addWeight') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('progress.log_weight')}</h1>
        <div className="space-y-3 mb-4">
          <input type="number" inputMode="decimal" placeholder={t('progress.weight_kg')} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
          <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        </div>
        <Button fullWidth disabled={!weightInput} onClick={() => {
          addWeight(Number(weightInput), dateInput);
          haptic('medium'); addToast(t('toast.weight_logged'));
          setWeightInput(''); setView('main');
        }}>
          {t('progress.save_entry')}
        </Button>
      </div>
    );
  }

  if (view === 'addMeasurement') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('measurements')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <h1 className="text-xl font-bold mb-4">{t('progress.add_measurements')}</h1>
        <div className="space-y-3 mb-4">
          {measurementFields.map(({ key, label }) => (
            <input
              key={key}
              type="number" inputMode="decimal"
              placeholder={`${label} (cm)`}
              value={(mForm as Record<string, number | undefined>)[key] || ''}
              onChange={(e) => setMForm({ ...mForm, [key]: Number(e.target.value) || undefined })}
            />
          ))}
          <input type="date" value={mForm.date || today()} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} />
        </div>
        <Button fullWidth onClick={() => {
          addMeasurement({ ...mForm, date: mForm.date || today() } as Omit<MeasurementEntry, 'id' | 'createdAt'>);
          haptic('medium'); addToast(t('toast.measurements_saved'));
          setMForm({}); setView('measurements');
        }}>
          {t('progress.save_measurements')}
        </Button>
      </div>
    );
  }

  if (view === 'measurements') {
    return (
      <div className="px-5 pt-6 pb-24 animate-slide-left">
        <button onClick={() => setView('main')} className="flex items-center gap-1 text-text-muted text-sm mb-4">
          <ChevronLeftIcon size={16} /> {t('common.back')}
        </button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{t('progress.measurements_title')}</h1>
          <button onClick={() => setView('addMeasurement')} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <PlusIcon size={20} color="#000" />
          </button>
        </div>
        {measurements.length === 0 ? (
          <Card className="py-10 text-center">
            <RulerIcon size={32} color="#616161" className="mx-auto mb-3" />
            <div className="text-text-muted text-sm">{t('progress.no_measurements')}</div>
          </Card>
        ) : (
          measurements.slice().reverse().map((m, i) => (
            <div key={m.id} className={`animate-stagger-in stagger-${Math.min(i + 1, 8)}`}>
              <Card className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">{m.date}</span>
                  <button onClick={() => { deleteMeasurement(m.id); haptic('light'); }} className="p-1"><TrashIcon size={14} color="#FF5252" /></button>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {m.chest && <div className="text-text-secondary">{t('progress.chest')}: <span className="text-text-primary font-medium">{m.chest}cm</span></div>}
                  {m.waist && <div className="text-text-secondary">{t('progress.waist')}: <span className="text-text-primary font-medium">{m.waist}cm</span></div>}
                  {m.hips && <div className="text-text-secondary">{t('progress.hips')}: <span className="text-text-primary font-medium">{m.hips}cm</span></div>}
                  {m.leftArm && <div className="text-text-secondary">{t('progress.left_arm')}: <span className="text-text-primary font-medium">{m.leftArm}cm</span></div>}
                  {m.rightArm && <div className="text-text-secondary">{t('progress.right_arm')}: <span className="text-text-primary font-medium">{m.rightArm}cm</span></div>}
                  {m.leftThigh && <div className="text-text-secondary">{t('progress.left_thigh')}: <span className="text-text-primary font-medium">{m.leftThigh}cm</span></div>}
                  {m.rightThigh && <div className="text-text-secondary">{t('progress.right_thigh')}: <span className="text-text-primary font-medium">{m.rightThigh}cm</span></div>}
                </div>
              </Card>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-24 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t('progress.title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('progress.subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { value: latest.toFixed(1), label: t('progress.current_kg'), color: 'text-accent' },
          { value: bmi.toFixed(1), label: t('progress.bmi'), color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={s.label} className={`animate-stagger-in stagger-${i + 1}`}>
            <Card className="text-center">
              <div className={`${s.color} text-lg font-bold animate-count-up`}>{s.value}</div>
              <div className="text-text-muted text-[10px]">{s.label}</div>
            </Card>
          </div>
        ))}
        <div className="animate-stagger-in stagger-3">
          <Card className="text-center">
            <div className="flex items-center justify-center gap-1">
              {trend !== null ? (
                <>
                  {trend > 0 ? <TrendUpIcon size={14} color="#FF5252" /> : <TrendDownIcon size={14} color="#00E676" />}
                  <span className={`text-lg font-bold ${trend > 0 ? 'text-danger' : 'text-accent'}`}>{Math.abs(trend).toFixed(1)}</span>
                </>
              ) : (
                <span className="text-text-muted text-lg">--</span>
              )}
            </div>
            <div className="text-text-muted text-[10px]">{t('progress.trend_kg')}</div>
          </Card>
        </div>
      </div>

      <div className="animate-stagger-in stagger-4">
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center">
                <ScaleIcon size={18} color="#C084FC" />
              </div>
              <div className="text-sm font-semibold">{t('progress.weight_30')}</div>
            </div>
            <button onClick={() => setView('addWeight')} className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <PlusIcon size={16} color="#00E676" />
            </button>
          </div>
          <WeightChart entries={last30} emptyLabel={t('progress.no_chart')} />
        </Card>
      </div>

      {weightEntries.length > 0 && (
        <div className="animate-stagger-in stagger-5">
          <Card className="mb-4">
            <div className="text-text-muted text-xs mb-2">{t('progress.recent_entries')}</div>
            <div className="divide-y divide-border">
              {weightEntries.slice(-5).reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2">
                  <span className="text-text-secondary text-xs">{e.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{e.weight} kg</span>
                    <button onClick={() => { deleteWeight(e.id); haptic('light'); }} className="p-1"><TrashIcon size={12} color="#FF5252" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="animate-stagger-in stagger-6">
          <Card onClick={() => setView('measurements')} className="flex flex-col items-center py-4">
            <RulerIcon size={22} color="#FFD740" className="mb-2" />
            <div className="text-xs font-semibold">{t('progress.measurements')}</div>
            <div className="text-text-muted text-[10px]">{measurements.length} {t('progress.entries')}</div>
          </Card>
        </div>
        <div className="animate-stagger-in stagger-7">
          <Card onClick={() => useAppStore.getState().setActiveTab('achievements')} className="flex flex-col items-center py-4">
            <TrophyIcon size={22} color="#FFD700" className="mb-2" />
            <div className="text-xs font-semibold">{t('achievements.title')}</div>
            <div className="text-text-muted text-[10px]">{t('achievements.unlocked')}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
