import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';
import { TimerStopwatch, WorkoutTimer } from '@/components/ui/TimerStopwatch';
import type { WorkoutLog, Exercise } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, Edit2, Trash2, Dumbbell, Calendar, CheckCircle2, 
  ChevronLeft, ChevronRight, X, Timer, Clock, Play, Pause, RotateCcw,
  Bell, VolumeX
} from 'lucide-react';
import { format, addDays, subDays, parseISO, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isWithinInterval } from 'date-fns';

export function WorkoutSection() {
  const { 
    workoutLogs, addWorkoutLog, updateWorkoutLog, deleteWorkoutLog, 
    toggleWorkoutCompletion, toggleExerciseCompletion 
  } = useStore();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(60);
  const [isRestRunning, setIsRestRunning] = useState(false);

  const [formData, setFormData] = useState({
    exercises: [] as Exercise[],
    notes: ''
  });

  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    weight: ''
  });

  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutElapsed, setWorkoutElapsed] = useState(0);
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState(false);

  const todayLog = workoutLogs.find(log => log.date === selectedDate);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekWorkouts = workoutLogs.filter(log => {
    const date = parseISO(log.date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd });
  });

  const completedThisWeek = weekWorkouts.filter(w => w.completed).length;

  useEffect(() => {
    let interval: number;
    if (isWorkoutTimerRunning && workoutStartTime) {
      interval = window.setInterval(() => {
        setWorkoutElapsed(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutTimerRunning, workoutStartTime]);

  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const alarmIntervalRef = useRef<number | null>(null);
  const alarmTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { stopAlarm(); };
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRestRunning && restSeconds > 0) {
      interval = window.setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            setIsRestRunning(false);
            startContinuousAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restSeconds]);

  const playBeepSequence = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioContext.currentTime;
      const frequencies = [700, 900, 1100];
      const beepDuration = 0.2;
      const gap = 0.1;
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        const startTime = now + (index * (beepDuration + gap));
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.5, startTime + beepDuration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + beepDuration);
        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      });
      
      const finalOsc = audioContext.createOscillator();
      const finalGain = audioContext.createGain();
      finalOsc.connect(finalGain);
      finalGain.connect(audioContext.destination);
      const sustainStart = now + (3 * (beepDuration + gap));
      finalOsc.frequency.value = 880;
      finalOsc.type = 'sine';
      finalGain.gain.setValueAtTime(0, sustainStart);
      finalGain.gain.linearRampToValueAtTime(0.6, sustainStart + 0.05);
      finalGain.gain.setValueAtTime(0.6, sustainStart + 0.8);
      finalGain.gain.linearRampToValueAtTime(0, sustainStart + 1.0);
      finalOsc.start(sustainStart);
      finalOsc.stop(sustainStart + 1.0);
      
      setTimeout(() => { audioContext.close().catch(() => {}); }, 2000);
    } catch { console.log('Audio not supported'); }
  };

  const startContinuousAlarm = () => {
    setIsAlarmPlaying(true);
    playBeepSequence();
    alarmIntervalRef.current = window.setInterval(() => { playBeepSequence(); }, 1500);
    alarmTimeoutRef.current = window.setTimeout(() => { stopAlarm(); }, 30000);
  };

  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    if (alarmIntervalRef.current) { clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null; }
    if (alarmTimeoutRef.current) { clearTimeout(alarmTimeoutRef.current); alarmTimeoutRef.current = null; }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog) {
      updateWorkoutLog(editingLog.id, formData);
    } else {
      addWorkoutLog({ ...formData, date: selectedDate, completed: false });
    }
    closeModal();
  };

  const openModal = (log?: WorkoutLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({ exercises: log.exercises, notes: log.notes });
    } else {
      setEditingLog(null);
      setFormData({ exercises: [], notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
    setNewExercise({ name: '', sets: 3, reps: 10, weight: '' });
  };

  const addExercise = () => {
    if (!newExercise.name) return;
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          id: uuidv4(),
          name: newExercise.name,
          sets: newExercise.sets,
          reps: newExercise.reps,
          weight: newExercise.weight ? parseFloat(newExercise.weight) : null,
          completed: false
        }
      ]
    });
    setNewExercise({ name: '', sets: 3, reps: 10, weight: '' });
  };

  const removeExercise = (id: string) => {
    setFormData({ ...formData, exercises: formData.exercises.filter(e => e.id !== id) });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = parseISO(selectedDate);
    const newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStart(direction === 'next' ? addWeeks(weekStart, 1) : subWeeks(weekStart, 1));
  };

  const startWorkoutTimer = () => { setWorkoutStartTime(Date.now()); setIsWorkoutTimerRunning(true); };
  const pauseWorkoutTimer = () => { setIsWorkoutTimerRunning(false); };
  const resumeWorkoutTimer = () => { if (workoutStartTime) { setWorkoutStartTime(Date.now() - workoutElapsed * 1000); setIsWorkoutTimerRunning(true); } };
  const resetWorkoutTimer = () => { setIsWorkoutTimerRunning(false); setWorkoutStartTime(null); setWorkoutElapsed(0); };

  const startRestTimer = (duration?: number) => {
    setRestDuration(duration || restDuration);
    setRestSeconds(duration || restDuration);
    setIsRestRunning(true);
    setShowRestTimer(true);
  };

  const restPresets = [30, 45, 60, 90, 120, 180];

  return (
     <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workout Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track exercises and progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowWorkoutTimer(true)}>
            <Timer className="w-4 h-4 mr-2" />
            Timer
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Workout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
  <KpiCard
    label="This Week"
    value={completedThisWeek.toString()}
    subtitle="workouts completed"
    icon={CheckCircle2}
    />

  <KpiCard
    label="Today"
    value={todayLog?.completed ? 'Done' : 'Pending'}
    subtitle={
      todayLog
        ? `${todayLog.exercises.length} exercises`
        : 'No workout'
    }
    icon={Dumbbell}
    />

  <div className="col-span-2">
    <KpiCard
      label="Session Time"
      value={formatTime(workoutElapsed)}
      subtitle={isWorkoutTimerRunning ? 'Active' : 'Paused'}
      icon={Clock}
     />
  </div>
