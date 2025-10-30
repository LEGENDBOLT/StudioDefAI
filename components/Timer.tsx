import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, SessionType, TimerPreset } from '../types';
import FeedbackModal from './FeedbackModal';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';

interface TimerProps {
  onSessionComplete: (session: Session) => void;
  activePreset: TimerPreset | undefined;
}

const DEFAULT_PRESET: TimerPreset = { id: 'default', name: 'Default', study: 45, rest: 15 };

const Timer: React.FC<TimerProps> = ({ onSessionComplete, activePreset }) => {
  const currentPreset = activePreset || DEFAULT_PRESET;
  const [sessionType, setSessionType] = useState<SessionType>('study');
  const [initialDuration, setInitialDuration] = useState(currentPreset.study * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const timerId = useRef<number | null>(null);
  const deadline = useRef<number | null>(null);
  const sessionStartTime = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
  }, []);

  useEffect(() => {
    if (!isActive) {
      handleSessionSwitch(sessionType, false);
    }
  }, [activePreset]);

  const showNotification = (type: SessionType) => {
    if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
      const title = type === 'study' ? 'Sessione di studio finita!' : 'Pausa finita!';
      const body = type === 'study' ? 'È ora di fare una pausa!' : 'È ora di tornare a studiare!';
      new Notification(title, { body });
    }
  };

  const handleTimerCompletion = useCallback(() => {
    if (timerId.current) clearInterval(timerId.current);
    timerId.current = null;
    setIsActive(false);
    
    audioRef.current?.play().catch(e => console.log("Riproduzione audio fallita:", e));
    showNotification(sessionType);
    
    if (sessionType === 'study') {
      setShowModal(true);
    } else {
      handleSessionSwitch('study');
    }
  }, [sessionType]);

  const startTimer = useCallback(() => {
    if (timerId.current || timeLeft <= 0) return;
    if (!sessionStartTime.current) {
        sessionStartTime.current = new Date().toISOString();
    }
    setIsActive(true);
    deadline.current = Date.now() + timeLeft * 1000;
    
    timerId.current = window.setInterval(() => {
      const newTimeLeft = Math.round((deadline.current! - Date.now()) / 1000);
      if (newTimeLeft <= 0) {
        setTimeLeft(0);
        handleTimerCompletion();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);
  }, [timeLeft, handleTimerCompletion]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeLeft(initialDuration);
    sessionStartTime.current = null;
  }, [initialDuration, pauseTimer]);
  
  const handleSessionSwitch = useCallback((newType: SessionType, shouldPause = true) => {
    if (shouldPause) pauseTimer();
    const newDuration = (newType === 'study' ? currentPreset.study : currentPreset.rest) * 60;
    setSessionType(newType);
    setInitialDuration(newDuration);
    setTimeLeft(newDuration);
    sessionStartTime.current = null;
  }, [currentPreset, pauseTimer]);

  const addFiveMinutes = () => {
    const newTimeLeft = timeLeft + 5 * 60;
    setTimeLeft(newTimeLeft);
    setInitialDuration(prev => prev + 5 * 60);
    if (isActive && deadline.current) {
      deadline.current += 5 * 60 * 1000;
    }
  };
  
  useEffect(() => {
    return () => {
      if(timerId.current) clearInterval(timerId.current)
    };
  }, []);

  const handleModalSubmit = (notes: string) => {
    const session: Session = {
      id: crypto.randomUUID(),
      startTime: sessionStartTime.current || new Date().toISOString(),
      endTime: new Date().toISOString(),
      type: 'study',
      duration: Math.round(initialDuration / 60),
      notes: notes,
    };
    onSessionComplete(session);
    setShowModal(false);
    handleSessionSwitch('rest');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = initialDuration > 0 ? ((initialDuration - timeLeft) / initialDuration) * 100 : 0;
  const circleColor = sessionType === 'study' ? 'stroke-blue-500' : 'stroke-emerald-500';

  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      {showModal && <FeedbackModal onSubmit={handleModalSubmit} onDismiss={() => {
        setShowModal(false);
        handleSessionSwitch('rest');
        }} />}

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