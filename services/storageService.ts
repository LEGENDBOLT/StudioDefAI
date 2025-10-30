import { Session, Analysis, TimerPreset, Theme } from '../types';

const SESSIONS_KEY = 'focusflow_sessions';
const ANALYSES_KEY = 'focusflow_analyses';
const API_KEY_KEY = 'focusflow_api_key';
const PRESETS_KEY = 'focusflow_presets';
const ACTIVE_PRESET_ID_KEY = 'focusflow_active_preset_id';
const THEME_KEY = 'focusflow_theme';

const DEFAULT_PRESETS: TimerPreset[] = [
    { id: 'default-45-15', name: 'Standard Focus', study: 45, rest: 15 },
    { id: 'default-25-5', name: 'Pomodoro', study: 25, rest: 5 },
];

// Sessions
export const saveSessions = (sessions: Session[]): void => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to save sessions:", error);
  }
};

export const loadSessions = (): Session[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load sessions:", error);
    return [];
  }
};

// Analyses
export const saveAnalyses = (analyses: Analysis[]): void => {
  try {
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(analyses));
  } catch (error) {
    console.error("Failed to save analyses:", error);
  }
};

export const loadAnalyses = (): Analysis[] => {
  try {
    const data = localStorage.getItem(ANALYSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load analyses:", error);
    return [];
  }
};

// API Key
export const saveApiKey = (apiKey: string): void => {
  try {
    localStorage.setItem(API_KEY_KEY, apiKey);
  } catch (error) {
    console.error("Failed to save API key:", error);
  }
};

export const loadApiKey = (): string | null => {
  try {
    return localStorage.getItem(API_KEY_KEY);
  } catch (error) {
    console.error("Failed to load API key:", error);
    return null;
  }
};

// Presets
export const savePresets = (presets: TimerPreset[]): void => {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error("Failed to save presets:", error);
  }
};

export const loadPresets = (): TimerPreset[] => {
  try {
    const data = localStorage.getItem(PRESETS_KEY);
    if (data) {
        const presets = JSON.parse(data);
        return presets.length > 0 ? presets : DEFAULT_PRESETS;
    }
    return DEFAULT_PRESETS;
  } catch (error) {
    console.error("Failed to load presets:", error);
    return DEFAULT_PRESETS;
  }
};

export const saveActivePresetId = (id: string | null): void => {
    try {
        if (id) {
            localStorage.setItem(ACTIVE_PRESET_ID_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_PRESET_ID_KEY);
        }
    } catch (error) {
        console.error("Failed to save active preset ID:", error);
    }
};

export const loadActivePresetId = (): string | null => {
    try {
        return localStorage.getItem(ACTIVE_PRESET_ID_KEY);
    } catch (error) {
        console.error("Failed to load active preset ID:", error);
        return null;
    }
};

// Theme
export const saveTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error("Failed to save theme:", error);
  }
};

export const loadTheme = (): Theme => {
  try {
    const theme = localStorage.getItem(THEME_KEY) as Theme | null;
    return theme || 'system'; // Default to system preference
  } catch (error) {
    console.error("Failed to load theme:", error);
    return 'system';
  }
};