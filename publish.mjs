import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const origin='https://mukkarams1.github.io/pin-pitch-site/';
const manifest=JSON.parse(await fs.readFile('manifest.json','utf8'));
for(const file of manifest){
 if(file.path==='index.html')continue;
 let bytes;
 if(file.local)bytes=await fs.readFile(path.join('build',file.path));
 else {const response=await fetch(origin+file.path);if(!response.ok)throw Error(file.path+': '+response.status);bytes=Buffer.from(await response.arrayBuffer());}
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Checksum: '+file.path);
 const target=path.join('site',file.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);
}
const html=(await fs.readFile('index.html','utf8')).replaceAll('"./assets/','"/pin-pitch-site/assets/').replaceAll('"/assets/','"/pin-pitch-site/assets/');
await fs.mkdir('site/portfolio',{recursive:true});await fs.writeFile('site/index.html',html);await fs.writeFile('site/portfolio/index.html',html);await fs.writeFile('site/.nojekyll','');
console.log('Published '+manifest.length+' verified files');
