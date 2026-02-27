import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { ProgressRow } from '@/components/ui/ProgressRow';
import { MealType, MealItem, FoodItem, FoodCategory } from '@/types';
import { indianFoodsData, getAllCategories } from '@/data/indianFoods';
import { getProteinSuggestions } from '@/utils/nutritionCalculations';
import { Plus, Trash2, Pencil, X, Search, Check, AlertCircle } from 'lucide-react';

const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack'
};

const categoryLabels: Record<FoodCategory, string> = {
  grain: 'Grains',
  protein: 'Protein',
  vegetable: 'Vegetables',
  fruit: 'Fruits',
  dairy: 'Dairy',
  legume: 'Legumes',
  snack: 'Snacks',
  beverage: 'Beverages',
  sweet: 'Sweets',
  oil: 'Oils',
  spice: 'Spices'
};

export function DietSection() {
  const { dietLogs, addDietLog, updateDietLog, deleteDietLog, nutritionGoal, weeklyGoals, customFoods } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [notes, setNotes] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [tempQuantity, setTempQuantity] = useState<number>(100);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const filteredLogs = useMemo(() => {
    return dietLogs.filter(log => log.date === selectedDate);
  }, [dietLogs, selectedDate]);

  const dailyTotals = useMemo(() => {
    return filteredLogs.reduce((acc, log) => ({
      calories: acc.calories + log.totalCalories,
      protein: acc.protein + log.totalProtein,
      carbs: acc.carbs + log.totalCarbs,
      fats: acc.fats + log.totalFats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [filteredLogs]);

  const allFoods = useMemo(() => {
    const customFoodItems: FoodItem[] = customFoods.map(cf => ({
      id: cf.id,
      name: `★ ${cf.name}`,
      nameHindi: cf.nameHindi,
      category: cf.category,
      calories100g: cf.calories100g,
      protein100g: cf.protein100g,
      carbs100g: cf.carbs100g,
      fats100g: cf.fats100g,
      fiber100g: cf.fiber100g,
      servingSize: cf.servingSize,
      servingUnit: cf.servingUnit,
      createdAt: cf.createdAt
    }));
    return [...customFoodItems, ...indianFoodsData];
  }, [customFoods]);

  const filteredFoods = useMemo(() => {
    let foods = allFoods;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      foods = foods.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.nameHindi?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== 'all') {
      foods = foods.filter(f => f.category === selectedCategory);
    }
    return foods.slice(0, 50);
  }, [searchQuery, selectedCategory, allFoods]);

  const targets = {
    calories: nutritionGoal?.targetCalories || weeklyGoals.calorieTarget,
    protein: nutritionGoal?.targetProtein || weeklyGoals.proteinTarget,
    carbs: nutritionGoal?.targetCarbs || weeklyGoals.carbsTarget,
    fats: nutritionGoal?.targetFats || weeklyGoals.fatsTarget,
  };

  const proteinSuggestions = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 16) return [];
    return getProteinSuggestions(indianFoodsData, dailyTotals.protein, targets.protein);
  }, [dailyTotals.protein, targets.protein]);

  const resetForm = () => {
    setMealType('BREAKFAST');
    setSelectedItems([]);
    setNotes('');
    setEditingId(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setShowFoodPicker(false);
    setSelectedFood(null);
    setTempQuantity(100);
  };

  const openModal = (logId?: string) => {
    if (logId) {
      const log = dietLogs.find(l => l.id === logId);
      if (log) {
        setEditingId(logId);
        setMealType(log.mealType);
        setSelectedItems(log.items);
        setNotes(log.notes);
      }
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleAddFood = (food: FoodItem) => {
    setSelectedFood(food);
    setTempQuantity(food.servingSize || 100);
  };

  const confirmAddFood = () => {
    if (!selectedFood) return;
    
    const factor = tempQuantity / 100;
    const newItem: MealItem = {
      id: Date.now().toString(),
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity: tempQuantity,
      calories: Math.round(selectedFood.calories100g * factor),
      protein: Math.round(selectedFood.protein100g * factor * 10) / 10,
      carbs: Math.round(selectedFood.carbs100g * factor * 10) / 10,
      fats: Math.round(selectedFood.fats100g * factor * 10) / 10
    };

    setSelectedItems(prev => [...prev, newItem]);
    setSelectedFood(null);
    setTempQuantity(100);
    setShowFoodPicker(false);
    setSearchQuery('');
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    const totals = selectedItems.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const logData = {
      date: selectedDate,
      mealType,
      items: selectedItems,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFats: Math.round(totals.fats * 10) / 10,
      notes
    };

    if (editingId) {
      updateDietLog(editingId, logData);
    } else {
      addDietLog(logData);
    }

    closeModal();
  };

  const groupedLogs = useMemo(() => {
    const groups: Record<MealType, typeof filteredLogs> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: []
    };
    filteredLogs.forEach(log => {
      groups[log.mealType].push(log);
    });
    return groups;
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Diet Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track meals with Indian food database</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Meal
          </button>
        </div>
      </div>

      {/* Nutrition Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">
          Nutrition Overview
        </h2>
        <div className="space-y-4">
          <ProgressRow label="Calories" current={Math.round(dailyTotals.calories)} target={targets.calories} unit=" kcal" color="slate" />
          <ProgressRow label="Protein" current={Math.round(dailyTotals.protein)} target={targets.protein} unit="g" color="red" />
          <ProgressRow label="Carbs" current={Math.round(dailyTotals.carbs)} target={targets.carbs} unit="g" color="blue" />
          <ProgressRow label="Fats" current={Math.round(dailyTotals.fats)} target={targets.fats} unit="g" color="amber" />
        </div>
      </div>

      {/* Protein Suggestion */}
      {proteinSuggestions.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Protein intake below target
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                {dailyTotals.protein.toFixed(0)}g / {targets.protein}g ({Math.round((dailyTotals.protein / targets.protein) * 100)}%)
              </p>
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-2">Suggested sources:</p>
                <div className="flex flex-wrap gap-2">
                  {proteinSuggestions.map(food => (
                    <span key={food.id} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                      {food.name.replace('★ ', '')} ({food.protein100g}g/100g)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meals by Type */}
      <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(groupedLogs) as MealType[]).map((type) => (
          <div key={type} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-900">{mealTypeLabels[type]}</h3>
            </div>
            <div className="p-4">
              {groupedLogs[type].length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No {type.toLowerCase()} logged</p>
              ) : (
                <div className="space-y-3">
                  {groupedLogs[type].map((log) => (
                    <div key={log.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 space-y-1">
                          {log.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-slate-900">{item.foodName.replace('★ ', '')}</span>
                              <span className="text-slate-400 ml-2">({item.quantity}g)</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => openModal(log.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDietLog(log.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span><strong>{log.totalCalories}</strong> kcal</span>
                        <span><strong>{log.totalProtein}g</strong> P</span>
                        <span><strong>{log.totalCarbs}g</strong> C</span>
                        <span><strong>{log.totalFats}g</strong> F</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Meal' : 'Add New Meal'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {/* Meal Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meal Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(mealTypeLabels) as MealType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          mealType === type
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {mealTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Foods */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selected Foods ({selectedItems.length})
                  </label>
                  {selectedItems.length > 0 ? (
                    <div className="space-y-2 mb-3">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.foodName.replace('★ ', '')}</p>
                            <p className="text-xs text-slate-500">
                              {item.quantity}g · {item.calories} kcal · P:{item.protein}g · C:{item.carbs}g · F:{item.fats}g
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="bg-slate-100 rounded-lg p-3 text-sm">
                        <span className="font-medium text-slate-900">Total: </span>
                        <span className="text-slate-600">
                          {Math.round(selectedItems.reduce((sum, i) => sum + i.calories, 0))} kcal · 
                          P: {selectedItems.reduce((sum, i) => sum + i.protein, 0).toFixed(1)}g · 
                          C: {selectedItems.reduce((sum, i) => sum + i.carbs, 0).toFixed(1)}g · 
                          F: {selectedItems.reduce((sum, i) => sum + i.fats, 0).toFixed(1)}g
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 mb-3">No foods selected yet</p>
                  )}

                  {!showFoodPicker ? (
                    <button
                      type="button"
                      onClick={() => setShowFoodPicker(true)}
                      className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Food Item
                    </button>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Search */}
                      <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search foods..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                              selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            All
                          </button>
                          {getAllCategories().map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                                selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {categoryLabels[cat]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Food Quantity */}
                      {selectedFood && (
                        <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium text-slate-900">{selectedFood.name.replace('★ ', '')}</p>
                              {selectedFood.nameHindi && (
                                <p className="text-sm text-slate-500">{selectedFood.nameHindi}</p>
                              )}
                            </div>
                            <button type="button" onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {/* Quick serving buttons */}
                          <div className="flex gap-2 mb-3">
                            {selectedFood.servingSize && (
                              <button type="button" onClick={() => setTempQuantity(selectedFood.servingSize!)}
                                className="px-3 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                                1 {selectedFood.servingUnit || 'serving'} ({selectedFood.servingSize}g)
                              </button>
                            )}
                            <button type="button" onClick={() => setTempQuantity(100)}
                              className="px-3 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                              100g
                            </button>
                            <button type="button" onClick={() => setTempQuantity(200)}
                              className="px-3 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                              200g
                            </button>
                          </div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-xs text-slate-600 mb-1">Quantity (grams)</label>
                              <input
                                type="number"
                                value={tempQuantity}
                                onChange={(e) => setTempQuantity(Math.max(1, Number(e.target.value)))}
                                min="1"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                              />
                            </div>
                            <div className="text-right min-w-[120px]">
                              <p className="text-xs text-slate-500">Auto-calculated</p>
                              <p className="text-sm font-bold text-slate-900">
                                {Math.round(selectedFood.calories100g * tempQuantity / 100)} kcal
                              </p>
                            </div>
                          </div>
                          {/* Live macro preview */}
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-red-50 rounded p-1.5">
                              <span className="font-semibold text-red-700">{(selectedFood.protein100g * tempQuantity / 100).toFixed(1)}g</span>
                              <span className="text-red-500 ml-1">P</span>
                            </div>
                            <div className="bg-blue-50 rounded p-1.5">
                              <span className="font-semibold text-blue-700">{(selectedFood.carbs100g * tempQuantity / 100).toFixed(1)}g</span>
                              <span className="text-blue-500 ml-1">C</span>
                            </div>
                            <div className="bg-amber-50 rounded p-1.5">
                              <span className="font-semibold text-amber-700">{(selectedFood.fats100g * tempQuantity / 100).toFixed(1)}g</span>
                              <span className="text-amber-500 ml-1">F</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={confirmAddFood}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
                          >
                            <Check className="w-4 h-4" />
                            Add to Meal
                          </button>
                        </div>
                      )}

                      {/* Food List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredFoods.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => handleAddFood(food)}
                            className={`w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors ${
                              selectedFood?.id === food.id ? 'bg-indigo-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{food.name}</p>
                                {food.nameHindi && (
                                  <p className="text-xs text-slate-500">{food.nameHindi}</p>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {food.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Per 100g: {food.calories100g} kcal · P:{food.protein100g}g · C:{food.carbs100g}g · F:{food.fats100g}g
                            </p>
                          </button>
                        ))}
                        {filteredFoods.length === 0 && (
                          <p className="text-center text-slate-400 py-8 text-sm">No foods found</p>
                        )}
                      </div>

                      <div className="p-2 bg-slate-50 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => { setShowFoodPicker(false); setSelectedFood(null); }}
                          className="w-full py-2 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any observations..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingId ? 'Update Meal' : 'Save Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
