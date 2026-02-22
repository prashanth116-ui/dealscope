import { createContext, useContext, useReducer, type ReactNode } from "react";
import type {
  Property,
  RentRoll,
  Expenses,
  Financing,
  ValueAddAssumptions,
  AnalysisInput,
} from "@dealscope/core";
import type { AnalysisResults } from "@dealscope/core";
import {
  FINANCING_DEFAULTS,
  PROJECTION_DEFAULTS,
} from "@dealscope/core";

// ─── State ──────────────────────────────────────────────────

export interface WizardState {
  currentStep: number;
  analysisId: string | null;
  property: Partial<Property>;
  rentRoll: RentRoll;
  expenses: Expenses;
  financing: Financing;
  valueAdd: ValueAddAssumptions;
  holdPeriod: number;
  exitCapRate: number;
  results: AnalysisResults | null;
}

const emptyOtherIncome = {
  utilityPassThrough: { perUnit: 0, unitsParticipating: 0 },
  laundry: 0,
  parking: 0,
  storage: 0,
  petFees: 0,
  other: 0,
};

const initialState: WizardState = {
  currentStep: 1,
  analysisId: null,
  property: {
    type: "multifamily",
    photos: [],
  },
  rentRoll: { units: [], otherIncome: emptyOtherIncome },
  expenses: { mode: "quick", quickPercentage: 50 },
  financing: {
    type: "conventional",
    purchasePrice: 0,
    downPaymentPercent: FINANCING_DEFAULTS.conventional.downPaymentPercent,
    interestRate: 7.0,
    loanTerm: FINANCING_DEFAULTS.conventional.loanTerm,
    amortization: FINANCING_DEFAULTS.conventional.amortization,
    closingCosts: 0,
    points: FINANCING_DEFAULTS.conventional.points,
  },
  valueAdd: {
    rentGrowthRate: PROJECTION_DEFAULTS.rentGrowthRate,
    expenseGrowthRate: PROJECTION_DEFAULTS.expenseGrowthRate,
    appreciationRate: PROJECTION_DEFAULTS.appreciationRate,
    renovationBudget: 0,
    renovationTimeline: 0,
    targetOccupancy: 0.95,
  },
  holdPeriod: PROJECTION_DEFAULTS.holdPeriod,
  exitCapRate: PROJECTION_DEFAULTS.exitCapRate,
  results: null,
};

// ─── Actions ────────────────────────────────────────────────

type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "SET_ANALYSIS_ID"; analysisId: string }
  | { type: "SET_PROPERTY"; property: Partial<Property> }
  | { type: "SET_RENT_ROLL"; rentRoll: RentRoll }
  | { type: "SET_EXPENSES"; expenses: Expenses }
  | { type: "SET_FINANCING"; financing: Financing }
  | { type: "SET_VALUE_ADD"; valueAdd: ValueAddAssumptions }
  | { type: "SET_HOLD_PERIOD"; holdPeriod: number }
  | { type: "SET_EXIT_CAP_RATE"; exitCapRate: number }
  | { type: "SET_RESULTS"; results: AnalysisResults }
  | { type: "LOAD_ANALYSIS"; id: string; input: AnalysisInput; results: AnalysisResults }
  | { type: "RESET" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "SET_ANALYSIS_ID":
      return { ...state, analysisId: action.analysisId };
    case "SET_PROPERTY":
      return { ...state, property: { ...state.property, ...action.property } };
    case "SET_RENT_ROLL":
      return { ...state, rentRoll: action.rentRoll };
    case "SET_EXPENSES":
      return { ...state, expenses: action.expenses };
    case "SET_FINANCING":
      return { ...state, financing: action.financing };
    case "SET_VALUE_ADD":
      return { ...state, valueAdd: action.valueAdd };
    case "SET_HOLD_PERIOD":
      return { ...state, holdPeriod: action.holdPeriod };
    case "SET_EXIT_CAP_RATE":
      return { ...state, exitCapRate: action.exitCapRate };
    case "SET_RESULTS":
      return { ...state, results: action.results };
    case "LOAD_ANALYSIS":
      return {
        currentStep: 6,
        analysisId: action.id,
        property: action.input.property,
        rentRoll: action.input.rentRoll,
        expenses: action.input.expenses,
        financing: action.input.financing,
        valueAdd: action.input.valueAdd ?? initialState.valueAdd,
        holdPeriod: action.input.holdPeriod,
        exitCapRate: action.input.exitCapRate ?? initialState.exitCapRate,
        results: action.results,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  goNext: () => void;
  goBack: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const goNext = () => {
    if (state.currentStep < 6) {
      dispatch({ type: "SET_STEP", step: state.currentStep + 1 });
    }
  };

  const goBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: "SET_STEP", step: state.currentStep - 1 });
    }
  };

  return (
    <WizardContext.Provider value={{ state, dispatch, goNext, goBack }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return ctx;
}
