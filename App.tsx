import React, { useState, useEffect, useCallback } from 'react';
import { Session, Analysis, View, TimerPreset, Theme } from './types';
import * as storageService from './services/storageService';
import * as geminiService from './services/geminiService';
import Timer from './components/Timer';
import AnalysisDashboard from './components/AnalysisDashboard';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import { BrainCircuit, Settings as SettingsIcon, TimerIcon } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [presets, setPresets] = useState<TimerPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => storageService.loadTheme());
  const [currentView, setCurrentView] = useState<View>('timer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessions(storageService.loadSessions());
    setAnalyses(storageService.loadAnalyses());
    const loadedPresets = storageService.loadPresets();
    setPresets(loadedPresets);
    const loadedActiveId = storageService.loadActivePresetId();
    // If no active ID is set, or if the active preset was deleted, set the first preset as active.
    if (loadedActiveId && loadedPresets.some(p => p.id === loadedActiveId)) {
        setActivePresetId(loadedActiveId);
    } else if (loadedPresets.length > 0) {
        setActivePresetId(loadedPresets[0].id);
    }
  }, []);

  useEffect(() => {
    storageService.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    storageService.saveAnalyses(analyses);
  }, [analyses]);

  useEffect(() => {
    storageService.savePresets(presets);
    storageService.saveActivePresetId(activePresetId);
  }, [presets, activePresetId]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    storageService.saveTheme(theme);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
           root.classList.toggle('dark', mediaQuery.matches);
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  const handleSessionComplete = (session: Session) => {
    setSessions(prev => [...prev, session]);
  };

  const handleAnalyze = useCallback(async () => {
    if (sessions.length === 0) {
      setError("Hai bisogno di almeno una sessione di studio per l'analisi.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newAnalysis = await geminiService.analyzeStudySessions(sessions);
      setAnalyses(prev => [{...newAnalysis, date: new Date().toISOString() }, ...prev]);
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

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

  const renderView = () => {
    switch (currentView) {
      case 'analysis':
        return <AnalysisDashboard analyses={analyses} onAnalyze={handleAnalyze} isLoading={isLoading} sessionCount={sessions.length} />;
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
        return <Timer onSessionComplete={handleSessionComplete} activePreset={activePreset} />;
    }
  };

  const navItems = [
    { id: 'timer' as View, label: 'Timer', icon: <TimerIcon size={24} /> },
    { id: 'analysis' as View, label: 'Analisi AI', icon: <BrainCircuit size={24} /> },
    { id: 'settings' as View, label: 'Impostazioni', icon: <SettingsIcon size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-slate-200 flex flex-col font-sans">
      <main className="flex-grow container mx-auto p-4 pb-24 max-w-2xl">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-600" role="alert">
            <p className="font-bold">Errore</p>
            <p>{error}</p>
          </div>
        )}
        {renderView()}
      </main>
      <BottomNav items={navItems} currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;