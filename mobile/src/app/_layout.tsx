import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useColorScheme } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { AuthProvider } from '@/providers/auth-provider'
import { PushProvider } from '@/providers/push-provider'
import { fonts, useColors } from '@/constants/theme'

// Hold the splash until the brand fonts are ready, so text never jumps.
SplashScreen.preventAutoHideAsync().catch(() => undefined)

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  })
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => undefined)
  }, [loaded, error])

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      // Lists stay usable on a weak connection: show what we have, refresh quietly.
      queries: { staleTime: 60_000, gcTime: 30 * 60_000, retry: 1, refetchOnWindowFocus: false },
    },
  }))

  // A font failure must not block the app; it falls back to system type.
  if (!loaded && !error) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PushProvider />
            <Navigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function Navigator() {
  const c = useColors()
  const scheme = useColorScheme()
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="opportunity/[id]" options={{ title: '' }} />
        <Stack.Screen name="topic/[slug]" options={{ title: '' }} />
        <Stack.Screen name="tool/[tool]" options={{ title: '' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="info/[kind]" options={{ title: '' }} />
      </Stack>
    </>
  )
}
