import { FlatList, RefreshControl, View } from 'react-native'
import { router } from 'expo-router'
import { TabScreen } from '@/components/screen'
import { ListingCard } from '@/components/listing-card'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { Button, Loading, Message, Text } from '@/components/ui'
import { space, useColors } from '@/constants/theme'
import { useSaved } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'

/** Stage 1: the saved list (shared with the website). Pipeline lanes arrive in stage 2. */
export default function Saved() {
  const c = useColors()
  const { status } = useAuth()
  const saved = useSaved()

  if (status !== 'authenticated') {
    return (
      <TabScreen title="Saved">
        <SignInPrompt title="Keep your shortlist in one place" text="Sign in to save scholarships. Your list is shared with thexcel360.com, and you get reminders before each deadline." />
      </TabScreen>
    )
  }

  const items = saved.data ?? []
  const open = items.filter((s) => !s.closed)
  return (
    <TabScreen title="Saved">
      <FlatList
        data={items}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={items.length ? (
          <Text variant="caption" muted style={{ paddingBottom: space.md }}>
            {open.length} open · {items.length - open.length} closed · soonest deadline first
          </Text>
        ) : undefined}
        renderItem={({ item }) => <ListingCard item={item} saved />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={saved.isPending ? <Loading /> : saved.isError
          ? <Message icon="cloud-offline-outline" title="Couldn't load your saved list" text={saved.error.message} action={<Button label="Try again" onPress={() => saved.refetch()} />} />
          : <Message icon="bookmark-outline" title="Nothing saved yet" text="Tap the bookmark on any scholarship to keep it here. We'll remind you before it closes."
              action={<Button label="Find scholarships" onPress={() => router.push('/explore')} />} />}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={saved.isRefetching} onRefresh={() => { void saved.refetch() }} tintColor={c.brand} />}
      />
    </TabScreen>
  )
}
