import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Must match the native splash backgroundColor in app.json so the
// hand-off from the OS splash to this component is seamless.
const SPLASH_BACKGROUND = '#1C1C1E';
const HOLD_DURATION_MS = 1400;
const FADE_DURATION_MS = 400;

export function SplashGate({ children }: { children: React.ReactNode }) {
  const fade = useMemo(() => new Animated.Value(1), []);
  const [imageReady, setImageReady] = useState(false);
  const [finished, setFinished] = useState(false);
  const nativeHidden = useRef(false);

  const hideNativeSplash = useCallback(async () => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    try {
      await SplashScreen.hideAsync();
    } catch {
      // already hidden — safe to ignore
    }
  }, []);

  // Hand off from the native (centered-icon) splash to our full-screen
  // one only once our image has painted, so there is no flash of app UI.
  const onImagePainted = useCallback(() => {
    setImageReady(true);
    hideNativeSplash();
  }, [hideNativeSplash]);

  // Safety net so the native splash can never get stuck if the image fails.
  useEffect(() => {
    const timer = setTimeout(hideNativeSplash, 2500);
    return () => clearTimeout(timer);
  }, [hideNativeSplash]);

  // Hold the full-screen splash briefly, then fade into the app.
  useEffect(() => {
    if (!imageReady) return;
    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setFinished(true));
    }, HOLD_DURATION_MS);
    return () => clearTimeout(timer);
  }, [imageReady, fade]);

  return (
    <View style={styles.root}>
      {children}
      {!finished && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fade }]}
        >
          <Animated.Image
            source={require('../../assets/splash.png')}
            style={styles.image}
            resizeMode="cover"
            fadeDuration={0}
            onLoadEnd={onImagePainted}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { backgroundColor: SPLASH_BACKGROUND },
  image: { width: '100%', height: '100%' },
});
