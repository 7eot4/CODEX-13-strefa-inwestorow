"""Archive licensed roundup texts with source attribution."""
import argparse
import hashlib
import json
import re
import time
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from topics import classify
from analysis import analyze
ORIGIN = 'https://strefainwestorow.pl'
AGENT = 'InvestorReadingArchive/1.0'

class Article(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.body_depth = None
        self.skip_depth = None
        self.block = None
        self.parts = []
        self.paragraphs = []
        self.author_parts = []
        self.author_depth = None
        self.times = []
        self.title_parts = []
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {'br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'wbr', 'embed', 'area', 'base', 'col', 'param', 'track'}:
            if tag == 'br' and self.block:
                self.parts.append('\n')
            return
        self.stack.append(tag)
        if tag == 'h1':
            self.in_title = True
        classes = attrs.get('class', '').split()
        if 'field--name-field-body' in classes:
            self.body_depth = len(self.stack)
        if 'user-name' in classes:
            self.author_depth = len(self.stack)
        if tag == 'time' and attrs.get('datetime'):
            self.times.append(attrs['datetime'])
        if self.body_depth is not None and self.skip_depth is None:
            if tag in {'script', 'style', 'iframe'} or 'ad-inside-article' in classes:
                self.skip_depth = len(self.stack)
            elif tag in {'p', 'h2', 'h3', 'h4', 'h5', 'li', 'blockquote', 'tr', 'figcaption'}:
                self.block = tag
                self.parts = []
            elif tag in {'td', 'th'} and self.block == 'tr':
                self.parts.append(' | ')

    def handle_data(self, data):
        if self.block and self.skip_depth is None:
            self.parts.append(data)
        if self.author_depth:
            self.author_parts.append(data)
        if self.in_title:
            self.title_parts.append(data)

    def handle_endtag(self, tag):
        if tag not in self.stack:
            return
        depth = len(self.stack) - self.stack[::-1].index(tag)
        if self.block == tag and self.skip_depth is None:
            text = ' '.join(' '.join(self.parts).split())
            if text:
                self.paragraphs.append({'type': 'heading' if tag in {'h2','h3','h4','h5'} or (text.isupper() and len(text) < 100) else 'paragraph', 'text': text})
            self.block = None
        if self.skip_depth is not None and depth <= self.skip_depth:
            self.skip_depth = None
        if self.body_depth is not None and depth <= self.body_depth:
            self.body_depth = None
        if self.author_depth is not None and depth <= self.author_depth:
            self.author_depth = None
        self.stack = self.stack[:depth-1]
        if tag == 'h1':
            self.in_title = False

def parse_article(html, roundup=True):
    parser = Article()
    parser.feed(html)
    if len(parser.paragraphs) < (5 if roundup else 1) or sum(len(p['text']) for p in parser.paragraphs) < (500 if roundup else 200):
        raise ValueError('Missing or incomplete article body; refusing to archive')
    result = {'body': parser.paragraphs, 'author': ' '.join(' '.join(parser.author_parts).split()),
            'published_display': ' '.join(parser.times[:2]),
            'content_sha256': hashlib.sha256(json.dumps(parser.paragraphs, ensure_ascii=False).encode()).hexdigest()}
    if parser.title_parts:
        result['title'] = ' '.join(' '.join(parser.title_parts).split())
    if parser.times and re.fullmatch(r'\d{2}\.\d{2}\.\d{4}', parser.times[0]):
        result['date'] = datetime.strptime(parser.times[0], '%d.%m.%Y').date().isoformat()
    return result

def discover(html, rules):
    parser = Links()
    parser.feed(html)
    found = {a['url']: {**a, 'kind': 'roundup'} for a in parse(html)}
    for href, title in parser.items:
        parsed = urlparse(urljoin(ORIGIN, href))
        if parsed.scheme != 'https' or parsed.netloc != 'strefainwestorow.pl' or len(title) < 25:
            continue
        if not any(parsed.path.startswith(prefix) and len(parsed.path.strip('/').split('/')) >= 2 for prefix in rules['article_prefixes']):
            continue
        if any(x in parsed.path for x in ['/page/', '/feed', '/rss', '/users/']) or '.' in parsed.path.rsplit('/', 1)[-1]:
            continue
        url = ORIGIN + parsed.path.rstrip('/')
        if url in found:
            continue
        labels = classify(title, [], url, rules)
        # Collect all company/editorial/news headlines, so private browser-side
        # portfolios are not restricted to the example company watchlists.
        if labels['sections'] or parsed.path.startswith(('/wiadomosci/', '/spolki/', '/debiut-ipo/')):
            if not labels['sections']:
                labels['sections'] = ['pozostale']
                labels['match_reasons'] = {'pozostale': ['Wiadomość lub artykuł o spółkach spoza podstawowych reguł']}
            found[url] = {'id': hashlib.sha256(url.encode()).hexdigest()[:16], 'title': title,
                          'url': url, 'source': 'Strefa Inwestorów', 'kind': 'article', **labels}
    return list(found.values())

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.href = None
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.href = dict(attrs).get('href')
            self.parts = []

    def handle_data(self, data):
        if self.href is not None:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag == 'a' and self.href is not None:
            self.items.append((self.href, ' '.join(' '.join(self.parts).split())))
            self.href = None

def parse(html):
    parser = Links()
    parser.feed(html)
    found = {}
    for href, title in parser.items:
        url = urljoin(ORIGIN, href)
        parsed = urlparse(url)
        match = re.fullmatch(r'/wiadomosci/(\d{8})/(skrot-wiadomosci-[a-z0-9-]+)', parsed.path)
        if parsed.scheme != 'https' or parsed.netloc != 'strefainwestorow.pl' or not match:
            continue
        if not title.casefold().startswith('skrót wiadomości'):
            continue
        date = datetime.strptime(match[1], '%Y%m%d').date().isoformat()
        canonical = ORIGIN + parsed.path
        found[canonical] = {'id': hashlib.sha256(canonical.encode()).hexdigest()[:16],
                            'title': title, 'date': date, 'url': canonical,
                            'source': 'Strefa Inwestorów', 'category': 'Skróty wiadomości'}
    return list(found.values())

def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': AGENT}), timeout=30) as response:
                if urlparse(response.url).netloc != 'strefainwestorow.pl':
                    raise ValueError('Unexpected redirect host')
                return response.read(8_000_000).decode('utf-8')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)

def merge(existing, new, now):
    records = {item['url']: item for item in existing}
    for item in new:
        old = records.get(item['url'], {})
        records[item['url']] = {**old, **item, 'saved_at': old.get('saved_at', now)}
    return sorted(records.values(), key=lambda item: (item['date'], item['url']), reverse=True)

def update():
    rules = json.loads((ROOT / 'docs/data/topics.json').read_text(encoding='utf-8'))
    exposures = json.loads((ROOT / 'docs/data/exposures.json').read_text(encoding='utf-8'))
    robots = RobotFileParser()
    robots.parse(fetch(ORIGIN + '/robots.txt').splitlines())
    discovered, warnings, successful_sources = [], [], 0
    for path in rules['source_paths']:
        url = ORIGIN + path
        if not robots.can_fetch(AGENT, url):
            raise RuntimeError('Source disallows collection: ' + path)
        try:
            discovered.extend(discover(fetch(url), rules))
            successful_sources += 1
        except Exception as error:
            warnings.append({'url': url, 'error': type(error).__name__})
        time.sleep(1)
    if not discovered or not successful_sources:
        raise RuntimeError('No relevant entries found; archive remains unchanged')
    target = ROOT / 'docs/data/archive.json'
    previous = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {'articles': []}
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    records = {a['url']: a for a in previous['articles']}
    queue = {a['url']: a for a in previous.get('pending', [])}
    for item in discovered:
        if item['url'] not in records or item['kind'] == 'roundup':
            queue[item['url']] = item
    # Refresh roundups first; remaining new articles are persisted for later runs.
    ordered = sorted(queue.values(), key=lambda a: (a.get('kind') != 'roundup', a.get('attempts', 0)))
    for item in ordered[:rules['max_new_articles_per_run']]:
        try:
            if not robots.can_fetch(AGENT, item['url']):
                raise ValueError('Source disallows article collection')
            content = parse_article(fetch(item['url']), roundup=item.get('kind') == 'roundup')
            if not content.get('date'):
                raise ValueError('Missing publication date')
            entry = {**records.get(item['url'], {}), **item, **content}
            entry['saved_at'] = records.get(item['url'], {}).get('saved_at', now)
            entry['content_checked_at'] = now
            entry.update(classify(entry['title'], entry['body'], entry['url'], rules, entry.get('kind') == 'roundup'))
            records[item['url']] = entry
            del queue[item['url']]
            print('Saved:', entry['title'], flush=True)
        except Exception as error:
            warnings.append({'url': item['url'], 'error': type(error).__name__})
            queue[item['url']]['attempts'] = queue[item['url']].get('attempts', 0) + 1
        time.sleep(1)
    for entry in records.values():
        entry.setdefault('kind', 'roundup' if '/skrot-wiadomosci-' in entry['url'] else 'article')
        entry.update(classify(entry['title'], entry['body'], entry['url'], rules, entry['kind'] == 'roundup'))
        if not entry['sections']:
            entry['sections'] = ['pozostale']
            entry['match_reasons'] = {'pozostale': ['Wiadomość spoza podstawowych reguł tematycznych']}
        analyze(entry, exposures)
    articles = sorted(records.values(), key=lambda a: (a['date'], a.get('published_display', ''), a['url']), reverse=True)
    result = {'schema_version': 4, 'last_checked': now, 'mode': 'full_text', 'articles': articles,
              'sections': rules['sections'], 'pending': list(queue.values()), 'warnings': warnings,
              'collector': {'successful_sources': successful_sources, 'total_sources': len(rules['source_paths'])}}
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(target)
    print(f'Archive: {len(articles)} entries; added {len(articles)-len(previous["articles"])}')

if __name__ == '__main__':
    update()
