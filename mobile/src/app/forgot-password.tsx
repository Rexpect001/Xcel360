import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AuthLayout } from '@/components/auth-layout'
import { Button, Card, Field, Text } from '@/components/ui'
import { fonts, space, useColors } from '@/constants/theme'
import { apiBody, post } from '@/lib/api'

/** Request a reset link by email (the website's reset flow; the link opens the reset page). */
export default function ForgotPassword() {
  const c = useColors()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    setBusy(true); setError('')
    try {
      // Same answer whether or not the email has an account, so nothing is revealed
      await apiBody('/auth/forgot-password', post({ email: email.trim() }), { auth: false })
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <Card style={{ alignItems: 'center', gap: space.md, paddingVertical: space.xl }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="mail-open-outline" size={28} color={c.onTint} />
          </View>
          <Text style={{ textAlign: 'center' }}>
            If <Text style={{ fontFamily: fonts.semibold }}>{email.trim()}</Text> has an Xcel360 account, we have sent a link to reset your password.
          </Text>
          <Text variant="small" muted style={{ textAlign: 'center' }}>The link works for 1 hour. Check your spam folder if you can't see it.</Text>
        </Card>
        <Button label="Back to sign in" onPress={() => router.replace('/sign-in')} />
        <Button label="Use a different email" kind="ghost" onPress={() => setSent(false)} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a reset link.">
      <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address"
        textContentType="emailAddress" returnKeyType="send" onSubmitEditing={submit} placeholder="you@email.com" />
      {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}
      <Button label="Send reset link" onPress={submit} loading={busy} />
      <Button label="Back to sign in" kind="ghost" onPress={() => router.replace('/sign-in')} />
    </AuthLayout>
  )
}
