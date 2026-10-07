(function(root){
 'use strict';
 const normalize=value=>String(value||'').toLocaleLowerCase('pl').replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
 function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');
  let best=[];
  for(const delimiter of [';',',','\t']){
   const rows=[];let row=[],cell='',quoted=false;
   for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
   if(quoted)throw Error('Nieprawidłowo zamknięty cudzysłów w CSV.');
   row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
   if(rows.slice(0,40).some(r=>r.length>1&&r.some(v=>/^(nazwa|walor|instrument|symbol|ticker|isin|security|name)/.test(normalize(v)))))return rows;
   if(rows.length>best.length)best=rows;
  }
  return best;
 }
 function parseRows(rows){
  const names=['nazwa','nazwa spolki','spolka','nazwa instrumentu','instrument','walor','nazwa waloru','papier','nazwa papieru','papier wartosciowy','security name','name','company','security','instrument name'];
  const tickers=['ticker','symbol','symbol instrumentu','symbol waloru','kod instrumentu'];
  let header=-1,ni=-1,ti=-1,ii=-1;
  for(let i=0;i<Math.min(rows.length,40);i++){const r=rows[i].map(normalize);const n=r.findIndex(v=>names.includes(v));const t=r.findIndex(v=>tickers.includes(v));const isin=r.findIndex(v=>v==='isin'||v==='kod isin');if(n>=0||t>=0||isin>=0){header=i;ni=n;ti=t;ii=isin;break;}}
  if(header<0)throw Error('Nie rozpoznano kolumn. Potrzebna jest kolumna Nazwa, Instrument, Walor lub Ticker/ISIN.');
  const found=new Map();let omitted=0;
  for(const row of rows.slice(header+1,header+1001)){
   const clean=i=>i<0?'':String(row[i]??'').replace(/[\r\n]+/g,' ').trim().slice(0,160);
   const name=clean(ni),ticker=clean(ti),isin=clean(ii).toUpperCase();
   if(!name&&!ticker&&!isin)continue;
   if(/^(razem|suma|total|gotowka|cash|saldo)\b/.test(normalize(name))||/^\d+[.,]?\d*$/.test(name)){omitted++;continue;}
   if(isin&&!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)){omitted++;continue;}
   const entry={name:name||ticker||isin,ticker,isin};
   found.set(normalize(entry.name)+'|'+isin,entry);
  }
  if(!found.size)throw Error('Nie znaleziono instrumentów. Wyeksportuj listę aktualnych pozycji, a nie historię transakcji.');
  return {entries:[...found.values()].slice(0,200),omitted};
 }
 function aliases(entry,sections){
  const name=normalize(entry.name).replace(/\bs\.?a\.?\b/g,'').replace(/[.()]/g,'').trim();
  const compact=name.replace(/\s/g,'');
  const result=new Set([entry.name.trim()]);
  for(const section of sections)for(const [company,terms] of Object.entries(section.companies||{})){
   if([company,...terms].some(t=>normalize(t).replace(/\s/g,'')===compact)){result.add(company);terms.forEach(t=>result.add(t));}
  }
  return [...result].filter(t=>t.length>=3&&!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(t));
 }
 function matches(article,entries,sections){
  const text=normalize(article.title+' '+(article.body||[]).map(p=>p.text).join(' '));
  return entries.filter(entry=>aliases(entry,sections).some(term=>{const escaped=normalize(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(^|[^a-z0-9])'+escaped+'($|[^a-z0-9])').test(text);})).map(entry=>entry.name);
 }
 const api={normalize,parseCSV,parseRows,aliases,matches};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PortfolioCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
