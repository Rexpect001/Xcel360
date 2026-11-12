/** Upload a local image to Azure Blob Storage and print its public URL. */
import { putBlob } from './azure-blob.mjs'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const src = process.argv[2]
const name = process.argv[3] || 'email-image.png'
if(!src){ console.error('Usage: node scripts/upload-image.mjs <file> [blobName]'); process.exit(1) }
const buf = readFileSync(src)
const { url } = await putBlob(name, buf, { addRandomSuffix: true, contentType: 'image/png' })
console.log(url)
