/** Creates a DRAFT campaign (audience=contacts, provider=resend) using the HTML broadcast.
 *  Run: node scripts/create-resend-draft.mjs */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))
const prisma = new PrismaClient()
const HTML = here('../../../Xcel360/events/email-reminders/general-broadcast.html')
const SUBJECT = "📌 Today at 4PM WAT - Your join link for Leveraging AI in Today's World"
const HTML_BODY = readFileSync(HTML,'utf8').replace(/^<!--[\s\S]*?-->\s*/gm,'').trim()
const TEXT_BODY = `Dear [First Name],\n\nToday is the day! Join our session "Leveraging AI in Today's World" at 4:00 PM WAT.\nZoom: https://umsystem.zoom.us/j/91459172327?pwd=qMeOcaOMXBXeVwCKJxb6MTdqIebXpY.1\nMeeting ID: 914 5917 2327  Passcode: XCEL360\n\nWarm regards,\nJohnson Alabi\nCoordinator, Xcel360`
async function main(){
  const contacts = await prisma.contact.findMany({ select:{ email:true } })
  const recipients = Array.from(new Set(contacts.map(c=>c.email.toLowerCase().trim()).filter(Boolean)))
  const c = await prisma.emailCampaign.create({ data:{
    subject:SUBJECT, htmlBody:HTML_BODY, textBody:TEXT_BODY, audience:'contacts', provider:'resend',
    status:'DRAFT', dailyLimit:100, recipients:JSON.stringify(recipients),
    manualRecipients:'[]', ccRecipients:'[]', bccRecipients:'[]', attachments:'[]',
    totalCount:recipients.length, sentCount:0,
  }})
  console.log(`✅ Resend DRAFT created. id: ${c.id}  recipients: ${c.totalCount}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
