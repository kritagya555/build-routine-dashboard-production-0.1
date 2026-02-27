import { cn } from '@/utils/cn'
import React from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    positive?: boolean
  }
  icon?: React.ElementType
  className?: string
}

export function KpiCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  className
}: KpiCardProps) {
 return (
  <div
    className={cn(
      'bg-white border border-slate-200 rounded-lg p-5 transition-all duration-150 hover:border-slate-300',
      className
    )}
  >
    {/* Top Row */}
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      {Icon && (
        <div className="h-8 w-8 flex items-center justify-center bg-slate-100 rounded-md">
          <Icon className="w-4 h-4 text-slate-600" />
        </div>
      )}
    </div>

    {/* Value */}
    <p className="text-3xl font-semibold text-slate-900 tabular-nums leading-none">
      {value}
    </p>

    {subtitle && (
      <p className="text-sm text-slate-500 mt-2">
        {subtitle}
      </p>
    )}

    {trend && (
      <p
        className={cn(
          'text-xs font-medium mt-3',
          trend.positive ? 'text-green-600' : 'text-slate-500'
        )}
      >
        {trend.positive && '↑ '}
        {trend.value}
      </p>
    )}
  </div>
)
}