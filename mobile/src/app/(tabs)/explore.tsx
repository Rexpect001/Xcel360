import { useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TabScreen } from '@/components/screen'
import { ListingCard } from '@/components/listing-card'
import { Button, Chip, Loading, Message, Text } from '@/components/ui'
import { TOUCH, fonts, radius, space, useColors } from '@/constants/theme'
import { useListings, useTopics, type ListingQuery } from '@/lib/queries'

const CATEGORIES = [
  { key: 'SCHOLARSHIP', label: 'Scholarships' },
  { key: 'INTERNSHIP', label: 'Internships' },
  { key: 'JOB', label: 'Jobs' },
] as const

const LEVELS = [
  { key: 'masters', label: "Master's" },
  { key: 'phd', label: 'PhD' },
  { key: 'undergrad', label: 'Undergraduate' },
]

export default function Explore() {
  const c = useColors()
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['key']>('SCHOLARSHIP')
  const [level, setLevel] = useState<string | undefined>()
  const [funded, setFunded] = useState(false)
  const [soon, setSoon] = useState(false)

  // Wait for a pause in typing before searching, to save data on slow connections
  useEffect(() => {
    const t = setTimeout(() => setQ(text), 350)
    return () => clearTimeout(t)
  }, [text])

  const filters: ListingQuery = useMemo(() => ({
    q, category, level: category === 'SCHOLARSHIP' ? level : undefined, funded: category === 'SCHOLARSHIP' && funded, soon: soon ? 30 : undefined,
  }), [q, category, level, funded, soon])
  const list = useListings(filters)
  const items = list.data?.pages.flatMap((p) => p.data) ?? []
  const total = list.data?.pages[0]?.total
  const topics = useTopics()
  const browsing = !q && !level && !funded && !soon && category === 'SCHOLARSHIP'

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: space.lg, minHeight: TOUCH + 10 }}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder='Try "fully funded masters in Canada"'
          placeholderTextColor={c.placeholder}
          returnKeyType="search"
          onSubmitEditing={() => setQ(text)}
          accessibilityLabel="Search opportunities"
          style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: c.text, paddingVertical: space.sm }}
        />
        {text ? <Ionicons name="close-circle" size={20} color={c.muted} onPress={() => { setText(''); setQ('') }} accessibilityLabel="Clear search" accessibilityRole="button" /> : null}
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, padding: 4 }} accessibilityRole="tablist">
        {CATEGORIES.map((cat) => {
          const on = category === cat.key
          return (
            <Text key={cat.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setCategory(cat.key)}
              color={on ? c.onBrand : c.text}
              style={{ flex: 1, textAlign: 'center', paddingVertical: 11, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: on ? c.brand : 'transparent', fontFamily: fonts.display, fontSize: 13.5 }}>
              {cat.label}
            </Text>
          )
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {category === 'SCHOLARSHIP' && <Chip label="Fully funded" active={funded} onPress={() => setFunded((v) => !v)} />}
        <Chip label="Closing in 30 days" active={soon} onPress={() => setSoon((v) => !v)} />
        {category === 'SCHOLARSHIP' && LEVELS.map((l) => <Chip key={l.key} label={l.label} active={level === l.key} onPress={() => setLevel((v) => (v === l.key ? undefined : l.key))} />)}
      </ScrollView>

      {browsing && (topics.data?.length ?? 0) > 0 && (
        <View style={{ gap: space.sm }}>
          <Text variant="title">Browse by topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {topics.data!.map((t) => <Chip key={t.slug} label={t.label} count={t.count} onPress={() => router.push(`/topic/${t.slug}`)} />)}
          </ScrollView>
        </View>
      )}

      {total !== undefined && (
        <Text variant="caption" muted accessibilityLiveRegion="polite">{total.toLocaleString()} open {total === 1 ? 'result' : 'results'}</Text>
      )}
    </View>
  )

  return (
    <TabScreen title="Explore" subtitle="Scholarships, internships and jobs, all open now.">
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <ListingCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        onEndReachedThreshold={0.6}
        onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage() }}
        ListEmptyComponent={list.isPending ? <Loading /> : list.isError
          ? <Message icon="cloud-offline-outline" title="Couldn't load results" text={list.error.message} action={<Button label="Try again" onPress={() => list.refetch()} />} />
          : <Message icon="search-outline" title="No matches" text="Try fewer words, or remove a filter." />}
        ListFooterComponent={list.isFetchingNextPage ? <Loading /> : <View style={{ height: space.xl }} />}
        contentContainerStyle={{ paddingHorizontal: space.lg }}
        refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={() => { void list.refetch() }} tintColor={c.brand} />}
      />
    </TabScreen>
  )
}
