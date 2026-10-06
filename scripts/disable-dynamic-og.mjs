import nextEnv from '@next/env'
import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

nextEnv.loadEnvConfig(process.cwd())

const prisma = new PrismaClient()
try {
  const rows = await prisma.opportunity.findMany({
    where: { imageUrl: { contains: '/api/og' } },
    select: { id: true, imageUrl: true },
  })
  console.log(`${rows.length} opportunity records use dynamic OG images.`)

  if (process.argv.includes('--apply') && rows.length > 0) {
    const backupDir = join(process.cwd(), '.tmp')
    await mkdir(backupDir, { recursive: true })
    const backupPath = join(backupDir, `dynamic-og-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    await writeFile(backupPath, JSON.stringify(rows, null, 2), { flag: 'wx' })
    console.log(`Backup written to ${backupPath}`)
    const result = await prisma.opportunity.updateMany({
      where: { imageUrl: { contains: '/api/og' } },
      data: { imageUrl: null },
    })
    console.log(`${result.count} dynamic URLs removed. Public pages will use the static site image.`)
  } else if (!process.argv.includes('--apply')) {
    console.log('Dry run. Pass --apply to back up and clear these URLs.')
  }
} finally {
  await prisma.$disconnect()
}
