import { useEffect, useState } from 'react'
import { FlatList, Linking, Platform, Pressable, RefreshControl, View } from 'react-native'
import { Stack } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, Loading, Message, Text } from '@/components/ui'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { openLink } from '@/lib/links'
import { useMarkRead, useNotifications } from '@/lib/queries'
import { registerForPush } from '@/lib/push'
import { useAuth } from '@/providers/auth-provider'
import type { NotificationItem } from '@/lib/types'

const ICON: Record<NotificationItem['type'], keyof typeof Ionicons.glyphMap> = {
  DEADLINE_REMINDER: 'alarm-outline',
  NEW_OPPORTUNITY: 'sparkles-outline',
  APPLICATION_UPDATE: 'checkmark-done-outline',
  GENERAL: 'megaphone-outline',
}

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d < 7 ? `${d} d ago` : new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Offers to switch on phone notifications when they are off (the whole point of the app). */
function PushPrompt() {
  const c = useColors()
  const [state, setState] = useState<'unknown' | 'on' | 'off' | 'blocked'>('unknown')
  useEffect(() => {
    if (Platform.OS === 'web') return
    Notifications.getPermissionsAsync().then((p) => setState(p.granted ? 'on' : p.canAskAgain ? 'off' : 'blocked')).catch(() => {})
  }, [])
  if (state === 'unknown' || state === 'on') return null
  return (
    <Card style={{ backgroundColor: c.hero, gap: space.sm, marginBottom: space.md }}>
      <Text variant="title" color={c.onHero}>Turn on notifications</Text>
      <Text variant="small" color={c.onHeroMuted}>Get deadline reminders and new scholarships on your phone, even when Xcel360 is closed.</Text>
      <Button
        label={state === 'blocked' ? 'Open phone settings' : 'Turn on'}
        kind="light"
        style={{ minHeight: 46 }}
        onPress={async () => {
          if (state === 'blocked') { Linking.openSettings().catch(() => {}); return }
          const s = await registerForPush()
          setState(s === 'denied' ? 'blocked' : 'on')
        }}
      />
    </Card>
  )
}

export default function NotificationsScreen() {
  const c = useColors()
  const { status } = useAuth()
  const list = useNotifications()
  const mark = useMarkRead()
  const items = list.data?.data ?? []
  const unread = list.data?.unread ?? 0

  if (status !== 'authenticated') return <SignInPrompt title="Never miss a deadline" text="Sign in to get reminders and notices from Xcel360." />

  const open = (n: NotificationItem) => {
    if (!n.read) mark.mutate({ id: n.id })
    if (n.link) openLink(n.link)
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Notifications',
        headerRight: () => unread > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => mark.mutate({ all: true })} hitSlop={10}>
            <Text style={{ fontFamily: fonts.display, fontSize: 14 }} color={c.link}>Mark all read</Text>
          </Pressable>
        ) : null,
      }} />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={<PushPrompt />}
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        renderItem={({ item: n }) => (
          <Card
            onPress={() => open(n)}
            accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${n.message}`}
            style={{ flexDirection: 'row', gap: space.md, backgroundColor: n.read ? c.surface : c.tint, paddingVertical: space.md }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: n.read ? c.bg : c.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={ICON[n.type] ?? 'notifications-outline'} size={20} color={c.link} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="title" style={{ flex: 1, fontSize: 15 }}>{n.title}</Text>
                {!n.read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.brand }} />}
              </View>
              <Text variant="small">{n.message}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 2 }}>
                <Text variant="caption" muted>{ago(n.createdAt)}</Text>
                {n.link ? <Text style={{ fontFamily: fonts.display, fontSize: 12.5 }} color={c.link}>Open →</Text> : null}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={list.isPending ? <Loading /> : list.isError
          ? <Message icon="cloud-offline-outline" title="Couldn't load notifications" text={list.error.message} action={<Button label="Try again" onPress={() => { void list.refetch() }} />} />
          : <Message icon="notifications-outline" title="You're all caught up" text="Deadline reminders, new matches and notices from Xcel360 appear here." />}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        style={{ backgroundColor: c.bg }}
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => { void list.refetch() }} tintColor={c.brand} />}
      />
    </>
  )
}
