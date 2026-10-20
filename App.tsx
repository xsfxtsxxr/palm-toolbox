import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CalculationProvider } from './src/context/CalculationContext';
import { CalcStatsProvider } from './src/context/CalcStatsContext';
import { ToastProvider } from './src/components/Toast';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const ThemedApp: React.FC = () => {
  const { scheme } = useTheme();

  return (
    <CalculationProvider>
      <CalcStatsProvider>
        <ToastProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
        </ToastProvider>
      </CalcStatsProvider>
    </CalculationProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
