import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))
const KEY=process.env.SENDCHAMP_API_KEY
const BASE='https://api.sendchamp.com/api/v1'
const H={Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Accept:'application/json'}
async function get(path){
  try{const r=await fetch(BASE+path,{headers:H});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t}
    console.log(`\nGET ${path}  -> HTTP ${r.status}`); console.log(typeof j==='string'?j.slice(0,400):JSON.stringify(j,null,2).slice(0,800))
  }catch(e){console.log(`\nGET ${path} ERROR ${e.message}`)}
}
console.log('Key prefix:', (KEY||'').slice(0,18)+'…')
await get('/wallet/wallet_balance')
await get('/email/domain')
await get('/email/sender')
await get('/me')
