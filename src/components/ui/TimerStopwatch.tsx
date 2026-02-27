import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Timer, Bell, VolumeX } from 'lucide-react';
import { Button } from './Button';

type TimerMode = 'stopwatch' | 'timer';

interface TimerStopwatchProps {
  mode?: TimerMode;
  onTimeUpdate?: (seconds: number) => void;
  onTimerComplete?: () => void;
  initialTime?: number; // in seconds, for timer mode
  compact?: boolean;
  className?: string;
  label?: string;
}

// Alarm controller interface
interface AlarmController {
  stop: () => void;
  isPlaying: boolean;
}

// Create a continuous beeping alarm that plays until stopped
function createContinuousAlarm(onStop?: () => void): AlarmController {
  let isPlaying = true;
  let audioContext: AudioContext | null = null;
  let intervalId: number | null = null;
  let timeoutId: number | null = null;

  const playBeepSequence = () => {
    if (!isPlaying) return;

    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const now = audioContext.currentTime;
      
      // Create 3 rising beeps
      const frequencies = [700, 900, 1100];
      const beepDuration = 0.2;
      const gap = 0.1;
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext!.createOscillator();
        const gainNode = audioContext!.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext!.destination);
        
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
      
      // Long sustained tone
      const sustainedOsc = audioContext.createOscillator();
      const sustainedGain = audioContext.createGain();
      
      sustainedOsc.connect(sustainedGain);
      sustainedGain.connect(audioContext.destination);
      
      const sustainStart = now + (3 * (beepDuration + gap));
      
      sustainedOsc.frequency.value = 880;
      sustainedOsc.type = 'sine';
      
      sustainedGain.gain.setValueAtTime(0, sustainStart);
      sustainedGain.gain.linearRampToValueAtTime(0.6, sustainStart + 0.05);
      sustainedGain.gain.setValueAtTime(0.6, sustainStart + 0.8);
      sustainedGain.gain.linearRampToValueAtTime(0, sustainStart + 1.0);
      
      sustainedOsc.start(sustainStart);
      sustainedOsc.stop(sustainStart + 1.0);
      
    } catch (e) {
      console.log('Audio not supported:', e);
    }
  };

  // Start the alarm - plays beep sequence every 1.5 seconds
  playBeepSequence();
  intervalId = window.setInterval(() => {
    if (isPlaying) {
      playBeepSequence();
    }
  }, 1500);

  // Auto-stop after 30 seconds
  timeoutId = window.setTimeout(() => {
    stop();
  }, 30000);

  const stop = () => {
    isPlaying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    onStop?.();
  };

  return {
    stop,
    get isPlaying() { return isPlaying; }
  };
}

