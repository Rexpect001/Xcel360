import type { ReactNode } from 'react'
import { Image, Pressable, View, useColorScheme } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar, IconButton, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { useMe } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

const LOGO = require('../../assets/xcel-blue.png')

/** "Hi, Ada / Welcome back!" pill (signed in) or the logo (guests). */
function Greeting() {
  const c = useColors()
  const dark = useColorScheme() === 'dark'
  const { status, user } = useAuth()
  if (status !== 'authenticated') {
    return <Image source={LOGO} style={{ width: 92, height: 18, ...(dark && { tintColor: '#ffffff' }) }} resizeMode="contain" accessibilityLabel="Xcel360" />
  }
  const first = user?.name?.split(' ')[0] ?? 'there'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Your profile, ${user?.name ?? ''}`}
      onPress={() => router.push('/me')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: c.surface, borderRadius: radius.pill, paddingLeft: 4, paddingRight: space.lg, paddingVertical: 4, borderWidth: 1, borderColor: c.line }}
    >
      <Avatar name={user?.name} size={38} />
      <View>
        <Text style={{ fontFamily: fonts.display, fontSize: 14 }}>Hi, {first}</Text>
        <Text variant="caption" muted>Welcome back!</Text>
      </View>
    </Pressable>
  )
}

/** Round bell with the unread count; opens the in-app Notifications screen. */
export function Bell() {
  const { status } = useAuth()
  const me = useMe()
  if (status !== 'authenticated') return null
  return <IconButton icon="notifications-outline" label="Notifications" badge={me.data?.unreadNotifications ?? 0} onPress={() => router.push('/notifications')} />
}

/** Tab screen frame: greeting pill + bell on top, then a large headline. */
export function TabScreen({ title, subtitle, children, right, showGreeting = true }: {
  title?: string
  subtitle?: string
  children: ReactNode
  right?: ReactNode
  showGreeting?: boolean
}) {
  const c = useColors()
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {showGreeting && (
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
          <Greeting />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {right}
            <Bell />
          </View>
        </View>
      )}
      {title ? (
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md, gap: 4 }}>
          <Text variant="hero" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text muted>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  )
}
