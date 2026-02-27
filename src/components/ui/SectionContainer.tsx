import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface SectionContainerProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionContainer({
  title,
  description,
  action,
  children,
  className,
  noPadding = false
}: SectionContainerProps) {
  return (
    <div className={cn('mb-6', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(
        'bg-white border border-slate-200 rounded-lg',
        !noPadding && 'p-5'
      )}>
        {children}
      </div>
    </div>
  );
}
