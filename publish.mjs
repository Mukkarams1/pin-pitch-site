import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const origin='https://pin-pitch-studio.cricketrebornacc.chatgpt.site';
const files=JSON.parse(await readFile('manifest.json','utf8')).filter(f=>f.path!=='index.html');
async function download(file){
 if(file.path.includes('..')||file.path.startsWith('/'))throw Error('Invalid asset path');
 const dest='site/'+(file.path.startsWith('assets/index-')&&file.path.endsWith('.js')?'assets/site-entry-v2.js':file.path);
 for(let attempt=0;attempt<5;attempt++){
  try{
   const response=await fetch(origin+'/'+file.path);
   if(!response.ok)throw Error('Asset status '+response.status);
   let bytes=Buffer.from(await response.arrayBuffer());
   if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Checksum mismatch: '+file.path);
   if(file.path.startsWith('assets/index-')&&file.path.endsWith('.js'))bytes=Buffer.from(bytes.toString().replaceAll('return"/"+','return"/pin-pitch-site/"+').replaceAll('[href^="/"],[src^="/"]','#app [href^="/"],#app [src^="/"]'));
   await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);return;
  }catch(error){if(attempt===4)throw error;await new Promise(resolve=>setTimeout(resolve,3000));}
 }
}
for(let i=0;i<files.length;i+=6)await Promise.all(files.slice(i,i+6).map(download));
let html=(await readFile('index.html','utf8')).replaceAll('"/assets/','"/pin-pitch-site/assets/').replace(/assets\/index-[^"]+\.js/g,'assets/site-entry-v2.js');
await writeFile('site/index.html',html);
await mkdir('site/portfolio',{recursive:true});await writeFile('site/portfolio/index.html',html);
await writeFile('site/.nojekyll','');
console.log('Published '+files.length+' verified assets; all assets are served by GitHub Pages.');
