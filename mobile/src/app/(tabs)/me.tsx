import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Share, View } from 'react-native'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useQueryClient } from '@tanstack/react-query'
import { TabScreen } from '@/components/screen'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { Avatar, Button, Card, Chip, Field, Loading, ProgressRing, SectionHeader, Text, Toggle } from '@/components/ui'
import { TOUCH, fonts, radius, space, useColors } from '@/constants/theme'
import { apiBody } from '@/lib/api'
import { useMe, useProfile, useReferral } from '@/lib/queries'
import { useAuth } from '@/providers/auth-provider'
import type { Profile } from '@/lib/types'

const WHATSAPP = 'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30'
const LEVELS: NonNullable<Profile['level']>[] = ['Undergrad', 'Masters', 'PhD', 'Postdoc']
const LEVEL_LABEL: Record<string, string> = { Undergrad: 'Undergraduate', Masters: "Master's", PhD: 'PhD', Postdoc: 'Postdoc' }

type IconName = keyof typeof Ionicons.glyphMap

function Row({ icon, label, onPress, last }: { icon: IconName; label: string; onPress: () => void; last?: boolean }) {
  const c = useColors()
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH + 12, paddingHorizontal: space.lg, opacity: pressed ? 0.7 : 1, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={c.onTint} />
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 15 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  )
}

function HelpCard() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Row icon="chatbubble-ellipses-outline" label="Contact us" onPress={() => router.push('/info/contact')} />
      <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => router.push('/info/privacy')} />
      <Row icon="document-text-outline" label="Terms of service" onPress={() => router.push('/info/terms')} last />
    </Card>
  )
}

/** Big green card: the community lives on WhatsApp. */
function WhatsAppCard() {
  const c = useColors()
  return (
    <Card onPress={() => Linking.openURL(WHATSAPP).catch(() => {})} accessibilityLabel="Join the Xcel360 WhatsApp channel"
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: c.hero }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1f8f4e', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="logo-whatsapp" size={26} color="#ffffff" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="title" color={c.onHero}>Join our WhatsApp channel</Text>
        <Text variant="small" color={c.onHeroMuted}>New scholarships and tips, the day we post them.</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={c.onHeroMuted} />
    </Card>
  )
}

const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 20)

function ProfileForm({ initialName, onDone }: { initialName: string; onDone: () => void }) {
  const c = useColors()
  const qc = useQueryClient()
  const profile = useProfile()
  const p = profile.data
  const [name, setName] = useState(initialName)
  const [level, setLevel] = useState<Profile['level']>(null)
  const [course, setCourse] = useState('')
  const [degree, setDegree] = useState('')
  const [school, setSchool] = useState('')
  const [countries, setCountries] = useState('')
  const [fields, setFields] = useState('')
  const [inApp, setInApp] = useState(true)
  const [email, setEmail] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!p) return
    setLevel(p.level); setCourse(p.courseOfStudy ?? ''); setDegree(p.degree ?? ''); setSchool(p.school ?? '')
    setCountries(p.targetCountries.join(', ')); setFields(p.targetFields.join(', '))
    setInApp(p.notifyInApp); setEmail(p.notifyEmail)
  }, [p])

  if (profile.isPending) return <Loading />

  const save = async () => {
    if (!name.trim()) return setError('Please enter your name.')
    setBusy(true); setError('')
    try {
      await apiBody('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(), level, courseOfStudy: course.trim(), degree: degree.trim(), school: school.trim(),
          targetCountries: split(countries), targetFields: split(fields), notifyInApp: inApp, notifyEmail: email,
        }),
      })
      await Promise.all(['me', 'profile', 'home'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ gap: space.lg }}>
      <Text variant="heading" style={{ fontSize: 18 }}>Edit profile</Text>
      <Field label="Full name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" maxLength={100} />
      <View style={{ gap: 6 }}>
        <Text variant="caption" style={{ fontFamily: fonts.display, fontSize: 13 }}>Level you're applying for</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {LEVELS.map((l) => <Chip key={l} label={LEVEL_LABEL[l]} active={level === l} onPress={() => setLevel((v) => (v === l ? null : l))} />)}
        </View>
      </View>
      <Field label="Field of study" icon="school-outline" value={course} onChangeText={setCourse} placeholder="e.g. Public Health" maxLength={120} />
      <Field label="Current or last degree" icon="ribbon-outline" value={degree} onChangeText={setDegree} placeholder="e.g. BSc Microbiology" maxLength={120} />
      <Field label="School" icon="business-outline" value={school} onChangeText={setSchool} placeholder="e.g. University of Lagos" maxLength={160} />
      <Field label="Target countries" icon="globe-outline" value={countries} onChangeText={setCountries} placeholder="e.g. UK, Canada, Germany" hint="Separate with commas." />
      <Field label="Fields you want to study" icon="flask-outline" value={fields} onChangeText={setFields} placeholder="e.g. Data Science, Public Policy" hint="Separate with commas." />
      <View style={{ gap: space.xs }}>
        <Toggle label="Notifications in the app" hint="Deadline reminders, new matches and notices" value={inApp} onChange={setInApp} />
        <Toggle label="Email updates" hint="Weekly digest and reminders by email" value={email} onChange={setEmail} />
      </View>
      {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label="Cancel" kind="secondary" onPress={onDone} style={{ flex: 1 }} />
        <Button label="Save" icon="checkmark" onPress={save} loading={busy} style={{ flex: 1 }} />
      </View>
    </Card>
  )
}

