'use strict';
window.articleAnalysisUI=function(a){
 const container=document.createElement('section');container.className='article-analysis';container.setAttribute('aria-label','Podsumowanie i ocena znaczenia');
 const analysis=a.analysis;
 if(!analysis){const p=document.createElement('p');p.textContent='Analiza tego artykułu jest przygotowywana.';container.append(p);return container;}
 const summary=document.createElement('p');summary.className='article-summary';summary.textContent=analysis.summary_sentences.join(' ');container.append(summary);
 const caption=document.createElement('p');caption.className='summary-method';caption.textContent='Podsumowanie ekstrakcyjne: wybrane zdania z analizy pełnej treści.';container.append(caption);
 for(const [icon,title,key] of [['⚡','Znaczenie tematu w branży','interest_score'],['🧨','Potencjał reakcji kursu','impact_score']]){
  const label=document.createElement('label');label.className='score-label';const text=document.createElement('span');text.textContent=`${icon} ${title}`;const output=document.createElement('strong');output.textContent=`${analysis[key]}/100`;const range=document.createElement('input');range.type='range';range.min='0';range.max='100';range.value=analysis[key];range.disabled=true;range.setAttribute('aria-label',`${title}: ${analysis[key]} punktów na 100`);label.append(text,output,range);container.append(label);
 }
 const note=document.createElement('p');note.className='score-note';note.textContent='Szacunek regułowy, nie prognoza ceny. Kierunek reakcji: nieokreślony.';container.append(note);
 const watch=analysis.watch_companies||[];
 if(watch.length){const heading=document.createElement('strong');heading.className='watch-heading';heading.textContent='Spółki powiązane z tematem';container.append(heading);const list=document.createElement('ul');list.className='watch-companies';for(const company of watch){const li=document.createElement('li');const link=document.createElement('a');link.textContent=company.name;link.href=`./?company=${encodeURIComponent(company.name)}`;li.append(link,document.createTextNode(` — ${company.relation}`));list.append(li);}container.append(list);}
 const details=document.createElement('details');details.className='analysis-details';const title=document.createElement('summary');title.textContent='Podstawa skal i powiązań';details.append(title);
 for(const e of analysis.evidence||[]){const p=document.createElement('p');p.textContent=`${e.factor}: „${e.excerpt}”`;details.append(p);}
 const limits=document.createElement('p');limits.textContent=`Pewność: ${analysis.confidence}. ${analysis.limitations}`;details.append(limits);
 for(const company of watch){const p=document.createElement('p');p.textContent=`${company.name}: ${company.reason} Weryfikacja profilu: ${company.checked_at}. `;const source=document.createElement('a');const url=new URL(company.source);if(url.protocol==='https:'){source.href=url.href;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Źródło emitenta';p.append(source);}details.append(p);}
 container.append(details);return container;
};
