const {JSDOM}=require('jsdom');
const ExcelJS=require('exceljs');
const BrowserExcelJS=require('../docs/vendor/exceljs.min.js');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const rules=JSON.parse(fs.readFileSync('docs/data/topics.json','utf8'));
// Synthetic data only: broker fixtures must never contain a real portfolio.
const data={last_checked:new Date().toISOString(),sections:rules.sections,articles:[
 {id:'a',title:'Orlen rozwija Baltic Power',date:'2026-10-07',kind:'article',url:'https://strefainwestorow.pl/spolki/orlen-test',body:[{type:'paragraph',text:'Orlen inwestuje w elektrownie.'}],sections:['energia'],companies:['Orlen'],match_reasons:{energia:['Firma: Orlen']},saved_at:new Date().toISOString(),content_checked_at:new Date().toISOString()},
 {id:'b',title:'CD PROJEKT RED zapowiada grę',date:'2026-10-07',kind:'article',url:'https://strefainwestorow.pl/gaming/test',body:[{type:'paragraph',text:'Nowy Wiedźmin.'}],sections:['technologie'],companies:['CD PROJEKT'],match_reasons:{technologie:['Firma: CD PROJEKT']},saved_at:new Date().toISOString(),content_checked_at:new Date().toISOString()}
]};
async function load(page,script,url){const dom=new JSDOM(fs.readFileSync(`docs/${page}`,'utf8'),{url,runScripts:'outside-only'});const requests=[];dom.window.fetch=async(url,opts)=>{requests.push({url,opts});return {ok:true,json:async()=>data};};if(page==='index.html')for(const source of ['portfolio-core.js','portfolio.js'])dom.window.eval(fs.readFileSync(`docs/${source}`,'utf8'));dom.window.eval(fs.readFileSync(`docs/${script}`,'utf8'));await new Promise(resolve=>setImmediate(resolve));return {dom,requests};}
(async()=>{
 console.log('Checking page controls');
 const {dom,requests}=await load('index.html','app.js','https://example.test/');const d=dom.window.document;
 assert.equal(d.querySelectorAll('.card').length,2);
 d.querySelector('[data-section="energia"]').click();assert.equal(d.querySelectorAll('.card').length,1);assert.ok(d.querySelector('.card').textContent.includes('Orlen'));
 d.querySelector('[data-section=""]').click();d.getElementById('company').value='CD PROJEKT';d.getElementById('company').dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('.card').length,1);assert.ok(d.querySelector('.card').textContent.includes('CD PROJEKT'));
 d.getElementById('company').value='';d.getElementById('search').value='Wiedźmin';d.getElementById('search').dispatchEvent(new dom.window.Event('input'));assert.equal(d.querySelectorAll('.card').length,1);
 d.getElementById('search').value='';d.getElementById('all').click();d.querySelector('.bookmark').click();d.getElementById('saved').click();assert.equal(d.querySelectorAll('.card').length,1);
 console.log('Checking XLSX round trip');
 const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Pozycje');sheet.addRows([['Nazwa','Ticker','ISIN','Liczba','Wartość','Numer rachunku'],['Orlen','PKN','PLPKN0000018',55,123456,'SECRET-ACCOUNT']]);const buffer=await book.xlsx.writeBuffer();
 const browserBook=new BrowserExcelJS.Workbook();await browserBook.xlsx.load(buffer);assert.equal(browserBook.worksheets[0].getCell('A2').value,'Orlen');
 console.log('Checking local import');
 dom.window.ExcelJS=BrowserExcelJS;
 await d.getElementById('portfolio-file').onchange({target:{files:[{name:'synthetic.xlsx',size:buffer.length,arrayBuffer:async()=>buffer}],value:''}});
 assert.equal(d.querySelectorAll('#portfolio-preview input').length,1);assert.equal(d.querySelector('#portfolio-preview input').value,'Orlen');
 d.getElementById('portfolio-save').click();const saved=dom.window.localStorage.getItem('investor-portfolio');assert.ok(saved.includes('Orlen'));assert.ok(!saved.includes('SECRET-ACCOUNT'));assert.ok(!saved.includes('123456'));assert.ok(!saved.includes('synthetic.xlsx'));
 d.getElementById('portfolio-tab').click();assert.equal(d.querySelectorAll('.card').length,1);assert.ok(d.querySelector('.portfolio-match').textContent.includes('Orlen'));
 assert.deepEqual(requests.map(r=>r.url),['data/archive.json']);assert.ok(requests.every(r=>!r.opts?.body));
 const {dom:reader}=await load('read.html','read.js','https://example.test/read.html?id=a');assert.equal(reader.window.document.getElementById('body').children.length,1);assert.equal(reader.window.document.querySelector('.reader-tags a').textContent,'Energia i surowce');
 d.getElementById('portfolio-clear').click();assert.equal(dom.window.localStorage.getItem('investor-portfolio'),null);
 dom.window.close();reader.window.close();console.log('PASS: sections, company/full-text filters, bookmarks, XLSX browser bundle, local import privacy, portfolio filtering, reader tags');
})().catch(error=>{console.error(error);process.exitCode=1;});
