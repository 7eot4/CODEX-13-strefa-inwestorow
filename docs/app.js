'use strict';
const $ = id => document.getElementById(id);
let articles = [], onlySaved = false, bookmarks;
try { bookmarks = new Set(JSON.parse(localStorage.getItem('investor-bookmarks') || '[]')); } catch { bookmarks = new Set(); }
function element(tag, text, className) { const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el; }
function safeURL(value) { const u = new URL(value); if (u.protocol !== 'https:' || u.hostname !== 'strefainwestorow.pl') throw Error('Nieprawidłowe źródło'); return u.href; }
function externalLink(text, url, className) { const a = element('a', text, className); a.href = safeURL(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
function render() {
 const query = $('search').value.toLocaleLowerCase('pl');
 const month = $('month').value;
 const filtered = articles.filter(a => (!onlySaved || bookmarks.has(a.id)) && (!month || a.date.startsWith(month)) && `${a.title} ${a.date}`.toLocaleLowerCase('pl').includes(query));
 $('articles').replaceChildren(); $('saved-count').textContent = articles.filter(a => bookmarks.has(a.id)).length;
 $('count').textContent = `${filtered.length} z ${articles.length} wpisów`;
 for (const a of filtered) {
  const card = element('article', '', 'card');
  card.append(element('div', `${new Date(a.date + 'T12:00:00').toLocaleDateString('pl-PL', {day:'numeric',month:'long',year:'numeric'})} · SKRÓT DNIA`, 'meta'));
  const heading = element('h3'); const titleLink = element('a', a.title); titleLink.href = `read.html?id=${encodeURIComponent(a.id)}`; heading.append(titleLink); card.append(heading);
  const actions = element('div', '', 'actions'); const readLink = element('a', 'Czytaj artykuł →', 'read'); readLink.href = titleLink.href; actions.append(readLink);
  const button = element('button', bookmarks.has(a.id) ? 'Zapisano ✓' : 'Do przeczytania +', 'bookmark');
  button.setAttribute('aria-pressed', String(bookmarks.has(a.id))); button.setAttribute('aria-label', `Do przeczytania: ${a.title}`);
  button.onclick = () => { bookmarks.has(a.id) ? bookmarks.delete(a.id) : bookmarks.add(a.id); try {localStorage.setItem('investor-bookmarks', JSON.stringify([...bookmarks]));} catch { $('status').textContent = 'Przeglądarka nie pozwala zapisać zakładek'; } render(); };
  actions.append(button); card.append(actions); $('articles').append(card);
 }
 if (!filtered.length) $('articles').append(element('p', onlySaved ? 'Nie ma zapisanych wpisów dla tych filtrów.' : 'Brak wpisów dla tych filtrów.', 'empty'));
}
for (const id of ['search', 'month']) $(id).addEventListener('input', render);
for (const [id, value] of [['all',false],['saved',true]]) $(id).onclick = () => { onlySaved=value; for (const name of ['all','saved']) { $(name).classList.toggle('active', name === id); $(name).setAttribute('aria-pressed', String(name === id)); } render(); };
fetch('data/archive.json', {cache:'no-store'}).then(r => {if (!r.ok) throw Error('HTTP ' + r.status); return r.json();}).then(data => {
 articles = data.articles; for (const a of articles) safeURL(a.url);
 const months = [...new Set(articles.map(a => a.date.slice(0,7)))].sort().reverse();
 for (const month of months) { const option = element('option', new Date(month + '-01T12:00:00').toLocaleDateString('pl-PL', {month:'long',year:'numeric'})); option.value=month; $('month').append(option); }
 const checked = new Date(data.last_checked); const stale = Date.now() - checked.getTime() > 6*3600*1000;
 $('status').textContent = stale ? 'Archiwum wymaga aktualizacji' : 'Archiwum zaktualizowane';
 $('checked').textContent = `Ostatni odczyt: ${checked.toLocaleString('pl-PL')}. Harmonogram co 2 godziny; uruchomienia mogą się opóźnić.`;
 render();
}).catch(() => { $('status').textContent='Nie udało się wczytać bazy'; $('articles').append(element('p', 'Odśwież stronę lub pobierz bazę bezpośrednio.', 'empty')); }).finally(() => $('articles').setAttribute('aria-busy','false'));
