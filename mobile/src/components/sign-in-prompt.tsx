import { router } from 'expo-router'
import { Button, Message } from '@/components/ui'
import { View } from 'react-native'
import { space } from '@/constants/theme'

/** Shown on personal tabs for guests. */
export function SignInPrompt({ title, text }: { title: string; text: string }) {
  return (
    <Message
      icon="lock-closed-outline"
      title={title}
      text={text}
      action={
        <View style={{ gap: space.sm }}>
          <Button label="Create a free account" onPress={() => router.push('/sign-up')} />
          <Button label="Sign in" kind="secondary" onPress={() => router.push('/sign-in')} />
        </View>
      }
    />
  )
}
