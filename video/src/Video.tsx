import React from 'react'
import { AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile, useVideoConfig } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { Backdrop, Logo } from './ui'
import { realFrames } from './time'
import { c, sans } from './theme'

export type Format = 'wide' | 'tall' | 'square'

/**
 * Where the logo and artboard sit in each format (canvas pixels). No captions: the motion
 * carries the story, so the 1200x760 artboard is scaled as large as each canvas allows.
 */
const LAYOUT: Record<Format, { w: number; h: number; scale: number; logo: { top: number; left?: number; h: number }; url?: number }> = {
  wide: { w: 1920, h: 1080, scale: 1.25, logo: { top: 40, left: 52, h: 36 } },
  tall: { w: 1080, h: 1920, scale: 0.9, logo: { top: 400, h: 80 }, url: 420 },
  // 1:1 for Instagram/Facebook feed, LinkedIn and X; also the GIF source
  square: { w: 1080, h: 1080, scale: 0.9, logo: { top: 64, h: 50 } },
}

export interface Scene {
  id: string
  /** Voiceover line for this scene (the videos no longer show captions). */
  text: string
  /** Length in design frames (30 fps design clock); played SPEED times faster, see time.ts. */
  dur: number
  dark?: boolean
  Visual: React.FC
}

/** The visuals are drawn on a fixed 1200x760 artboard and scaled into each format. */
export const ART_W = 1200
export const ART_H = 760
export const TRANSITION = 9

// Scene lists live in their own files; imported lazily via this registry so props stay JSON.
import { JOURNEY } from './journey'
import { AI_TOOLS } from './aitools'
import { PLATFORM } from './platform'
import { SMART_AI } from './smartai'
import { TRACKER } from './tracker'
import { MENTORSHIP } from './mentorship'
import { WRITING } from './writing'

export const VIDEOS = {
  Journey: { scenes: JOURNEY, voiceover: 'voiceover-journey.mp3' },
  AITools: { scenes: AI_TOOLS, voiceover: 'voiceover-aitools.mp3' },
  // Nov 2026 "what's new" series
  Platform: { scenes: PLATFORM, voiceover: 'voiceover-platform.mp3' },
  SmartAI: { scenes: SMART_AI, voiceover: 'voiceover-smartai.mp3' },
  Tracker: { scenes: TRACKER, voiceover: 'voiceover-tracker.mp3' },
  Mentorship: { scenes: MENTORSHIP, voiceover: 'voiceover-mentorship.mp3' },
  WritingSuite: { scenes: WRITING, voiceover: 'voiceover-writing.mp3' },
}
export type VideoId = keyof typeof VIDEOS

export const totalFrames = (scenes: Scene[]) =>
  scenes.reduce((sum, sc) => sum + realFrames(sc.dur), 0) - TRANSITION * (scenes.length - 1)

const SceneFrame: React.FC<{ scene: Scene; format: Format }> = ({ scene, format }) => {
  const dark = !!scene.dark
  const L = LAYOUT[format]
  const { Visual } = scene
  return (
    <AbsoluteFill>
      <Backdrop dark={dark} />
      {/* The closing scene draws its own large logo */}
      {scene.id !== 'end' && (
        <div style={L.logo.left !== undefined ? { position: 'absolute', left: L.logo.left, top: L.logo.top } : { position: 'absolute', top: L.logo.top, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Logo white={dark} height={L.logo.h} />
        </div>
      )}
      <div
        style={{
          position: 'absolute', width: ART_W, height: ART_H, transformOrigin: 'top left',
          left: (L.w - ART_W * L.scale) / 2,
          // Centred, nudged down a little to clear the logo
          top: (L.h - ART_H * L.scale) / 2 + (format === 'wide' ? 30 : format === 'square' ? 40 : 0),
          transform: `scale(${L.scale})`,
        }}
      >
        <Visual />
      </div>
      {L.url !== undefined && (
        <div style={{ position: 'absolute', bottom: L.url, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 44, color: dark ? c.accent200 : c.brand600, letterSpacing: '0.02em' }}>thexcel360.com</span>
        </div>
      )}
    </AbsoluteFill>
  )
}

export const XcelVideo: React.FC<{ video: VideoId; format: Format; /** Scene timing for tooling (render-all.mjs); not used here. */ marks?: { id: string; dur: number }[] }> = ({ video, format }) => {
  const { scenes, voiceover } = VIDEOS[video]
  const { durationInFrames } = useVideoConfig()
  const files = getStaticFiles().map((f) => f.name)
  const hasVo = files.includes(voiceover)
  const hasMusic = files.includes('music.mp3')
  return (
    <AbsoluteFill style={{ background: c.surface100 }}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const items = [
            <TransitionSeries.Sequence key={scene.id} durationInFrames={realFrames(scene.dur)}>
              <SceneFrame scene={scene} format={format} />
            </TransitionSeries.Sequence>,
          ]
          if (i < scenes.length - 1) {
            items.push(<TransitionSeries.Transition key={scene.id + '-t'} presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />)
          }
          return items
        })}
      </TransitionSeries>
      {hasVo && <Audio src={staticFile(voiceover)} />}
      {hasMusic && (
        <Audio
          src={staticFile('music.mp3')}
          loop
          volume={(f) =>
            interpolate(f, [0, 30, durationInFrames - 45, durationInFrames], [0, hasVo ? 0.12 : 0.35, hasVo ? 0.12 : 0.35, 0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            })
          }
        />
      )}
    </AbsoluteFill>
  )
}
