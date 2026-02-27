import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import type { GeneralTask, FilterStatus, RecurType } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, Edit2, Trash2, ListTodo, GripVertical, CheckCircle2, 
  RefreshCw, Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const recurTypeOptions = [
  { value: '', label: 'No Recurrence' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' }
];

interface SortableRowProps {
  task: GeneralTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableRow({ task, onToggle, onEdit, onDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors h-11',
        isDragging && 'opacity-50 bg-gray-100'
      )}
    >
      <td className="px-4 py-3 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded text-gray-400"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-4 py-3 w-10">
        <button onClick={onToggle}>
          {task.status === 'COMPLETED' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-gray-500 transition-colors" />
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <p className={cn(
          'text-sm font-medium',
          task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900'
        )}>
          {task.title}
        </p>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {task.isRecurring && task.recurType ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
            <RefreshCw className="w-3 h-3" />
            {task.recurType}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {task.dueDate ? (
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
          task.status === 'COMPLETED'
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-700'
        )}>
          {task.status === 'COMPLETED' ? 'Done' : 'Pending'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TaskSection() {
  const { 
    generalTasks, addGeneralTask, updateGeneralTask, deleteGeneralTask, 
    toggleGeneralTaskStatus, reorderTasks 
  } = useStore();
  
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<GeneralTask | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    isRecurring: false,
    recurType: '' as RecurType | '',
    dueDate: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const filteredTasks = generalTasks.filter(task => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  }).sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = generalTasks.findIndex((t) => t.id === active.id);
      const newIndex = generalTasks.findIndex((t) => t.id === over.id);
      
      const newTasks = arrayMove(generalTasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index
      }));
      
      reorderTasks(newTasks);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title: formData.title,
      isRecurring: formData.isRecurring,
      recurType: formData.recurType || null,
      dueDate: formData.dueDate || null,
      status: 'PENDING' as const
    };

    if (editingTask) {
      updateGeneralTask(editingTask.id, taskData);
    } else {
      addGeneralTask(taskData);
    }
    closeModal();
  };

  const openModal = (task?: GeneralTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        isRecurring: task.isRecurring,
        recurType: task.recurType || '',
        dueDate: task.dueDate || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        isRecurring: false,
        recurType: '',
        dueDate: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const pendingCount = generalTasks.filter(t => t.status === 'PENDING').length;
  const completedCount = generalTasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['ALL', 'PENDING', 'COMPLETED'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              filter === status
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {status === 'ALL' 
              ? `All (${generalTasks.length})` 
              : status === 'PENDING' 
                ? `Pending (${pendingCount})` 
                : `Completed (${completedCount})`}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ListTodo className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No tasks yet.</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-sm font-medium text-gray-900 hover:underline"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden md:table-cell">Recurrence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden lg:table-cell">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <SortableContext
                items={filteredTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {filteredTasks.map((task) => (
                    <SortableRow
                      key={task.id}
                      task={task}
                      onToggle={() => toggleGeneralTaskStatus(task.id)}
                      onEdit={() => openModal(task)}
                      onDelete={() => deleteGeneralTask(task.id)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Add Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter task title"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ 
                ...formData, 
                isRecurring: e.target.checked,
                recurType: e.target.checked ? 'DAILY' : ''
              })}
              className="w-4 h-4 text-gray-900 rounded focus:ring-gray-500 border-gray-300"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
              Recurring Task
            </label>
          </div>

          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <select
                value={formData.recurType}
                onChange={(e) => setFormData({ ...formData, recurType: e.target.value as RecurType })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900"
              >
                {recurTypeOptions.filter(o => o.value !== '').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {editingTask ? 'Update' : 'Add'} Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