export function TimerStopwatch({
  mode: initialMode = 'stopwatch',
  onTimeUpdate,
  onTimerComplete,
  initialTime = 1500, // 25 minutes default (Pomodoro)
  compact = false,
  className = '',
  label
}: TimerStopwatchProps) {
  const [mode, setMode] = useState<TimerMode>(initialMode);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // For stopwatch
  const [remainingSeconds, setRemainingSeconds] = useState(initialTime); // For timer
  const [timerDuration, setTimerDuration] = useState(initialTime);
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timerInput, setTimerInput] = useState({ hours: 0, minutes: 25, seconds: 0 });
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  
  const alarmRef = useRef<AlarmController | null>(null);

  // Preset durations for timer
  const presets = [
    { label: '5m', seconds: 5 * 60 },
    { label: '15m', seconds: 15 * 60 },
    { label: '25m', seconds: 25 * 60 },
    { label: '45m', seconds: 45 * 60 },
    { label: '1h', seconds: 60 * 60 },
    { label: '2h', seconds: 2 * 60 * 60 },
  ];

  // Format time display
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cleanup alarm on unmount
  useEffect(() => {
    return () => {
      if (alarmRef.current) {
        alarmRef.current.stop();
      }
    };
  }, []);

  // Stopwatch effect
  useEffect(() => {
    let interval: number;
    
    if (isRunning && mode === 'stopwatch') {
      interval = window.setInterval(() => {
        setElapsedSeconds(prev => {
          const newValue = prev + 1;
          onTimeUpdate?.(newValue);
          return newValue;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, mode, onTimeUpdate]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    
    if (isRunning && mode === 'timer') {
      interval = window.setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimerComplete?.();
            // Start continuous alarm
            startAlarm();
            return 0;
          }
          const newValue = prev - 1;
          onTimeUpdate?.(timerDuration - newValue);
          return newValue;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, mode, timerDuration, onTimeUpdate, onTimerComplete]);

  const startAlarm = useCallback(() => {
    // Stop any existing alarm first
    if (alarmRef.current) {
      alarmRef.current.stop();
    }
    
    setIsAlarmPlaying(true);
    alarmRef.current = createContinuousAlarm(() => {
      setIsAlarmPlaying(false);
    });
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current = null;
    }
    setIsAlarmPlaying(false);
  }, []);

  const handleStart = () => {
    stopAlarm(); // Stop any playing alarm
    setIsRunning(true);
  };
  
  const handlePause = () => setIsRunning(false);
  
  const handleStop = () => {
    setIsRunning(false);
    stopAlarm();
    if (mode === 'stopwatch') {
      const finalTime = elapsedSeconds;
      setElapsedSeconds(0);
      return finalTime;
    } else {
      setRemainingSeconds(timerDuration);
      return timerDuration - remainingSeconds;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    stopAlarm();
    if (mode === 'stopwatch') {
      setElapsedSeconds(0);
    } else {
      setRemainingSeconds(timerDuration);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    stopAlarm();
    setMode(newMode);
    if (newMode === 'stopwatch') {
      setElapsedSeconds(0);
    } else {
      setRemainingSeconds(timerDuration);
    }
  };

  const setPresetTime = (seconds: number) => {
    setTimerDuration(seconds);
    setRemainingSeconds(seconds);
    setShowTimerSetup(false);
  };

  const setCustomTime = () => {
    const totalSeconds = timerInput.hours * 3600 + timerInput.minutes * 60 + timerInput.seconds;
    if (totalSeconds > 0) {
      setTimerDuration(totalSeconds);
      setRemainingSeconds(totalSeconds);
      setShowTimerSetup(false);
    }
  };

  const currentTime = mode === 'stopwatch' ? elapsedSeconds : remainingSeconds;
  const progress = mode === 'timer' ? ((timerDuration - remainingSeconds) / timerDuration) * 100 : 0;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
          <button
            onClick={() => switchMode('stopwatch')}
            className={`p-1 rounded ${mode === 'stopwatch' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Stopwatch"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => switchMode('timer')}
            className={`p-1 rounded ${mode === 'timer' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Timer"
          >
            <Timer className="w-4 h-4" />
          </button>
        </div>
        
        <span className={`font-mono text-lg font-bold ${isAlarmPlaying ? 'text-red-600 animate-pulse' : isRunning ? 'text-green-600' : 'text-gray-700'}`}>
          {formatTime(currentTime)}
        </span>
        
        <div className="flex items-center gap-1">
          {isAlarmPlaying ? (
            <button
              onClick={stopAlarm}
              className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors animate-pulse"
              title="Stop Alarm"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          ) : !isRunning ? (
            <button
              onClick={handleStart}
              className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Start"
            >
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="p-1.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-1.5 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 ${className}`}>
      {label && (
        <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">{label}</h3>
      )}
      
      {/* Mode Tabs */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => switchMode('stopwatch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'stopwatch'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Stopwatch
          </button>
          <button
            onClick={() => switchMode('timer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'timer'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Timer className="w-4 h-4" />
            Timer
          </button>
        </div>
      </div>

      {/* Alarm Playing Indicator */}
      {isAlarmPlaying && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 rounded-xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Bell className="w-8 h-8 text-red-600 animate-bounce" />
            <span className="text-xl font-bold text-red-700">Time's Up!</span>
            <Bell className="w-8 h-8 text-red-600 animate-bounce" />
          </div>
          <Button
            onClick={stopAlarm}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
          >
            <VolumeX className="w-5 h-5 mr-2" />
            Stop Alarm
          </Button>
        </div>
      )}

      {/* Timer Display */}
      <div className="relative flex justify-center mb-6">
        {mode === 'timer' && (
          <svg className="absolute w-48 h-48 -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke={isAlarmPlaying ? '#ef4444' : remainingSeconds === 0 ? '#ef4444' : '#6366f1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
        )}
        
        <div className={`flex flex-col items-center justify-center ${mode === 'timer' ? 'w-48 h-48' : ''}`}>
          <span className={`font-mono font-bold ${
            mode === 'timer' ? 'text-4xl' : 'text-5xl'
          } ${
            isAlarmPlaying 
              ? 'text-red-600 animate-pulse'
              : isRunning 
                ? 'text-green-600' 
                : remainingSeconds === 0 && mode === 'timer'
                  ? 'text-red-500'
                  : 'text-gray-800'
          }`}>
            {formatTime(currentTime)}
          </span>
          {mode === 'stopwatch' && isRunning && (
            <span className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Running
            </span>
          )}
          {mode === 'timer' && remainingSeconds === 0 && !isAlarmPlaying && (
            <span className="flex items-center gap-1 mt-2 text-sm text-red-500">
              <Bell className="w-4 h-4" />
              Time's up!
            </span>
          )}
        </div>
      </div>

      {/* Timer Presets (Timer Mode Only) */}
      {mode === 'timer' && !isRunning && !isAlarmPlaying && (
        <div className="mb-6">
          {!showTimerSetup ? (
            <div className="flex flex-wrap justify-center gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPresetTime(preset.seconds)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    timerDuration === preset.seconds
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setShowTimerSetup(true)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={timerInput.hours}
                    onChange={(e) => setTimerInput({ ...timerInput, hours: parseInt(e.target.value) || 0 })}
                    className="w-16 text-center text-2xl font-mono border rounded-lg p-2"
                  />
                  <span className="text-xs text-gray-500 mt-1">Hours</span>
                </div>
                <span className="text-2xl font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerInput.minutes}
                    onChange={(e) => setTimerInput({ ...timerInput, minutes: parseInt(e.target.value) || 0 })}
                    className="w-16 text-center text-2xl font-mono border rounded-lg p-2"
                  />
                  <span className="text-xs text-gray-500 mt-1">Minutes</span>
                </div>
                <span className="text-2xl font-bold text-gray-400">:</span>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={timerInput.seconds}
                    onChange={(e) => setTimerInput({ ...timerInput, seconds: parseInt(e.target.value) || 0 })}
                    className="w-16 text-center text-2xl font-mono border rounded-lg p-2"
                  />
                  <span className="text-xs text-gray-500 mt-1">Seconds</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTimerSetup(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={setCustomTime}
                  className="flex-1"
                >
                  Set Timer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {isAlarmPlaying ? (
          <Button
            onClick={stopAlarm}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 animate-pulse"
          >
            <VolumeX className="w-5 h-5 mr-2" />
            Stop Alarm
          </Button>
        ) : !isRunning ? (
          <Button
            onClick={handleStart}
            className="px-8 py-3 bg-green-500 hover:bg-green-600"
            disabled={mode === 'timer' && remainingSeconds === 0}
          >
            <Play className="w-5 h-5 mr-2" />
            {mode === 'stopwatch' || remainingSeconds === timerDuration ? 'Start' : 'Resume'}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600"
          >
            <Pause className="w-5 h-5 mr-2" />
            Pause
          </Button>
        )}
        
        <Button
          variant="secondary"
          onClick={handleReset}
          className="px-6 py-3"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Reset
        </Button>
        
        {isRunning && (
          <Button
            variant="danger"
            onClick={handleStop}
            className="px-6 py-3"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}

// Standalone Workout Timer with rest periods
interface WorkoutTimerProps {
  onComplete?: (totalTime: number) => void;
  className?: string;
}

export function WorkoutTimer({ onComplete, className = '' }: WorkoutTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [restMode, setRestMode] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(60); // Default 60 seconds rest
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  
  const alarmRef = useRef<AlarmController | null>(null);

  const restPresets = [30, 45, 60, 90, 120];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (alarmRef.current) {
        alarmRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let interval: number;
    
    if (isRunning && !restMode) {
      interval = window.setInterval(() => {
        setTotalSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, restMode]);

  useEffect(() => {
    let interval: number;
    
    if (restMode && restSeconds > 0) {
      interval = window.setInterval(() => {
        setRestSeconds(prev => {
          if (prev <= 1) {
            setRestMode(false);
            // Start continuous alarm
            startAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [restMode, restSeconds]);

  const startAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.stop();
    }
    setIsAlarmPlaying(true);
    alarmRef.current = createContinuousAlarm(() => {
      setIsAlarmPlaying(false);
    });
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current = null;
    }
    setIsAlarmPlaying(false);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRest = () => {
    stopAlarm();
    setRestMode(true);
    setRestSeconds(restDuration);
  };

  const skipRest = () => {
    setRestMode(false);
    setRestSeconds(0);
    stopAlarm();
  };

  const handleComplete = () => {
    setIsRunning(false);
    stopAlarm();
    onComplete?.(totalSeconds);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(0);
    setRestMode(false);
    setRestSeconds(0);
    stopAlarm();
  };

  return (
    <div className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
          <Timer className="w-5 h-5 text-green-600" />
          Workout Timer
        </h3>
      </div>

      {/* Alarm Playing Indicator */}
      {isAlarmPlaying && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-xl text-center animate-pulse">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bell className="w-6 h-6 text-red-600 animate-bounce" />
            <span className="text-lg font-bold text-red-700">Rest Complete!</span>
            <Bell className="w-6 h-6 text-red-600 animate-bounce" />
          </div>
          <Button
            onClick={stopAlarm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Stop Alarm
          </Button>
        </div>
      )}

      {/* Main Timer */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-mono font-bold ${isAlarmPlaying ? 'text-red-600 animate-pulse' : isRunning ? 'text-green-600' : 'text-gray-800'}`}>
          {formatTime(totalSeconds)}
        </div>
        {isRunning && !restMode && !isAlarmPlaying && (
          <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Workout in progress
          </p>
        )}
      </div>

      {/* Rest Timer */}
      {restMode && (
        <div className="bg-blue-100 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-blue-700 font-medium mb-2">Rest Period</p>
          <div className="text-3xl font-mono font-bold text-blue-600">
            {formatTime(restSeconds)}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={skipRest}
            className="mt-3"
          >
            Skip Rest
          </Button>
        </div>
      )}

      {/* Rest Duration Presets */}
      {!restMode && isRunning && !isAlarmPlaying && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 text-center mb-2">Rest Duration</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {restPresets.map((seconds) => (
              <button
                key={seconds}
                onClick={() => setRestDuration(seconds)}
                className={`px-3 py-1 text-sm rounded-full ${
                  restDuration === seconds
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {seconds}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">
        {isAlarmPlaying ? (
          <Button
            onClick={stopAlarm}
            className="bg-red-500 hover:bg-red-600 animate-pulse"
          >
            <VolumeX className="w-5 h-5 mr-2" />
            Stop Alarm
          </Button>
        ) : !isRunning ? (
          <Button
            onClick={() => setIsRunning(true)}
            className="px-6 bg-green-500 hover:bg-green-600"
          >
            <Play className="w-5 h-5 mr-2" />
            {totalSeconds > 0 ? 'Resume' : 'Start Workout'}
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setIsRunning(false)}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
            {!restMode && (
              <Button
                variant="secondary"
                onClick={startRest}
              >
                <Clock className="w-5 h-5 mr-2" />
                Start Rest
              </Button>
            )}
          </>
        )}
        
        {totalSeconds > 0 && !isAlarmPlaying && (
          <>
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
            <Button
              variant="danger"
              onClick={handleComplete}
            >
              <Square className="w-5 h-5 mr-2" />
              Finish
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
