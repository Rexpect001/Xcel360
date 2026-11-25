import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

const PATTERN = require('../../assets/pattern.png')
const TILE_W = 300
const TILE_H = Math.round((910 / 597) * TILE_W) // keep the pattern's aspect ratio

/**
 * The Xcel360 brand backdrop: deep-blue gradient with the website's pattern
 * drifting slowly and a soft light that breathes. Still when the phone asks
 * for reduced motion.
 */
export function BrandBackdrop({ intensity = 1 }: { intensity?: number }) {
  const reduce = useReducedMotion()
  const drift = useSharedValue(0)
  const glow = useSharedValue(0)

  useEffect(() => {
    if (reduce) return
    drift.value = withRepeat(withTiming(1, { duration: 38000, easing: Easing.linear }), -1, false)
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.quad) })), -1, false)
  }, [reduce, drift, glow])

  // Move exactly one tile diagonally, then loop: seamless.
  const patternStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * TILE_W }, { translateY: -drift.value * TILE_H }],
  }))
  const glowStyle = useAnimatedStyle(() => ({ opacity: (0.14 + glow.value * 0.12) * intensity, transform: [{ scale: 1 + glow.value * 0.08 }] }))

  // Enough tiles to cover a tall phone plus one tile of travel
  const cols = 5
  const rows = 4

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#0e2643', '#1a4880', '#2266b1']} locations={[0, 0.55, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, opacity: 0.16 * intensity }, patternStyle]}>
        {Array.from({ length: rows }).map((_, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {Array.from({ length: cols }).map((__, cIdx) => (
              <Animated.Image key={cIdx} source={PATTERN} style={{ width: TILE_W, height: TILE_H }} resizeMode="cover" />
            ))}
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', width: 420, height: 420, borderRadius: 210, backgroundColor: '#41a5ee', top: -140, right: -170 }, glowStyle]} />
      <Animated.View style={[{ position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: '#2266b1', bottom: -120, left: -150 }, glowStyle]} />
      <LinearGradient colors={['rgba(14,38,67,0)', 'rgba(14,38,67,0.55)']} style={[StyleSheet.absoluteFill, { top: '55%' }]} />
    </View>
  )
}
