'use strict';
const articleArtThemes={skroty:'Skrót dnia',makro:'Makro i rynki',finanse:'Banki i finanse',energia:'Energia i surowce',technologie:'Technologie i gaming',przemysl:'Przemysł',konsumpcja:'Handel i konsumpcja',nieruchomosci:'Nieruchomości',pozostale:'Rynek i spółki'};
window.articleArtworkUI=function(a,{linked=false}={}){
 const key=a.kind==='roundup'?'skroty':(a.sections||[]).find(id=>id!=='makro'&&id!=='pozostale'&&id!=='skroty'&&articleArtThemes[id])||(a.sections||[]).find(id=>articleArtThemes[id])||'pozostale';
 const figure=document.createElement('figure');figure.className=`article-art art-${key}`;
 const image=document.createElement('img');image.src=`images/${key}.svg`;image.alt='';image.width=720;image.height=340;image.loading='lazy';image.decoding='async';
 if(linked){const link=document.createElement('a');link.href=`read.html?id=${encodeURIComponent(a.id)}`;link.setAttribute('aria-label',`Czytaj: ${a.title}`);link.append(image);figure.append(link);}else figure.append(image);
 const caption=document.createElement('figcaption');const topic=document.createElement('span');topic.textContent=articleArtThemes[key];const note=document.createElement('span');note.textContent='Ilustracja tematyczna';caption.append(topic,note);figure.append(caption);return figure;
};
let articleMotionObserver;
window.registerArticleMotion=function(root){
 if(!('IntersectionObserver' in window)){for(const node of root.querySelectorAll('.article-art,.score-panel'))node.classList.add('is-visible');return;}
 articleMotionObserver ||= new IntersectionObserver(entries=>{for(const e of entries)e.target.classList.toggle('is-visible',e.isIntersecting);},{rootMargin:'40px'});
 for(const node of root.querySelectorAll('.article-art,.score-panel'))articleMotionObserver.observe(node);
};
window.clearArticleMotion=function(root){if(articleMotionObserver)for(const node of root.querySelectorAll('.article-art,.score-panel'))articleMotionObserver.unobserve(node);};
window.articleAnalysisUI=function(a){
 const container=document.createElement('section');container.className='article-analysis';container.setAttribute('aria-label','Podsumowanie i ocena znaczenia');
 const analysis=a.analysis;
 if(!analysis){const p=document.createElement('p');p.textContent='Analiza tego artykułu jest przygotowywana.';container.append(p);return container;}
 const summary=document.createElement('p');summary.className='article-summary';summary.textContent=analysis.summary_sentences.join(' ');container.append(summary);
 const caption=document.createElement('p');caption.className='summary-method';caption.textContent='Podsumowanie ekstrakcyjne: wybrane zdania z analizy pełnej treści.';container.append(caption);
 const panel=document.createElement('div');panel.className='score-panel';
 for(const [icon,title,key,tone] of [['⚡','Znaczenie tematu w branży','interest_score','cyan'],['🧨','Potencjał reakcji kursu','impact_score','coral']]){
  const value=Number.isFinite(Number(analysis[key]))?Math.max(0,Math.min(100,Number(analysis[key]))):0;
  const label=document.createElement('div');label.className=`score-label score-${tone}`;label.style.setProperty('--score',`${value}%`);
  const text=document.createElement('span');text.className='score-title';const badge=document.createElement('span');badge.className='score-icon';badge.textContent=icon;badge.setAttribute('aria-hidden','true');text.append(badge,document.createTextNode(title));
  const output=document.createElement('strong');output.className='score-value';output.append(document.createTextNode(value));const unit=document.createElement('small');unit.textContent='/100';output.append(unit);
  const meter=document.createElement('div');meter.className='score-track';meter.setAttribute('role','meter');meter.setAttribute('aria-label',title);meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',String(value));meter.setAttribute('aria-valuetext',`${value} punktów na 100; ocena pomocnicza`);
  const fill=document.createElement('span');fill.className='score-fill';meter.append(fill);const ticks=document.createElement('div');ticks.className='score-ticks';ticks.setAttribute('aria-hidden','true');for(const tick of ['0','25','50','75','100']){const n=document.createElement('span');n.textContent=tick;ticks.append(n);}label.append(text,output,meter,ticks);panel.append(label);
 }
 container.append(panel);
 const note=document.createElement('p');note.className='score-note';note.textContent='Szacunek regułowy, nie prognoza ceny. Kierunek reakcji: nieokreślony.';container.append(note);
 const watch=analysis.watch_companies||[];
 if(watch.length){const heading=document.createElement('strong');heading.className='watch-heading';heading.textContent='Spółki powiązane z tematem';container.append(heading);const list=document.createElement('ul');list.className='watch-companies';for(const company of watch){const li=document.createElement('li');const link=document.createElement('a');link.textContent=company.name;link.href=`./?company=${encodeURIComponent(company.name)}`;li.append(link,document.createTextNode(` — ${company.relation}`));list.append(li);}container.append(list);}
 const details=document.createElement('details');details.className='analysis-details';const title=document.createElement('summary');title.textContent='Podstawa skal i powiązań';details.append(title);
 for(const e of analysis.evidence||[]){const p=document.createElement('p');p.textContent=`${e.factor}: „${e.excerpt}”`;details.append(p);}
 const limits=document.createElement('p');limits.textContent=`Pewność: ${analysis.confidence}. ${analysis.limitations}`;details.append(limits);
 for(const company of watch){const p=document.createElement('p');p.textContent=`${company.name}: ${company.reason} Weryfikacja profilu: ${company.checked_at}. `;const source=document.createElement('a');const url=new URL(company.source);if(url.protocol==='https:'){source.href=url.href;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Źródło emitenta';p.append(source);}details.append(p);}
 container.append(details);return container;
};
