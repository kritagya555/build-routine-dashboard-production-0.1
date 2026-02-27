import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { SectionContainer } from '@/components/ui/SectionContainer';
import { ProgressRow } from '@/components/ui/ProgressRow';
import { calculateBMI, calculateWeeklyMacroAverage, getStartOfWeek, getDailyNutritionData } from '@/utils/nutritionCalculations';
import type { GoalType, Gender, ActivityLevel } from '@/types';
import { Scale, Ruler, User, Activity, TrendingUp, TrendingDown, Minus, Save, Check, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

// Activity level multipliers for TDEE calculation
const activityMultipliers: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9
};

// Goal calorie adjustments
const goalAdjustments: Record<GoalType, number> = {
  BULK: 300,
  MAINTAIN: 0,
  CUT: -300
};

export const NutritionGoals: React.FC = () => {
  const { nutritionGoal, calculateAndSetNutritionGoal, dietLogs, weeklyGoals } = useStore();
  
  const [formData, setFormData] = useState({
    heightCm: nutritionGoal?.heightCm || 170,
    weightKg: nutritionGoal?.weightKg || 70,
    age: nutritionGoal?.age || 25,
    gender: nutritionGoal?.gender || 'MALE' as Gender,
    activityLevel: nutritionGoal?.activityLevel || 'MODERATELY_ACTIVE' as ActivityLevel,
    goalType: nutritionGoal?.goalType || 'MAINTAIN' as GoalType
  });
  
  const [saved, setSaved] = useState(false);
  
  // Real-time BMI calculation
  const bmi = calculateBMI(formData.weightKg, formData.heightCm);
  
  // Real-time macro auto-calculation
  const preview = useMemo(() => {
    const { heightCm, weightKg, age, gender, activityLevel, goalType } = formData;
    
    // Step 1: BMR (Mifflin-St Jeor)
    let bmr: number;
    if (gender === 'MALE') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    
    // Step 2: Maintenance Calories (TDEE)
    const maintenance = bmr * activityMultipliers[activityLevel];
    
    // Step 3: Goal Adjustment (Bulk +300, Cut -300, Maintain 0)
    const targetCalories = Math.round(maintenance + goalAdjustments[goalType]);
    
    // Step 4: Macro Split (Vegetarian Weight Gain Friendly)
    // Protein: 1.8g × bodyweight
    const targetProtein = Math.round(1.8 * weightKg);
    // Fats: 25% of total calories (9 cal per gram)
    const targetFats = Math.round((targetCalories * 0.25) / 9);
    // Remaining = Carbs (4 cal per gram)
    const proteinCal = targetProtein * 4;
    const fatCal = targetFats * 9;
    const targetCarbs = Math.round((targetCalories - proteinCal - fatCal) / 4);
    
    return { bmr: Math.round(bmr), maintenance: Math.round(maintenance), targetCalories, targetProtein, targetCarbs, targetFats };
  }, [formData]);
  
  // Weekly average data
  const weeklyAverage = useMemo(() => {
    return calculateWeeklyMacroAverage(dietLogs, getStartOfWeek());
  }, [dietLogs]);

  // Weekly trend data for charts
  const weeklyTrendData = useMemo(() => {
    return getDailyNutritionData(dietLogs, 7);
  }, [dietLogs]);

  // Active targets (from saved goal or weekly defaults)
  const activeTargets = nutritionGoal || {
    targetCalories: weeklyGoals.calorieTarget,
    targetProtein: weeklyGoals.proteinTarget,
    targetCarbs: weeklyGoals.carbsTarget,
    targetFats: weeklyGoals.fatsTarget,
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateAndSetNutritionGoal(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const activityLabels: Record<ActivityLevel, string> = {
    SEDENTARY: 'Sedentary (office job)',
    LIGHTLY_ACTIVE: 'Light (1-3 days/week)',
    MODERATELY_ACTIVE: 'Moderate (3-5 days/week)',
    VERY_ACTIVE: 'Active (6-7 days/week)',
    EXTRA_ACTIVE: 'Extra Active (physical job)'
  };

  // Check if current intake aligns with goal
  const goalAlignment = useMemo(() => {
    if (!nutritionGoal || weeklyAverage.daysLogged === 0) return null;
    
    const caloriesDiff = weeklyAverage.calories - nutritionGoal.targetCalories;
    const proteinPct = Math.round((weeklyAverage.protein / nutritionGoal.targetProtein) * 100);
    
    let status: 'on-track' | 'over' | 'under';
    let message: string;
    
    if (nutritionGoal.goalType === 'BULK') {
      if (caloriesDiff >= -100) {
        status = 'on-track';
        message = 'Calorie surplus on track for bulking';
      } else {
        status = 'under';
        message = `Eating ${Math.abs(Math.round(caloriesDiff))} kcal below bulk target`;
      }
    } else if (nutritionGoal.goalType === 'CUT') {
      if (caloriesDiff <= 100) {
        status = 'on-track';
        message = 'Calorie deficit on track for cutting';
      } else {
        status = 'over';
        message = `Eating ${Math.round(caloriesDiff)} kcal above cut target`;
      }
    } else {
      if (Math.abs(caloriesDiff) <= 150) {
        status = 'on-track';
        message = 'Maintenance calories on track';
      } else if (caloriesDiff > 0) {
        status = 'over';
        message = `${Math.round(caloriesDiff)} kcal above maintenance`;
      } else {
        status = 'under';
        message = `${Math.abs(Math.round(caloriesDiff))} kcal below maintenance`;
      }
    }
    
    return { status, message, proteinPct };
  }, [nutritionGoal, weeklyAverage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nutrition Goals</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-calculate macros based on your body and goal</p>
      </div>
      
      {/* Goal Alignment Alert */}
      {goalAlignment && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${
          goalAlignment.status === 'on-track' ? 'border-green-200 bg-green-50' :
          goalAlignment.status === 'over' ? 'border-amber-200 bg-amber-50' :
          'border-red-200 bg-red-50'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            goalAlignment.status === 'on-track' ? 'text-green-600' :
            goalAlignment.status === 'over' ? 'text-amber-600' :
            'text-red-600'
          }`} />
          <div>
            <p className={`text-sm font-medium ${
              goalAlignment.status === 'on-track' ? 'text-green-800' :
              goalAlignment.status === 'over' ? 'text-amber-800' :
              'text-red-800'
            }`}>
              {goalAlignment.message}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Protein: {goalAlignment.proteinPct}% of target · Based on {weeklyAverage.daysLogged} days this week
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <SectionContainer title="Your Profile">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Ruler className="w-4 h-4 inline mr-1 text-slate-400" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  min={100}
                  max={250}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Scale className="w-4 h-4 inline mr-1 text-slate-400" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  min={30}
                  max={200}
                />
              </div>
            </div>
            
            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <User className="w-4 h-4 inline mr-1 text-slate-400" />
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  min={15}
                  max={80}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
            
            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Activity className="w-4 h-4 inline mr-1 text-slate-400" />
                Activity Level
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
              >
                {Object.entries(activityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            {/* Goal Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Goal</label>
              <div className="grid grid-cols-3 gap-3">
                {(['BULK', 'MAINTAIN', 'CUT'] as GoalType[]).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setFormData({ ...formData, goalType: goal })}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                      formData.goalType === goal
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {goal === 'BULK' && <TrendingUp className="w-5 h-5 text-green-500 mb-1" />}
                    {goal === 'MAINTAIN' && <Minus className="w-5 h-5 text-blue-500 mb-1" />}
                    {goal === 'CUT' && <TrendingDown className="w-5 h-5 text-orange-500 mb-1" />}
                    <span className="text-sm font-medium capitalize">{goal.toLowerCase()}</span>
                    <span className="text-xs text-slate-500">
                      {goal === 'BULK' ? '+300' : goal === 'CUT' ? '-300' : '±0'} kcal
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live calculation preview */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Auto-Calculated Targets</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">BMR</p>
                  <p className="text-lg font-semibold text-slate-900">{preview.bmr} <span className="text-xs font-normal text-slate-500">kcal</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Maintenance</p>
                  <p className="text-lg font-semibold text-slate-900">{preview.maintenance} <span className="text-xs font-normal text-slate-500">kcal</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Target Calories</p>
                  <p className="text-lg font-bold text-slate-900">{preview.targetCalories} <span className="text-xs font-normal text-slate-500">kcal</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Goal Adjustment</p>
                  <p className={`text-lg font-semibold ${
                    formData.goalType === 'BULK' ? 'text-green-600' :
                    formData.goalType === 'CUT' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {goalAdjustments[formData.goalType] >= 0 ? '+' : ''}{goalAdjustments[formData.goalType]} <span className="text-xs font-normal text-slate-500">kcal</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Protein</p>
                  <p className="text-base font-semibold text-red-600">{preview.targetProtein}g</p>
                  <p className="text-xs text-slate-400">1.8g × {formData.weightKg}kg</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Carbs</p>
                  <p className="text-base font-semibold text-green-600">{preview.targetCarbs}g</p>
                  <p className="text-xs text-slate-400">remaining cal</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fats</p>
                  <p className="text-base font-semibold text-amber-600">{preview.targetFats}g</p>
                  <p className="text-xs text-slate-400">25% of cal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Save className="w-4 h-4" />
                Calculate & Save
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Saved & applied
                </span>
              )}
            </div>
          </form>
        </SectionContainer>
        
        {/* Results */}
        <div className="space-y-6">
          {/* BMI */}
          <SectionContainer title="BMI Calculator">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold ${bmi.color}`}>{bmi.value}</div>
                <div className={`text-lg ${bmi.color}`}>{bmi.category}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.weightKg}kg / ({formData.heightCm / 100}m)² = {bmi.value}
                </p>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={bmi.category === 'Normal' ? '#22c55e' : bmi.category === 'Underweight' ? '#eab308' : '#f97316'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min((bmi.value / 40) * 251, 251)} 251`}
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
              <div className={`p-1.5 rounded border ${bmi.category === 'Underweight' ? 'bg-amber-100 border-amber-300 font-bold' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>&lt;18.5</div>
              <div className={`p-1.5 rounded border ${bmi.category === 'Normal' ? 'bg-green-100 border-green-300 font-bold' : 'bg-green-50 text-green-700 border-green-100'}`}>18.5-24.9</div>
              <div className={`p-1.5 rounded border ${bmi.category === 'Overweight' ? 'bg-orange-100 border-orange-300 font-bold' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>25-29.9</div>
              <div className={`p-1.5 rounded border ${bmi.category === 'Obese' ? 'bg-red-100 border-red-300 font-bold' : 'bg-red-50 text-red-700 border-red-100'}`}>&gt;30</div>
            </div>
          </SectionContainer>
          
          {/* Weekly Average vs Target */}
          {weeklyAverage.daysLogged > 0 && (
            <SectionContainer title="Weekly Average vs Target">
              <div className="space-y-3">
                <ProgressRow
                  label="Calories"
                  current={weeklyAverage.calories}
                  target={activeTargets.targetCalories}
                  unit=" kcal"
                  color="slate"
                />
                <ProgressRow
                  label="Protein"
                  current={weeklyAverage.protein}
                  target={activeTargets.targetProtein}
                  unit="g"
                  color="red"
                />
                <ProgressRow
                  label="Carbs"
                  current={weeklyAverage.carbs}
                  target={activeTargets.targetCarbs}
                  unit="g"
                  color="green"
                />
                <ProgressRow
                  label="Fats"
                  current={weeklyAverage.fats}
                  target={activeTargets.targetFats}
                  unit="g"
                  color="amber"
                />
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                Based on {weeklyAverage.daysLogged} days of data this week
              </p>
            </SectionContainer>
          )}
        </div>
      </div>
      
      {/* Weekly Trends */}
      {weeklyTrendData.some(d => d.calories > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calorie Trend */}
          <SectionContainer title="7-Day Calorie Trend">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="calories" fill="#475569" radius={[4, 4, 0, 0]} name="Calories" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {nutritionGoal && (
              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Target: {nutritionGoal.targetCalories} kcal/day ({nutritionGoal.goalType.toLowerCase()})
              </p>
            )}
          </SectionContainer>

          {/* Protein Trend */}
          <SectionContainer title="7-Day Protein Trend">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Protein (g)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {nutritionGoal && (
              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Target: {nutritionGoal.targetProtein}g/day (1.8g × {nutritionGoal.weightKg}kg)
              </p>
            )}
          </SectionContainer>
        </div>
      )}
      
      {/* Active Goals Summary */}
      {nutritionGoal && (
        <SectionContainer title="Active Goals">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{nutritionGoal.targetCalories}</div>
              <div className="text-xs text-slate-500">Daily Calories</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{nutritionGoal.targetProtein}g</div>
              <div className="text-xs text-slate-500">Protein</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{nutritionGoal.targetCarbs}g</div>
              <div className="text-xs text-slate-500">Carbs</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{nutritionGoal.targetFats}g</div>
              <div className="text-xs text-slate-500">Fats</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              nutritionGoal.goalType === 'BULK' ? 'bg-green-50' :
              nutritionGoal.goalType === 'CUT' ? 'bg-orange-50' : 'bg-blue-50'
            }`}>
              <div className={`text-2xl font-bold capitalize ${
                nutritionGoal.goalType === 'BULK' ? 'text-green-600' :
                nutritionGoal.goalType === 'CUT' ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {nutritionGoal.goalType.toLowerCase()}
              </div>
              <div className="text-xs text-slate-500">Goal</div>
            </div>
          </div>
        </SectionContainer>
      )}
    </div>
  );
};
