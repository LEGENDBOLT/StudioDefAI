import React from 'react';
import type { View } from '../types';

interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavProps {
  items: NavItem[];
  currentView: View;
  setCurrentView: (view: View) => void;
  timerIsActive: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, currentView, setCurrentView, timerIsActive }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 shadow-t-md flex justify-around items-center z-10 md:max-w-2xl md:mx-auto md:bottom-4 md:rounded-full md:h-20 md:shadow-lg">
      {items.map((item) => {
        const isActive = currentView === item.id;
        const isTimerRunning = item.id === 'timer' && timerIsActive;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out ${
              isActive ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-blue-400 dark:hover:text-blue-400'
            }`}
          >
            <div className={`relative ${isActive ? 'scale-110 -translate-y-1' : ''} transition-transform duration-300`}>
              {item.icon}
               {isTimerRunning && (
                <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/4 ring-2 ring-white dark:ring-gray-900 md:dark:ring-slate-800"></span>
              )}
            </div>
            <span className={`text-xs mt-1 font-medium transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;