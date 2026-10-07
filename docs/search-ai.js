'use strict';
let searchWorker,searchIndex,aiReady=false,requestId=0,activeQuery='',timer;
window.articleSemanticScores=null;
const aiStatus=text=>document.getElementById('ai-status').textContent=text;
async function semanticSearch(){const query=document.getElementById('search').value.trim();if(!aiReady||!query)return;activeQuery=query;window.articleSemanticScores=null;aiStatus('AI porównuje znaczenie zapytania z artykułami…');searchWorker.postMessage({type:'query',requestId:++requestId,query});}
document.getElementById('ai-enable').onclick=async()=>{
 const button=document.getElementById('ai-enable');
 if(searchWorker){searchWorker.terminate();searchWorker=null;aiReady=false;window.articleSemanticScores=null;button.textContent='Włącz lokalne AI';aiStatus('AI wyłączone. Wyszukiwanie słowami nadal działa.');window.dispatchEvent(new Event('search-updated'));return;}
 button.disabled=true;aiStatus('Pobieranie lokalnego modelu: ok. 120 MB + pliki językowe. Pierwsze uruchomienie może potrwać kilka minut.');
 try{const [config,index]=await Promise.all([fetch('data/ai-config.json').then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('data/search-index.json').then(r=>{if(!r.ok)throw Error();return r.json();})]);
  if(config.revision!==index.revision)throw Error('Wersja indeksu nie zgadza się z modelem');searchIndex=index;
  searchWorker=new Worker('search-worker.js',{type:'module'});
  searchWorker.onerror=()=>{aiReady=false;button.disabled=false;aiStatus('Nie udało się uruchomić modelu. Wyszukiwanie słowami pozostaje dostępne. Wyłącz AI i spróbuj ponownie.');};
  searchWorker.onmessage=({data})=>{if(data.type==='ready'){aiReady=true;button.disabled=false;button.textContent='Wyłącz lokalne AI';aiStatus('Lokalne AI gotowe. Zapytania są przetwarzane na tym urządzeniu.');semanticSearch();}else if(data.type==='progress'&&data.status==='progress'){aiStatus(`Pobieranie ${data.file}: ${Math.round(data.progress||0)}%. Zapytania nie są wysyłane do usługi AI.`);}else if(data.type==='result'&&data.requestId===requestId&&data.query===document.getElementById('search').value.trim()){window.articleSemanticScores=SearchCore.semanticScores(data.vector,searchIndex);aiStatus('Wyniki uporządkowane według znaczenia i dopasowania słów. Podobieństwo nie jest oceną prawdziwości artykułu.');window.dispatchEvent(new Event('search-updated'));}else if(data.type==='error'){button.disabled=false;aiStatus('Błąd lokalnego AI. Dostępne są wyniki wyszukiwania słowami.');}};
  searchWorker.postMessage({type:'init',config});
 }catch{button.disabled=false;aiStatus('Nie można pobrać modelu lub indeksu. Wyszukiwanie słowami nadal działa.');}
};
document.getElementById('search-run').onclick=semanticSearch;
document.getElementById('search').addEventListener('input',()=>{window.articleSemanticScores=null;requestId++;window.dispatchEvent(new Event('search-updated'));clearTimeout(timer);if(aiReady)timer=setTimeout(semanticSearch,600);});
document.getElementById('search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();semanticSearch();}});
