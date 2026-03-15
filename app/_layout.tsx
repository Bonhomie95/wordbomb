import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import { loadStore } from '@/hooks/use-game-store';

export default function RootLayout() {
  useEffect(() => {
    // Load persisted game state (theme, high score, games played)
    loadStore();

    // Initialise AdMob SDK
    mobileAds()
      .initialize()
      .catch(() => { /* graceful fail in Expo Go or no internet */ });

    // Hide Android navigation bar (immersive)
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
