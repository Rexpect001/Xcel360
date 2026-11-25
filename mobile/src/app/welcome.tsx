import { useEffect } from 'react'
import { Image, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { BrandBackdrop } from '@/components/brand-backdrop'
import { Button, Text } from '@/components/ui'
import { fonts, space } from '@/constants/theme'

const LOGO = require('../../assets/xcel-white.png')

/** First screen for anyone signed out: the logo, and three ways in. */
export default function Welcome() {
  const insets = useSafeAreaInsets()
  const reduce = useReducedMotion()
  const logo = useSharedValue(reduce ? 1 : 0)
  const actions = useSharedValue(reduce ? 1 : 0)

  useEffect(() => {
    if (reduce) return
    logo.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    actions.value = withDelay(450, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }))
  }, [reduce, logo, actions])

  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value, transform: [{ scale: 0.92 + logo.value * 0.08 }] }))
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actions.value, transform: [{ translateY: (1 - actions.value) * 24 }] }))

  // Home sits underneath, so Back from sign-in/up lands somewhere useful
  const go = (to: '/sign-in' | '/sign-up' | '/home') => {
    router.replace('/home')
    if (to !== '/home') router.push(to)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0e2643' }}>
      <StatusBar style="light" />
      <BrandBackdrop />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl }}>
        <Animated.View style={[{ alignItems: 'center' }, logoStyle]}>
          <Image source={LOGO} style={{ width: 236, height: 47 }} resizeMode="contain" accessibilityRole="header" accessibilityLabel="Xcel360" />
        </Animated.View>
      </View>
      <Animated.View style={[{ paddingHorizontal: space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }, actionsStyle]}>
        <Button label="Create a free account" kind="light" onPress={() => go('/sign-up')} />
        <Button label="Sign in" kind="outlineLight" onPress={() => go('/sign-in')} />
        <Pressable accessibilityRole="button" onPress={() => go('/home')} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 15 }} color="#dbeaf8">Browse for free</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}
