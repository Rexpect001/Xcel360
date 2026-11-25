import { RefreshControl, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TabScreen } from '@/components/screen'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { Card, Loading, SectionHeader, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { useDrafts, useMe, useToolList } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { ToolSummary } from '@/lib/types'

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cv: 'document-text-outline', sop: 'reader-outline', 'cover-letter': 'mail-outline', 'cold-email': 'send-outline',
  'startup-idea': 'bulb-outline', 'startup-interviews': 'chatbubbles-outline', 'startup-roadmap': 'map-outline',
}

function ToolRow({ tool, step }: { tool: ToolSummary; step?: number }) {
  const c = useColors()
  return (
    <Card onPress={() => router.push(`/tool/${tool.id}`)} accessibilityLabel={`${tool.name}. ${tool.tagline}. ${tool.credits} credits.`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: step ? c.hero : c.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={ICONS[tool.id] ?? 'create-outline'} size={22} color="#ffffff" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {step ? <Text variant="label" color={c.link}>Step {step}</Text> : null}
        <Text variant="title">{tool.name}</Text>
        <Text variant="small" muted numberOfLines={2}>{tool.tagline}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 12.5 }} color={c.muted}>{tool.credits} cr</Text>
        <Ionicons name="chevron-forward" size={18} color={c.muted} />
      </View>
    </Card>
  )
}

export default function Tools() {
  const c = useColors()
  const { status } = useAuth()
  const me = useMe()
  const tools = useToolList()
  const drafts = useDrafts()

  if (status !== 'authenticated') {
    return (
      <TabScreen title="Writing tools">
        <SignInPrompt title="Write a stronger application" text="Create a free account to use the CV Builder, SOP Generator and more. You start with 100 AI credits." />
      </TabScreen>
    )
  }

  const credits = me.data?.credits
  return (
    <TabScreen title="Writing tools" subtitle="Drafts written from your own details. Edit them in your voice.">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md }}
        refreshControl={<RefreshControl refreshing={drafts.isRefetching} onRefresh={() => { void drafts.refetch(); void me.refetch() }} tintColor={c.brand} />}
      >
        <View style={{ backgroundColor: c.hero, borderRadius: radius.xl, padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" color={c.onHeroMuted}>AI credits</Text>
            <Text variant="small" color={c.onHeroMuted}>Invite a friend from your profile and you both get 50 more.</Text>
          </View>
          <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 40 }} color="#ffffff" accessibilityLabel={`${credits ?? 0} credits`}>
            {credits === undefined ? '–' : credits === null ? '∞' : credits}
          </Text>
        </View>

        {tools.isPending ? <Loading /> : (
          <>
            <View style={{ gap: space.md }}>
              <SectionHeader title="Applications" />
              {tools.data?.writing.map((t) => <ToolRow key={t.id} tool={t} />)}
            </View>
            <View style={{ gap: space.md, marginTop: space.md }}>
              <SectionHeader title="Launchpad" />
              <Text variant="small" muted>Test a startup idea: validate it, plan customer interviews, then build a 30-day roadmap.</Text>
              {tools.data?.launchpad.map((t, i) => <ToolRow key={t.id} tool={t} step={i + 1} />)}
            </View>
          </>
        )}

        <View style={{ gap: space.md, marginTop: space.md }}>
          <SectionHeader title="My drafts" />
          {drafts.isPending ? <Loading /> : !drafts.data?.length ? (
            <Text variant="small" muted>Your drafts appear here after you generate one. They're kept for 30 days.</Text>
          ) : drafts.data.slice(0, 20).map((d) => (
            <Card key={d.id} onPress={() => router.push(`/tool/${d.tool}?draft=${d.id}`)} accessibilityLabel={`${d.toolName}: ${d.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
              <Ionicons name={ICONS[d.tool] ?? 'document-outline'} size={20} color={c.link} />
              <View style={{ flex: 1 }}>
                <Text variant="title" numberOfLines={1} style={{ fontSize: 14.5 }}>{d.title}</Text>
                <Text variant="caption" muted>{d.toolName} · {new Date(d.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Card>
          ))}
        </View>
      </ScrollView>
    </TabScreen>
  )
}
