"""Deterministic, explainable section and company matching."""
import re
import unicodedata

def normalize(value):
    value = value.casefold().replace('ł', 'l')
    return ''.join(c for c in unicodedata.normalize('NFKD', value) if not unicodedata.combining(c))

def matches(text, term):
    parts = normalize(term).split()
    expression = r'\s+'.join(re.escape(p).replace(r'\*', r'\w*') for p in parts)
    return bool(re.search(r'(?<!\w)' + expression + r'(?!\w)', normalize(text)))

def classify(title, body, url, rules, roundup=False):
    text = title + ' ' + ' '.join(p['text'] for p in body)
    sections, companies, reasons = [], [], {}
    if roundup:
        sections.append('skroty')
        reasons['skroty'] = ['Skrót wiadomości']
    for section in rules['sections']:
        if section['id'] == 'skroty':
            continue
        firms = [name for name, aliases in section['companies'].items() if any(matches(text, alias) for alias in aliases)]
        # Article routing uses headline/lead; incidental mentions in a long text
        # do not turn a gaming article into a property or industrial article.
        routing_text = text if roundup else title + ' ' + ' '.join(p['text'] for p in body[:1])
        routing_firms = [name for name, aliases in section['companies'].items() if any(matches(routing_text, alias) for alias in aliases)]
        words = [term for term in section['keywords'] if matches(routing_text, term)]
        paths = [p for p in section['paths'] if p in url]
        companies.extend(firms)
        if routing_firms or words or paths:
            sections.append(section['id'])
            reasons[section['id']] = ([f'Firma: {f}' for f in routing_firms] + [f'Temat: {w.rstrip("*")}' for w in words[:5]] + (['Dział źródłowy'] if paths else []))
    return {'sections': sections, 'companies': sorted(set(companies)), 'match_reasons': reasons}
