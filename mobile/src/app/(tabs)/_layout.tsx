import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts, useColors } from '@/constants/theme'

const ICONS = {
  home: ['home-outline', 'home'],
  explore: ['search-outline', 'search'],
  saved: ['bookmark-outline', 'bookmark'],
  tools: ['create-outline', 'create'],
  me: ['person-circle-outline', 'person-circle'],
} as const

/** Five tabs within thumb reach. Guests can use Home and Explore; the rest ask them to sign in. */
export default function TabsLayout() {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.semibold },
        tabBarStyle: {
          height: 60 + Math.max(insets.bottom, 8),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: c.surface,
          borderTopColor: c.line,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const pair = ICONS[route.name as keyof typeof ICONS]
          return <Ionicons name={pair ? pair[focused ? 1 : 0] : 'ellipse-outline'} size={size - 2} color={color as string} />
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools' }} />
      <Tabs.Screen name="me" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
