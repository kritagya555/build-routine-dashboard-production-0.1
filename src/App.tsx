import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Dashboard } from '@/components/Dashboard';
import { StudySection } from '@/components/StudySection';
import { DietSection } from '@/components/DietSection';
import { WorkoutSection } from '@/components/WorkoutSection';
import { TaskSection } from '@/components/TaskSection';
import { Settings } from '@/components/Settings';
import { NutritionGoals } from '@/components/NutritionGoals';
import { NutritionCharts } from '@/components/NutritionCharts';
import { CustomFoodManager } from '@/components/CustomFoodManager';
import { 
  LayoutDashboard, BookOpen, Utensils, Dumbbell, ListTodo, 
  Settings as SettingsIcon, Menu, X, Target, BarChart3, UtensilsCrossed
} from 'lucide-react';

type Section = 'overview' | 'study' | 'nutrition' | 'training' | 'tasks' | 'nutrition-goals' | 'nutrition-charts' | 'custom-foods' | 'settings';

const navItems = [
  { id: 'overview' as Section, label: 'Overview', icon: LayoutDashboard },
  { id: 'study' as Section, label: 'Study Sessions', icon: BookOpen },
  { id: 'nutrition' as Section, label: 'Nutrition', icon: Utensils },
  { id: 'training' as Section, label: 'Training', icon: Dumbbell },
  { id: 'tasks' as Section, label: 'Task Manager', icon: ListTodo },
  { id: 'nutrition-goals' as Section, label: 'Nutrition Goals', icon: Target },
  { id: 'nutrition-charts' as Section, label: 'Analytics', icon: BarChart3 },
  { id: 'custom-foods' as Section, label: 'Custom Foods', icon: UtensilsCrossed },
  { id: 'settings' as Section, label: 'Settings', icon: SettingsIcon },
];

export function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Dashboard />;
      case 'study':
        return <StudySection />;
      case 'nutrition':
        return <DietSection />;
      case 'training':
        return <WorkoutSection />;
      case 'tasks':
        return <TaskSection />;
      case 'nutrition-goals':
        return <NutritionGoals />;
      case 'nutrition-charts':
        return <NutritionCharts />;
      case 'custom-foods':
        return <CustomFoodManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <span className="font-semibold text-gray-900">Daily Routine</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - 240px fixed width */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-60 bg-white border-r border-gray-200 transition-transform duration-200',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-6 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Daily Routine</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      'relative w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors duration-150',
                      isActive
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {/* Active indicator - 3px left border */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gray-900 rounded-r" />
                    )}
                    <item.icon className={cn(
                      'w-[18px] h-[18px]',
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    )} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Data stored locally
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content - max 1200px centered */}
      <main className="lg:ml-60 min-h-screen">
        <div className="pt-14 lg:pt-0">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}
