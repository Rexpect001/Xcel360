/**
 * Send the event email to registrants via Gmail SMTP (free Gmail ≈ 500/day).
 * Personalized HTML with the real Zoom link. Throttled + resumable.
 *
 *   node scripts/send-gmail.mjs --test you@example.com
 *   node scripts/send-gmail.mjs --yes                 # send to all registrants
 *   node scripts/send-gmail.mjs --yes --delay 7000 --cap 480
 *
 * Requires in .env.local:
 *   GMAIL_USER=alabijohnson6@gmail.com
 *   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (16-char Google App Password, no spaces)
 */
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { readFileSync, appendFileSync, existsSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const prisma=new PrismaClient()
const EVENT_ID='cmobns2gx0000u9klishjmwqr'
const SENTLOG=here('../.tmp/gmail-sent.log')

const args=process.argv.slice(2)
const val=(f)=>{const i=args.indexOf(f);return i!==-1?args[i+1]:undefined}
const testEmail=val('--test')
const confirmed=args.includes('--yes')
const dry=args.includes('--dry')
const DELAY=parseInt(val('--delay')||'6000')
const CAP=parseInt(val('--cap')||'480')

// --html and --subject let us send a different email without editing this file.
const HTML=val('--html')||here('../../../Xcel360/events/email-reminders/general-broadcast.html')
const USER=process.env.GMAIL_USER
const PASS=process.env.GMAIL_APP_PASSWORD
const FROM=`Xcel360 <${USER}>`
const SUBJECT=val('--subject')||"Today at 4PM WAT - Your Zoom link for Leveraging AI in Today's World"
const HTML_BODY=readFileSync(HTML,'utf8').replace(/^<!--[\s\S]*?-->\s*/gm,'').trim()

const firstName=(full)=>{ if(!full) return 'Scholar'; const t=full.trim().replace(/^"|"$/g,'').split(/\s+/); return t[0]||'Scholar' }
const personalize=(html,name)=>html.replace(/\[First Name\]/gi,name)
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))

function transporter(){
  if(!USER||!PASS) throw new Error('Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local')
  return nodemailer.createTransport({ host:'smtp.gmail.com', port:465, secure:true, auth:{ user:USER, pass:PASS } })
}

async function main(){
  const tx=transporter()
  await tx.verify()
  console.log(`SMTP OK as ${USER}`)

  if(testEmail){
    console.log(`Sending TEST to ${testEmail} …`)
    await tx.sendMail({ from:FROM, to:testEmail, subject:SUBJECT, html:personalize(HTML_BODY,'Johnson') })
    console.log('✅ TEST sent')
    return
  }

  // recipients
  const regs=await prisma.eventRegistration.findMany({ where:{ eventId:EVENT_ID }, select:{ email:true, fullName:true } })
  const map=new Map()
  for(const r of regs){ const e=(r.email||'').toLowerCase().trim(); if(e&&!map.has(e)) map.set(e,firstName(r.fullName)) }
  const already=existsSync(SENTLOG)?new Set(readFileSync(SENTLOG,'utf8').split('\n').map(s=>s.trim()).filter(Boolean)):new Set()
  const todo=[...map.keys()].filter(e=>!already.has(e))
  console.log(`Registrants: ${map.size} | already sent: ${already.size} | remaining: ${todo.length} | cap this run: ${CAP}`)

  if(dry){ console.log('Dry run - nothing sent.'); return }
  if(!confirmed){ console.log('Pass --yes to send.'); return }

  let sent=0, failed=0
  for(const email of todo){
    if(sent>=CAP){ console.log(`\nReached cap ${CAP} - stop. Re-run later to continue (resumable).`); break }
    try{
      await tx.sendMail({ from:FROM, to:email, subject:SUBJECT, html:personalize(HTML_BODY, map.get(email)) })
      appendFileSync(SENTLOG, email+'\n'); sent++
    }catch(e){ failed++; console.log(`\n  fail ${email}: ${e.message}`) }
    process.stdout.write(`\r  sent ${sent}, failed ${failed}, remaining ${todo.length-sent-failed}   `)
    await sleep(DELAY)
  }
  console.log(`\n\n✅ Run done. sent=${sent} failed=${failed}. Total ever sent: ${already.size+sent}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
