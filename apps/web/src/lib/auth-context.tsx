"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = process.env.NEXT_PUBLIC_USER_POOL_ID ?? "us-east-1_XXXXXXXXX";
const CLIENT_ID = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? "XXXXXXXXXXXXXXXXXXXXXXXXXX";

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

// ─── Types ──────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
}

type AuthAction =
  | { type: "RESTORE_SESSION"; user: AuthUser; token: string }
  | { type: "SIGN_IN"; user: AuthUser; token: string }
  | { type: "SIGN_OUT" }
  | { type: "LOADING"; isLoading: boolean };

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsVerification: boolean }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  getToken: () => Promise<string | null>;
}

// ─── Reducer ────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "RESTORE_SESSION":
    case "SIGN_IN":
      return {
        isLoading: false,
        isAuthenticated: true,
        user: action.user,
        accessToken: action.token,
      };
    case "SIGN_OUT":
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
      };
    case "LOADING":
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

const initialState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  accessToken: null,
};

// ─── Context ────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        dispatch({ type: "SIGN_OUT" });
        return;
      }

      currentUser.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session?.isValid()) {
            dispatch({ type: "SIGN_OUT" });
            return;
          }

          const token = session.getAccessToken().getJwtToken();
          const payload = session.getIdToken().decodePayload();

          dispatch({
            type: "RESTORE_SESSION",
            user: {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
            },
            token,
          });
        }
      );
    } catch {
      dispatch({ type: "SIGN_OUT" });
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    return new Promise<void>((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const token = session.getAccessToken().getJwtToken();
          const payload = session.getIdToken().decodePayload();

          dispatch({
            type: "SIGN_IN",
            user: {
              id: payload.sub,
              email: payload.email,
              name: payload.name,
            },
            token,
          });
          resolve();
        },
        onFailure: (err) => reject(err),
      });
    });
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: name }),
      ];

      return new Promise<{ needsVerification: boolean }>((resolve, reject) => {
        userPool.signUp(email, password, attributes, [], (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            needsVerification: !result?.userConfirmed,
          });
        });
      });
    },
    []
  );

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise<void>((resolve, reject) => {
      user.confirmRegistration(code, true, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, []);

  const signOut = useCallback(async () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    dispatch({ type: "SIGN_OUT" });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise<void>((resolve, reject) => {
      user.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      return new Promise<void>((resolve, reject) => {
        user.confirmPassword(code, newPassword, {
          onSuccess: () => resolve(),
          onFailure: (err) => reject(err),
        });
      });
    },
    []
  );

  const getToken = useCallback(async (): Promise<string | null> => {
    return state.accessToken;
  }, [state.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
        forgotPassword,
        confirmForgotPassword,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
