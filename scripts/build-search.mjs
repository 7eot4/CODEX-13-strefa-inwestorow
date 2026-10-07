import {pipeline,env} from '@huggingface/transformers';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const config=JSON.parse(fs.readFileSync('docs/data/ai-config.json','utf8'));
const archive=JSON.parse(fs.readFileSync('docs/data/archive.json','utf8'));
env.localModelPath=path.resolve('.model-cache')+path.sep;
env.cacheDir=path.resolve('.model-cache/downloads');
const target='docs/data/search-index.json';
const previous=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):null;
const old=new Map(previous?.revision===config.revision?previous.entries.map(e=>[e.id,e]):[]);
let extractor;
const entries=[];
for(const a of archive.articles){
 const text=[a.title,...(a.analysis?.summary_sentences||[]),...a.body.filter(p=>p.type==='heading').map(p=>p.text)].join(' ').slice(0,3000);
 const hash=crypto.createHash('sha256').update(text).digest('hex');
 if(old.get(a.id)?.hash===hash){entries.push(old.get(a.id));continue;}
 extractor ||= await pipeline('feature-extraction',config.model,{revision:config.revision,dtype:config.dtype,device:'cpu'});
 const output=await extractor('passage: '+text,{pooling:'mean',normalize:true,truncation:true,max_length:config.max_length});
 const vector=Array.from(output.data,n=>Math.round(n*1e6)/1e6);
 if(vector.length!==config.dimension||vector.some(n=>!Number.isFinite(n)))throw Error('Invalid semantic vector');
 entries.push({id:a.id,hash,vector});
 console.log(`Indexed ${entries.length}/${archive.articles.length}: ${a.title}`);
}
const result={...config,indexed_at:new Date().toISOString(),scope:'Tytuł, podsumowanie i nagłówki sekcji. Pełna treść jest dodatkowo przeszukiwana słowami.',entries};
fs.writeFileSync(target+'.tmp',JSON.stringify(result));fs.renameSync(target+'.tmp',target);
console.log(`Semantic index ready: ${entries.length} articles`);
