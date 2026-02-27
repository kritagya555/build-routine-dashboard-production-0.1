import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  StudyTask, DietLog, WorkoutLog, WorkoutTemplate, GeneralTask, WeeklyGoal, 
  NutritionGoal, CustomFood, GoalType, Gender, ActivityLevel
} from '@/types';

interface AppState {
  // Study Tasks
  studyTasks: StudyTask[];
  addStudyTask: (task: Omit<StudyTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStudyTask: (id: string, task: Partial<StudyTask>) => void;
  deleteStudyTask: (id: string) => void;
  toggleStudyTaskStatus: (id: string) => void;

  // Diet Logs
  dietLogs: DietLog[];
  addDietLog: (log: Omit<DietLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDietLog: (id: string, log: Partial<DietLog>) => void;
  deleteDietLog: (id: string) => void;

  // Workout Logs
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: Omit<WorkoutLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkoutLog: (id: string, log: Partial<WorkoutLog>) => void;
  deleteWorkoutLog: (id: string) => void;
  toggleWorkoutCompletion: (id: string) => void;
  toggleExerciseCompletion: (workoutId: string, exerciseId: string) => void;

  // Workout Templates (Weekly Recurring)
  workoutTemplates: WorkoutTemplate[];
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkoutTemplate: (id: string, template: Partial<WorkoutTemplate>) => void;
  deleteWorkoutTemplate: (id: string) => void;

  // General Tasks
  generalTasks: GeneralTask[];
  addGeneralTask: (task: Omit<GeneralTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateGeneralTask: (id: string, task: Partial<GeneralTask>) => void;
  deleteGeneralTask: (id: string) => void;
  toggleGeneralTaskStatus: (id: string) => void;
  reorderTasks: (tasks: GeneralTask[]) => void;

  // Weekly Goals
  weeklyGoals: WeeklyGoal;
  updateWeeklyGoals: (goals: Partial<WeeklyGoal>) => void;

  // Nutrition Goal
  nutritionGoal: NutritionGoal | null;
  setNutritionGoal: (goal: NutritionGoal) => void;
  calculateAndSetNutritionGoal: (params: {
    heightCm: number;
    weightKg: number;
    age: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goalType: GoalType;
  }) => void;

  // Custom Foods
  customFoods: CustomFood[];
  addCustomFood: (food: Omit<CustomFood, 'id' | 'createdAt' | 'isCustom'>) => void;
  updateCustomFood: (id: string, food: Partial<CustomFood>) => void;
  deleteCustomFood: (id: string) => void;

  // Active Timer
  activeTimer: { taskId: string; startTime: number } | null;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
}

const now = () => new Date().toISOString();

const activityMultipliers: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9
};

const goalAdjustments: Record<GoalType, number> = {
  BULK: 300,
  MAINTAIN: 0,
  CUT: -300
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Study Tasks
      studyTasks: [],
      addStudyTask: (task) => set((state) => ({
        studyTasks: [...state.studyTasks, {
          ...task,
          id: uuidv4(),
          createdAt: now(),
          updatedAt: now()
        }]
      })),
      updateStudyTask: (id, task) => set((state) => ({
        studyTasks: state.studyTasks.map((t) =>
          t.id === id ? { ...t, ...task, updatedAt: now() } : t
        )
      })),
      deleteStudyTask: (id) => set((state) => ({
        studyTasks: state.studyTasks.filter((t) => t.id !== id)
      })),
      toggleStudyTaskStatus: (id) => set((state) => ({
        studyTasks: state.studyTasks.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'PENDING' ? 'COMPLETED' : 'PENDING', updatedAt: now() }
            : t
        )
      })),

      // Diet Logs
      dietLogs: [],
      addDietLog: (log) => set((state) => ({
        dietLogs: [...state.dietLogs, {
          ...log,
          id: uuidv4(),
          createdAt: now(),
          updatedAt: now()
        }]
      })),
      updateDietLog: (id, log) => set((state) => ({
        dietLogs: state.dietLogs.map((l) =>
          l.id === id ? { ...l, ...log, updatedAt: now() } : l
        )
      })),
      deleteDietLog: (id) => set((state) => ({
        dietLogs: state.dietLogs.filter((l) => l.id !== id)
      })),

      // Workout Logs
      workoutLogs: [],
      addWorkoutLog: (log) => set((state) => ({
        workoutLogs: [...state.workoutLogs, {
          ...log,
          id: uuidv4(),
          createdAt: now(),
          updatedAt: now()
        }]
      })),
      updateWorkoutLog: (id, log) => set((state) => ({
        workoutLogs: state.workoutLogs.map((l) =>
          l.id === id ? { ...l, ...log, updatedAt: now() } : l
        )
      })),
      deleteWorkoutLog: (id) => set((state) => ({
        workoutLogs: state.workoutLogs.filter((l) => l.id !== id)
      })),
      toggleWorkoutCompletion: (id) => set((state) => ({
        workoutLogs: state.workoutLogs.map((l) =>
          l.id === id ? { ...l, completed: !l.completed, updatedAt: now() } : l
        )
      })),
      toggleExerciseCompletion: (workoutId, exerciseId) => set((state) => ({
        workoutLogs: state.workoutLogs.map((l) =>
          l.id === workoutId
            ? {
                ...l,
                exercises: l.exercises.map((e) =>
                  e.id === exerciseId ? { ...e, completed: !e.completed } : e
                ),
                updatedAt: now()
              }
            : l
        )
      })),

