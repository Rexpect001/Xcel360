import { useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Card, Chip, Field, Loading, Message, Text } from '@/components/ui'
import { fonts, radius, space, useColors } from '@/constants/theme'
import { ApiError, api, apiBody, post } from '@/lib/api'
import { useToolForm } from '@/lib/queries'
import { SignInPrompt } from '@/components/sign-in-prompt'
import { useAuth } from '@/providers/auth-provider'
import type { DraftCheck, ToolField } from '@/lib/types'

/** CV only: some questions belong to the academic or the job track. */
const trackOf = (values: Record<string, string>) => (values.track === 'Job / Industry CV' ? 'job' : 'academic')
const visible = (tool: string, f: ToolField, values: Record<string, string>) => !f.tracks || tool !== 'cv' || f.tracks.includes(trackOf(values))

interface GenerateResult { text: string; checks?: DraftCheck[]; draftId: string | null; credits: number | null; truncated?: boolean }

export default function ToolScreen() {
  const { tool, draft: draftParam, opportunity } = useLocalSearchParams<{ tool: string; draft?: string; opportunity?: string }>()
  const c = useColors()
  const insets = useSafeAreaInsets()
  const qc = useQueryClient()
  const { status } = useAuth()
  const form = useToolForm(tool, { draft: draftParam, opportunity })
  const f = form.data

  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [savedOutput, setSavedOutput] = useState('')
  const [checks, setChecks] = useState<DraftCheck[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(true)
  const [busy, setBusy] = useState<null | 'generate' | 'fix' | 'save'>(null)
  const [error, setError] = useState('')
  const [noCredits, setNoCredits] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [copied, setCopied] = useState(false)
  // Checks run when a draft is generated; a reopened draft has none to show
  const [checked, setChecked] = useState(false)

  // Load the form once: saved draft, or profile/listing prefill
  useEffect(() => {
    if (!f) return
    setValues(f.values)
    if (f.draft) {
      setOutput(f.draft.output); setSavedOutput(f.draft.output); setDraftId(f.draft.id); setShowForm(false)
    }
  }, [f])

  const fields = useMemo(() => (f ? f.fields.filter((fl) => visible(tool, fl, values)) : []), [f, tool, values])
  const missing = fields.filter((fl) => fl.required && !values[fl.id]?.trim())
  const dirty = !!draftId && output !== savedOutput
  const fixable = checks.some((ch) => ch.level === 'warn')

  if (status !== 'authenticated') return <SignInPrompt title="Sign in to use the writing tools" text="Your drafts are saved to your account and shared with thexcel360.com." />
  if (form.isPending) return <Loading />
  if (form.isError || !f) return <Message icon="alert-circle-outline" title="Couldn't open this tool" text={form.error?.message} action={<Button label="Go back" onPress={() => router.back()} />} />

  const run = async (action: 'generate' | 'fix') => {
    if (action === 'generate' && missing.length) { setError(`Please answer: ${missing.map((m) => m.label).join('; ')}`); return }
    setBusy(action); setError(''); setNoCredits(false); setConfirmRegenerate(false)
    try {
      const inputs = Object.fromEntries(fields.map((fl) => [fl.id, values[fl.id] ?? '']))
      const res = await apiBody<GenerateResult>('/tools/generate', post({
        tool, inputs, draftId, opportunityId: f.opportunity?.id, action, ...(action === 'fix' && { draft: output }),
      }))
      setOutput(res.text); setSavedOutput(res.text); setChecks(res.checks ?? []); setChecked(true); setShowForm(false)
      if (res.draftId) setDraftId(res.draftId)
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['drafts'] })
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setNoCredits(true)
      else setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (!draftId) return
    setBusy('save'); setError('')
    try {
      await api(`/drafts/${draftId}`, { method: 'PATCH', body: JSON.stringify({ output }) })
      setSavedOutput(output)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your edits.')
    } finally {
      setBusy(null)
    }
  }

  const copy = async () => {
    await Clipboard.setStringAsync(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: f.name }} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xxl, gap: space.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text variant="display" accessibilityRole="header">{f.name}</Text>
          <Text muted>{f.tagline}</Text>
        </View>

        {f.opportunity && (
          <Card style={{ backgroundColor: c.tint, flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Ionicons name="locate-outline" size={20} color={c.onTint} />
            <Text variant="small" color={c.onTint} style={{ flex: 1 }}>
              Tailored to <Text variant="small" color={c.onTint} style={{ fontFamily: fonts.display }}>{f.opportunity.title}</Text> ({f.opportunity.org}). We filled in what it asks for; add your own experience.
            </Text>
          </Card>
        )}

        {/* Answers */}
        {output ? (
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showForm }} onPress={() => setShowForm((s) => !s)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
            <Text variant="heading" style={{ fontSize: 18 }}>Your answers</Text>
            <Ionicons name={showForm ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
          </Pressable>
        ) : null}
        {showForm && (
          <View style={{ gap: space.lg }}>
            {fields.map((fl) => (
              <View key={fl.id} style={{ gap: space.sm }}>
                {fl.section ? <Text variant="label" color={c.link} style={{ marginTop: space.sm }}>{fl.section}</Text> : null}
                {fl.type === 'select' ? (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 13 }}>{fl.label}{fl.required ? ' *' : ''}</Text>
                    {fl.help ? <Text variant="caption" muted>{fl.help}</Text> : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup">
                      {fl.options?.map((o) => <Chip key={o} label={o} active={(values[fl.id] ?? fl.options?.[0]) === o} onPress={() => setValues((v) => ({ ...v, [fl.id]: o }))} />)}
                    </View>
                  </View>
                ) : (
                  <Field
                    label={`${fl.label}${fl.required ? ' *' : ''}`}
                    value={values[fl.id] ?? ''}
                    onChangeText={(t) => setValues((v) => ({ ...v, [fl.id]: t }))}
                    placeholder={fl.placeholder}
                    maxLength={fl.max}
                    multiline={fl.type === 'textarea'}
                    hint={fl.help}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}

        {noCredits && (
          <Card style={{ backgroundColor: c.warnSoft, gap: space.sm }}>
            <Text variant="title" color={c.warn}>You need more credits</Text>
            <Text variant="small">Invite a friend from your profile and you both get 50 credits. Editing and fixing issues stay free.</Text>
            <Button label="Invite a friend" onPress={() => router.push('/me')} style={{ minHeight: 46 }} />
          </Card>
        )}

        {(!output || showForm) && (
          confirmRegenerate ? (
            <View style={{ gap: space.sm }}>
              <Text variant="small" muted>A new version uses {f.credits} credits and replaces the text below. Your current text is kept as the previous version.</Text>
              <Button label={`Yes, write a new version (${f.credits} credits)`} onPress={() => run('generate')} loading={busy === 'generate'} />
              <Button label="Keep my draft" kind="ghost" onPress={() => setConfirmRegenerate(false)} />
            </View>
          ) : (
            <Button
              label={output ? `Write a new version · ${f.credits} credits` : `Write my draft · ${f.credits} credits`}
              icon="sparkles"
              onPress={() => (output ? setConfirmRegenerate(true) : run('generate'))}
              loading={busy === 'generate'}
            />
          )
        )}
        {busy === 'generate' && <Text variant="small" muted style={{ textAlign: 'center' }}>Writing your draft. This usually takes about 30 seconds.</Text>}

        {/* Draft */}
        {output ? (
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="heading" style={{ fontSize: 18 }}>{f.outputLabel}</Text>
              <Text variant="caption" muted>{dirty ? 'Unsaved changes' : draftId ? 'Saved' : ''}</Text>
            </View>
            <TextInput
              value={output}
              onChangeText={setOutput}
              multiline
              textAlignVertical="top"
              accessibilityLabel={f.outputLabel}
              style={{ minHeight: 320, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.line, padding: space.lg, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: c.text }}
            />
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              {dirty && <Chip label={busy === 'save' ? 'Saving…' : 'Save edits'} icon="checkmark" active onPress={save} />}
              <Chip label={copied ? 'Copied' : 'Copy'} icon="copy-outline" onPress={copy} />
              <Chip label="Share" icon="share-outline" onPress={() => Share.share({ message: output }).catch(() => {})} />
              {!showForm && <Chip label="Edit answers" icon="create-outline" onPress={() => setShowForm(true)} />}
            </View>

            {checks.length > 0 && (
              <Card style={{ gap: space.md }}>
                <Text variant="title">Draft check</Text>
                {checks.map((ch) => (
                  <View key={ch.code} style={{ flexDirection: 'row', gap: space.sm }}>
                    <Ionicons name={ch.level === 'warn' ? 'warning-outline' : 'information-circle-outline'} size={18} color={ch.level === 'warn' ? c.warn : c.link} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text variant="small">{ch.message}</Text>
                      {ch.items?.length ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {ch.items.map((it) => (
                            <View key={it} style={{ backgroundColor: c.bg, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                              <Text variant="caption">{it}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
                {fixable && draftId ? <Button label="Fix these issues (free)" icon="color-wand-outline" onPress={() => run('fix')} loading={busy === 'fix'} style={{ minHeight: 46 }} /> : null}
              </Card>
            )}
            {checks.length === 0 && checked && !busy ? (
              <Text variant="small" color={c.ok}>Passed our checks for made-up facts, clichés and length. Still read it carefully.</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
