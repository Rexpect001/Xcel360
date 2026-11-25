import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { AuthLayout } from '@/components/auth-layout'
import { Button, Field, Text, type InputRef } from '@/components/ui'
import { fonts, space, useColors } from '@/constants/theme'
import { useAuth } from '@/providers/auth-provider'

export default function SignUp() {
  const c = useColors()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<InputRef>(null)
  const passwordRef = useRef<InputRef>(null)

  const submit = async () => {
    // Same rules as the server, checked here first so students get instant feedback
    if (!name.trim()) return setError('Please enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true); setError('')
    try {
      await signUp(name.trim(), email.trim(), password)
      if (router.canGoBack()) router.back()
      else router.replace('/home')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Free forever. Includes 100 AI credits for your CV and SOP.">
      <Field label="Full name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" textContentType="name" maxLength={100}
        returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} placeholder="Ada Obi" />
      <Field ref={emailRef} label="Email" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email"
        keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@email.com" />
      <Field ref={passwordRef} label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password"
        textContentType="newPassword" returnKeyType="go" onSubmitEditing={submit} placeholder="At least 8 characters" />
      {error ? <Text color={c.bad} accessibilityLiveRegion="polite" style={{ fontFamily: fonts.semibold }}>{error}</Text> : null}
      <Button label="Create account" onPress={submit} loading={busy} />
      <Text variant="small" muted style={{ textAlign: 'center' }}>
        By creating an account you agree to our{' '}
        <Text variant="small" color={c.link} style={{ fontFamily: fonts.semibold }} onPress={() => router.push('/info/terms')}>Terms</Text> and{' '}
        <Text variant="small" color={c.link} style={{ fontFamily: fonts.semibold }} onPress={() => router.push('/info/privacy')}>Privacy Policy</Text>.
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.xs }}>
        <Text muted>Already have an account?</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/sign-in')}>
          <Text style={{ fontFamily: fonts.display }} color={c.link}>Sign in</Text>
        </Pressable>
      </View>
    </AuthLayout>
  )
}
