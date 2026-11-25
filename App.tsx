import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppProvider } from './src/contexts/AppContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CuidadorProvider } from './src/contexts/CuidadorContext';
import { DialogoProvider } from './src/components/Dialogo';
import { configurarNotificacoes } from './src/services/notifications';
import { colors } from './src/theme';

// Só monta o resto do app (e o `AppNavigator`, cujo `initialRouteName` depende de já sabermos se
// há sessão salva) depois que `AuthProvider` termina de restaurar a sessão do aparelho.
function AppContent() {
  const { carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AppProvider>
      <CuidadorProvider>
        <DialogoProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </DialogoProvider>
      </CuidadorProvider>
    </AppProvider>
  );
}

export default function App() {
  useEffect(() => {
    configurarNotificacoes();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
