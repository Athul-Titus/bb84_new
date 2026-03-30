/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AttackScenario, ProtocolKey } from '../data/types';

export type DashboardTab = 'overview' | 'qber' | 'features' | 'pipeline' | 'deepdive' | 'ai';

type FeatureFilter = 'all' | 'differences' | 'qsafe';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DashboardState {
  activeTab: DashboardTab;
  activeProtocol: ProtocolKey;
  attackScenario: AttackScenario;
  featureFilter: FeatureFilter;
  visibleProtocols: Record<ProtocolKey, boolean>;
  aiChat: {
    messages: ChatMessage[];
    loading: boolean;
    error: string | null;
  };
}

type DashboardAction =
  | { type: 'SET_TAB'; payload: DashboardTab }
  | { type: 'SET_PROTOCOL'; payload: ProtocolKey }
  | { type: 'SET_ATTACK'; payload: AttackScenario }
  | { type: 'SET_FILTER'; payload: FeatureFilter }
  | { type: 'TOGGLE_PROTOCOL'; payload: ProtocolKey }
  | { type: 'AI_LOADING' }
  | { type: 'AI_ERROR'; payload: string }
  | { type: 'AI_MESSAGE'; payload: ChatMessage }
  | { type: 'AI_CLEAR' };

const initialState: DashboardState = {
  activeTab: 'overview',
  activeProtocol: 'e91',
  attackScenario: 'no_attack',
  featureFilter: 'all',
  visibleProtocols: {
    qsafe: true,
    e91: true,
    b92: true,
    bb84: true,
    sgs04: true,
  },
  aiChat: {
    messages: [],
    loading: false,
    error: null,
  },
};

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_PROTOCOL':
      return { ...state, activeProtocol: action.payload };
    case 'SET_ATTACK':
      return { ...state, attackScenario: action.payload };
    case 'SET_FILTER':
      return { ...state, featureFilter: action.payload };
    case 'TOGGLE_PROTOCOL':
      return {
        ...state,
        visibleProtocols: {
          ...state.visibleProtocols,
          [action.payload]: !state.visibleProtocols[action.payload],
        },
      };
    case 'AI_LOADING':
      return { ...state, aiChat: { ...state.aiChat, loading: true, error: null } };
    case 'AI_ERROR':
      return { ...state, aiChat: { ...state.aiChat, loading: false, error: action.payload } };
    case 'AI_MESSAGE':
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          loading: false,
          messages: [...state.aiChat.messages, action.payload],
        },
      };
    case 'AI_CLEAR':
      return {
        ...state,
        aiChat: {
          messages: [],
          loading: false,
          error: null,
        },
      };
    default:
      return state;
  }
}

const DashboardContext = createContext<{ state: DashboardState; dispatch: Dispatch<DashboardAction> } | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <DashboardContext.Provider value={{ state, dispatch }}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used inside DashboardProvider');
  }
  return context;
}
