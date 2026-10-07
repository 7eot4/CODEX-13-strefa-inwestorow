"""Grounded extractive synopsis and explicitly heuristic news prioritization."""
import hashlib
import json
import re
from collections import Counter
from datetime import datetime
from zoneinfo import ZoneInfo
from topics import normalize, matches

EVENTS = [
 ('wyniki', ['wynik*','zysk*','strat*','przychod*','marż*','EBITDA'], 18, 22, 'Wyniki i rentowność'),
 ('prognozy', ['prognoz*','oczekiwan*','szacunk*'], 10, 12, 'Prognozy lub oczekiwania'),
 ('kapital', ['dywidend*','emisj*','buyback','skup akcji','przeję*','akwizycj*'], 16, 20, 'Zmiana kapitału lub wypłaty'),
 ('produkt', ['premier*','sprzedaż*','sprzedaży','kontrakt*','umow*'], 14, 16, 'Produkt, sprzedaż lub kontrakt'),
 ('regulacje', ['RPP','stop* procentow*','regulacj*','ustaw*','sankcj*','koncesj*'], 14, 18, 'Stopy procentowe lub regulacje'),
 ('ryzyko', ['upadłoś*','niewypłacal*','wstrzyman*','opóźni*','awari*','zadłuż*'], 18, 22, 'Ryzyko operacyjne lub finansowe')
]
STOP = set('oraz jest przez dla nie jego sie do na w i z o to ze od po za jak tym tego ich lub proc mln mld roku spolka firmy'.split())

def sentences(text):
    # Protect decimal numbers and common Polish abbreviations before splitting.
    protected = re.sub(r'(?<=\d)\.(?=\d)', '¤', text)
    protected = re.sub(r'\b(proc|mln|mld|rdr|mdm|m\.in|np|tj|kw|ub|br|r|S\.A)\.', lambda m:m[0].replace('.', '¤'), protected, flags=re.I)
    return [s.replace('¤','.').strip() for s in re.split(r'(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„"0-9])', protected) if len(s.strip()) > 35]

def synopsis(article):
    candidates = []
    for block in article['body']:
        if block['type'] != 'paragraph' or '|' in block['text']:
            continue
        for sentence in sentences(block['text']):
            if 45 <= len(sentence) <= 650 and sentence[-1] in '.!?' and not sentence.startswith(('-', '•', '|')) and not re.search(r'czytaj także|zobacz także|zapisz się|przegląd najważniejszych|\(PAP',sentence,re.I):
                candidates.append(sentence)
    if not candidates:
        return [article['title'].rstrip('.!?')+'.', 'Szczegóły i dane źródłowe sprawdzisz w pełnej treści artykułu.']
    terms = [w for w in re.findall(r'\w+', normalize(article['title'])) if len(w)>3 and w not in STOP]
    frequency = Counter(w for s in candidates for w in re.findall(r'\w+', normalize(s)) if len(w)>4 and w not in STOP)
    ranked=[]
    for i,sentence in enumerate(candidates):
        norm=normalize(sentence)
        score=sum(term in norm for term in terms)*2 + sum(min(frequency[w],5) for w in set(re.findall(r'\w+',norm)))/max(len(sentence)**.5,1)
        score+=sum(any(matches(sentence,t) for t in event[1]) for event in EVENTS)*2
        score+=2 if re.search(r'\d',sentence) else 0
        score+=3 if i<3 else 0
        ranked.append((score,i,sentence))
    selected=[]
    for score,i,sentence in sorted(ranked,reverse=True):
        words=set(re.findall(r'\w+',normalize(sentence)))
        if any(len(words & previous)/max(len(words|previous),1)>.65 for _,_,previous in selected):
            continue
        selected.append((i,sentence,words))
        if len(selected)==3:break
    result=[s for _,s,_ in sorted(selected)]
    if len(result)==1:
        active=[e[4].lower() for e in EVENTS if any(matches(article['title']+' '+result[0],t) for t in e[1])]
        result.append('Wątek do dalszej analizy: '+', '.join(active[:2])+'.' if active else 'To krótka informacja rynkowa; szczegóły i źródło danych sprawdzisz w pełnym tekście.')
    return result

def analyze(article, exposures):
    full=' '.join(p['text'] for p in article['body'])
    lead=article['title']+' '+' '.join(p['text'] for p in article['body'][:3])
    active=[event for event in EVENTS if any(matches(lead,term) for term in event[1])]
    interest=min(95,25+sum(e[2] for e in active)+(8 if re.search(r'\d',lead) else 0))
    impact=min(90,10+sum(e[3] for e in active)+(10 if article.get('companies') else 0))
    roundup=article.get('kind')=='roundup'
    if roundup:
        interest=min(interest,65);impact=min(impact,45)
    evidence=[]
    for event in active:
        sentence=next((s for p in article['body'] for s in sentences(p['text']) if any(matches(s,t) for t in event[1])),None)
        evidence.append({'factor':event[4], 'excerpt':(sentence or article['title'])[:650]})
    watch=[]
    # Named companies are distinct from inferred sector exposure.
    for firm in exposures['companies']:
        direct=firm['name'] in article.get('companies',[])
        sector=bool(set(firm['sections']) & set(article.get('sections',[])))
        terms=[t for t in firm['terms'] if matches(lead,t)]
        if direct or (sector and terms and not roundup):
            watch.append({**firm,'relation':'Wymieniona w tekście' if direct else 'Powiązanie branżowe — wniosek', 'matched_topics':terms[:3], 'checked_at':exposures['checked_at']})
    watch.sort(key=lambda firm:firm['relation']!='Wymieniona w tekście')
    display=article.get('published_display','')
    time=re.search(r'\b([01]\d|2[0-3]):[0-5]\d\b',display)
    article['published_time']=time[0] if time else None
    article['published_at']=datetime.fromisoformat(article['date']+'T'+time[0]).replace(tzinfo=ZoneInfo('Europe/Warsaw')).isoformat(timespec='minutes') if time else None
    article['analysis']={'version':1,'method':'Analiza regułowa i podsumowanie ekstrakcyjne pełnego tekstu',
      'summary_sentences':synopsis(article),'interest_score':interest,'impact_score':impact,
      'confidence':'Niska — bez cen rynkowych i oceny zaskoczenia względem konsensusu',
      'impact_direction':'Nieokreślony','evidence':evidence,'watch_companies':watch[:4],
      'limitations':'Skale 0–100 porządkują wiadomości. Nie oznaczają procentowej zmiany kursu ani prawdopodobieństwa. Brak kalibracji historycznej; informacja może już być w cenie.',
      'content_sha256':article.get('content_sha256')}
    return article
