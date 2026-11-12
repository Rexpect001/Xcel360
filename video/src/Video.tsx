import React from 'react'
import { AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile, useVideoConfig } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { Backdrop, Caption, Logo } from './ui'
import { c, sans } from './theme'

export type Format = 'wide' | 'tall'

export interface Scene {
  id: string
  /** Voiceover line for this scene - also shown as the on-screen caption. */
  text: string
  /** Frames. */
  dur: number
  dark?: boolean
  Visual: React.FC
}

/** The visuals are drawn on a fixed 1200x760 artboard and scaled into each format. */
export const ART_W = 1200
export const ART_H = 760
export const TRANSITION = 12

// Scene lists live in their own files; imported lazily via this registry so props stay JSON.
import { JOURNEY } from './journey'
import { AI_TOOLS } from './aitools'

export const VIDEOS = {
  Journey: { scenes: JOURNEY, voiceover: 'voiceover-journey.mp3' },
  AITools: { scenes: AI_TOOLS, voiceover: 'voiceover-aitools.mp3' },
}
export type VideoId = keyof typeof VIDEOS

export const totalFrames = (scenes: Scene[]) =>
  scenes.reduce((sum, sc) => sum + sc.dur, 0) - TRANSITION * (scenes.length - 1)

const SceneFrame: React.FC<{ scene: Scene; format: Format }> = ({ scene, format }) => {
  const dark = !!scene.dark
  const wide = format === 'wide'
  const { Visual } = scene
  const scale = wide ? 1 : 0.86
  return (
    <AbsoluteFill>
      <Backdrop dark={dark} />
      <div style={wide ? { position: 'absolute', left: 64, top: 52 } : { position: 'absolute', top: 170, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Logo white={dark} height={wide ? 34 : 52} />
      </div>
      <div
        style={{
          position: 'absolute', width: ART_W, height: ART_H, transformOrigin: 'top left',
          left: wide ? (1920 - ART_W) / 2 : (1080 - ART_W * scale) / 2,
          top: wide ? 64 : 330,
          transform: `scale(${scale})`,
        }}
      >
        <Visual />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: wide ? 850 : 1050, display: 'flex', justifyContent: 'center', padding: '0 60px' }}>
        <Caption text={scene.text} dur={scene.dur} size={wide ? 46 : 68} dark={dark} maxWidth={wide ? 1560 : 960} />
      </div>
      {!wide && (
        <div style={{ position: 'absolute', bottom: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: dark ? c.accent200 : c.brand600, letterSpacing: '0.02em' }}>thexcel360.com</span>
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
            <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.dur}>
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
