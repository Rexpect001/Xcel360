/**
 * Exports all registrant phone numbers in ready-to-send formats.
 * Outputs to Xcel360/events/sms/.
 *   node scripts/export-phones.mjs
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))
const prisma=new PrismaClient()
const EVENT_ID='cmobns2gx0000u9klishjmwqr'
const OUT=here('../../../Xcel360/events/sms/')
mkdirSync(OUT,{recursive:true})

// Known African country codes we expect in this audience.
const INTL_CC=['233','254','263','266','27','237','256','255','250','228','229','221','220']

function classify(raw){
  if(!raw) return {status:'empty'}
  let s=String(raw).replace(/[^\d+]/g,'').replace(/\++/g,'+').replace(/(?!^)\+/g,'')
  s=s.replace(/^\+/,'')
  if(s.startsWith('00')) s=s.slice(2)
  // Nigerian
  if(s.startsWith('0')&&s.length===11) return {status:'ng',e164:'234'+s.slice(1),local:s}
  if(s.length===10&&/^[789]/.test(s)) return {status:'ng',e164:'234'+s,local:'0'+s}
  if(s.startsWith('234')&&s.length===13) return {status:'ng',e164:s,local:'0'+s.slice(3)}
  // International (other African codes), length 11–13
  for(const cc of INTL_CC){ if(s.startsWith(cc)&&s.length>=11&&s.length<=13) return {status:'intl',e164:s} }
  return {status:'bad',raw}
}

function csvField(s){ s=s==null?'':String(s); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s }

const regs=await prisma.eventRegistration.findMany({where:{eventId:EVENT_ID},select:{fullName:true,phone:true,whatsappPhone:true}})

const rows=[]; const ng=new Set(); const ngLocal=new Set(); const intl=new Set(); const bad=[]
for(const r of regs){
  const c=classify(r.phone)
  rows.push({name:r.fullName,raw:r.phone,...c})
  if(c.status==='ng'){ ng.add(c.e164); ngLocal.add(c.local) }
  else if(c.status==='intl'){ intl.add(c.e164) }
  else bad.push(r.phone)
}

// 1) Full CSV
const csv=['full_name,raw_phone,e164,local,status']
for(const r of rows) csv.push([csvField(r.name),csvField(r.raw),csvField(r.e164||''),csvField(r.local||''),r.status].join(','))
writeFileSync(OUT+'registrant-phones.csv',csv.join('\n')+'\n','utf8')

// 2) Plain lists
writeFileSync(OUT+'phones-234.txt',[...ng].join('\n')+'\n','utf8')
writeFileSync(OUT+'phones-local-0.txt',[...ngLocal].join('\n')+'\n','utf8')
writeFileSync(OUT+'phones-234-comma.txt',[...ng].join(',')+'\n','utf8')
writeFileSync(OUT+'phones-international.txt',[...intl].join('\n')+'\n','utf8')
if(bad.length) writeFileSync(OUT+'phones-unresolved.txt',bad.join('\n')+'\n','utf8')

console.log(`Registrations:            ${regs.length}`)
console.log(`Nigerian (unique):        ${ng.size}`)
console.log(`International (unique):    ${intl.size}  -> ${[...intl].slice(0,8).join(', ')}${intl.size>8?' …':''}`)
console.log(`Unresolved/bad:           ${bad.length}  -> ${bad.slice(0,8).join(', ')}${bad.length>8?' …':''}`)
console.log(`\nFiles written to: ${OUT}`)
console.log('  registrant-phones.csv      (name, raw, e164, local, status)')
console.log('  phones-234.txt             (234XXXXXXXXXX, one per line)')
console.log('  phones-local-0.txt         (0XXXXXXXXXX, one per line)')
console.log('  phones-234-comma.txt       (comma-separated, for paste)')
console.log('  phones-international.txt    (non-Nigerian E.164)')
await prisma.$disconnect()
