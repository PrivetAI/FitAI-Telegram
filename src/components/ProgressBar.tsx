interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i <= current ? 'bg-accent' : 'bg-surface-lighter'
          }`}
        />
      ))}
    </div>
  );
}
