import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { TimerStopwatch } from '@/components/ui/TimerStopwatch';
import type { StudyTask, Priority, FilterStatus } from '@/types';
import { 
  Plus, Edit2, Trash2, Play, Square, 
  CheckCircle2, Timer, X, BookOpen
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' }
];

const subjectOptions = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'History', label: 'History' },
  { value: 'Language', label: 'Language' },
  { value: 'Programming', label: 'Programming' },
  { value: 'Other', label: 'Other' }
];

export function StudySection() {
  const { 
    studyTasks, addStudyTask, updateStudyTask, deleteStudyTask, 
    toggleStudyTaskStatus, activeTimer, startTimer, stopTimer 
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  const [showStandaloneTimer, setShowStandaloneTimer] = useState(false);
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'timer'>('stopwatch');

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Other',
    priority: 'MEDIUM' as Priority,
    deadline: '',
    notes: '',
    studyTime: 0
  });

  useEffect(() => {
    let interval: number;
    if (activeTimer) {
      interval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setTimerDisplay(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setTimerDisplay('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const filteredTasks = studyTasks.filter(task => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      updateStudyTask(editingTask.id, {
        ...formData,
        deadline: formData.deadline || null
      });
    } else {
      addStudyTask({
        ...formData,
        deadline: formData.deadline || null,
        status: 'PENDING'
      });
    }
    closeModal();
  };

  const openModal = (task?: StudyTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        subject: task.subject,
        priority: task.priority,
        deadline: task.deadline || '',
        notes: task.notes,
        studyTime: task.studyTime
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        subject: 'Other',
        priority: 'MEDIUM',
        deadline: '',
        notes: '',
        studyTime: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTimerToggle = (taskId: string) => {
    if (activeTimer?.taskId === taskId) {
      stopTimer();
    } else {
      if (activeTimer) stopTimer();
      startTimer(taskId);
    }
  };

  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  // Stats
  const totalStudyMinutes = studyTasks.reduce((total, task) => total + task.studyTime, 0);
  const completedTasks = studyTasks.filter(t => t.status === 'COMPLETED').length;
  const highPriorityPending = studyTasks.filter(t => t.priority === 'HIGH' && t.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Study Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">Track your study progress and time</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTimerMode('timer'); setShowStandaloneTimer(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Timer className="w-4 h-4" />
            Pomodoro
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Study Time</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completed</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {completedTasks} / {studyTasks.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">High Priority</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {highPriorityPending} pending
          </p>
        </div>
      </div>

      {/* Active Timer Bar */}
      {activeTimer && (
        <div className="bg-gray-900 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-medium">
              {studyTasks.find(t => t.id === activeTimer.taskId)?.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-mono font-bold">{timerDisplay}</span>
            <button
              onClick={stopTimer}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </div>
        </div>
      )}

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
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No study tasks yet.</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-sm font-medium text-gray-900 hover:underline"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden md:table-cell">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden lg:table-cell">Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors h-11">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStudyTaskStatus(task.id)}>
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
                    {task.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{task.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{task.subject}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
                      getPriorityStyles(task.priority)
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full mr-1.5',
                        task.priority === 'HIGH' ? 'bg-red-500' : task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'
                      )} />
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {task.deadline ? (
                      <span className={cn(
                        'text-sm',
                        isPast(parseISO(task.deadline)) && task.status === 'PENDING'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      )}>
                        {format(parseISO(task.deadline), 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {Math.floor(task.studyTime / 60)}h {task.studyTime % 60}m
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                      {task.status === 'PENDING' && (
                        <button
                          onClick={() => handleTimerToggle(task.id)}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            activeTimer?.taskId === task.id
                              ? 'bg-red-100 text-red-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          )}
                          title={activeTimer?.taskId === task.id ? 'Stop' : 'Start Timer'}
                        >
                          {activeTimer?.taskId === task.id ? (
                            <Square className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => openModal(task)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStudyTask(task.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? 'Edit Study Task' : 'Add Study Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter task title"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900"
              >
                {subjectOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-gray-900"
              >
                {priorityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Study Time (min)</label>
              <input
                type="number"
                value={formData.studyTime}
                onChange={(e) => setFormData({ ...formData, studyTime: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes..."
            />
          </div>
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

      {/* Timer Modal */}
      <Modal
        isOpen={showStandaloneTimer}
        onClose={() => setShowStandaloneTimer(false)}
        title="Pomodoro Timer"
        className="max-w-md"
      >
        <div className="relative">
          <button
            onClick={() => setShowStandaloneTimer(false)}
            className="absolute -top-2 -right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
          <TimerStopwatch
            mode={timerMode}
            initialTime={25 * 60}
            label="Focus Session"
          />
        </div>
      </Modal>
    </div>
  );
}
