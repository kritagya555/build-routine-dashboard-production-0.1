import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Clock, Flame, Dumbbell, CheckSquare, Save, Check } from 'lucide-react';

export function Settings() {
  const { weeklyGoals, updateWeeklyGoals } = useStore();
  
  const [formData, setFormData] = useState({
    studyHours: weeklyGoals.studyHours,
    calorieTarget: weeklyGoals.calorieTarget,
    workoutDays: weeklyGoals.workoutDays,
    tasksTarget: weeklyGoals.tasksTarget
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeeklyGoals(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your weekly goals and preferences</p>
      </div>

      {/* Weekly Goals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-6">
          Weekly Goals
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Study Hours */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-50 rounded">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Study Hours</span>
              </div>
              <input
                type="number"
                value={formData.studyHours}
                onChange={(e) => setFormData({ ...formData, studyHours: parseInt(e.target.value) || 0 })}
                min={1}
                max={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">Target study hours per week</p>
            </div>

            {/* Daily Calories */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-50 rounded">
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Daily Calories</span>
              </div>
              <input
                type="number"
                value={formData.calorieTarget}
                onChange={(e) => setFormData({ ...formData, calorieTarget: parseInt(e.target.value) || 0 })}
                min={500}
                max={10000}
                step={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">Target calories per day</p>
            </div>

            {/* Workout Days */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-green-50 rounded">
                  <Dumbbell className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Workout Days</span>
              </div>
              <input
                type="number"
                value={formData.workoutDays}
                onChange={(e) => setFormData({ ...formData, workoutDays: parseInt(e.target.value) || 0 })}
                min={1}
                max={7}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">Target workout days per week</p>
            </div>

            {/* Tasks Target */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 rounded">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Tasks Target</span>
              </div>
              <input
                type="number"
                value={formData.tasksTarget}
                onChange={(e) => setFormData({ ...formData, tasksTarget: parseInt(e.target.value) || 0 })}
                min={1}
                max={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">Target tasks to complete per week</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" />
                Settings saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* About */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 mb-4">
          About
        </h2>
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Daily Routine Dashboard helps you track study sessions, diet, workouts, and daily tasks.
          </p>
          <div>
            <p className="font-medium text-gray-900 mb-2">Features</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Study task management with timer</li>
              <li>• Diet and nutrition tracking (190+ Indian foods)</li>
              <li>• Workout logging with exercises</li>
              <li>• Task management with drag-and-drop</li>
              <li>• Weekly progress overview</li>
              <li>• Goal-based nutrition system with BMI</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Data is stored locally in your browser using localStorage.
          </p>
        </div>
      </div>
    </div>
  );
}
