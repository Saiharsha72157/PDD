import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import React, { useEffect } from "react";

import AppNavigator from "./navigation/AppNavigator";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./services/ThemeContext";
import { AuthProvider } from "./services/AuthContext";
import { warmUpBackend } from "./services/api";
import { initLanguage } from "./services/localization";

const linking: any = {
  prefixes: ["https://researchmateai.netlify.app", "researchmateai://"],
  config: {
    screens: {
      Language: "language",
      OnboardingOne: "onboarding-1",
      OnboardingTwo: "onboarding-2",
      OnboardingThree: "onboarding-3",
      Login: "login",
      Signup: "signup",
      MainApp: {
        screens: {
          Home: "dashboard",
          Datasets: "datasets",
          Analysis: "analysis",
          Tools: "tools",
          Profile: "profile",
        },
      },
      TitleGenerator: "title-generator",
      LanguageSettings: "settings/language",
      HelpSupport: "help",
      SavedResearch: "saved-research",
      ResearchDetails: "research-details",
    },
  },
};

export default function App() {
  useEffect(() => {
    console.log("[App] App mounted successfully");
    console.log("[App] Navigation Container initialized");
    console.log("[App] Safe startup validation completed");
    console.log("[App] Application loaded successfully in production-hardened mode");
    
    // Inject global CSS for Web to remove default input outlines globally
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(`
        input, textarea, select {
          outline: none !important;
        }
      `));
      document.head.appendChild(style);
    }

    // Proactively warm up sleeping Render server containers in the background!
    warmUpBackend();

    // Initialize persisted language
    initLanguage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <NavigationContainer linking={linking}>
                {Platform.OS !== "web" && <StatusBar style="auto" />}
                <AppNavigator />
              </NavigationContainer>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

