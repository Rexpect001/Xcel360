import { Redirect } from 'expo-router'
import { View } from 'react-native'
import { useAuth } from '@/providers/auth-provider'

/** Signed in: straight to Home. Signed out: the welcome page (sign in, create account, or browse). */
export default function Index() {
  const { status } = useAuth()
  if (status === 'loading') return <View style={{ flex: 1, backgroundColor: '#0e2643' }} />
  return <Redirect href={status === 'authenticated' ? '/home' : '/welcome'} />
}
