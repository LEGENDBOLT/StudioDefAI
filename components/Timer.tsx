import React from 'react';
import type { SessionType } from '../types';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';

interface TimerProps {
  timeLeft: number;
  initialDuration: number;
  sessionType: SessionType;
  isActive: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addFiveMinutes: () => void;
}

const Timer: React.FC<TimerProps> = ({ 
  timeLeft, 
  initialDuration, 
  sessionType, 
  isActive, 
  startTimer, 
  pauseTimer, 
  resetTimer, 
  addFiveMinutes 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = initialDuration > 0 ? ((initialDuration - timeLeft) / initialDuration) * 100 : 0;
  const circleColor = sessionType === 'study' ? 'stroke-blue-500' : 'stroke-emerald-500';

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2 capitalize">
        Sessione di {sessionType === 'study' ? 'Studio' : 'Pausa'}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        {sessionType === 'study' ? 'È ora di concentrarsi!' : 'È ora di fare una pausa!'}
      </p>
      
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <svg className="absolute w-full h-full" viewBox="0 0 100 100">
          <circle className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" cx="50" cy="50" r="45" fill="transparent" />
          <circle 
            className={`transform -rotate-90 origin-center transition-all duration-500 ${circleColor}`}
            strokeWidth="8" 
            strokeDasharray="283"
            strokeDashoffset={283 - (progress / 100) * 283}
            cx="50" cy="50" r="45" fill="transparent"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-5xl md:text-7xl font-mono font-bold text-slate-800 dark:text-slate-100">{formatTime(timeLeft)}</span>
      </div>

      <div className="flex items-center space-x-4 mt-8">
        <button onClick={resetTimer} className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" aria-label="Resetta timer">
          <RotateCcw size={24} />
        </button>
        <button onClick={isActive ? pauseTimer : startTimer} className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105" aria-label={isActive ? 'Pausa' : 'Avvia'}>
          {isActive ? <Pause size={32} /> : <Play size={32} />}
        </button>
        <button onClick={addFiveMinutes} className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" aria-label="Aggiungi 5 minuti">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default Timer;
