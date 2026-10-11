'use strict';
let marketCalendar;
// Fixed public instrument list. Never read portfolio/localStorage here; an
// external frame runs on its own origin and cannot access the private import.
const publicMarketConfig={width:'100%',height:550,colorTheme:'dark',locale:'pl',showSymbolLogo:true,isTransparent:false,symbolsGroups:[
 {name:'Indeksy GPW',symbols:[{name:'GPW:WIG20',displayName:'WIG20'},{name:'GPW:WIG',displayName:'WIG'},{name:'GPW:MWIG40',displayName:'mWIG40'},{name:'GPW:SWIG80',displayName:'sWIG80'}]},
 {name:'Spółki GPW',symbols:[{name:'GPW:PKN',displayName:'Orlen'},{name:'GPW:PKO',displayName:'PKO BP'},{name:'GPW:CDR',displayName:'CD PROJEKT'},{name:'GPW:BDX',displayName:'Budimex'},{name:'GPW:ALE',displayName:'Allegro'},{name:'GPW:DOM',displayName:'Dom Development'},{name:'GPW:DVL',displayName:'Develia'},{name:'GPW:ACP',displayName:'Asseco Poland'}]},
 {name:'Indeksy USA',symbols:[{name:'SP:SPX',displayName:'S&P 500'},{name:'NASDAQ:NDX',displayName:'Nasdaq 100'},{name:'DJ:DJI',displayName:'Dow Jones'}]},
 {name:'Spółki USA',symbols:[{name:'NASDAQ:AAPL',displayName:'Apple'},{name:'NASDAQ:MSFT',displayName:'Microsoft'},{name:'NASDAQ:NVDA',displayName:'NVIDIA'},{name:'NASDAQ:GOOGL',displayName:'Alphabet'},{name:'NASDAQ:AMZN',displayName:'Amazon'}]}
]};
document.getElementById('public-market-widget').src='https://s.tradingview.com/embed-widget/market-quotes/?locale=pl#'+encodeURIComponent(JSON.stringify(publicMarketConfig));
const marketNode=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
function renderMarkets(){
 if(!marketCalendar)return;
 const now=new Date(),selected=document.getElementById('market-date').value,body=document.getElementById('market-sessions');body.replaceChildren();
 document.getElementById('market-now').textContent=now.toLocaleString('pl-PL',{timeZone:'Europe/Warsaw',hourCycle:'h23'})+' · czas polski';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(selected)||selected<marketCalendar.start||selected>marketCalendar.end){document.getElementById('market-calendar-note').textContent='Wybierz dzień w zakresie kalendarza.';return;}
 for(const m of marketCalendar.markets){
  const row=marketNode('tr'),s=m.sessions[selected],state=MarketCore.status(m,now);
  const name=marketNode('td');name.append(marketNode('strong',m.name),marketNode('small',m.timezone));row.append(name);
  const hours=marketNode('td');hours.append(marketNode('strong',s?`${MarketCore.clock(s.open,'Europe/Warsaw')}–${MarketCore.clock(s.close,'Europe/Warsaw')}`:'Brak sesji'));
  if(s?.break_start)hours.append(marketNode('small',`Przerwa ${MarketCore.clock(s.break_start,'Europe/Warsaw')}–${MarketCore.clock(s.break_end,'Europe/Warsaw')}`));row.append(hours);
  const local=marketNode('td',s?`${MarketCore.clock(s.open,m.timezone)}–${MarketCore.clock(s.close,m.timezone)}`:'—');row.append(local);
  const live=marketNode('td');live.append(marketNode('span',state.label,'exchange-status '+state.state));const next=MarketCore.nextEvent(m,now);
  if(next){const delta=Math.max(0,Math.ceil((Date.parse(next.at)-now.getTime())/60000));live.append(marketNode('small',`${next.label}: ${new Date(next.at).toLocaleString('pl-PL',{timeZone:'Europe/Warsaw',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} · za ${Math.floor(delta/60)} h ${delta%60} min`));}else live.append(marketNode('small','Poza zakresem kalendarza — brak aktualnego statusu.'));row.append(live);
  const details=marketNode('td');const d=marketNode('details'),summary=marketNode('summary','Fazy i źródło');d.append(summary,marketNode('p',m.note));const a=marketNode('a','Oficjalny harmonogram');a.href=m.source;a.target='_blank';a.rel='noopener noreferrer';d.append(a);details.append(d);row.append(details);body.append(row);
 }
 const covered=MarketCore.day(now,'Europe/Warsaw')>=marketCalendar.start&&MarketCore.day(now,'Europe/Warsaw')<=marketCalendar.end;
 document.getElementById('market-calendar-note').textContent=covered?`Sesje akcji: ${marketCalendar.start}–${marketCalendar.end}. Godziny w wybranym dniu są niezależne od statusu „teraz”. Święta, sesje skrócone i przerwy uwzględnione. Aukcje i rozszerzone fazy opisano przy giełdzie; awaryjnych wstrzymań handlu ten zegar nie wykrywa.`:'Kalendarz wymaga aktualizacji. Status bieżący nie jest potwierdzony.';
 if(!covered)for(const el of body.querySelectorAll('.exchange-status'))el.textContent='Brak aktualnego kalendarza';
}
fetch('data/calendar.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
 marketCalendar=data;const input=document.getElementById('market-date');input.min=data.start;input.max=data.end;input.value=MarketCore.day(new Date(),'Europe/Warsaw');input.onchange=renderMarkets;renderMarkets();setInterval(()=>{if(!document.hidden)renderMarkets();},30000);
}).catch(()=>{document.getElementById('market-calendar-note').textContent='Nie udało się pobrać harmonogramu. Sprawdź oficjalne kalendarze giełd.';});
