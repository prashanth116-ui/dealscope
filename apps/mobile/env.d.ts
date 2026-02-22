/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_COGNITO_USER_POOL_ID?: string;
    EXPO_PUBLIC_COGNITO_CLIENT_ID?: string;
    EXPO_PUBLIC_FRED_API_KEY?: string;
    EXPO_PUBLIC_CENSUS_API_KEY?: string;
    EXPO_PUBLIC_BLS_API_KEY?: string;
    EXPO_PUBLIC_GOOGLE_GEOCODING_KEY?: string;
  }
}
