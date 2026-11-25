import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react'
import {
  ActivityIndicator, Pressable, Switch, Text as RNText, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { TOUCH, fonts, radius, space, useColors } from '@/constants/theme'

type IconName = keyof typeof Ionicons.glyphMap

/**
 * Type scale. Headings, labels and numbers use Plus Jakarta Sans; anything you
 * read in sentences uses Inter.
 */
type Variant = 'hero' | 'display' | 'heading' | 'title' | 'body' | 'small' | 'caption' | 'label' | 'number'
const VARIANTS: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  display: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.displayHeavy, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.display, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  number: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, fontVariant: ['tabular-nums'] },
}

export function Text({ variant = 'body', muted, color, style, ...rest }: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const c = useColors()
  return <RNText {...rest} style={[VARIANTS[variant], { color: color ?? (muted ? c.muted : c.text) }, style]} />
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'light' | 'outlineLight'

/** Pill button. "light" / "outlineLight" are for brand-blue backgrounds. */
export function Button({
  label, onPress, kind = 'primary', loading, disabled, icon, style, accessibilityHint,
}: {
  label: string
  onPress?: () => void
  kind?: ButtonKind
  loading?: boolean
  disabled?: boolean
  icon?: IconName
  style?: StyleProp<ViewStyle>
  accessibilityHint?: string
}) {
  const c = useColors()
  const look: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: c.brand, fg: c.onBrand },
    secondary: { bg: c.surface, fg: c.text, border: c.line },
    ghost: { bg: 'transparent', fg: c.link },
    light: { bg: '#ffffff', fg: '#1a4880' },
    outlineLight: { bg: 'transparent', fg: '#ffffff', border: 'rgba(255,255,255,0.55)' },
  }
  const { bg, fg, border } = look[kind]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: 54, borderRadius: radius.pill, paddingHorizontal: space.xl,
          backgroundColor: bg, borderWidth: border ? 1.5 : 0, borderColor: border,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text variant="title" color={fg} style={{ fontSize: 15.5 }}>{label}</Text>
    </Pressable>
  )
}

/** Round icon button (search, bell, close...). */
export function IconButton({ icon, onPress, label, badge, tone = 'surface', size = 46 }: {
  icon: IconName
  onPress?: () => void
  label: string
  badge?: number
  tone?: 'surface' | 'brand' | 'glass'
  size?: number
}) {
  const c = useColors()
  const bg = tone === 'brand' ? c.brand : tone === 'glass' ? 'rgba(255,255,255,0.16)' : c.surface
  const fg = tone === 'surface' ? c.text : '#ffffff'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        borderWidth: tone === 'surface' ? 1 : 0, borderColor: c.line, opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={size * 0.44} color={fg} />
      {!!badge && (
        <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.bad, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bg }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 10.5, lineHeight: 13 }} color="#ffffff">{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  )
}

export type InputRef = ComponentRef<typeof TextInput>

/** Pill text field with an icon. Passwords get a show/hide button. */
export const Field = forwardRef<InputRef, TextInputProps & { label: string; icon?: IconName; error?: string; hint?: string }>(
  function Field({ label, icon, error, hint, secureTextEntry, multiline, style, ...rest }, ref) {
    const c = useColors()
    const [hidden, setHidden] = useState(!!secureTextEntry)
    return (
      <View style={{ gap: 6 }}>
        <Text variant="caption" style={{ fontFamily: fonts.display, fontSize: 13 }}>{label}</Text>
        <View style={{
          flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: space.sm,
          minHeight: multiline ? 120 : 54, borderRadius: multiline ? radius.md : radius.pill,
          borderWidth: 1.5, borderColor: error ? c.bad : c.line, backgroundColor: c.surface, paddingHorizontal: space.lg,
          paddingVertical: multiline ? space.md : 0,
        }}>
          {icon ? <Ionicons name={icon} size={18} color={c.muted} style={multiline ? { marginTop: 2 } : undefined} /> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={c.placeholder}
            accessibilityLabel={label}
            secureTextEntry={hidden}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            {...rest}
            style={[{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: c.text, paddingVertical: multiline ? 0 : 14, minHeight: multiline ? 96 : undefined }, style]}
          />
          {secureTextEntry ? (
            <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden((h) => !h)} hitSlop={10}>
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.muted} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text variant="small" color={c.bad}>{error}</Text> : hint ? <Text variant="caption" muted>{hint}</Text> : null}
      </View>
    )
  },
)

/** Filter / topic pill. Selected = brand blue. */
export function Chip({ label, active, onPress, count, icon }: { label: string; active?: boolean; onPress?: () => void; count?: number; icon?: IconName }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: space.lg, borderRadius: radius.pill, justifyContent: 'center',
        backgroundColor: active ? c.brand : c.surface, borderWidth: 1, borderColor: active ? c.brand : c.line,
        flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={15} color={active ? c.onBrand : c.muted} /> : null}
      <Text style={{ fontFamily: fonts.display, fontSize: 13.5 }} color={active ? c.onBrand : c.text}>{label}</Text>
      {count !== undefined && <Text style={{ fontFamily: fonts.display, fontSize: 12.5 }} color={active ? c.onHeroMuted : c.muted}>{count}</Text>}
    </Pressable>
  )
}

export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: PressableProps['onPress']; accessibilityLabel?: string }) {
  const c = useColors()
  const base: ViewStyle = {
    backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg,
    shadowColor: c.shadow, shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  }
  if (!onPress) return <View style={[base, style]}>{children}</View>
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1 }, style]}>
      {children}
    </Pressable>
  )
}

export function Monogram({ text, size = 34 }: { text: string; size?: number }) {
  const c = useColors()
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.displayHeavy, fontSize: size * 0.36 }} color={c.onTint}>{text}</Text>
    </View>
  )
}

/** Initial in a brand circle (no photos stored). */
export function Avatar({ name, size = 44, inverse }: { name?: string | null; size?: number; inverse?: boolean }) {
  const c = useColors()
  // inverse = white disc for use on the dark-blue panels
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: inverse ? '#ffffff' : c.brand, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no">
      <Text style={{ fontFamily: fonts.displayHeavy, fontSize: size * 0.42 }} color={inverse ? '#1a4880' : '#ffffff'}>{(name?.trim() || 'X').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

/** Circular progress (profile completeness), drawn with SVG. */
export function ProgressRing({ value, size = 72, stroke = 8, color, track, children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const c = useColors()
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`${pct}% complete`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? c.line} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color ?? c.brand} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - pct / 100)} />
      </Svg>
      {children}
    </View>
  )
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 14.5 }}>{label}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} trackColor={{ true: c.brand, false: c.line }} thumbColor="#ffffff" />
    </View>
  )
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="heading" accessibilityRole="header" style={{ fontSize: 18 }}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={10}>
          <Text style={{ fontFamily: fonts.display, fontSize: 13.5 }} color={c.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  const c = useColors()
  return (
    <View style={{ padding: space.xxl, alignItems: 'center' }} accessibilityLabel={label}>
      <ActivityIndicator color={c.brand} />
    </View>
  )
}

export function Message({ icon = 'information-circle-outline', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  const c = useColors()
  return (
    <View style={{ padding: space.xl, alignItems: 'center', gap: space.sm }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.tint, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs }}>
        <Ionicons name={icon} size={28} color={c.onTint} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center', fontSize: 18 }}>{title}</Text>
      {text ? <Text variant="small" muted style={{ textAlign: 'center', maxWidth: 320 }}>{text}</Text> : null}
      {action ? <View style={{ marginTop: space.md, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  )
}
