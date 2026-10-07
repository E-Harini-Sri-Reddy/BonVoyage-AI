import { createContext, useContext, useMemo, useReducer } from 'react';

const initialTripInput = {
  origin: '',
  destination: '',
  fromDate: '',
  toDate: '',
  travellers: 1,
  budget: '',
  currency: 'USD',
  tripType: 'solo',
  interests: [],
  travellingWithPets: false,
  travellingWithDisabilities: false,
};

const TripContext = createContext(null);

function tripReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: { ...state.input, ...action.payload } };
    case 'SET_PLAN':
      return { ...state, plan: action.payload, isLoading: false, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'RESET':
      return { input: initialTripInput, plan: null, isLoading: false, error: null };
    case 'CLEAR_PLAN':
      return { ...state, plan: null, isLoading: false, error: null };
    default:
      return state;
  }
}

export function TripProvider({ children }) {
  const [state, dispatch] = useReducer(tripReducer, {
    input: initialTripInput,
    plan: null,
    isLoading: false,
    error: null,
  });

  const value = useMemo(
    () => ({
      ...state,
      setInput: (payload) => dispatch({ type: 'SET_INPUT', payload }),
      setPlan: (payload) => dispatch({ type: 'SET_PLAN', payload }),
      setLoading: (payload) => dispatch({ type: 'SET_LOADING', payload }),
      setError: (payload) => dispatch({ type: 'SET_ERROR', payload }),
      resetTrip: () => dispatch({ type: 'RESET' }),
      clearPlan: () => dispatch({ type: 'CLEAR_PLAN' }),
    }),
    [state]
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
