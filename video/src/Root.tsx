import React from 'react'
import { Composition } from 'remotion'
import { XcelVideo, totalFrames, VIDEOS, type Format } from './Video'
import { FPS } from './theme'

const FORMATS: { suffix: string; format: Format; width: number; height: number }[] = [
  { suffix: 'Wide', format: 'wide', width: 1920, height: 1080 }, // YouTube, X/Twitter, website
  { suffix: 'Tall', format: 'tall', width: 1080, height: 1920 }, // TikTok, WhatsApp Status, Reels, Shorts
]

export const Root: React.FC = () => (
  <>
    {(Object.keys(VIDEOS) as (keyof typeof VIDEOS)[]).flatMap((id) =>
      FORMATS.map((f) => (
        <Composition
          key={id + f.suffix}
          id={id + f.suffix}
          component={XcelVideo}
          durationInFrames={totalFrames(VIDEOS[id].scenes)}
          fps={FPS}
          width={f.width}
          height={f.height}
          defaultProps={{ video: id, format: f.format, marks: VIDEOS[id].scenes.map((sc) => ({ id: sc.id, dur: sc.dur })) }}
        />
      )),
    )}
  </>
)
