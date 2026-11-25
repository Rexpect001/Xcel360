import { useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, ScrollView, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, Field, Loading, Message, Text } from '@/components/ui'
import { fonts, space, useColors } from '@/constants/theme'
import { apiBody, post } from '@/lib/api'
import { openLink } from '@/lib/links'
import { useLegal, useMe } from '@/lib/queries'
import type { LegalDoc } from '@/lib/types'

const WHATSAPP = 'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30'
const EMAIL = 'hello@thexcel360.com'

/** **bold** and [label](href) from the shared legal text (src/content/legal.ts on the website). */
function Rich({ text }: { text: string }) {
  const c = useColors()
  const parts: { text: string; bold?: boolean; href?: string }[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) })
    parts.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], href: m[3] })
    last = re.lastIndex
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return (
    <Text>
      {parts.map((p, i) =>
        p.bold ? <Text key={i} style={{ fontFamily: fonts.semibold }}>{p.text}</Text>
          : p.href && !p.href.startsWith('#') ? <Text key={i} color={c.link} style={{ fontFamily: fonts.semibold }} onPress={() => openLink(p.href!)} accessibilityRole="link">{p.text}</Text>
            : <Text key={i}>{p.text}</Text>,
      )}
    </Text>
  )
}

function LegalView({ doc }: { doc: LegalDoc }) {
  const c = useColors()
  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.xl }} style={{ backgroundColor: c.bg }}>
      <View style={{ gap: space.sm }}>
        <Text variant="display" accessibilityRole="header">{doc.title}</Text>
        <Text muted>{doc.intro}</Text>
        <Text variant="caption" muted>Last updated: {doc.lastUpdated}</Text>
      </View>
      {doc.sections.map((s) => (
        <View key={s.id} style={{ gap: space.sm }}>
          <Text variant="heading" style={{ fontSize: 18 }} accessibilityRole="header">{s.title}</Text>
          {s.blocks.map((b, i) =>
            'h' in b ? <Text key={i} variant="title" style={{ marginTop: space.sm }}>{b.h}</Text>
              : 'ul' in b ? (
                <View key={i} style={{ gap: space.sm }}>
                  {b.ul.map((li) => (
                    <View key={li} style={{ flexDirection: 'row', gap: space.sm }}>
                      <Text color={c.link}>•</Text>
                      <View style={{ flex: 1 }}><Rich text={li} /></View>
                    </View>
                  ))}
                </View>
              ) : <Rich key={i} text={b.p} />,
          )}
        </View>
      ))}
    </ScrollView>
  )
}

function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const q = useLegal(kind)
  if (q.isPending) return <Loading />
  if (q.isError || !q.data) return <Message icon="cloud-offline-outline" title="Couldn't load this page" text={q.error?.message} />
  return <LegalView doc={q.data} />
}

function Contact() {
  const c = useColors()
  const me = useMe()
  const [name, setName] = useState(me.data?.name ?? '')
  const [email, setEmail] = useState(me.data?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const send = async () => {
    if (!name.trim()) return setError('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (message.trim().length < 10) return setError('Please add a little more detail (at least 10 characters).')
    setBusy(true); setError('')
    try {
      await apiBody('/contact', post({ kind: 'contact', name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }), { auth: false })
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your message. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text variant="display" accessibilityRole="header">Contact us</Text>
          <Text muted>Questions about a scholarship, your account or the app? We reply by email.</Text>
        </View>
        {sent ? (
          <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
            <Ionicons name="checkmark-circle" size={44} color={c.ok} />
            <Text variant="heading" style={{ fontSize: 18 }}>Message sent</Text>
            <Text muted style={{ textAlign: 'center' }}>Thanks, {name.split(' ')[0]}. We'll reply to {email}.</Text>
            <Button label="Send another" kind="ghost" onPress={() => { setSent(false); setSubject(''); setMessage('') }} />
          </Card>
        ) : (
          <>
            <Field label="Your name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" maxLength={120} />
            <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={200} />
            <Field label="Subject" icon="chatbox-outline" value={subject} onChangeText={setSubject} placeholder="What's this about?" maxLength={200} />
            <Field label="Message" value={message} onChangeText={setMessage} multiline placeholder="Tell us more..." maxLength={5000} />
            {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}
            <Button label="Send message" icon="send" onPress={send} loading={busy} />
          </>
        )}
        <Card style={{ gap: space.md }}>
          <Text variant="title">Other ways to reach us</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name="mail-outline" size={20} color={c.link} />
            <Text selectable style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${EMAIL}`).catch(() => {})}>{EMAIL}</Text>
          </View>
          <Button label="Join our WhatsApp channel" kind="secondary" icon="logo-whatsapp" onPress={() => Linking.openURL(WHATSAPP).catch(() => {})} style={{ minHeight: 48 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default function InfoScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>()
  const title = kind === 'privacy' ? 'Privacy' : kind === 'terms' ? 'Terms' : 'Contact'
  return (
    <>
      <Stack.Screen options={{ title }} />
      {kind === 'privacy' || kind === 'terms' ? <Legal kind={kind} /> : <Contact />}
    </>
  )
}