      // Workout Templates
      workoutTemplates: [],
      addWorkoutTemplate: (template) => set((state) => ({
        workoutTemplates: [
          ...state.workoutTemplates,
          {
            ...template,
            id: uuidv4(),
            createdAt: now(),
            updatedAt: now()
          }
        ]
      })),
      updateWorkoutTemplate: (id, template) => set((state) => ({
        workoutTemplates: state.workoutTemplates.map((t) =>
          t.id === id ? { ...t, ...template, updatedAt: now() } : t
        )
      })),
      deleteWorkoutTemplate: (id) => set((state) => ({
        workoutTemplates: state.workoutTemplates.filter((t) => t.id !== id)
      })),

      // General Tasks
      generalTasks: [],
      addGeneralTask: (task) => set((state) => ({
        generalTasks: [...state.generalTasks, {
          ...task,
          id: uuidv4(),
          order: state.generalTasks.length,
          createdAt: now(),
          updatedAt: now()
        }]
      })),
      updateGeneralTask: (id, task) => set((state) => ({
        generalTasks: state.generalTasks.map((t) =>
          t.id === id ? { ...t, ...task, updatedAt: now() } : t
        )
      })),
      deleteGeneralTask: (id) => set((state) => ({
        generalTasks: state.generalTasks.filter((t) => t.id !== id)
      })),
      toggleGeneralTaskStatus: (id) => set((state) => ({
        generalTasks: state.generalTasks.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'PENDING' ? 'COMPLETED' : 'PENDING', updatedAt: now() }
            : t
        )
      })),
      reorderTasks: (tasks) => set({ generalTasks: tasks }),

      // Weekly Goals
      weeklyGoals: {
        id: uuidv4(),
        weekStart: now(),
        studyHours: 20,
        calorieTarget: 2000,
        proteinTarget: 120,
        carbsTarget: 250,
        fatsTarget: 65,
        workoutDays: 5,
        tasksTarget: 15
      },
      updateWeeklyGoals: (goals) => set((state) => ({
        weeklyGoals: { ...state.weeklyGoals, ...goals }
      })),

      // Nutrition Goal
      nutritionGoal: null,
      setNutritionGoal: (goal) => set({ nutritionGoal: goal }),
      calculateAndSetNutritionGoal: (params) => {
        const { heightCm, weightKg, age, gender, activityLevel, goalType } = params;

        let bmr: number;
        if (gender === 'MALE') {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
          bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }

        const maintenanceCalories = bmr * activityMultipliers[activityLevel];
        const targetCalories = Math.round(maintenanceCalories + goalAdjustments[goalType]);
        const targetProtein = Math.round(1.8 * weightKg);
        const targetFats = Math.round((targetCalories * 0.25) / 9);

        const proteinCalories = targetProtein * 4;
        const fatCalories = targetFats * 9;
        const remainingCalories = targetCalories - proteinCalories - fatCalories;
        const targetCarbs = Math.round(remainingCalories / 4);

        const nutritionGoal: NutritionGoal = {
          id: uuidv4(),
          goalType,
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFats,
          heightCm,
          weightKg,
          age,
          gender,
          activityLevel,
          createdAt: now(),
          updatedAt: now()
        };

        set({
          nutritionGoal,
          weeklyGoals: {
            ...get().weeklyGoals,
            calorieTarget: targetCalories,
            proteinTarget: targetProtein,
            carbsTarget: targetCarbs,
            fatsTarget: targetFats
          }
        });
      },

      // Custom Foods
      customFoods: [],
      addCustomFood: (food) => set((state) => ({
        customFoods: [...state.customFoods, {
          ...food,
          id: uuidv4(),
          isCustom: true,
          createdAt: now()
        }]
      })),
      updateCustomFood: (id, food) => set((state) => ({
        customFoods: state.customFoods.map((f) =>
          f.id === id ? { ...f, ...food } : f
        )
      })),
      deleteCustomFood: (id) => set((state) => ({
        customFoods: state.customFoods.filter((f) => f.id !== id)
      })),

      // Active Timer
      activeTimer: null,
      startTimer: (taskId) => set({ activeTimer: { taskId, startTime: Date.now() } }),
      stopTimer: () => {
        const { activeTimer, studyTasks, updateStudyTask } = get();
        if (activeTimer) {
          const elapsedMinutes = Math.floor((Date.now() - activeTimer.startTime) / 60000);
          const task = studyTasks.find((t) => t.id === activeTimer.taskId);
          if (task) {
            updateStudyTask(activeTimer.taskId, { studyTime: task.studyTime + elapsedMinutes });
          }
        }
        set({ activeTimer: null });
      }
    }),
    { name: 'daily-routine-dashboard' }
  )
);