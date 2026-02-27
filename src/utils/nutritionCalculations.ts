import type { BMIResult, WeeklyMacroAverage, DailyNutritionData, DietLog, FoodItem } from '@/types';

/**
 * Calculate BMI from height and weight
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let category: BMIResult['category'];
  let color: string;
  
  if (bmi < 18.5) {
    category = 'Underweight';
    color = 'text-yellow-500';
  } else if (bmi < 25) {
    category = 'Normal';
    color = 'text-green-500';
  } else if (bmi < 30) {
    category = 'Overweight';
    color = 'text-orange-500';
  } else {
    category = 'Obese';
    color = 'text-red-500';
  }
  
  return {
    value: Math.round(bmi * 10) / 10,
    category,
    color
  };
}

/**
 * Calculate weekly macro averages from diet logs
 */
export function calculateWeeklyMacroAverage(dietLogs: DietLog[], startDate: Date): WeeklyMacroAverage {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const weeklyLogs = dietLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startDate && logDate < endDate;
  });
  
  // Get unique days
  const uniqueDays = new Set(weeklyLogs.map(log => log.date.split('T')[0]));
  const daysLogged = uniqueDays.size || 1; // Avoid division by zero
  
  const totals = weeklyLogs.reduce((acc, log) => ({
    calories: acc.calories + log.totalCalories,
    protein: acc.protein + log.totalProtein,
    carbs: acc.carbs + log.totalCarbs,
    fats: acc.fats + log.totalFats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  
  return {
    calories: Math.round(totals.calories / daysLogged),
    protein: Math.round(totals.protein / daysLogged),
    carbs: Math.round(totals.carbs / daysLogged),
    fats: Math.round(totals.fats / daysLogged),
    daysLogged
  };
}

/**
 * Get daily nutrition data for the past N days (for charts)
 */
export function getDailyNutritionData(dietLogs: DietLog[], days: number = 7): DailyNutritionData[] {
  const result: DailyNutritionData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayLogs = dietLogs.filter(log => log.date.startsWith(dateStr));
    
    const dayTotals = dayLogs.reduce((acc, log) => ({
      calories: acc.calories + log.totalCalories,
      protein: acc.protein + log.totalProtein,
      carbs: acc.carbs + log.totalCarbs,
      fats: acc.fats + log.totalFats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    
    result.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      ...dayTotals
    });
  }
  
  return result;
}

/**
 * Get start of current week (Monday)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get high protein vegetarian food suggestions
 */
export function getProteinSuggestions(
  foods: FoodItem[], 
  currentProtein: number, 
  targetProtein: number
): FoodItem[] {
  // If protein intake is less than 80% of target
  if (currentProtein >= targetProtein * 0.8) {
    return [];
  }
  
  // Filter vegetarian high-protein foods and sort by protein content
  const vegetarianCategories = ['dairy', 'legume', 'grain'];
  const highProteinVegFoods = foods
    .filter(food => 
      vegetarianCategories.includes(food.category) || 
      food.name.toLowerCase().includes('paneer') ||
      food.name.toLowerCase().includes('soy') ||
      food.name.toLowerCase().includes('tofu') ||
      food.name.toLowerCase().includes('curd') ||
      food.name.toLowerCase().includes('milk') ||
      food.name.toLowerCase().includes('dal') ||
      food.name.toLowerCase().includes('chana') ||
      food.name.toLowerCase().includes('rajma') ||
      food.name.toLowerCase().includes('peanut') ||
      food.name.toLowerCase().includes('sprout')
    )
    .sort((a, b) => b.protein100g - a.protein100g)
    .slice(0, 5);
  
  return highProteinVegFoods;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(Math.round(progress), 100);
}

/**
 * Get macros breakdown as percentages
 */
export function getMacroPercentages(protein: number, carbs: number, fats: number): {
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
} {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatsCal = fats * 9;
  const totalCal = proteinCal + carbsCal + fatsCal;
  
  if (totalCal === 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }
  
  return {
    proteinPct: Math.round((proteinCal / totalCal) * 100),
    carbsPct: Math.round((carbsCal / totalCal) * 100),
    fatsPct: Math.round((fatsCal / totalCal) * 100)
  };
}
