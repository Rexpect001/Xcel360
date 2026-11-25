import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TabScreen } from '@/components/screen'
import { ListingCard } from '@/components/listing-card'
import { Button, Card, Chip, IconButton, Loading, Message, ProgressRing, SectionHeader, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { deadlineInfo, urgencyColors } from '@/lib/format'
import { openLink } from '@/lib/links'
import { useHome, useListings, useTopics } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { ListingCard as Listing } from '@/lib/types'

export default function Home() {
  const { status } = useAuth()
  return status === 'authenticated' ? <SignedInHome /> : <GuestHome />
}

const search = <IconButton icon="search" label="Search scholarships" onPress={() => router.push('/explore')} />

function TopicRow({ topics }: { topics: { slug: string; label: string; count: number }[] }) {
  if (!topics.length) return null
  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title="Popular searches" action="See all" onAction={() => router.push('/explore')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}>
        {topics.map((t, i) => <Chip key={t.slug} label={t.label} count={t.count} active={i === 0} onPress={() => router.push(`/topic/${t.slug}`)} />)}
      </ScrollView>
    </View>
  )
}

function SignedInHome() {
  const c = useColors()
  const home = useHome()
  const d = home.data

  const header = d ? (
    <View style={{ gap: space.xl, paddingBottom: space.md }}>
      {/* Matches + profile progress */}
      <Pressable accessibilityRole="button" onPress={() => router.push('/me')} style={{ backgroundColor: c.hero, borderRadius: radius.xl, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <ProgressRing value={d.profileCompleteness} size={78} stroke={8} color="#ffffff" track="rgba(255,255,255,0.22)">
          <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 18 }} color="#ffffff">{d.profileCompleteness}%</Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="heading" color={c.onHero} style={{ fontSize: 18 }}>
            {d.matchCount > 0 ? `${d.matchCount} scholarship${d.matchCount === 1 ? '' : 's'} match you` : 'Get matched to scholarships'}
          </Text>
          <Text variant="small" color={c.onHeroMuted}>
            {d.profileCompleteness < 100 ? 'Complete your profile for sharper matches.' : 'Your profile is complete.'}
          </Text>
          {d.profileCompleteness < 100 && <Text style={{ fontFamily: fonts.display, fontSize: 13.5, marginTop: 2 }} color="#ffffff">Finish profile →</Text>}
        </View>
      </Pressable>

      {d.latestNotice && (
        <Card onPress={() => router.push('/notifications')} accessibilityLabel={`New notice: ${d.latestNotice.title}`} style={{ backgroundColor: c.tint, gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <Ionicons name="notifications" size={16} color={c.onTint} />
            <Text variant="title" color={c.onTint} style={{ flex: 1 }}>{d.latestNotice.title}</Text>
          </View>
          <Text variant="small" numberOfLines={3}>{d.latestNotice.message}</Text>
          {d.latestNotice.link ? (
            <Text style={{ fontFamily: fonts.display, fontSize: 13.5, marginTop: 2 }} color={c.link} onPress={() => openLink(d.latestNotice!.link!)}>Open →</Text>
          ) : null}
        </Card>
      )}

      {d.closingSoon.length > 0 && (
        <View style={{ gap: space.md }}>
          <SectionHeader title="Your deadlines this month" action="Saved" onAction={() => router.push('/saved')} />
          {d.closingSoon.map((s) => {
            const dl = deadlineInfo(s.deadline)
            const tone = urgencyColors(dl.urgency, c)
            return (
              <Card key={s.id} onPress={() => router.push(`/opportunity/${s.id}`)} accessibilityLabel={`${s.title}, ${dl.label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
                <View style={{ flex: 1 }}>
                  <Text variant="title" numberOfLines={1} style={{ fontSize: 15 }}>{s.title}</Text>
                  <Text variant="caption" muted numberOfLines={1}>{s.org} · {dl.date}</Text>
                </View>
                <View style={{ backgroundColor: tone.bg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 12.5 }} color={tone.fg}>{dl.short}</Text>
                </View>
              </Card>
            )
          })}
        </View>
      )}

      <TopicRow topics={d.topics} />
      <SectionHeader title="Best matches for you" action="Explore" onAction={() => router.push('/explore')} />
    </View>
  ) : undefined

  return (
    <TabScreen title="Find your fully funded scholarship" right={search}>
      {home.isPending ? <Loading /> : home.isError ? (
        <Message icon="cloud-offline-outline" title="Couldn't load your home" text={home.error.message} action={<Button label="Try again" onPress={() => { void home.refetch() }} />} />
      ) : (
        <FlatList
          data={d?.matches ?? []}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={header}
          renderItem={({ item }) => <ListingCard item={item} reason={item.score >= 50 ? `${item.score}% match · ${item.reasons.join(', ')}` : undefined} />}
          ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
          refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => { void home.refetch() }} tintColor={c.brand} />}
        />
      )}
    </TabScreen>
  )
}

function GuestHome() {
  const c = useColors()
  const topics = useTopics()
  const soon = useListings({ soon: 30 })
  const items: Listing[] = soon.data?.pages.flatMap((p) => p.data).slice(0, 10) ?? []
  const popular = [...(topics.data ?? [])].sort((a, b) => b.count - a.count).slice(0, 8)

  const header = (
    <View style={{ gap: space.xl, paddingBottom: space.md }}>
      <View style={{ backgroundColor: c.hero, borderRadius: radius.xl, padding: space.lg, gap: space.md }}>
        <Text variant="heading" color={c.onHero}>Save scholarships and get deadline reminders</Text>
        <Text variant="small" color={c.onHeroMuted}>Free account. Notifications on your phone before every deadline.</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Join free" kind="light" onPress={() => router.push('/sign-up')} style={{ flex: 1, minHeight: 48 }} />
          <Button label="Sign in" kind="outlineLight" onPress={() => router.push('/sign-in')} style={{ flex: 1, minHeight: 48 }} />
        </View>
      </View>
      <TopicRow topics={popular} />
      <SectionHeader title="Closing in the next 30 days" />
    </View>
  )

  return (
    <TabScreen title="Find your fully funded scholarship" right={search}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        ListEmptyComponent={soon.isPending ? <Loading /> : soon.isError
          ? <Message icon="cloud-offline-outline" title="Couldn't load scholarships" text={soon.error.message} action={<Button label="Try again" onPress={() => { void soon.refetch() }} />} />
          : <Message title="Nothing closing this month" />}
        renderItem={({ item }) => <ListingCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListFooterComponent={items.length ? <Button label="See all scholarships" kind="ghost" onPress={() => router.push('/explore')} style={{ marginTop: space.md }} /> : undefined}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl }}
        refreshControl={<RefreshControl refreshing={soon.isRefetching} onRefresh={() => { void soon.refetch(); void topics.refetch() }} tintColor={c.brand} />}
      />
    </TabScreen>
  )
}
