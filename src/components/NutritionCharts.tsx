import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { ProgressRow } from '@/components/ui/ProgressRow';
import { calculateBMI, getDailyNutritionData, calculateWeeklyMacroAverage, getStartOfWeek, calculateProgress } from '@/utils/nutritionCalculations';
import { TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react';

const COLORS = {
  calories: '#475569',
  protein: '#ef4444',
  carbs: '#22c55e',
  fats: '#f59e0b'
};

export const NutritionCharts: React.FC = () => {
  const { dietLogs, nutritionGoal, weeklyGoals } = useStore();
  
  const dailyData = getDailyNutritionData(dietLogs, 7);
  const weeklyAverage = calculateWeeklyMacroAverage(dietLogs, getStartOfWeek());
  
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = dietLogs.filter(log => log.date.startsWith(today));
  const todayTotals = todayLogs.reduce((acc, log) => ({
    calories: acc.calories + log.totalCalories,
    protein: acc.protein + log.totalProtein,
    carbs: acc.carbs + log.totalCarbs,
    fats: acc.fats + log.totalFats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  
  const targets = useMemo(() => nutritionGoal || {
    targetCalories: weeklyGoals.calorieTarget,
    targetProtein: weeklyGoals.proteinTarget,
    targetCarbs: weeklyGoals.carbsTarget,
    targetFats: weeklyGoals.fatsTarget,
  }, [nutritionGoal, weeklyGoals]);

  // BMI
  const bmi = useMemo(() => {
    if (nutritionGoal?.heightCm && nutritionGoal?.weightKg) {
      return calculateBMI(nutritionGoal.weightKg, nutritionGoal.heightCm);
    }
    return null;
  }, [nutritionGoal]);

  // Weekly calorie trend analysis
  const calorieTrend = useMemo(() => {
    const daysWithData = dailyData.filter(d => d.calories > 0);
    if (daysWithData.length < 2) return null;
    
    const firstHalf = daysWithData.slice(0, Math.ceil(daysWithData.length / 2));
    const secondHalf = daysWithData.slice(Math.ceil(daysWithData.length / 2));
    
    const firstAvg = firstHalf.reduce((s, d) => s + d.calories, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + d.calories, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    return {
      direction: diff > 50 ? 'up' : diff < -50 ? 'down' : 'stable',
      value: Math.abs(Math.round(diff))
    };
  }, [dailyData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Nutrition Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Track your macro trends and progress</p>
        </div>
        {nutritionGoal && (
          <div className="flex items-center gap-2">
            {nutritionGoal.goalType === 'BULK' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {nutritionGoal.goalType === 'CUT' && <TrendingDown className="w-4 h-4 text-orange-600" />}
            {nutritionGoal.goalType === 'MAINTAIN' && <Minus className="w-4 h-4 text-blue-600" />}
            <span className="text-sm text-slate-600 capitalize">{nutritionGoal.goalType.toLowerCase()} · {targets.targetCalories} kcal</span>
          </div>
        )}
      </div>
      
      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Calories</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              todayTotals.calories >= targets.targetCalories ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {calculateProgress(todayTotals.calories, targets.targetCalories)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{Math.round(todayTotals.calories)}</div>
          <div className="text-xs text-slate-500">/ {targets.targetCalories} kcal</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-600 rounded-full" style={{ width: `${Math.min(calculateProgress(todayTotals.calories, targets.targetCalories), 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Protein</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              todayTotals.protein >= targets.targetProtein ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {calculateProgress(todayTotals.protein, targets.targetProtein)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-red-500">{Math.round(todayTotals.protein)}g</div>
          <div className="text-xs text-slate-500">/ {targets.targetProtein}g</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(calculateProgress(todayTotals.protein, targets.targetProtein), 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Carbs</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              todayTotals.carbs >= targets.targetCarbs ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {calculateProgress(todayTotals.carbs, targets.targetCarbs)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-green-500">{Math.round(todayTotals.carbs)}g</div>
          <div className="text-xs text-slate-500">/ {targets.targetCarbs}g</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(calculateProgress(todayTotals.carbs, targets.targetCarbs), 100)}%` }} />
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Fats</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              todayTotals.fats >= targets.targetFats ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {calculateProgress(todayTotals.fats, targets.targetFats)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-500">{Math.round(todayTotals.fats)}g</div>
          <div className="text-xs text-slate-500">/ {targets.targetFats}g</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(calculateProgress(todayTotals.fats, targets.targetFats), 100)}%` }} />
          </div>
        </div>
      </div>

      {/* BMI + Goal Summary Row */}
      {(bmi || calorieTrend) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bmi && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">BMI</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${bmi.color}`}>{bmi.value}</span>
                <span className={`text-sm ${bmi.color}`}>{bmi.category}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{nutritionGoal?.weightKg}kg · {nutritionGoal?.heightCm}cm</p>
            </div>
          )}
          
          {calorieTrend && (
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {calorieTrend.direction === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {calorieTrend.direction === 'down' && <TrendingDown className="w-4 h-4 text-orange-500" />}
                {calorieTrend.direction === 'stable' && <Minus className="w-4 h-4 text-blue-500" />}
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Calorie Trend</span>
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {calorieTrend.direction === 'up' ? '↑' : calorieTrend.direction === 'down' ? '↓' : '→'} {calorieTrend.value} kcal
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {calorieTrend.direction === 'up' ? 'Increasing' : calorieTrend.direction === 'down' ? 'Decreasing' : 'Stable'} over 7 days
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Weekly Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-slate-900">{weeklyAverage.calories}</p>
                <p className="text-xs text-slate-500">avg kcal/day</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-600">{weeklyAverage.protein}g</p>
                <p className="text-xs text-slate-500">avg protein/day</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{weeklyAverage.daysLogged} days logged</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Trend with Target Line */}
        <SectionContainer title="7-Day Calorie Trend">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.calories} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS.calories} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <ReferenceLine y={targets.targetCalories} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
                <Area type="monotone" dataKey="calories" stroke={COLORS.calories} strokeWidth={2} fillOpacity={1} fill="url(#colorCalories)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionContainer>
        
        {/* Protein Intake with Target Line */}
        <SectionContainer title="7-Day Protein Intake">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <ReferenceLine y={targets.targetProtein} stroke="#fca5a5" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#fca5a5' }} />
                <Bar dataKey="protein" fill={COLORS.protein} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionContainer>
      </div>
      
      {/* Weekly Average vs Target */}
      <SectionContainer title="Weekly Average vs Target">
        <div className="space-y-4">
          <ProgressRow label="Calories" current={weeklyAverage.calories} target={targets.targetCalories} unit=" kcal" color="slate" />
          <ProgressRow label="Protein" current={weeklyAverage.protein} target={targets.targetProtein} unit="g" color="red" />
          <ProgressRow label="Carbs" current={weeklyAverage.carbs} target={targets.targetCarbs} unit="g" color="green" />
          <ProgressRow label="Fats" current={weeklyAverage.fats} target={targets.targetFats} unit="g" color="amber" />
        </div>
        <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
          Based on {weeklyAverage.daysLogged} days of data this week
          {nutritionGoal && ` · Goal: ${nutritionGoal.goalType.toLowerCase()} (${nutritionGoal.targetCalories} kcal/day)`}
        </p>
      </SectionContainer>
      
      {/* Macro Trends */}
      <SectionContainer title="Weekly Macro Trends">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="protein" stroke={COLORS.protein} strokeWidth={2} dot={{ fill: COLORS.protein, r: 3 }} name="Protein (g)" />
              <Line type="monotone" dataKey="carbs" stroke={COLORS.carbs} strokeWidth={2} dot={{ fill: COLORS.carbs, r: 3 }} name="Carbs (g)" />
              <Line type="monotone" dataKey="fats" stroke={COLORS.fats} strokeWidth={2} dot={{ fill: COLORS.fats, r: 3 }} name="Fats (g)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Protein
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Carbs
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Fats
          </span>
        </div>
      </SectionContainer>
    </div>
  );
};
