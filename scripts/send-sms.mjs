/**
 * Bulk SMS to event registrants via SendChamp.
 *   node scripts/send-sms.mjs --dry                     # normalize + report, send nothing
 *   node scripts/send-sms.mjs --test 2348012345678      # one test SMS
 *   node scripts/send-sms.mjs --yes                      # send to ALL registrants
 *   optional: --sender "Xcel360"  --route dnd            # sender ID + route (dnd reaches DND lines)
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const prisma = new PrismaClient()
const SC_BASE='https://api.sendchamp.com/api/v1'
const EVENT_ID='cmobns2gx0000u9klishjmwqr'

const args=process.argv.slice(2)
const dry=args.includes('--dry')
const confirmed=args.includes('--yes')
const testIdx=args.indexOf('--test'); const testNumber=testIdx!==-1?args[testIdx+1]:null
const senderIdx=args.indexOf('--sender'); const SENDER=senderIdx!==-1?args[senderIdx+1]:'Xcel360'
const routeIdx=args.indexOf('--route'); const ROUTE=routeIdx!==-1?args[routeIdx+1]:'dnd'

// MTN bulk route blocks URLs AND the words "code"/"passcode" — keep it clean.
const MESSAGE = `Xcel360: Leveraging AI in Todays World holds TODAY 4PM WAT. Open Zoom app, Join a Meeting: ID 914 5917 2327, then enter XCEL360. See you there!`

// Normalize a Nigerian phone to E.164 digits (234XXXXXXXXXX). Returns null if implausible.
function normalize(raw){
  if(!raw) return null
  let s=String(raw).replace(/[^\d+]/g,'')
  s=s.replace(/^\+/,'')
  if(s.startsWith('00')) s=s.slice(2)
  if(s.startsWith('0') && s.length===11) s='234'+s.slice(1)        // 0803... -> 234803...
  else if(s.length===10) s='234'+s                                  // 803... -> 234803...
  else if(s.startsWith('234') && s.length===13) { /* ok */ }
  else return null                                                  // anything else: flag
  return /^234\d{10}$/.test(s) ? s : null
}

async function scSms(toArr){
  const apiKey=process.env.SENDCHAMP_API_KEY
  if(!apiKey) return {ok:false,error:'SENDCHAMP_API_KEY not set'}
  const payload={ to:toArr, message:MESSAGE, sender_name:SENDER, route:ROUTE }
  try{
    const res=await fetch(`${SC_BASE}/sms/send`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)})
    const data=await res.json().catch(()=>({}))
    if(!res.ok || data.status==='failed') return {ok:false,error:data.message??`HTTP ${res.status}`,raw:data}
    return {ok:true,raw:data}
  }catch(e){return {ok:false,error:e.message}}
}

async function main(){
  console.log(`Sender: "${SENDER}" | route: ${ROUTE}`)
  console.log(`Message (${MESSAGE.length} chars): ${MESSAGE}\n`)

  if(testNumber){
    const n=normalize(testNumber)||testNumber.replace(/[^\d]/g,'')
    console.log(`Sending TEST SMS to ${n} …`)
    const r=await scSms([n])
    console.log(r.ok?'✅ TEST accepted':`❌ ${r.error}`)
    if(r.raw) console.log('   response:', JSON.stringify(r.raw).slice(0,400))
    return
  }

  const regs=await prisma.eventRegistration.findMany({where:{eventId:EVENT_ID},select:{phone:true}})
  const seen=new Set(); const good=[]; const bad=[]
  for(const r of regs){ const n=normalize(r.phone); if(n){ if(!seen.has(n)){seen.add(n); good.push(n)} } else bad.push(r.phone) }
  console.log(`Registrations: ${regs.length}`)
  console.log(`Sendable (unique 234…): ${good.length}`)
  console.log(`Unnormalizable: ${bad.length}${bad.length?' -> '+bad.slice(0,10).join(', ')+(bad.length>10?' …':''):''}\n`)

  if(dry){ console.log('Dry run — nothing sent.'); return }
  if(!confirmed){ console.log('Refusing to send: pass --yes to confirm the bulk SMS.'); return }

  // SendChamp accepts an array of recipients per call; chunk to be safe.
  const CHUNK=100; let sent=0, failed=0
  for(let i=0;i<good.length;i+=CHUNK){
    const batch=good.slice(i,i+CHUNK)
    const r=await scSms(batch)
    if(r.ok) sent+=batch.length; else { failed+=batch.length; console.log(`  batch ${i} failed: ${r.error}`) }
    process.stdout.write(`\r  progress: ${Math.min(i+CHUNK,good.length)}/${good.length} (sent ${sent}, failed ${failed})  `)
  }
  console.log(`\n\n✅ Done. sent=${sent} failed=${failed}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
