import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'indigo' | 'green' | 'orange' | 'red' | 'blue';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  color = 'indigo',
  className
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const colorClasses = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
