import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { AuthLayout } from '@/components/auth-layout'
import { Button, Field, Text, type InputRef } from '@/components/ui'
import { fonts, space, useColors } from '@/constants/theme'
import { useAuth } from '@/providers/auth-provider'

export default function SignIn() {
  const c = useColors()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const passwordRef = useRef<InputRef>(null)

  const submit = async () => {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    setBusy(true); setError('')
    try {
      await signIn(email, password)
      if (router.canGoBack()) router.back()
      else router.replace('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in with your Xcel360 email and password.">
      <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address"
        textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@email.com" />
      <Field ref={passwordRef} label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password"
        textContentType="password" returnKeyType="go" onSubmitEditing={submit} placeholder="Your password" />
      <Pressable accessibilityRole="link" onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 14 }} color={c.link}>Forgot password?</Text>
      </Pressable>
      {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}
      <Button label="Sign in" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.sm }}>
        <Text muted>New to Xcel360?</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/sign-up')}>
          <Text style={{ fontFamily: fonts.display }} color={c.link}>Create a free account</Text>
        </Pressable>
      </View>
    </AuthLayout>
  )
}
