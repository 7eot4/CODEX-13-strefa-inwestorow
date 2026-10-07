'use strict';
let portfolioEntries=[];
try{const parsed=JSON.parse(localStorage.getItem('investor-portfolio')||'[]');if(Array.isArray(parsed))portfolioEntries=parsed.filter(e=>typeof e.name==='string').slice(0,200).map(e=>({name:e.name.slice(0,160),ticker:String(e.ticker||'').slice(0,160),isin:String(e.isin||'').slice(0,12)}));}catch{}
let draft=[];
window.getPortfolio=()=>portfolioEntries;
window.matchPortfolio=(article,sections)=>PortfolioCore.matches(article,portfolioEntries,sections);
function portfolioStatus(){document.getElementById('portfolio-status').textContent=portfolioEntries.length?`Śledzisz ${portfolioEntries.length} instrumentów w tej przeglądarce.`:'Nie masz jeszcze zapisanej listy spółek.';document.getElementById('portfolio-tab-count').textContent=portfolioEntries.length;}
function preview(entries){draft=entries;const target=document.getElementById('portfolio-preview');target.replaceChildren();for(const e of entries){const label=document.createElement('label');label.textContent=[e.ticker,e.isin].filter(Boolean).join(' · ')||'Nazwa do dopasowania';const input=document.createElement('input');input.value=e.name;input.maxLength=160;input.oninput=()=>e.name=input.value.trim();label.append(input);target.append(label);}document.getElementById('portfolio-save').hidden=!entries.length;}
function loadExcel(){if(window.ExcelJS)return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/exceljs.min.js';script.onload=resolve;script.onerror=()=>reject(Error('Nie udało się wczytać obsługi XLSX.'));document.head.append(script);});}
document.getElementById('portfolio-file').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;const status=document.getElementById('portfolio-import-status');status.textContent='Odczyt lokalny…';preview([]);
 try{if(file.size>5*1024*1024)throw Error('Limit pliku wynosi 5 MB.');const buffer=await file.arrayBuffer();let rows;
  if(/\.xlsx$/i.test(file.name)){await loadExcel();const book=new ExcelJS.Workbook();await book.xlsx.load(buffer);rows=[];for(const sheet of book.worksheets.slice(0,5)){if(sheet.rowCount>10000)throw Error('Arkusz jest zbyt duży — wyeksportuj tylko aktualne pozycje.');const current=[];sheet.eachRow(row=>current.push(row.values.slice(1).map(v=>typeof v==='object'&&v!==null?(v.text||v.richText?.map(t=>t.text).join('')||''):v)));try{PortfolioCore.parseRows(current);rows=current;break;}catch{}}}
  else if(/\.(csv|tsv|txt)$/i.test(file.name)){const bytes=new Uint8Array(buffer);let text;if(bytes[0]===255&&bytes[1]===254)text=new TextDecoder('utf-16le').decode(bytes);else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1250').decode(bytes);}}rows=PortfolioCore.parseCSV(text);}
  else throw Error('Obsługiwane są CSV, TSV i XLSX. PDF wymaga osobnego dopasowania.');
  const result=PortfolioCore.parseRows(rows||[]);preview(result.entries);status.textContent=`Rozpoznano ${result.entries.length} instrumentów. Sprawdź i popraw nazwy firm; sam ticker lub ISIN może nie występować w artykułach. Pominięto ${result.omitted} wierszy. Wybierz plik aktualnych pozycji — historia transakcji nie jest portfelem.`;
 }catch(error){status.textContent=error.message;}finally{event.target.value='';}
};
document.getElementById('portfolio-save').onclick=()=>{const cleaned=draft.filter(e=>e.name).map(e=>({name:e.name,ticker:e.ticker,isin:e.isin}));if(!cleaned.length)return;try{localStorage.setItem('investor-portfolio',JSON.stringify(cleaned));portfolioEntries=cleaned;document.getElementById('portfolio-import-status').textContent='Lista zapisana lokalnie. Plik, saldo i wartości pozycji nie są przechowywane.';preview([]);portfolioStatus();window.dispatchEvent(new Event('portfolio-changed'));}catch{document.getElementById('portfolio-import-status').textContent='Przeglądarka blokuje zapis. Lista nie została zapisana.';}};
document.getElementById('portfolio-clear').onclick=()=>{localStorage.removeItem('investor-portfolio');portfolioEntries=[];preview([]);portfolioStatus();window.dispatchEvent(new Event('portfolio-changed'));};
portfolioStatus();
