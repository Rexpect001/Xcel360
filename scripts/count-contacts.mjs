/** Counts master contacts + overlap with event registrants. Run: node scripts/count-contacts.mjs */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
loadEnv(new URL('../.env.local',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'))
loadEnv(new URL('../.env',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'))
const prisma = new PrismaClient()
async function main(){
  const db = prisma
  const totalContacts = await db.contact.count()
  const contacts = await db.contact.findMany({ select: { email: true } })
  const contactEmails = new Set(contacts.map(c => (c.email??'').toLowerCase().trim()).filter(Boolean))
  console.log(`Master contacts (rows):           ${totalContacts}`)
  console.log(`Unique contact emails:            ${contactEmails.size}`)

  const regs = await db.eventRegistration.findMany({ where: { eventId: 'cmobns2gx0000u9klishjmwqr' }, select: { email: true } })
  const regEmails = new Set(regs.map(r => (r.email??'').toLowerCase().trim()).filter(Boolean))
  let overlap = 0; for (const e of regEmails) if (contactEmails.has(e)) overlap++
  console.log(`Event registrants (unique):       ${regEmails.size}`)
  console.log(`Contacts who already registered:  ${overlap}`)
  console.log(`Contacts NOT yet registered:      ${contactEmails.size - overlap}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
