import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ScoreCard, ScreeningJob, AppSettings, DEFAULT_SETTINGS } from '../types';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  scoreCards: ScoreCard[];
  currentJob: ScreeningJob | null;
  isLoading: boolean;
  error: string | null;
  settings: AppSettings;
  serverConnected: boolean;
  selectedCompany: ScoreCard | null;
}

type AppAction =
  | { type: 'SET_SCORECARDS'; payload: ScoreCard[] }
  | { type: 'SET_JOB'; payload: ScreeningJob | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_SERVER_CONNECTED'; payload: boolean }
  | { type: 'SET_SELECTED_COMPANY'; payload: ScoreCard | null }
  | { type: 'ADD_SCORECARD'; payload: ScoreCard }
  | { type: 'UPDATE_JOB_PROGRESS'; payload: Partial<ScreeningJob> };

const initialState: AppState = {
  scoreCards: [],
  currentJob: null,
  isLoading: false,
  error: null,
  settings: DEFAULT_SETTINGS,
  serverConnected: false,
  selectedCompany: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCORECARDS':
      return { ...state, scoreCards: action.payload };
    case 'SET_JOB':
      return { ...state, currentJob: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SERVER_CONNECTED':
      return { ...state, serverConnected: action.payload };
    case 'SET_SELECTED_COMPANY':
      return { ...state, selectedCompany: action.payload };
    case 'ADD_SCORECARD':
      return {
        ...state,
        scoreCards: [...state.scoreCards.filter(
          sc => sc.company.corpCode !== action.payload.company.corpCode
        ), action.payload],
      };
    case 'UPDATE_JOB_PROGRESS':
      return {
        ...state,
        currentJob: state.currentJob
          ? { ...state.currentJob, ...action.payload }
          : null,
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    startScreening: (corpCodes?: string[]) => Promise<void>;
    refreshResults: () => Promise<void>;
    analyzeCompany: (corpCode: string) => Promise<void>;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
    checkConnection: () => Promise<void>;
    loadCachedResults: () => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadCachedResults();
    checkConnection();
  }, []);

  async function loadCachedResults() {
    try {
      const cached = await AsyncStorage.getItem('cached_results');
      if (cached) {
        dispatch({ type: 'SET_SCORECARDS', payload: JSON.parse(cached) });
      }
    } catch (e) {
      console.warn('Failed to load cached results:', e);
    }
  }

  async function checkConnection() {
    const connected = await apiService.checkServerHealth();
    dispatch({ type: 'SET_SERVER_CONNECTED', payload: connected });
  }

  async function startScreening(corpCodes?: string[]) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const job = await apiService.startScreening(corpCodes);
      dispatch({ type: 'SET_JOB', payload: job });
      pollJob(job.id);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message || '스크리닝 시작 실패' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const job = await apiService.getScreeningStatus(jobId);
        dispatch({ type: 'SET_JOB', payload: job });

        if (job.status === 'completed') {
          clearInterval(interval);
          dispatch({ type: 'SET_SCORECARDS', payload: job.results });
          dispatch({ type: 'SET_LOADING', payload: false });
          await AsyncStorage.setItem('cached_results', JSON.stringify(job.results));
        } else if (job.status === 'error') {
          clearInterval(interval);
          dispatch({ type: 'SET_ERROR', payload: job.error || '분석 중 오류 발생' });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (e) {
        clearInterval(interval);
        dispatch({ type: 'SET_ERROR', payload: '서버 연결 실패' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 3000);
  }

  async function refreshResults() {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const results = await apiService.getScreeningResults();
      dispatch({ type: 'SET_SCORECARDS', payload: results });
      await AsyncStorage.setItem('cached_results', JSON.stringify(results));
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  async function analyzeCompany(corpCode: string) {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await apiService.analyzeCompany(corpCode);
      dispatch({ type: 'ADD_SCORECARD', payload: result });
      dispatch({ type: 'SET_SELECTED_COMPANY', payload: result });
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }

  async function updateSettings(newSettings: Partial<AppSettings>) {
    const updated = { ...state.settings, ...newSettings };
    dispatch({ type: 'SET_SETTINGS', payload: updated });
    await apiService.updateSettings(newSettings);
  }

  const actions = {
    startScreening,
    refreshResults,
    analyzeCompany,
    updateSettings,
    checkConnection,
    loadCachedResults,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
