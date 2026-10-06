import nextEnv from '@next/env'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

nextEnv.loadEnvConfig(process.cwd())

const fileArg = process.argv.find((arg) => arg.startsWith('--file='))
if (!fileArg) {
  console.error('Pass --file=PATH to a dynamic-og-backup JSON file. Add --apply to restore it.')
  process.exit(1)
}

const filePath = resolve(fileArg.slice('--file='.length))
const rows = JSON.parse(await readFile(filePath, 'utf8'))
if (!Array.isArray(rows) || !rows.every((row) =>
  typeof row.id === 'string' && typeof row.imageUrl === 'string' && row.imageUrl.includes('/api/og')
)) {
  throw new Error('Backup file is not a valid dynamic OG URL backup')
}

console.log(`${rows.length} records in ${filePath}.`)
if (!process.argv.includes('--apply')) {
  console.log('Dry run. Add --apply to restore links only where the image is still empty.')
  process.exit(0)
}

const prisma = new PrismaClient()
try {
  let restored = 0
  for (const row of rows) {
    const result = await prisma.opportunity.updateMany({
      where: { id: row.id, imageUrl: null },
      data: { imageUrl: row.imageUrl },
    })
    restored += result.count
  }
  console.log(`${restored} URLs restored; newer images were not overwritten.`)
} finally {
  await prisma.$disconnect()
}