function InviteCard() {
  const c = useColors()
  const ref = useReferral()
  const [copied, setCopied] = useState(false)
  const r = ref.data
  if (!r) return null
  const full = r.remaining <= 0
  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="gift-outline" size={22} color={c.onTint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="title">Invite a friend</Text>
          <Text variant="small" muted>{full ? `You've earned the maximum ${r.max * r.perFriend} credits. Thank you!` : `You both get ${r.perFriend} AI credits when they sign up.`}</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Your invite code ${r.code}. Tap to copy.`}
        onPress={async () => { await Clipboard.setStringAsync(r.link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.pill, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, backgroundColor: c.bg, paddingHorizontal: space.lg, minHeight: 50 }}>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 17, letterSpacing: 2 }}>{r.code}</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 13.5 }} color={copied ? c.ok : c.link}>{copied ? 'Link copied' : 'Copy link'}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" muted>{r.rewards} of {r.max} friends joined · {r.credits} credits earned</Text>
      </View>
      <Button label="Share invite" icon="share-social-outline" onPress={() => Share.share({ message: `I use Xcel360 to find fully funded scholarships. Join with my link and we both get ${r.perFriend} free AI credits: ${r.link}` }).catch(() => {})} />
    </Card>
  )
}

export default function Me() {
  const c = useColors()
  const { status, signOut } = useAuth()
  const me = useMe()
  const [editing, setEditing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const version = Constants.expoConfig?.version ?? ''

  if (status !== 'authenticated') {
    return (
      <TabScreen title="Profile">
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg }}>
          <SignInPrompt title="Your Xcel360 account" text="Sign in with the same account you use on thexcel360.com, or create one for free." />
          <WhatsAppCard />
          <HelpCard />
          <Text variant="caption" muted style={{ textAlign: 'center' }}>Xcel360 {version}</Text>
        </ScrollView>
      </TabScreen>
    )
  }

  const m = me.data
  const p = m?.profile
  const summary = [p?.level ? LEVEL_LABEL[p.level] ?? p.level : null, p?.courseOfStudy, p?.targetCountries?.length ? p.targetCountries.slice(0, 3).join(', ') : null].filter(Boolean).join(' · ')

  return (
    <TabScreen title="Profile" showGreeting={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg }} keyboardShouldPersistTaps="handled">
        {me.isPending ? <Loading /> : m ? (
          <View style={{ backgroundColor: c.hero, borderRadius: radius.xl, padding: space.lg, gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={m.name ?? m.email} size={56} inverse />
              <View style={{ flex: 1 }}>
                <Text variant="heading" color={c.onHero} numberOfLines={1}>{m.name ?? 'Student'}</Text>
                <Text variant="small" color={c.onHeroMuted} numberOfLines={1}>{m.email}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <ProgressRing value={m.profileCompleteness} size={76} stroke={8} color="#ffffff" track="rgba(255,255,255,0.22)">
                <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 18 }} color="#ffffff">{m.profileCompleteness}%</Text>
              </ProgressRing>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="title" color={c.onHero}>{m.profileCompleteness >= 80 ? 'Profile looks great' : 'Complete your profile'}</Text>
                <Text variant="small" color={c.onHeroMuted} numberOfLines={2}>{summary || 'Add your level, field and target countries for better matches.'}</Text>
              </View>
            </View>
            {!editing && <Button label="Edit profile" kind="light" icon="create-outline" onPress={() => setEditing(true)} style={{ minHeight: 48 }} />}
          </View>
        ) : null}

        {editing && <ProfileForm initialName={m?.name ?? ''} onDone={() => setEditing(false)} />}

        <InviteCard />
        <WhatsAppCard />

        <View style={{ gap: space.md }}>
          <SectionHeader title="Help" />
          <HelpCard />
        </View>

        <Button label="Sign out" kind="secondary" icon="log-out-outline" loading={leaving}
          onPress={async () => { setLeaving(true); try { await signOut() } finally { setLeaving(false); router.replace('/welcome') } }} />
        <Text variant="caption" muted style={{ textAlign: 'center' }}>Xcel360 {version}</Text>
      </ScrollView>
    </TabScreen>
  )
}
