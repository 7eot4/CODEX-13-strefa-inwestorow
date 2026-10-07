'use strict';
const id = new URLSearchParams(location.search).get('id');
fetch('data/archive.json',{cache:'no-store'}).then(r => {if(!r.ok) throw Error();return r.json();}).then(data => {
 const a=data.articles.find(item => item.id===id); if(!a || !a.body) throw Error();
 document.title=`${a.title} · Notatnik inwestora`;
 document.getElementById('title').textContent=a.title;
 document.getElementById('meta').textContent=`${SearchCore.published(a)} · ${a.kind==='article'?'ARTYKUŁ':'SKRÓT WIADOMOŚCI'}`;
 document.getElementById('byline').textContent=`${a.author || 'Strefa Inwestorów'} · ${a.published_display || a.date}`;
 const body=document.getElementById('body');
 document.getElementById('title').before(window.articleArtworkUI(a));
 const tags=document.createElement('nav');tags.className='reader-tags';tags.setAttribute('aria-label','Sekcje artykułu');
 for(const section of data.sections || [])if(a.sections?.includes(section.id)){const link=document.createElement('a');link.href=`./?section=${encodeURIComponent(section.id)}`;link.textContent=section.name;tags.append(link);}
 body.before(tags);
 body.before(window.articleAnalysisUI(a));
 window.registerArticleMotion(document.querySelector('.reader'));
 for(const block of a.body){const el=document.createElement(block.type==='heading'?'h2':'p');el.textContent=block.text;body.append(el);}
 const url=new URL(a.url);if(url.protocol!=='https:'||url.hostname!=='strefainwestorow.pl')throw Error();
 const original=document.getElementById('original');original.href=url.href;original.hidden=false;
 document.getElementById('archived').textContent=`Zapisano ${new Date(a.saved_at).toLocaleString('pl-PL')}. Ostatni odczyt treści: ${new Date(a.content_checked_at).toLocaleString('pl-PL')}.`;
}).catch(()=>{document.getElementById('title').textContent='Artykuł jest niedostępny';document.getElementById('body').textContent='Wróć do biblioteki i wybierz dostępny wpis.';}).finally(()=>document.getElementById('body').setAttribute('aria-busy','false'));
