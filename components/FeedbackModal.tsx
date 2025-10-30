import React, { useState } from 'react';

interface FeedbackModalProps {
  onSubmit: (notes: string) => void;
  onDismiss: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onSubmit, onDismiss }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes.trim() || "Nessuna nota per questa sessione.");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in-up">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Sessione Completata!</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">Com'è andata la tua sessione di studio? Le tue note aiuteranno l'AI ad analizzare i tuoi progressi.</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mi sentivo concentrato, ma mi sono distratto..."
            className="w-full h-28 p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            autoFocus
          />
          <div className="flex justify-end space-x-3 mt-4">
             <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
            >
              Salta
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;