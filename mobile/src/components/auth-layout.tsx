import type { ReactNode } from 'react'
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandBackdrop } from '@/components/brand-backdrop'
import { IconButton, Text } from '@/components/ui'
import { radius, space, useColors } from '@/constants/theme'

const LOGO = require('../../assets/xcel-white.png')

/** Sign in, create account and forgot password: brand band on top, white sheet below. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0e2643' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.xl, paddingBottom: 56, overflow: 'hidden' }}>
          <BrandBackdrop intensity={0.8} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton icon="arrow-back" label="Back" tone="glass" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
            <Image source={LOGO} style={{ width: 96, height: 19 }} resizeMode="contain" accessibilityLabel="Xcel360" />
            <View style={{ width: 46 }} />
          </View>
          <View style={{ marginTop: space.xxl, gap: space.sm }}>
            <Text variant="hero" color="#ffffff" accessibilityRole="header">{title}</Text>
            {subtitle ? <Text color="#dbeaf8">{subtitle}</Text> : null}
          </View>
        </View>
        <View style={{
          flex: 1, marginTop: -28, backgroundColor: c.bg, borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4,
          padding: space.xl, paddingBottom: insets.bottom + space.xl, gap: space.lg,
        }}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
