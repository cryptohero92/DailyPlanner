import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import MainScreen from './src/screens/MainScreen';

// Keep the splash visible until the app signals it's ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const scheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Load fonts, assets, or async data here if needed.
    // For now the app has nothing to pre-load so we resolve immediately.
    setAppReady(true);
  }, []);

  const onLayout = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayout}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <MainScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
