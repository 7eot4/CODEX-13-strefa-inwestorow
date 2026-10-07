'use strict';
const $ = id => document.getElementById(id);
let articles = [], sections = [], selectedSection = new URLSearchParams(location.search).get('section') || '', onlySaved = false, onlyPortfolio=false, bookmarks;
try { bookmarks = new Set(JSON.parse(localStorage.getItem('investor-bookmarks') || '[]')); } catch { bookmarks = new Set(); }
function element(tag, text, className) { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; }
function safeURL(value) { const u = new URL(value); if (u.protocol !== 'https:' || u.hostname !== 'strefainwestorow.pl') throw Error('Nieprawidłowe źródło'); return u.href; }
function externalLink(text, url, className) { const a = element('a', text, className); a.href = safeURL(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
function render() {
 const query = $('search').value.toLocaleLowerCase('pl');
 const month = $('month').value;
 const company = $('company').value, kind = $('kind').value;
 const semantic=query?window.articleSemanticScores:null;
 const lexical=new Map(articles.map(a=>[a.id,query?SearchCore.lexicalScore(a,query):0]));
 let filtered = articles.filter(a => (!onlyPortfolio || window.matchPortfolio(a,sections).length) && (!selectedSection || (a.sections || []).includes(selectedSection)) && (!company || (a.companies || []).includes(company) || (a.analysis?.watch_companies||[]).some(c=>c.name===company)) && (!kind || a.kind === kind) && (!onlySaved || bookmarks.has(a.id)) && (!month || a.date.startsWith(month)) && (!query || semantic?.has(a.id) || lexical.get(a.id)>0));
 const relevance=a=>semantic?(semantic.get(a.id)||0)+Math.min(lexical.get(a.id),30)/300:lexical.get(a.id);
 const order=$('sort').value;
 filtered.sort((a,b)=>order==='interest'?(b.analysis?.interest_score||0)-(a.analysis?.interest_score||0):order==='impact'?(b.analysis?.impact_score||0)-(a.analysis?.impact_score||0):order==='latest'||!query?(b.published_at||b.date).localeCompare(a.published_at||a.date):relevance(b)-relevance(a));
 const total=filtered.length;if(semantic&&query)filtered=filtered.slice(0,30);
 $('articles').replaceChildren(); $('saved-count').textContent = articles.filter(a => bookmarks.has(a.id)).length;
 $('count').textContent = semantic&&query?`Najlepsze ${filtered.length} z ${total} wyników AI`:`${filtered.length} z ${articles.length} wpisów`;
 for (const a of filtered) {
  const card = element('article', '', 'card');
  card.append(element('div', `${SearchCore.published(a)} · ${a.kind === 'roundup' ? 'SKRÓT DNIA' : 'ARTYKUŁ'}`, 'meta'));
  const heading = element('h3'); const titleLink = element('a', a.title); titleLink.href = `read.html?id=${encodeURIComponent(a.id)}`; heading.append(titleLink); card.append(heading);
  card.append(window.articleAnalysisUI(a));
  const tags = element('div', '', 'tags');
  for (const id of a.sections || []) { const section = sections.find(s=>s.id===id); if (!section) continue; const tag = element('button', section.name); tag.onclick=()=>chooseSection(id); tags.append(tag); }
  card.append(tags);
  if (a.companies?.length) card.append(element('p', a.companies.join(' · '), 'card-companies'));
  if(onlyPortfolio)card.append(element('p','Z Twojej listy: '+window.matchPortfolio(a,sections).join(' · '),'portfolio-match'));
  const explanation = element('details', '', 'match-info'); explanation.append(element('summary', 'Dlaczego ten artykuł?'));
  const reasons = selectedSection ? a.match_reasons?.[selectedSection] || [] : Object.values(a.match_reasons || {}).flat();
  explanation.append(element('p', [...new Set(reasons)].join(' · '))); card.append(explanation);
  const actions = element('div', '', 'actions'); const readLink = element('a', 'Czytaj artykuł →', 'read'); readLink.href = titleLink.href; actions.append(readLink);
  const button = element('button', bookmarks.has(a.id) ? 'Zapisano ✓' : 'Do przeczytania +', 'bookmark');
  button.setAttribute('aria-pressed', String(bookmarks.has(a.id))); button.setAttribute('aria-label', `Do przeczytania: ${a.title}`);
  button.onclick = () => { bookmarks.has(a.id) ? bookmarks.delete(a.id) : bookmarks.add(a.id); try {localStorage.setItem('investor-bookmarks', JSON.stringify([...bookmarks]));} catch { $('status').textContent = 'Przeglądarka nie pozwala zapisać zakładek'; } render(); };
  actions.append(button); card.append(actions); $('articles').append(card);
 }
 if (!filtered.length) $('articles').append(element('p', onlyPortfolio ? 'Brak dopasowań do portfela dla tych filtrów. Zaimportuj listę lub popraw nazwy firm; kolejne pobrane artykuły będą dopasowywane automatycznie.' : onlySaved ? 'Nie ma zapisanych wpisów dla tych filtrów.' : 'Brak wpisów dla tych filtrów.', 'empty'));
}
function chooseSection(id) {
 selectedSection=id;
 const section=sections.find(s=>s.id===id);
 $('section-title').textContent=section?.name || 'Wszystkie sekcje';
 $('section-description').textContent=section?.description || 'Artykuły o śledzonych firmach i zagadnieniach oraz skróty dnia.';
 const watched=section ? [section] : sections.filter(s=>s.id!=='skroty');
 $('watchlist').textContent=watched.map(s=>`${s.name}: firmy — ${Object.keys(s.companies).join(', ') || 'brak listy firm'}; tematy — ${s.keywords.map(t=>t.replaceAll('*','…')).join(', ') || 'skróty wiadomości'}.`).join('\n');
 const company=$('company').value;
 $('company').replaceChildren(element('option', 'Wszystkie firmy')); $('company').firstChild.value='';
 const names=[...new Set([...watched.flatMap(s=>Object.keys(s.companies)),...articles.filter(a=>!id||a.sections?.includes(id)).flatMap(a=>[...(a.companies||[]),...(a.analysis?.watch_companies||[]).map(c=>c.name)])])].sort((a,b)=>a.localeCompare(b,'pl'));
 for(const name of names){const option=element('option',name);option.value=name;$('company').append(option);}
 if(names.includes(company))$('company').value=company;
 for(const b of $('sections').children){b.classList.toggle('active',b.dataset.section===id);b.setAttribute('aria-pressed',String(b.dataset.section===id));}
 const url=new URL(location.href);id?url.searchParams.set('section',id):url.searchParams.delete('section');history.replaceState(null,'',url);
 render();
}
for (const id of ['search', 'month','company','kind','sort']) $(id).addEventListener('input', render);
window.addEventListener('search-updated',render);
for (const id of ['all','saved','portfolio-tab']) $(id).onclick = () => { onlySaved=id==='saved';onlyPortfolio=id==='portfolio-tab'; for (const name of ['all','saved','portfolio-tab']) { $(name).classList.toggle('active', name === id); $(name).setAttribute('aria-pressed', String(name === id)); } render(); };
window.addEventListener('portfolio-changed',render);
fetch('data/archive.json', {cache:'no-store'}).then(r => {if (!r.ok) throw Error('HTTP ' + r.status); return r.json();}).then(data => {
 articles = data.articles; sections=data.sections || []; for (const a of articles) safeURL(a.url);
 for(const section of [{id:'',name:'Wszystkie'},...sections]){const count=articles.filter(a=>!section.id||a.sections?.includes(section.id)).length;const b=element('button', `${section.name} · ${count}`);b.dataset.section=section.id;b.onclick=()=>chooseSection(section.id);$('sections').append(b);}
 if(!sections.some(s=>s.id===selectedSection))selectedSection='';
 const months = [...new Set(articles.map(a => a.date.slice(0,7)))].sort().reverse();
 for (const month of months) { const option = element('option', new Date(month + '-01T12:00:00').toLocaleDateString('pl-PL', {month:'long',year:'numeric'})); option.value=month; $('month').append(option); }
 const checked = new Date(data.last_checked); const stale = Date.now() - checked.getTime() > 6*3600*1000;
 $('status').textContent = stale ? 'Archiwum wymaga aktualizacji' : data.warnings?.length ? 'Aktualizacja częściowa' : 'Archiwum zaktualizowane';
 $('checked').textContent = `Ostatni odczyt: ${checked.toLocaleString('pl-PL')}. Harmonogram co 2 godziny; uruchomienia mogą się opóźnić.`;
 $('collection-status').textContent=`${data.pending?.length || 0} tekstów oczekuje na pobranie. ${data.warnings?.length || 0} ostrzeżeń ostatniego odczytu.`;
 chooseSection(selectedSection);
 const requestedCompany=new URLSearchParams(location.search).get('company');if(requestedCompany&&[...$('company').options].some(o=>o.value===requestedCompany)){$('company').value=requestedCompany;render();}
}).catch(() => { $('status').textContent='Nie udało się wczytać bazy'; $('articles').append(element('p', 'Odśwież stronę lub pobierz bazę bezpośrednio.', 'empty')); }).finally(() => $('articles').setAttribute('aria-busy','false'));
