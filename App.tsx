import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Analysis, View, TimerPreset, Theme, SessionType } from './types';
import * as storageService from './services/storageService';
import * as geminiService from './services/geminiService';
import Timer from './components/Timer';
import AnalysisDashboard from './components/AnalysisDashboard';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import FeedbackModal from './components/FeedbackModal';
import { BrainCircuit, Settings as SettingsIcon, TimerIcon } from 'lucide-react';

const DEFAULT_PRESET: TimerPreset = { id: 'default', name: 'Default', study: 45, rest: 15 };
// More compatible silent WAV file
const SILENT_AUDIO_URL = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAAAAAAAA';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => storageService.loadTheme());
  const [currentView, setCurrentView] = useState<View>('timer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0] || DEFAULT_PRESET;

  // --- START: Timer State & Logic (lifted from Timer.tsx) ---
  const [sessionType, setSessionType] = useState<SessionType>('study');
  const [initialDuration, setInitialDuration] = useState(activePreset.study * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionAwaitingFeedback, setSessionAwaitingFeedback] = useState<Omit<Session, 'notes'> | null>(null);

  const timerId = useRef<number | null>(null);
  const deadline = useRef<number | null>(null);
  const sessionStartTime = useRef<string | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  // --- END: Timer State & Logic ---

  useEffect(() => {
    setSessions(storageService.loadSessions());
    setAnalyses(storageService.loadAnalyses());
    const loadedPresets = storageService.loadPresets();
    setPresets(loadedPresets);
    const loadedActiveId = storageService.loadActivePresetId();
    if (loadedActiveId && loadedPresets.some(p => p.id === loadedActiveId)) {
        setActivePresetId(loadedActiveId);
    } else if (loadedPresets.length > 0) {
        setActivePresetId(loadedPresets[0].id);
    }
    // Initialize audio elements
    completionAudioRef.current = new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3');
    silentAudioRef.current = new Audio(SILENT_AUDIO_URL);
    silentAudioRef.current.loop = true;
  }, []);

  useEffect(() => { storageService.saveSessions(sessions); }, [sessions]);
  useEffect(() => { storageService.saveAnalyses(analyses); }, [analyses]);
  useEffect(() => { storageService.savePresets(presets); storageService.saveActivePresetId(activePresetId); }, [presets, activePresetId]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    storageService.saveTheme(theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (theme === 'system') { root.classList.toggle('dark', mediaQuery.matches); } };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // --- START: Timer Functions ---
  const handleSessionComplete = (session: Session) => {
    setSessions(prev => [...prev, session]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const pauseTimer = useCallback(() => {
    setIsActive(false);
    silentAudioRef.current?.pause();
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
    }
  }, []);
  
  const handleSessionSwitch = useCallback((newType: SessionType, shouldPause = true) => {
    if (shouldPause) pauseTimer();
    const newDuration = (newType === 'study' ? activePreset.study : activePreset.rest) * 60;
    setSessionType(newType);
    setInitialDuration(newDuration);
    setTimeLeft(newDuration);
    sessionStartTime.current = null;
  }, [activePreset, pauseTimer]);
  
  const showNotification = (type: SessionType) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = type === 'study' ? 'Sessione di studio finita!' : 'Pausa finita!';
      const body = type === 'study' ? 'È ora di fare una pausa!' : 'È ora di tornare a studiare!';
      new Notification(title, { body });
    }
  };

  const handleTimerCompletion = useCallback(() => {
    if (timerId.current) clearInterval(timerId.current);
    timerId.current = null;
    setIsActive(false);
    silentAudioRef.current?.pause();
    
    completionAudioRef.current?.play().catch(e => console.log("Riproduzione audio fallita:", e));
    showNotification(sessionType);
    
    if (sessionType === 'study') {
       const sessionData: Omit<Session, 'notes'> = {
            id: crypto.randomUUID(),
            startTime: sessionStartTime.current || new Date().toISOString(),
            endTime: new Date().toISOString(),
            type: 'study',
            duration: Math.round(initialDuration / 60),
        };
        setSessionAwaitingFeedback(sessionData);
        setShowFeedbackModal(true);
    } else {
      handleSessionSwitch('study');
    }
  }, [sessionType, handleSessionSwitch, initialDuration]);
  
  const startTimer = useCallback(() => {
    if (timerId.current || timeLeft <= 0) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if (!sessionStartTime.current) {
        sessionStartTime.current = new Date().toISOString();
    }
    setIsActive(true);
    silentAudioRef.current?.play().catch(e => console.error("Riproduzione audio silenzioso fallita:", e));
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
  
  const resetTimer = useCallback(() => {
    pauseTimer();
    const newDuration = (sessionType === 'study' ? activePreset.study : activePreset.rest) * 60;
    setInitialDuration(newDuration);
    setTimeLeft(newDuration);
    sessionStartTime.current = null;
  }, [activePreset, pauseTimer, sessionType]);
  
  useEffect(() => {
    if (!isActive) {
        const newDuration = (sessionType === 'study' ? activePreset.study : activePreset.rest) * 60;
        setInitialDuration(newDuration);
        setTimeLeft(newDuration);
    }
  }, [activePreset, sessionType, isActive]);


  const addFiveMinutes = () => {
    const newTime = timeLeft + 5 * 60;
    setTimeLeft(newTime);
    setInitialDuration(prev => prev + 5 * 60);
    if (isActive && deadline.current) {
      deadline.current += 5 * 60 * 1000;
    }
  };
  
  const handleFeedbackSubmit = (notes: string) => {
    if (!sessionAwaitingFeedback) return;
    const completeSession: Session = {
      ...sessionAwaitingFeedback,
      notes: notes.trim() || "Nessuna nota per questa sessione.",
    };
    handleSessionComplete(completeSession);

    setShowFeedbackModal(false);
    setSessionAwaitingFeedback(null);
    handleSessionSwitch('rest');
  };
  
  const handleFeedbackDismiss = () => {
    if (!sessionAwaitingFeedback) return;
    const completeSession: Session = {
      ...sessionAwaitingFeedback,
      notes: "Nessuna nota fornita.",
    };
    handleSessionComplete(completeSession);
    
    setShowFeedbackModal(false);
    setSessionAwaitingFeedback(null);
    handleSessionSwitch('rest');
  };

  // Effect for document title and Media Session Metadata
  useEffect(() => {
    if (isActive) {
        document.title = `${formatTime(timeLeft)} - ${sessionType === 'study' ? 'Studio' : 'Pausa'}`;
    } else {
        document.title = 'FocusFlow AI';
    }

    if ('mediaSession' in navigator) {
        if (isActive) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `Sessione di ${sessionType === 'study' ? 'Studio' : 'Pausa'}`,
                artist: formatTime(timeLeft),
                album: 'FocusFlow AI',
                artwork: [{ src: 'vite.svg', type: 'image/svg+xml' }]
            });
            navigator.mediaSession.playbackState = 'playing';
        } else {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'paused';
        }
    }
    return () => { document.title = 'FocusFlow AI'; };
  }, [timeLeft, isActive, sessionType]);

  // Effect for Media Session Action Handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', startTimer);
    navigator.mediaSession.setActionHandler('pause', pauseTimer);
    navigator.mediaSession.setActionHandler('stop', pauseTimer);
    const nextSessionType = sessionType === 'study' ? 'rest' : 'study';
    navigator.mediaSession.setActionHandler('nexttrack', () => handleSessionSwitch(nextSessionType, false));
    navigator.mediaSession.setActionHandler('previoustrack', () => handleSessionSwitch(sessionType, false));

    return () => {
        ['play', 'pause', 'stop', 'nexttrack', 'previoustrack'].forEach(action => {
             try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, null); } catch(e) {/* ignored */}
        });
    };
  }, [startTimer, pauseTimer, sessionType, handleSessionSwitch]);

  // --- END: Timer Functions ---

  const handleAnalyze = useCallback(async () => {
    const studySessions = sessions.filter(s => s.type === 'study');
    if (studySessions.length === 0) {
      setError("Hai bisogno di almeno una sessione di studio per l'analisi.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const totalDuration = studySessions.reduce((acc, s) => acc + s.duration, 0);
      const newAnalysisData = await geminiService.analyzeStudySessions(studySessions);
      const newAnalysis: Analysis = {
        ...newAnalysisData,
        date: new Date().toISOString(),
        totalStudyDuration: Math.round(totalDuration),
        sessionCount: studySessions.length,
      };
      setAnalyses(prev => [newAnalysis, ...prev]);
      setSessions([]); // Clear sessions after analysis
    } catch (err) {
      if (err instanceof Error && err.message === "API_KEY_NOT_FOUND") {
          setError("Per favore, aggiungi la tua chiave API Gemini nella scheda Impostazioni per usare le funzioni AI.");
      } else {
        setError("Impossibile ottenere l'analisi dall'AI. Controlla la tua chiave o riprova.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [sessions]);
  
  const handleImportData = (data: { sessions: Session[], analyses: Analysis[] }) => {
    setSessions(data.sessions);
    setAnalyses(data.analyses);
    alert('Dati importati con successo!');
  };

  const renderView = () => {
    switch (currentView) {
      case 'analysis':
        return <AnalysisDashboard analyses={analyses} onAnalyze={handleAnalyze} isLoading={isLoading} sessionCount={sessions.filter(s => s.type === 'study').length} />;
      case 'settings':
        return <Settings
                  sessions={sessions}
                  analyses={analyses}
                  onImport={handleImportData}
                  presets={presets}
                  setPresets={setPresets}
                  activePresetId={activePresetId}
                  setActivePresetId={setActivePresetId}
                  theme={theme}
                  setTheme={setTheme}
                />;
      case 'timer':
      default:
        return <Timer 
                  timeLeft={timeLeft}
                  initialDuration={initialDuration}
                  sessionType={sessionType}
                  isActive={isActive}
                  startTimer={startTimer}
                  pauseTimer={pauseTimer}
                  resetTimer={resetTimer}
                  addFiveMinutes={addFiveMinutes}
                />;
    }
  };

  const navItems = [
    { id: 'timer' as View, label: 'Timer', icon: <TimerIcon size={24} /> },
    { id: 'analysis' as View, label: 'Analisi AI', icon: <BrainCircuit size={24} /> },
    { id: 'settings' as View, label: 'Impostazioni', icon: <SettingsIcon size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-slate-200 flex flex-col font-sans">
       {showFeedbackModal && <FeedbackModal onSubmit={handleFeedbackSubmit} onDismiss={handleFeedbackDismiss} />}
      <main className="flex-grow container mx-auto p-4 pb-24 max-w-2xl">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-600" role="alert">
            <p className="font-bold">Errore</p>
            <p>{error}</p>
          </div>
        )}
        {renderView()}
      </main>
      <BottomNav items={navItems} currentView={currentView} setCurrentView={setCurrentView} timerIsActive={isActive} />
    </div>
  );
};

export default App;