/**
 * Email a participant their certificate(s) via Gmail SMTP with the SECURE
 * proxy download link (never the raw Blob URL).
 *   node scripts/send-cert-gmail.mjs --to alabijohnson6@gmail.com
 *   node scripts/send-cert-gmail.mjs --to someone@x.com --lookup other@x.com
 * Requires GMAIL_USER + GMAIL_APP_PASSWORD in .env.local.
 */
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const prisma=new PrismaClient()
const APP_URL='https://thexcel360.com'
const args=process.argv.slice(2)
const val=(f)=>{const i=args.indexOf(f);return i!==-1?args[i+1]:undefined}
const to=val('--to')
const lookup=(val('--lookup')||to||'').toLowerCase().trim()
if(!to){console.error('Usage: node scripts/send-cert-gmail.mjs --to <email> [--lookup <email>]');process.exit(1)}

const USER=process.env.GMAIL_USER, PASS=process.env.GMAIL_APP_PASSWORD
const FROM=`Xcel360 <${USER}>`

function html(fullName, eventName, certificateType, downloadUrl, verifyUrl){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#6b7280;font-size:14px;margin:0 0 8px 0;">Certificate Issued</p>
      <h2 style="color:#111827;margin:0 0 24px 0;font-size:24px;font-weight:700;">Congratulations, ${fullName}!</h2>
      <div style="background:#eff6ff;border-left:4px solid #0369a1;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:15px;font-weight:600;color:#0369a1;">${certificateType}</p>
        <p style="margin:4px 0 0 0;font-size:13px;color:#0284c7;">${eventName}</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
        Your certificate is ready. Click below to view, download, or print it. Each certificate carries a unique QR code so it can be independently verified.
      </p>
      <a href="${downloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#0369a1,#0284c7);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Download Certificate</a>
      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:24px 0 0 0;">
        Or visit <a href="${APP_URL}/certificate" style="color:#0369a1;">${APP_URL}/certificate</a> and enter this email to access all your certificates. Verify authenticity at <a href="${APP_URL}${verifyUrl}" style="color:#0369a1;">${APP_URL}${verifyUrl}</a>.
      </p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #f1f5f9;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Warm regards, <strong>The Xcel360 Team</strong></p>
    </div>
  </div>
</body></html>`
}

async function main(){
  if(!USER||!PASS) throw new Error('Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local')
  const certs=await prisma.certificate.findMany({where:{email:lookup,status:'ISSUED'},include:{event:{select:{title:true}}},orderBy:{issuedAt:'desc'}})
  if(!certs.length){console.error(`No ISSUED certificates for ${lookup}`);process.exit(2)}
  const c=certs[0]
  const downloadUrl=`${APP_URL}/api/certificate/download/${c.certificateId}`
  const verifyUrl=`/verify/${c.certificateId}`
  const tx=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:USER,pass:PASS}})
  await tx.verify()
  console.log(`SMTP OK as ${USER}. Sending ${c.certificateId} to ${to} …`)
  await tx.sendMail({from:FROM,to,subject:'Your Xcel360 Certificate Is Ready',html:html(c.fullName,c.event?.title??'',c.certificateType,downloadUrl,verifyUrl)})
  console.log(`✅ Sent. download: ${downloadUrl}`)
}
main().catch(e=>{console.error('❌',e.message);process.exit(1)}).finally(()=>prisma.$disconnect())
