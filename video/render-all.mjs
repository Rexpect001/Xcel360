// Bundles once, then renders every composition to out/<id>.mp4.
//   node render-all.mjs                -> all four videos
//   node render-all.mjs JourneyTall    -> just the named compositions
//   node render-all.mjs --stills       -> review stills of every scene (out/stills)
import path from 'node:path'
import fs from 'node:fs'
import { bundle } from '@remotion/bundler'
import { getCompositions, renderMedia, renderStill } from '@remotion/renderer'

const args = process.argv.slice(2)
const stills = args.includes('--stills')
const only = args.filter((a) => !a.startsWith('--'))
const outDir = path.resolve('out')
fs.mkdirSync(path.join(outDir, 'stills'), { recursive: true })

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') })
const comps = (await getCompositions(serveUrl)).filter((c) => !only.length || only.includes(c.id))

for (const comp of comps) {
  if (stills) {
    // One frame three-quarters into each scene, matching the TransitionSeries layout.
    let start = 0
    for (const [i, scene] of comp.props.marks.entries()) {
      const frame = Math.min(comp.durationInFrames - 1, start + Math.floor(scene.dur * 0.75))
      const output = path.join(outDir, 'stills', `${comp.id}-${String(i + 1).padStart(2, '0')}-${scene.id}.png`)
      await renderStill({ composition: comp, serveUrl, output, frame, inputProps: comp.props })
      console.log('still', output)
      start += scene.dur - 12
    }
    continue
  }
  const output = path.join(outDir, `${comp.id}.mp4`)
  let last = -1
  await renderMedia({
    composition: comp, serveUrl, codec: 'h264', outputLocation: output, inputProps: comp.props, crf: 18,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10
      if (pct !== last) { last = pct; console.log(`${comp.id} ${pct}%`) }
    },
  })
  console.log('rendered', output)
}
