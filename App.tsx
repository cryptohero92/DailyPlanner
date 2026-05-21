import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import MainScreen from './src/screens/MainScreen';
import { SplashGate } from './src/components/SplashGate';

// Hold the native splash until our full-screen splash is ready to take over.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <SplashGate>
          <MainScreen />
        </SplashGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
