import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { SectionContainer } from '@/components/ui/SectionContainer';
import type { FoodCategory, CustomFood } from '@/types';
import { Plus, Edit2, Trash2, X, Save, Search, UtensilsCrossed } from 'lucide-react';

const categories: { value: FoodCategory; label: string }[] = [
  { value: 'grain', label: 'Grains & Cereals' },
  { value: 'protein', label: 'Protein' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruits' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'legume', label: 'Legumes & Pulses' },
  { value: 'snack', label: 'Snacks' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'sweet', label: 'Sweets' },
  { value: 'oil', label: 'Oils & Fats' },
];

export const CustomFoodManager: React.FC = () => {
  const { customFoods, addCustomFood, updateCustomFood, deleteCustomFood } = useStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    nameHindi: '',
    category: 'grain' as FoodCategory,
    calories100g: 0,
    protein100g: 0,
    carbs100g: 0,
    fats100g: 0,
    fiber100g: 0,
    servingSize: 100,
    servingUnit: 'grams'
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      nameHindi: '',
      category: 'grain',
      calories100g: 0,
      protein100g: 0,
      carbs100g: 0,
      fats100g: 0,
      fiber100g: 0,
      servingSize: 100,
      servingUnit: 'grams'
    });
    setEditingFood(null);
    setShowForm(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFood) {
      updateCustomFood(editingFood.id, formData);
    } else {
      addCustomFood(formData);
    }
    resetForm();
  };
  
  const handleEdit = (food: CustomFood) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      nameHindi: food.nameHindi || '',
      category: food.category,
      calories100g: food.calories100g,
      protein100g: food.protein100g,
      carbs100g: food.carbs100g,
      fats100g: food.fats100g,
      fiber100g: food.fiber100g || 0,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingUnit || 'grams'
    });
    setShowForm(true);
  };
  
  const filteredFoods = customFoods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.nameHindi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Custom Foods</h1>
          <p className="text-sm text-slate-500 mt-1">Add your own foods with nutrition data</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Food
        </button>
      </div>
      
      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingFood ? 'Edit Food' : 'Add Custom Food'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Brown Rice"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name (Hindi)</label>
                  <input
                    type="text"
                    value={formData.nameHindi}
                    onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., भूरे चावल"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as FoodCategory })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Nutrition per 100g</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.calories100g}
                      onChange={(e) => setFormData({ ...formData, calories100g: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.1}
                      value={formData.protein100g}
                      onChange={(e) => setFormData({ ...formData, protein100g: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.1}
                      value={formData.carbs100g}
                      onChange={(e) => setFormData({ ...formData, carbs100g: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.1}
                      value={formData.fats100g}
                      onChange={(e) => setFormData({ ...formData, fats100g: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serving Size</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.servingSize}
                    onChange={(e) => setFormData({ ...formData, servingSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serving Unit</label>
                  <input
                    type="text"
                    value={formData.servingUnit}
                    onChange={(e) => setFormData({ ...formData, servingUnit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    placeholder="grams, piece, cup"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  <Save className="w-4 h-4" />
                  {editingFood ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search custom foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Foods List */}
      {customFoods.length === 0 ? (
        <SectionContainer>
          <div className="text-center py-8">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No custom foods yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              Add Your First Food
            </button>
          </div>
        </SectionContainer>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Food</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Cal</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:table-cell">P</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:table-cell">C</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:table-cell">F</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.map((food) => (
                <tr key={food.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{food.name}</p>
                    {food.nameHindi && (
                      <p className="text-xs text-slate-500">{food.nameHindi}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-500 capitalize">{food.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-slate-900">{food.calories100g}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm text-red-600">{food.protein100g}g</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm text-green-600">{food.carbs100g}g</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-sm text-amber-600">{food.fats100g}g</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(food)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCustomFood(food.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
