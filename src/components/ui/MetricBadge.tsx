import { cn } from '@/utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface MetricBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-500',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
};

export function MetricBadge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className
}: MetricBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
