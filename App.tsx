import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CalculationProvider } from './src/context/CalculationContext';
import { ToastProvider } from './src/components/Toast';

export default function App() {
  return (
    <SafeAreaProvider>
      <CalculationProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </ToastProvider>
      </CalculationProvider>
    </SafeAreaProvider>
  );
}
