import { cn } from '@/utils/cn';

interface ProgressRowProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'indigo';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressRow({
  label,
  current,
  target,
  unit = '',
  color = 'slate',
  showPercentage = true,
  className
}: ProgressRowProps) {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  
  const colorClasses = {
    slate: 'bg-slate-600',
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-600">
          {current}{unit} / {target}{unit}
          {showPercentage && (
            <span className="text-slate-400 ml-2">({percentage}%)</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
