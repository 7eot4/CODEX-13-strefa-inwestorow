(function(root){
 'use strict';
 const day=(date,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const clock=(iso,tz)=>new Intl.DateTimeFormat('pl-PL',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso));
 function status(market,now=new Date()){
  const date=day(now,market.timezone),s=market.sessions[date],t=now.getTime();
  if(!s)return {state:'closed',label:'Dzień bez sesji'};
  if(t<Date.parse(s.open))return {state:'waiting',label:'Przed otwarciem'};
  if(t>=Date.parse(s.close))return {state:'closed',label:'Po sesji'};
  if(s.break_start&&t>=Date.parse(s.break_start)&&t<Date.parse(s.break_end))return {state:'break',label:'Przerwa'};
  return {state:'open',label:'Sesja zasadnicza'};
 }
 function nextEvent(market,now=new Date()){
  const t=now.getTime();for(const [date,s] of Object.entries(market.sessions)){
   const events=[['Otwarcie',s.open],['Przerwa',s.break_start],['Wznowienie',s.break_end],['Zamknięcie',s.close]].filter(e=>e[1]&&Date.parse(e[1])>t);
   if(events.length)return {date,label:events[0][0],at:events[0][1]};
  }return null;
 }
 const api={day,clock,status,nextEvent};root.MarketCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
