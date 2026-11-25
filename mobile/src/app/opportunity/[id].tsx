import { Pressable, ScrollView, Share, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, Chip, Loading, Message, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { deadlineInfo, levels, urgencyColors } from '@/lib/format'
import { useListing, useSaveToggle } from '@/lib/queries'

/** Listing text is hand-written with markdown-ish bullets; show it as clean lines. */
const tidy = (s: string) => s.replace(/\*\*/g, '').replace(/^\s*[*•]\s+/gm, '• ').replace(/^#+\s*/gm, '').trim()

const CATEGORY_LABEL = { SCHOLARSHIP: 'Scholarship', JOB: 'Job', INTERNSHIP: 'Internship' } as const

const TAILOR: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  cv: { label: 'CV', icon: 'document-text-outline' },
  sop: { label: 'SOP', icon: 'reader-outline' },
  'cover-letter': { label: 'Cover letter', icon: 'mail-outline' },
}

export default function OpportunityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const c = useColors()
  const insets = useSafeAreaInsets()
  const q = useListing(id)
  const save = useSaveToggle(id)
  const o = q.data

  if (q.isPending) return <><Stack.Screen options={{ title: '' }} /><Loading /></>
  if (q.isError || !o) {
    return <Message icon="alert-circle-outline" title="Couldn't open this opportunity" text={q.error?.message} action={<Button label="Go back" onPress={() => router.back()} />} />
  }

  const dl = deadlineInfo(o.deadline)
  const tone = urgencyColors(dl.urgency, c)
  const isSaved = save.saved ?? o.saved
  // The one place the app sends people out: the official application page
  const apply = () => WebBrowser.openBrowserAsync(o.applicationLink)
  const share = () => Share.share({ message: `${o.title} (${o.org})\nDeadline: ${dl.date}\n${o.webUrl}` }).catch(() => {})
  const isScholarship = o.category === 'SCHOLARSHIP'
  const tailor = isScholarship ? ['cv', 'sop', 'cover-letter'] : ['cv', 'cover-letter']

  const facts: [keyof typeof Ionicons.glyphMap, string, string, string?][] = [
    ['calendar-outline', 'Deadline', dl.date],
    ['time-outline', 'Time left', o.closed ? 'Closed' : dl.label, tone.fg],
    isScholarship ? ['cash-outline', 'Funding', o.fundingType || '-'] : ['briefcase-outline', 'Type', [o.jobType, o.remote ? 'Remote' : null].filter(Boolean).join(' · ') || '-'],
    isScholarship ? ['school-outline', 'Level', levels(o.programLevel)] : ['wallet-outline', 'Salary', o.salary || 'Not stated'],
  ]

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: CATEGORY_LABEL[o.category], headerRight: () => (
        <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Share" hitSlop={10} style={{ padding: 6 }}>
          <Ionicons name="share-social-outline" size={22} color={c.text} />
        </Pressable>
      ) }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={{ backgroundColor: c.hero, padding: space.lg, paddingBottom: space.xl, gap: space.sm, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 5 }}>
            <Text variant="caption" color={c.onHero} style={{ fontFamily: fonts.display }}>{o.org}</Text>
          </View>
          <Text variant="display" color={c.onHero} accessibilityRole="header">{o.title}</Text>
          <Text variant="small" color={c.onHeroMuted}>{[isScholarship ? levels(o.programLevel) : null, o.country, isScholarship ? o.fundingType : null].filter(Boolean).join(' · ')}</Text>
        </View>

        <View style={{ padding: space.lg, gap: space.xl }}>
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: space.sm, marginTop: -space.xl }}>
            {facts.map(([icon, label, value, color]) => (
              <View key={label} style={{ width: '50%', paddingVertical: space.sm, paddingRight: space.sm, flexDirection: 'row', gap: space.sm }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={icon} size={16} color={c.onTint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" muted>{label}</Text>
                  <Text variant="title" color={color} style={{ fontSize: 14 }}>{value}</Text>
                </View>
              </View>
            ))}
          </Card>

          {o.closed && (
            <Card style={{ backgroundColor: c.badSoft }}>
              <Text color={c.bad} style={{ fontFamily: fonts.semibold }}>Applications for this opportunity have closed.</Text>
            </Card>
          )}

          {!o.closed && (
            <View style={{ backgroundColor: c.tint, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
              <View style={{ gap: 4 }}>
                <Text variant="title" color={c.onTint}>Tailor your application</Text>
                <Text variant="small" color={c.onTint}>Draft documents written for this listing, right here in the app. You add your own experience.</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                {tailor.map((tool) => (
                  <Chip key={tool} label={TAILOR[tool].label} icon={TAILOR[tool].icon} onPress={() => router.push(`/tool/${tool}?opportunity=${o.id}`)} />
                ))}
              </View>
            </View>
          )}

          {o.description ? (
            <View style={{ gap: space.sm }}>
              <Text variant="heading" style={{ fontSize: 18 }} accessibilityRole="header">About</Text>
              <Text selectable>{tidy(o.description)}</Text>
            </View>
          ) : null}

          <View style={{ gap: space.sm }}>
            <Text variant="heading" style={{ fontSize: 18 }} accessibilityRole="header">{isScholarship ? 'Who can apply' : 'Requirements'}</Text>
            <Text selectable>{tidy(o.eligibility)}</Text>
          </View>

          {o.requiredDocs.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Text variant="heading" style={{ fontSize: 18 }} accessibilityRole="header">Documents you need</Text>
              {o.requiredDocs.map((doc) => (
                <View key={doc} style={{ flexDirection: 'row', gap: space.sm }}>
                  <Ionicons name="checkmark-circle" size={18} color={c.ok} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1 }}>{doc}</Text>
                </View>
              ))}
            </View>
          )}

          {o.topics.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Text variant="heading" style={{ fontSize: 18 }}>Browse similar</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {o.topics.map((t) => <Chip key={t.slug} label={t.label} onPress={() => router.push(`/topic/${t.slug}`)} />)}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky action bar, within thumb reach */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: space.sm, padding: space.md, paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save'}
          accessibilityState={{ selected: isSaved }}
          onPress={save.toggle}
          style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: isSaved ? c.brand : c.surface, borderWidth: 1.5, borderColor: isSaved ? c.brand : c.line }}
        >
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? c.onBrand : c.text} />
        </Pressable>
        <Button label={o.closed ? 'Closed' : 'Apply on official site'} icon="open-outline" onPress={apply} disabled={o.closed} style={{ flex: 1 }} />
      </View>
    </View>
  )
}
