/**
 * Bulk SMS to event registrants via SmartSMSSolutions.
 *   SMARTSMS_TOKEN=xxx node scripts/send-sms-smartsms.mjs --test 2348012345678 --sender Xcel360
 *   SMARTSMS_TOKEN=xxx node scripts/send-sms-smartsms.mjs --yes --sender Xcel360 --routing 0
 *   node scripts/send-sms-smartsms.mjs --dry      # normalize + report only
 * Pass --token xxx instead of the env var if you prefer.
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const prisma=new PrismaClient()
const ENDPOINT='https://app.smartsmssolutions.com/io/api/client/v1/sms/'
const EVENT_ID='cmobns2gx0000u9klishjmwqr'

const args=process.argv.slice(2)
const dry=args.includes('--dry')
const confirmed=args.includes('--yes')
const val=(flag)=>{const i=args.indexOf(flag);return i!==-1?args[i+1]:undefined}
const testNumber=val('--test')
const SENDER=val('--sender')||'Xcel360'
const ROUTING=val('--routing')||'0'            // route selector; confirm value in your dashboard
const TYPE=val('--type')||'0'                  // 0 = plain text
const TOKEN=val('--token')||process.env.SMARTSMS_TOKEN

// MTN bulk route blocks URLs AND the words "code"/"passcode" - keep it clean.
const MESSAGE=`Xcel360: Leveraging AI in Todays World holds TODAY 4PM WAT. Open Zoom app, Join a Meeting: ID 914 5917 2327, then enter XCEL360. See you there!`

function normalize(raw){
  if(!raw) return null
  let s=String(raw).replace(/[^\d+]/g,'').replace(/^\+/,'')
  if(s.startsWith('00')) s=s.slice(2)
  if(s.startsWith('0')&&s.length===11) s='234'+s.slice(1)
  else if(s.length===10) s='234'+s
  else if(s.startsWith('234')&&s.length===13){/*ok*/}
  else return null
  return /^234\d{10}$/.test(s)?s:null
}

async function send(toCsv){
  if(!TOKEN) return {ok:false,error:'No token - set SMARTSMS_TOKEN or pass --token'}
  const body=new URLSearchParams({token:TOKEN,sender:SENDER,to:toCsv,message:MESSAGE,type:TYPE,routing:ROUTING})
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body})
    const text=await res.text(); let data; try{data=JSON.parse(text)}catch{data=text}
    const ok=res.ok && !/error|fail/i.test(JSON.stringify(data).slice(0,200))
    return {ok,error:ok?undefined:(typeof data==='string'?data.slice(0,300):JSON.stringify(data)),raw:data}
  }catch(e){return {ok:false,error:e.message}}
}

async function main(){
  console.log(`Sender: "${SENDER}" | routing: ${ROUTING} | token: ${TOKEN?TOKEN.slice(0,6)+'…':'(none)'}`)
  console.log(`Message (${MESSAGE.length}): ${MESSAGE}\n`)

  if(testNumber){
    const n=normalize(testNumber)||testNumber.replace(/[^\d]/g,'')
    console.log(`TEST -> ${n}`)
    const r=await send(n)
    console.log(r.ok?'✅ accepted':`❌ ${r.error}`)
    if(r.raw) console.log('   response:',JSON.stringify(r.raw).slice(0,400))
    return
  }

  const regs=await prisma.eventRegistration.findMany({where:{eventId:EVENT_ID},select:{phone:true}})
  const seen=new Set(); const good=[]; const bad=[]
  for(const r of regs){const n=normalize(r.phone); if(n){if(!seen.has(n)){seen.add(n);good.push(n)}} else bad.push(r.phone)}
  console.log(`Registrations: ${regs.length} | sendable: ${good.length} | bad: ${bad.length}\n`)

  if(dry){console.log('Dry run - nothing sent.');return}
  if(!confirmed){console.log('Pass --yes to send the bulk SMS.');return}

  const CHUNK=100; let sent=0,failed=0
  for(let i=0;i<good.length;i+=CHUNK){
    const batch=good.slice(i,i+CHUNK)
    const r=await send(batch.join(','))
    if(r.ok) sent+=batch.length; else {failed+=batch.length; console.log(`  batch ${i} failed: ${r.error}`)}
    process.stdout.write(`\r  ${Math.min(i+CHUNK,good.length)}/${good.length} (sent ${sent}, failed ${failed})  `)
  }
  console.log(`\n\n✅ Done. sent=${sent} failed=${failed}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
