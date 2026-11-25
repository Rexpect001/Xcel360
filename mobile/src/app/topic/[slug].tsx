import { FlatList, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ListingCard } from '@/components/listing-card'
import { Button, Card, Chip, Loading, Message, Text } from '@/components/ui'
import { space, useColors } from '@/constants/theme'
import { deadlineInfo } from '@/lib/format'
import { useTopic } from '@/lib/queries'

/** A topic page: the same guidance, live numbers and listings as thexcel360.com/scholarships/{slug}. */
export default function TopicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const c = useColors()
  const q = useTopic(slug)
  const t = q.data

  if (q.isPending) return <Loading />
  if (q.isError || !t) return <Message icon="alert-circle-outline" title="Couldn't open this topic" text={q.error?.message} action={<Button label="Go back" onPress={() => router.back()} />} />

  const tiles: [string, string | number][] = [
    ['Open now', t.stats.total],
    ['Fully funded', t.stats.fullyFunded],
    ['Close in 30 days', t.stats.closingIn30],
    ['Next deadline', t.stats.nextDeadline ? deadlineInfo(t.stats.nextDeadline).date : t.stats.rolling ? 'Rolling' : '-'],
  ]

  const header = (
    <View style={{ gap: space.lg, paddingBottom: space.md }}>
      <Text variant="heading" accessibilityRole="header">{t.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs }}>
        {tiles.map(([label, value]) => (
          <View key={label} style={{ width: '50%', padding: space.xs }}>
            <Card style={{ gap: 2 }}>
              <Text variant="heading" style={{ fontSize: 19 }}>{value}</Text>
              <Text variant="caption" muted>{label}</Text>
            </Card>
          </View>
        ))}
      </View>
      {t.intro.map((p) => <Text key={p} muted>{p}</Text>)}
      <Card style={{ gap: space.sm }}>
        <Text variant="title">Tips before you apply</Text>
        {t.tips.map((tip) => (
          <View key={tip} style={{ flexDirection: 'row', gap: space.sm }}>
            <Ionicons name="checkmark-circle" size={18} color={c.ok} />
            <Text variant="small" style={{ flex: 1 }}>{tip}</Text>
          </View>
        ))}
      </Card>
      <Text variant="title">{t.stats.total} open {t.stats.total === 1 ? 'scholarship' : 'scholarships'}</Text>
    </View>
  )

  return (
    <>
      <Stack.Screen options={{ title: 'Scholarships' }} />
      <FlatList
        data={t.listings}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ListingCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={<Message title="Nothing open right now" text="New scholarships are added every week." />}
        ListFooterComponent={t.related.length ? (
          <View style={{ gap: space.sm, paddingTop: space.xl }}>
            <Text variant="title">Related searches</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {t.related.map((r) => <Chip key={r.slug} label={r.label} onPress={() => router.push(`/topic/${r.slug}`)} />)}
            </View>
          </View>
        ) : undefined}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}
        style={{ backgroundColor: c.bg }}
      />
    </>
  )
}
