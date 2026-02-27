import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';
import { calculateBMI, calculateWeeklyMacroAverage, getStartOfWeek } from '@/utils/nutritionCalculations';
import { ChevronRight, Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function Dashboard() {
  const { studyTasks, dietLogs, workoutLogs, generalTasks, weeklyGoals, nutritionGoal } = useStore();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Calculate weekly study hours
  const weekStudyMinutes = studyTasks
    .filter(t => {
      const date = parseISO(t.updatedAt);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    })
    .reduce((acc, t) => acc + t.studyTime, 0);
  const weekStudyHours = Math.floor(weekStudyMinutes / 60);

  // Calculate today's nutrition
  const todayLogs = dietLogs.filter(l => l.date === todayStr);
  const todayCalories = todayLogs.reduce((acc, l) => acc + l.totalCalories, 0);
  const todayProtein = todayLogs.reduce((acc, l) => acc + l.totalProtein, 0);
  const todayCarbs = todayLogs.reduce((acc, l) => acc + l.totalCarbs, 0);
  const todayFats = todayLogs.reduce((acc, l) => acc + l.totalFats, 0);

  // Calculate workout sessions this week
  const weekWorkoutSessions = workoutLogs.filter(l => {
    const date = parseISO(l.date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd }) && l.completed;
  }).length;

  // Calculate tasks completed this week
  const weekCompletedTasks = generalTasks.filter(t => {
    const date = parseISO(t.updatedAt);
    return t.status === 'COMPLETED' && isWithinInterval(date, { start: weekStart, end: weekEnd });
  }).length;

  // Get pending tasks (max 5)
  const pendingTasks = generalTasks
    .filter(t => t.status === 'PENDING')
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);

  // Targets from nutrition goal (auto-calculated) or manual weekly goals
  const targets = useMemo(() => ({
    calories: nutritionGoal?.targetCalories || weeklyGoals.calorieTarget,
    protein: nutritionGoal?.targetProtein || weeklyGoals.proteinTarget,
    carbs: nutritionGoal?.targetCarbs || weeklyGoals.carbsTarget,
    fats: nutritionGoal?.targetFats || weeklyGoals.fatsTarget,
  }), [nutritionGoal, weeklyGoals]);

  // BMI calculation (only if nutrition goal has height/weight)
  const bmi = useMemo(() => {
    if (nutritionGoal?.heightCm && nutritionGoal?.weightKg) {
      return calculateBMI(nutritionGoal.weightKg, nutritionGoal.heightCm);
    }
    return null;
  }, [nutritionGoal]);

  // Weekly macro average
  const weeklyAvg = useMemo(() => {
    return calculateWeeklyMacroAverage(dietLogs, getStartOfWeek());
  }, [dietLogs]);

  // Weekly activity data for chart
  const weeklyActivityData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayStudyMinutes = studyTasks
      .filter(t => t.updatedAt.startsWith(dateStr))
      .reduce((acc, t) => acc + t.studyTime, 0);
    
    const dayCalories = dietLogs
      .filter(l => l.date === dateStr)
      .reduce((acc, l) => acc + l.totalCalories, 0);
    
    const dayProtein = dietLogs
      .filter(l => l.date === dateStr)
      .reduce((acc, l) => acc + l.totalProtein, 0);

    return {
      day: format(date, 'EEE'),
      study: Math.round(dayStudyMinutes / 60 * 10) / 10,
      calories: Math.round(dayCalories),
      protein: Math.round(dayProtein),
    };
  });

  // Progress calculation
  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Status indicator
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Protein suggestions
  const proteinPercentage = calculateProgress(todayProtein, targets.protein);
  const showProteinSuggestion = proteinPercentage < 80 && todayLogs.length > 0;

  // Goal type label
  const goalLabel = nutritionGoal?.goalType
    ? nutritionGoal.goalType === 'BULK' ? 'Bulking' : nutritionGoal.goalType === 'CUT' ? 'Cutting' : 'Maintaining'
    : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {goalLabel && (
          <div className="flex items-center gap-2">
            {nutritionGoal?.goalType === 'BULK' && <TrendingUp className="w-4 h-4 text-green-600" />}
            {nutritionGoal?.goalType === 'CUT' && <TrendingDown className="w-4 h-4 text-orange-600" />}
            {nutritionGoal?.goalType === 'MAINTAIN' && <Minus className="w-4 h-4 text-blue-600" />}
            <span className={cn(
              'text-sm font-medium px-3 py-1 rounded-lg border',
              nutritionGoal?.goalType === 'BULK' ? 'bg-green-50 text-green-700 border-green-200' :
              nutritionGoal?.goalType === 'CUT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            )}>
              {goalLabel} · {targets.calories} kcal/day
            </span>
          </div>
        )}
      </div>

      {/* Layer 1: KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Study Hours */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Study Hours</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{weekStudyHours}h</p>
              <p className="text-sm text-gray-500 mt-1">{weekStudyMinutes % 60}m this week</p>
            </div>
            <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(calculateProgress(weekStudyHours, weeklyGoals.studyHours)))} />
          </div>
        </div>

        {/* Calories */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Calories</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{Math.round(todayCalories)}</p>
              <p className="text-sm text-gray-500 mt-1">/ {targets.calories} today</p>
            </div>
            <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(calculateProgress(todayCalories, targets.calories)))} />
          </div>
        </div>

        {/* Workout Sessions */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Workout Sessions</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{weekWorkoutSessions}</p>
              <p className="text-sm text-gray-500 mt-1">/ {weeklyGoals.workoutDays} this week</p>
            </div>
            <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(calculateProgress(weekWorkoutSessions, weeklyGoals.workoutDays)))} />
          </div>
        </div>

        {/* BMI or Tasks */}
        {bmi ? (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">BMI</p>
                <p className={cn('text-3xl font-semibold mt-1', bmi.color)}>{bmi.value}</p>
                <p className={cn('text-sm mt-1', bmi.color)}>{bmi.category}</p>
              </div>
              <div className={cn(
                'w-2 h-2 rounded-full mt-1',
                bmi.category === 'Normal' ? 'bg-green-500' : bmi.category === 'Underweight' ? 'bg-amber-500' : 'bg-red-500'
              )} />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tasks Completed</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{weekCompletedTasks}</p>
                <p className="text-sm text-gray-500 mt-1">/ {weeklyGoals.tasksTarget} this week</p>
              </div>
              <div className={cn('w-2 h-2 rounded-full mt-1', getStatusColor(calculateProgress(weekCompletedTasks, weeklyGoals.tasksTarget)))} />
            </div>
          </div>
        )}
      </div>

      {/* Layer 2: Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  }}
                />
                <Line type="monotone" dataKey="calories" stroke="#475569" strokeWidth={2} dot={{ fill: '#475569', r: 3 }} name="Calories" />
                <Line type="monotone" dataKey="protein" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Protein (g)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <span className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-0.5 bg-slate-600 rounded" /> Calories
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 h-0.5 bg-red-500 rounded" /> Protein
            </span>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">Weekly Targets</h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Study Hours</span>
                <span className="text-sm text-gray-600">{weekStudyHours}h / {weeklyGoals.studyHours}h</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${calculateProgress(weekStudyHours, weeklyGoals.studyHours)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Calories Avg</span>
                <span className="text-sm text-gray-600">{weeklyAvg.calories} / {targets.calories} kcal</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${calculateProgress(weeklyAvg.calories, targets.calories)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Protein Avg</span>
                <span className="text-sm text-gray-600">{weeklyAvg.protein}g / {targets.protein}g</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${calculateProgress(weeklyAvg.protein, targets.protein)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Workout Days</span>
                <span className="text-sm text-gray-600">{weekWorkoutSessions} / {weeklyGoals.workoutDays} days</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${calculateProgress(weekWorkoutSessions, weeklyGoals.workoutDays)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">Tasks</span>
                <span className="text-sm text-gray-600">{weekCompletedTasks} / {weeklyGoals.tasksTarget}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${calculateProgress(weekCompletedTasks, weeklyGoals.tasksTarget)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 3: Nutrition + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nutrition Snapshot */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">Today's Nutrition</h3>
          
          {/* Macro Rows */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Calories</span>
                <span className="text-sm text-gray-600">{Math.round(todayCalories)} / {targets.calories}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full" style={{ width: `${calculateProgress(todayCalories, targets.calories)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Protein</span>
                <span className="text-sm text-gray-600">{Math.round(todayProtein)}g / {targets.protein}g</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${calculateProgress(todayProtein, targets.protein)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Carbs</span>
                <span className="text-sm text-gray-600">{Math.round(todayCarbs)}g / {targets.carbs}g</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${calculateProgress(todayCarbs, targets.carbs)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Fats</span>
                <span className="text-sm text-gray-600">{Math.round(todayFats)}g / {targets.fats}g</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${calculateProgress(todayFats, targets.fats)}%` }} />
              </div>
            </div>
          </div>

          {/* Protein suggestion */}
          {showProteinSuggestion && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">Protein intake below target</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {Math.round(todayProtein)}g / {targets.protein}g ({proteinPercentage}%)
              </p>
              <div className="mt-2">
                <p className="text-xs text-gray-500">Suggested sources:</p>
                <p className="text-sm text-gray-700 mt-1">Paneer · Soybean · Peanut Butter · Curd · Lentils</p>
              </div>
            </div>
          )}

          {/* Weekly average comparison */}
          {weeklyAvg.daysLogged > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Weekly Average</p>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{weeklyAvg.calories}</p>
                  <p className="text-xs text-gray-500">kcal</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-600">{weeklyAvg.protein}g</p>
                  <p className="text-xs text-gray-500">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">{weeklyAvg.carbs}g</p>
                  <p className="text-xs text-gray-500">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-amber-600">{weeklyAvg.fats}g</p>
                  <p className="text-xs text-gray-500">Fats</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Based on {weeklyAvg.daysLogged} days this week</p>
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">Pending Tasks</h3>
          
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No pending tasks.</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-2">
                  <Circle className="w-4 h-4 text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500">Due {format(parseISO(task.dueDate), 'MMM d')}</p>
                    )}
                  </div>
                  {task.isRecurring && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.recurType}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {generalTasks.filter(t => t.status === 'PENDING').length > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                View all tasks
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* BMI card if available and no nutrition goal shown in KPI */}
          {bmi && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">Body Metrics</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn('text-2xl font-bold', bmi.color)}>{bmi.value}</span>
                  <span className={cn('text-sm ml-2', bmi.color)}>{bmi.category}</span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{nutritionGoal?.heightCm}cm · {nutritionGoal?.weightKg}kg</p>
                  <p className="capitalize">{nutritionGoal?.goalType.toLowerCase()} · {nutritionGoal?.activityLevel.replace('_', ' ').toLowerCase()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
