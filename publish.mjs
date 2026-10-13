import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const origin='https://pin-pitch-studio.cricketrebornacc.chatgpt.site/';
const prefix='/pin-pitch-site/';
const manifest=JSON.parse(await fs.readFile('manifest.json','utf8'));
const files=manifest.filter(file=>file.path!=='index.html');
async function publish(file){
 let bytes;
 if(process.env.PUBLISH_LOCAL_DIR)bytes=await fs.readFile(path.join(process.env.PUBLISH_LOCAL_DIR,file.path));
 else {const response=await fetch(origin+file.path);if(!response.ok)throw Error(file.path+': '+response.status);bytes=Buffer.from(await response.arrayBuffer());}
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Checksum: '+file.path);
 // Vite's relative BASE_URL must use the GitHub repository prefix, including
 // when opening the /portfolio/ page. Relative module imports stay unchanged.
 const output=file.path.endsWith('.js')?bytes.toString('utf8').replaceAll('"./"',JSON.stringify(prefix)):bytes;
 const target=path.join('site',file.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,output);
}
let next=0;
await Promise.all(Array.from({length:6},async()=>{while(next<files.length){const file=files[next++];await publish(file);}}));
const source=await fs.readFile('index.html','utf8');
const index=manifest.find(file=>file.path==='index.html');
if(crypto.createHash('sha256').update(source).digest('hex')!==index.sha256)throw Error('Checksum: index.html');
const html=source.replaceAll('"./assets/','"'+prefix+'assets/').replaceAll('"/assets/','"'+prefix+'assets/');
await fs.mkdir('site/portfolio',{recursive:true});await fs.writeFile('site/index.html',html);await fs.writeFile('site/portfolio/index.html',html);await fs.writeFile('site/.nojekyll','');
console.log('Published '+manifest.length+' verified files for '+prefix);
