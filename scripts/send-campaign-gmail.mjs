/**
 * Send an Admin → Email campaign through Gmail SMTP (free Gmail ≈ 500/day).
 * Personalises [First Name], adds the unsubscribe footer, skips unsubscribed
 * addresses, and is resumable: re-run each day until the campaign completes.
 *
 *   node scripts/send-campaign-gmail.mjs <campaignId> --test you@example.com
 *   node scripts/send-campaign-gmail.mjs <campaignId> --dry
 *   node scripts/send-campaign-gmail.mjs <campaignId> --yes [--cap 480] [--delay 6000]
 *   add --account personal to send from GMAIL_USER instead of XCEL_GMAIL_USER
 */
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { createHmac } from 'node:crypto'
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const args=process.argv.slice(2)
const val=(f)=>{const i=args.indexOf(f);return i!==-1?args[i+1]:undefined}
const campaignId=args[0]
const testEmail=val('--test')
const confirmed=args.includes('--yes')
const dry=args.includes('--dry')
const CAP=parseInt(val('--cap')||'480')
const DELAY=parseInt(val('--delay')||'6000')
const personal=val('--account')==='personal'
if(!campaignId||campaignId.startsWith('--')){ console.error('Usage: node scripts/send-campaign-gmail.mjs <campaignId> [--test email | --dry | --yes]'); process.exit(1) }

const USER=personal?process.env.GMAIL_USER:process.env.XCEL_GMAIL_USER
const PASS=personal?process.env.GMAIL_APP_PASSWORD:process.env.XCEL_GMAIL_APP_PASSWORD
const FROM=`Xcel360 <${USER}>`
const APP_URL=process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')?process.env.NEXT_PUBLIC_APP_URL:'https://thexcel360.com'

// Mirrors src/lib/email-utils.ts so links validate on the live /unsubscribe page.
const unsubUrl=(email)=>`${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${createHmac('sha256',process.env.NEXTAUTH_SECRET??'fallback-secret').update(email.toLowerCase()).digest('hex')}`
const htmlFooter=(email)=>`
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#9ca3af;text-align:center;">
  You're receiving this because you signed up at Xcel360.&nbsp;
  <a href="${unsubUrl(email)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
</div>`
const withFooter=(html,email)=>html.includes('</body>')?html.replace('</body>',`${htmlFooter(email)}</body>`):html+htmlFooter(email)
const firstName=(full)=>{ const t=(full||'').trim().replace(/^"|"$/g,'').split(/\s+/)[0]; return t&&/^[A-Za-z]/.test(t)?t.charAt(0).toUpperCase()+t.slice(1).toLowerCase():'Scholar' }
const fill=(s,name)=>s.replace(/\[First Name\]/gi,name)
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms))

const prisma=new PrismaClient()
async function main(){
  if(!USER||!PASS) throw new Error(`Set ${personal?'GMAIL':'XCEL_GMAIL'}_USER and _APP_PASSWORD in .env.local`)
  const c=await prisma.emailCampaign.findUnique({ where:{ id:campaignId } })
  if(!c) throw new Error(`Campaign ${campaignId} not found`)
  const tx=nodemailer.createTransport({ host:'smtp.gmail.com', port:465, secure:true, auth:{ user:USER, pass:PASS } })
  await tx.verify()
  console.log(`SMTP OK as ${USER}\nCampaign: ${c.subject}`)

  const send=(to,name)=>tx.sendMail({
    from:FROM, to, subject:c.subject,
    html:withFooter(fill(c.htmlBody,name),to),
    text:c.textBody?fill(c.textBody,name)+`\n\n----\nTo unsubscribe: ${unsubUrl(to)}`:undefined,
    headers:{ 'List-Unsubscribe':`<${unsubUrl(to)}>` },
  })

  if(testEmail){ await send(testEmail,'Johnson'); console.log(`TEST sent to ${testEmail}`); return }

  const recipients=JSON.parse(c.recipients||'[]').map(e=>e.toLowerCase().trim())
  const names=new Map()
  for(const r of await prisma.contact.findMany({ select:{ email:true, name:true } })) if(r.name) names.set(r.email.toLowerCase(),r.name)
  for(const r of await prisma.user.findMany({ select:{ email:true, name:true } })) if(r.name&&r.email) names.set(r.email.toLowerCase(),r.name)
  const unsub=new Set((await prisma.emailUnsubscribe.findMany({ select:{ email:true } })).map(u=>u.email.toLowerCase()))
  mkdirSync(here('../.tmp'),{ recursive:true })
  const LOG=here(`../.tmp/gmail-campaign-${campaignId}.log`)
  const done=existsSync(LOG)?new Set(readFileSync(LOG,'utf8').split('\n').map(s=>s.trim()).filter(Boolean)):new Set()
  const todo=recipients.filter(e=>!done.has(e)&&!unsub.has(e))
  console.log(`Recipients: ${recipients.length} | already sent: ${done.size} | unsubscribed: ${recipients.filter(e=>unsub.has(e)).length} | remaining: ${todo.length} | cap this run: ${CAP}`)
  if(dry){ console.log('Dry run - nothing sent.'); return }
  if(!confirmed){ console.log('Pass --yes to send.'); return }

  await prisma.emailCampaign.update({ where:{ id:c.id }, data:{ status:'SENDING', provider:'gmail' } })
  let sent=0, failed=0
  for(const email of todo){
    if(sent>=CAP){ console.log(`\nReached cap ${CAP}. Re-run tomorrow to continue.`); break }
    try{ await send(email,firstName(names.get(email))); appendFileSync(LOG,email+'\n'); sent++ }
    catch(e){
      failed++; console.log(`\n  fail ${email}: ${e.message}`)
      if(/limit|quota|454|421|550 5\.4\.5/i.test(e.message)){ console.log('Gmail sending limit hit. Stopping; re-run later.'); break }
    }
    process.stdout.write(`\r  sent ${sent}, failed ${failed}, remaining ${todo.length-sent-failed}   `)
    await sleep(DELAY)
  }
  const total=done.size+sent
  const finished=todo.length-sent-failed===0
  await prisma.emailCampaign.update({ where:{ id:c.id }, data:{ sentCount:total, status:finished?'COMPLETED':'SENDING' } })
  console.log(`\n\nRun done. sent=${sent} failed=${failed}. Total sent for this campaign: ${total}/${recipients.length}`)
}
main().catch(e=>{console.error('Error:',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
