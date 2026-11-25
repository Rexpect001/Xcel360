import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Card, Monogram, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { deadlineInfo, levels, urgencyColors } from '@/lib/format'
import type { ListingCard as Listing } from '@/lib/types'
import { useSaveToggle } from '@/lib/queries'

function Fact({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 3, paddingRight: 6 }}>
      <Text variant="caption" muted>{label}</Text>
      <Text variant="small" numberOfLines={1} color={color} style={{ fontFamily: fonts.semibold }}>{value}</Text>
    </View>
  )
}

/** The web's "scholarship snapshot": the same four facts in the same order. */
export function ListingCard({ item, saved, reason }: { item: Listing; saved?: boolean; reason?: string }) {
  const c = useColors()
  const dl = deadlineInfo(item.deadline)
  const tone = urgencyColors(dl.urgency, c)
  const save = useSaveToggle(item.id)
  const isSaved = save.saved ?? saved ?? false
  // The save button is a sibling of the card's tap area, never inside it:
  // a button inside a button breaks screen readers (and is invalid on web).
  return (
    <View>
    <Card onPress={() => router.push(`/opportunity/${item.id}`)} accessibilityLabel={`${item.title}, ${item.org}, ${dl.label}`} style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Monogram text={item.monogram} size={30} />
        <Text variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>{item.org}</Text>
        {item.featured && <Text variant="label" color={c.link}>Featured</Text>}
      </View>
      <Text variant="title" numberOfLines={2}>{item.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: c.bg, borderRadius: radius.sm, padding: space.sm }}>
        <Fact label="Level" value={levels(item.programLevel)} />
        <Fact label="Destination" value={item.country} />
        <Fact label="Funding" value={item.fundingType || '-'} color={/full/i.test(item.fundingType) ? c.ok : undefined} />
        <Fact label="Deadline" value={dl.date} />
      </View>
      {reason ? <Text variant="small" muted numberOfLines={1}>{reason}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 40 }}>
        <View style={{ backgroundColor: tone.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text variant="caption" color={tone.fg} style={{ fontFamily: fonts.bold }}>{dl.label}</Text>
        </View>
      </View>
    </Card>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isSaved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
      accessibilityState={{ selected: isSaved }}
      onPress={save.toggle}
      hitSlop={10}
      style={{ position: 'absolute', right: space.md, bottom: space.md, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isSaved ? c.brand : c.surface, borderWidth: 1, borderColor: isSaved ? c.brand : c.line }}
    >
      <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? c.onBrand : c.text} />
    </Pressable>
    </View>
  )
}