</div>

      {/* Active Session Timer */}
      {(isWorkoutTimerRunning || workoutElapsed > 0) && (
        <div className="bg-slate-900 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${isWorkoutTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-medium">Workout Session</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-mono font-bold">{formatTime(workoutElapsed)}</span>
            <div className="flex gap-2">
              {isWorkoutTimerRunning ? (
                <button onClick={pauseWorkoutTimer} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><Pause className="w-4 h-4" /></button>
              ) : (
                <button onClick={resumeWorkoutTimer} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><Play className="w-4 h-4" /></button>
              )}
              <button onClick={resetWorkoutTimer} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Rest Timer */}
      {showRestTimer && (
        <div className={`rounded-lg p-4 flex items-center justify-between ${isAlarmPlaying ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white'}`}>
          <div className="flex items-center gap-3">
            {isAlarmPlaying ? <Bell className="w-5 h-5 animate-bounce" /> : <Clock className="w-5 h-5" />}
            <span className="font-medium">{isAlarmPlaying ? 'Rest Complete!' : 'Rest Timer'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-mono font-bold">{formatTime(restSeconds)}</span>
            {isAlarmPlaying ? (
              <button onClick={stopAlarm} className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium flex items-center gap-2">
                <VolumeX className="w-4 h-4" />Stop Alarm
              </button>
            ) : restSeconds === 0 ? (
              <div className="flex gap-2">{restPresets.slice(0, 4).map(s => (
                <button key={s} onClick={() => startRestTimer(s)} className="px-3 py-1 bg-white/20 rounded-full text-sm">{s}s</button>
              ))}</div>
            ) : (
              <div className="flex gap-2">
                {isRestRunning ? (
                  <button onClick={() => setIsRestRunning(false)} className="p-2 bg-white/20 rounded-full"><Pause className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => setIsRestRunning(true)} className="p-2 bg-white/20 rounded-full"><Play className="w-4 h-4" /></button>
                )}
                <button onClick={() => { setIsRestRunning(false); setRestSeconds(0); }} className="p-2 bg-white/20 rounded-full"><RotateCcw className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={() => { setShowRestTimer(false); setIsRestRunning(false); setRestSeconds(0); stopAlarm(); }} className="p-1 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        {!isWorkoutTimerRunning && workoutElapsed === 0 && (
          <button onClick={startWorkoutTimer} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Play className="w-4 h-4" />Start Session
          </button>
        )}
        {!showRestTimer && (
          <button onClick={() => setShowRestTimer(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <Clock className="w-4 h-4" />Rest Timer
          </button>
        )}
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
          <span className="text-sm font-medium text-slate-700">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </span>
          <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayWorkout = workoutLogs.find(log => log.date === dayStr);
            const isSelected = dayStr === selectedDate;
            const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDate(dayStr)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  isSelected ? 'bg-slate-900 text-white' : isToday ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                <p className="text-lg font-bold">{format(day, 'd')}</p>
                {dayWorkout && (
                  <div className="mt-1">
                    {dayWorkout.completed ? (
                      <CheckCircle2 className={`w-4 h-4 mx-auto ${isSelected ? 'text-green-300' : 'text-green-500'}`} />
                    ) : (
                      <div className="w-2 h-2 mx-auto bg-amber-500 rounded-full" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workout */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              {format(parseISO(selectedDate), 'EEEE, MMMM d')}
            </span>
            <button onClick={() => navigateDate('next')} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
          </div>
          {todayLog && (
            <button
              onClick={() => toggleWorkoutCompletion(todayLog.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                todayLog.completed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {todayLog.completed ? 'Completed' : 'Mark Complete'}
            </button>
          )}
        </div>

        <div className="p-5">
          {!todayLog ? (
            <div className="text-center py-8">
              <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">No workout planned for this day</p>
              <Button size="sm" onClick={() => openModal()}>Add Workout</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayLog.exercises.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No exercises added</p>
              ) : (
                <div className="space-y-2">
                  {todayLog.exercises.map((exercise) => (
                    <div key={exercise.id} className={`flex items-center justify-between p-3 rounded-lg border ${exercise.completed ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleExerciseCompletion(todayLog.id, exercise.id)}>
                          {exercise.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-slate-300 rounded-full hover:border-slate-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-sm font-medium ${exercise.completed ? 'text-green-700 line-through' : 'text-slate-900'}`}>{exercise.name}</p>
                          <p className="text-xs text-slate-500">{exercise.sets} sets × {exercise.reps} reps{exercise.weight && ` @ ${exercise.weight}kg`}</p>
                        </div>
                      </div>
                      <button onClick={() => startRestTimer(60)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Start Rest">
                        <Clock className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {todayLog.notes && (
                <p className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg">{todayLog.notes}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => openModal(todayLog)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />Edit
                </button>
                <button onClick={() => deleteWorkoutLog(todayLog.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingLog ? 'Edit Workout' : 'Add Workout'} className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Exercises</label>
            <div className="space-y-2 mb-4">
              {formData.exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{exercise.name}</p>
                    <p className="text-xs text-slate-500">{exercise.sets} sets × {exercise.reps} reps{exercise.weight && ` @ ${exercise.weight}kg`}</p>
                  </div>
                  <button type="button" onClick={() => removeExercise(exercise.id)} className="p-1 hover:bg-slate-200 rounded">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border border-dashed border-slate-300 rounded-lg space-y-3">
              <Input placeholder="Exercise name" value={newExercise.name} onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Sets" value={newExercise.sets} onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })} min={1} />
                <Input type="number" placeholder="Reps" value={newExercise.reps} onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 0 })} min={1} />
                <Input type="number" placeholder="Weight (kg)" value={newExercise.weight} onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })} min={0} step={0.5} />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addExercise} className="w-full">
                <Plus className="w-4 h-4 mr-2" />Add Exercise
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How was the workout?"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingLog ? 'Update' : 'Add'} Workout</Button>
          </div>
        </form>
      </Modal>

      {/* Workout Timer Modal */}
      <Modal isOpen={showWorkoutTimer} onClose={() => setShowWorkoutTimer(false)} title="Workout Timer" className="max-w-md">
        <WorkoutTimer onComplete={() => setShowWorkoutTimer(false)} />
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Quick Rest Timer</p>
          <div className="flex flex-wrap gap-2">
            {restPresets.map((seconds) => (
              <button key={seconds} onClick={() => startRestTimer(seconds)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
                {seconds}s
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Exercise Timer</p>
          <TimerStopwatch mode="stopwatch" compact={false} />
        </div>
      </Modal>
    </div>
  );
}
