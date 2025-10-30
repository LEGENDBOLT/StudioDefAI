import React, { useRef, useState, useEffect } from 'react';
import { Session, Analysis, TimerPreset, Theme } from '../types';
import { Download, Upload, KeyRound, Save, Sun, Moon, Laptop, Trash2, Bell, Check, PlusCircle } from 'lucide-react';
import * as storageService from '../services/storageService';

interface SettingsProps {
  sessions: Session[];
  analyses: Analysis[];
  onImport: (data: { sessions: Session[], analyses: Analysis[] }) => void;
  presets: TimerPreset[];
  setPresets: React.Dispatch<React.SetStateAction<TimerPreset[]>>;
  activePresetId: string | null;
  setActivePresetId: (id: string | null) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({ sessions, analyses, onImport, presets, setPresets, activePresetId, setActivePresetId, theme, setTheme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetStudy, setNewPresetStudy] = useState(45);
  const [newPresetRest, setNewPresetRest] = useState(15);


  useEffect(() => {
    const existingKey = storageService.loadApiKey();
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  const handleExport = () => {
    const data = { sessions, analyses };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const handleImportClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File non leggibile");
        const importedData = JSON.parse(text);
        if (Array.isArray(importedData.sessions) && Array.isArray(importedData.analyses)) {
          onImport(importedData);
        } else {
          alert("Formato file di backup non valido.");
        }
      } catch (error) {
        console.error("Import fallito:", error);
        alert("Import fallito. Il file potrebbe essere corrotto o in formato errato.");
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApiKeySave = () => {
    storageService.saveApiKey(apiKey);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  
  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleAddPreset = () => {
    if (!newPresetName.trim() || newPresetStudy <= 0 || newPresetRest <= 0) {
      alert("Per favore, inserisci un nome e durate valide per il preset.");
      return;
    }
    const newPreset: TimerPreset = {
      id: crypto.randomUUID(),
      name: newPresetName,
      study: newPresetStudy,
      rest: newPresetRest
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    if (!activePresetId) {
        setActivePresetId(newPreset.id);
    }
    setNewPresetName('');
    setNewPresetStudy(45);
    setNewPresetRest(15);
  };

  const handleDeletePreset = (idToDelete: string) => {
    const updatedPresets = presets.filter(p => p.id !== idToDelete);
    setPresets(updatedPresets);
    if (activePresetId === idToDelete) {
      setActivePresetId(updatedPresets.length > 0 ? updatedPresets[0].id : null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Impostazioni</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Gestisci i dati e le preferenze della tua applicazione.</p>
      </div>

       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Aspetto</h2>
         <div className="flex justify-around items-center pt-2">
            {(['light', 'dark', 'system'] as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${theme === t ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {t === 'light' ? <Sun size={18}/> : t === 'dark' ? <Moon size={18}/> : <Laptop size={18}/>}
                    <span className="capitalize">{t === 'system' ? 'Sistema' : t === 'light' ? 'Chiaro' : 'Scuro'}</span>
                </button>
            ))}
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center">
          <KeyRound size={24} className="mr-3 text-blue-500" />
          Chiave API Gemini
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Per abilitare le funzioni di analisi AI, hai bisogno di una chiave API di Google AI Gemini. L'app funziona anche senza, ma la scheda di analisi sarà disabilitata.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
            Puoi ottenere una chiave gratuita da{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                Google AI Studio
            </a>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center pt-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Inserisci qui la tua chiave API"
              className="flex-grow w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              aria-label="Input Chiave API Gemini"
            />
            <button
             onClick={handleApiKeySave}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Save size={18} />
              {saveStatus === 'saved' ? 'Salvata!' : 'Salva Chiave'}
            </button>
        </div>
      </div>

       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Preset Timer</h2>
        <div className="space-y-3">
          {presets.map(p => (
            <div key={p.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${activePresetId === p.id ? 'bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{p.study} min studio / {p.rest} min pausa</p>
              </div>
              <div className="flex items-center gap-2">
                {activePresetId !== p.id && (
                  <button onClick={() => setActivePresetId(p.id)} className="p-2 text-slate-500 hover:text-emerald-500" title="Attiva preset"><Check size={18}/></button>
                )}
                 <button onClick={() => handleDeletePreset(p.id)} className="p-2 text-slate-500 hover:text-red-500" title="Elimina preset"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Aggiungi Nuovo Preset</h3>
            <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="Nome (es. Pomodoro)" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg"/>
            <div className="flex gap-4">
                <input type="number" value={newPresetStudy} onChange={e => setNewPresetStudy(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" placeholder="Minuti studio"/>
                <input type="number" value={newPresetRest} onChange={e => setNewPresetRest(parseInt(e.target.value))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" placeholder="Minuti pausa"/>
            </div>
            <button onClick={handleAddPreset} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"><PlusCircle size={18}/> Aggiungi</button>
        </div>
      </div>
      
       <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Notifiche</h2>
         <p className="text-slate-600 dark:text-slate-300">
           Abilita le notifiche per essere avvisato quando una sessione di studio o una pausa terminano, anche se l'app è in background.
        </p>
         <button onClick={requestNotificationPermission} disabled={notificationPermission !== 'default'} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors">
            <Bell size={20} />
           {notificationPermission === 'granted' ? 'Notifiche Abilitate' : notificationPermission === 'denied' ? 'Notifiche Bloccate' : 'Abilita Notifiche'}
         </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Gestione Dati</h2>
        <p className="text-slate-600 dark:text-slate-300">
          Salva la cronologia delle sessioni e i dati di analisi in un file sul tuo dispositivo, o carica un backup precedente.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
           <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 transition-colors">
             <Download size={20} /> Esporta Dati
           </button>
           <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-600 transition-colors">
             <Upload size={20} /> Importa Dati
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden"/>
        </div>
      </div>
      
      <div className="text-center text-sm text-slate-400 dark:text-slate-500 pt-6">
          <p>Creato da Gabriele Ottonelli</p>
      </div>
    </div>
  );
};

export default Settings;