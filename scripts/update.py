"""Archive licensed roundup texts with source attribution."""
import argparse
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser

ROOT = Path(__file__).resolve().parents[1]
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

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {'br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'wbr', 'embed', 'area', 'base', 'col', 'param', 'track'}:
            if tag == 'br' and self.block:
                self.parts.append('\n')
            return
        self.stack.append(tag)
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
            elif tag in {'p', 'h2', 'h3', 'li'}:
                self.block = tag
                self.parts = []

    def handle_data(self, data):
        if self.block and self.skip_depth is None:
            self.parts.append(data)
        if self.author_depth:
            self.author_parts.append(data)

    def handle_endtag(self, tag):
        if tag not in self.stack:
            return
        depth = len(self.stack) - self.stack[::-1].index(tag)
        if self.block == tag and self.skip_depth is None:
            text = ' '.join(' '.join(self.parts).split())
            if text:
                self.paragraphs.append({'type': 'heading' if tag in {'h2','h3'} or (text.isupper() and len(text) < 100) else 'paragraph', 'text': text})
            self.block = None
        if self.skip_depth is not None and depth <= self.skip_depth:
            self.skip_depth = None
        if self.body_depth is not None and depth <= self.body_depth:
            self.body_depth = None
        if self.author_depth is not None and depth <= self.author_depth:
            self.author_depth = None
        self.stack = self.stack[:depth-1]

def parse_article(html):
    parser = Article()
    parser.feed(html)
    if len(parser.paragraphs) < 5 or sum(len(p['text']) for p in parser.paragraphs) < 500:
        raise ValueError('Missing or incomplete article body; refusing to archive')
    return {'body': parser.paragraphs, 'author': ' '.join(' '.join(parser.author_parts).split()),
            'published_display': ' '.join(parser.times[:2]),
            'content_sha256': hashlib.sha256(json.dumps(parser.paragraphs, ensure_ascii=False).encode()).hexdigest()}

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
    robots = RobotFileParser()
    robots.parse(fetch(ORIGIN + '/robots.txt').splitlines())
    discovered = []
    for path in ('/', '/wiadomosci'):
        url = ORIGIN + path
        if not robots.can_fetch(AGENT, url):
            raise RuntimeError('Source disallows collection: ' + path)
        discovered.extend(parse(fetch(url)))
        time.sleep(1)
    if not discovered:
        raise RuntimeError('No roundup entries found; archive remains unchanged')
    target = ROOT / 'docs/data/archive.json'
    previous = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {'articles': []}
    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    articles = merge(previous['articles'], discovered, now)
    for item in articles:
        if not item.get('body') or item['url'] in {a['url'] for a in discovered}:
            if not robots.can_fetch(AGENT, item['url']):
                raise RuntimeError('Source disallows article collection')
            item.update(parse_article(fetch(item['url'])))
            item['content_checked_at'] = now
            time.sleep(1)
    result = {'schema_version': 2, 'last_checked': now, 'mode': 'full_text', 'articles': articles}
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(target)
    print(f'Archive: {len(articles)} entries; added {len(articles)-len(previous["articles"])}')

if __name__ == '__main__':
    update()
