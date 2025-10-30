import React from 'react';
import { Analysis } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Lightbulb, BookOpen, Smile, Frown, BrainCircuit } from 'lucide-react';

interface AnalysisDashboardProps {
  analyses: Analysis[];
  onAnalyze: () => void;
  isLoading: boolean;
  sessionCount: number;
}

const MetricCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => {
    const getColor = (value: number) => {
        if (value > 75) return 'text-emerald-500';
        if (value > 40) return 'text-yellow-500';
        return 'text-red-500';
    }
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-700 ${getColor(value)}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                <p className={`text-2xl font-bold ${getColor(value)}`}>{value}<span className="text-sm font-normal">/100</span></p>
            </div>
        </div>
    );
};


const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analyses, onAnalyze, isLoading, sessionCount }) => {
  const latestAnalysis = analyses[0];
  const chartData = [...analyses].reverse().map(a => ({
    date: new Date(a.date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
    Concentrazione: a.concentration,
    Felicità: a.happiness,
    Capacità: a.studyCapacity
  }));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Analisi Produttività AI</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Scopri insight sulle tue abitudini di studio e benessere.</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Pronto per l'Analisi?</h2>
             <p className="text-slate-500 dark:text-slate-400 mt-1">{sessionCount} session{sessionCount !== 1 ? 'i' : 'e'} non analizzat{sessionCount !== 1 ? 'e' : 'a'} in attesa.</p>
          </div>
          <button
            onClick={onAnalyze}
            disabled={isLoading || sessionCount === 0}
            className="mt-4 md:mt-0 w-full md:w-auto flex items-center justify-center px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizzando...
              </>
            ) : (
                <>
                <BrainCircuit size={20} className="mr-2"/>
                Genera Analisi
                </>
            )}
          </button>
        </div>
      </div>
      
      {latestAnalysis && (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 text-center">Ultima Analisi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Concentrazione" value={latestAnalysis.concentration} icon={<BrainCircuit size={24}/>} />
                <MetricCard title="Capacità Studio" value={latestAnalysis.studyCapacity} icon={<BookOpen size={24}/>} />
                <MetricCard title="Stress" value={100 - latestAnalysis.stress} icon={<Frown size={24}/>} />
                <MetricCard title="Felicità" value={latestAnalysis.happiness} icon={<Smile size={24}/>} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Riepilogo</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-2">{latestAnalysis.summary}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center"><Lightbulb size={20} className="mr-2 text-yellow-500"/> Suggerimenti AI</h3>
                <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                    {latestAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            </div>
        </div>
      )}
      
      {analyses.length > 1 && (
         <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm">
             <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-4">Progressi nel Tempo</h3>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700"/>
                    <XAxis dataKey="date" tick={{fill: '#64748b', fontSize: 12}} className="dark:tick-slate-400" axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} className="dark:tick-slate-400" axisLine={false} tickLine={false} domain={[0, 100]}/>
                    <Tooltip contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem'}}/>
                    <Legend wrapperStyle={{fontSize: "14px"}}/>
                    <Bar dataKey="Concentrazione" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                    <Bar dataKey="Capacità" fill="#10b981" radius={[4, 4, 0, 0]}/>
                    <Bar dataKey="Felicità" fill="#f59e0b" radius={[4, 4, 0, 0]}/>
                </BarChart>
             </ResponsiveContainer>
         </div>
      )}

      {analyses.length === 0 && !latestAnalysis && (
        <div className="text-center py-12">
            <BrainCircuit size={48} className="mx-auto text-slate-400"/>
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Nessuna Analisi Ancora</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Completa alcune sessioni di studio e genera la tua prima analisi per vedere i tuoi progressi.</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;