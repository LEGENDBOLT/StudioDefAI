export type SessionType = 'study' | 'rest';

export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  type: SessionType;
  duration: number; // in minutes
  notes: string;
}

export interface Analysis {
  date: string;
  concentration: number;
  studyCapacity: number;
  stress: number;
  happiness: number;
  summary: string;
  suggestions: string[];
}

export type View = 'timer' | 'analysis' | 'settings';

export interface TimerPreset {
  id: string;
  name: string;
  study: number; // in minutes
  rest: number; // in minutes
}

export type Theme = 'light' | 'dark' | 'system';
