import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('collector', Path(__file__).resolve().parents[1] / 'scripts/update.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)

class CollectorTests(unittest.TestCase):
    def test_full_article_excludes_advertising_and_outside_content(self):
        paragraphs = ''.join(f'<p>Wiadomość numer {i}: ' + 'Treść źródłowa. ' * 20 + '</p>' for i in range(6))
        sample = '<div class="user-name"><a>Autor</a></div><time datetime="06.10.2026"></time><div class="field--name-field-body"><p>MAKROEKONOMIA</p><div class="ad-inside-article"><p>REKLAMA</p><script>malicious()</script></div>' + paragraphs + '</div><p>STOPKA</p>'
        result = collector.parse_article(sample)
        self.assertEqual(len(result['body']), 7)
        self.assertEqual(result['author'], 'Autor')
        self.assertEqual(result['body'][0]['type'], 'heading')
        self.assertNotIn('REKLAMA', str(result['body']))
        self.assertNotIn('STOPKA', str(result['body']))
        self.assertNotIn('malicious', str(result['body']))

    def test_incomplete_body_rejected(self):
        with self.assertRaises(ValueError):
            collector.parse_article('<div class="field--name-field-body"><p>Podgląd</p></div>')

    def test_short_dated_individual_article_is_not_filtered_by_length(self):
        result=collector.parse_article('<div class></div><time datetime="11.10.2026"></time><div class="field--name-field-body"><p>WIG20 otworzył sesję wzrostem o 0,4 procent.</p></div>',roundup=False)
        self.assertEqual(result['date'],'2026-10-11')
        self.assertEqual(len(result['body']),1)

    def test_chat_announcement_excludes_comments_and_advertising_body_fields(self):
        result=collector.parse_article('<time datetime="11.10.2026"></time><div class="field--name-field-announcement-text"><p>Opis zapowiedzianego wydarzenia.</p></div><div class="field--name-comment-body"><p>KOMENTARZ</p></div><div class="field--name-body"><p>REKLAMA</p></div>',roundup=False)
        self.assertEqual(len(result['body']),1)
        self.assertNotIn('KOMENTARZ',str(result))
        self.assertNotIn('REKLAMA',str(result))

    def test_source_filter_and_canonical_duplicates(self):
        sample = '''<a href="/wiadomosci/20261006/skrot-wiadomosci-wtorek-1700?tracking=1"><h6>Skrót wiadomości — wtorek</h6></a>
        <a href="https://evil.test/wiadomosci/20261006/skrot-wiadomosci-wtorek-1700">Skrót wiadomości — zły</a>
        <a href="/wiadomosci/20261006/skrot-wiadomosci-wtorek-1700">Skrót wiadomości — wtorek</a>
        <a href="/wiadomosci/20261006/inny-artykul">Inny artykuł</a>'''
        items = collector.parse(sample)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['date'], '2026-10-06')
        self.assertNotIn('?', items[0]['url'])

    def test_retention_and_original_saved_date(self):
        old = [{'url':'a','date':'2026-10-05','saved_at':'first','title':'old'}, {'url':'b','date':'2026-10-04','saved_at':'first'}]
        fresh = [{'url':'a','date':'2026-10-05','title':'corrected'}, {'url':'c','date':'2026-10-06'}]
        result = collector.merge(old, fresh, 'second')
        self.assertEqual([a['url'] for a in result], ['c','a','b'])
        self.assertEqual(result[1]['saved_at'], 'first')
        self.assertEqual(result[1]['title'], 'corrected')

    def test_all_topics_and_short_unfamiliar_article_paths(self):
        rules={'sections':[], 'article_prefixes':['/wiadomosci/']}
        items=collector.discover('<a href="/nowy-dzial/nowy-temat">AI</a><a href="/blog/inna-sprawa">Temat niezwiązany z listą spółek</a><a href="/notowania/spolki/PL0000000000">Cena</a>',rules)
        self.assertEqual(len(items),2)
        self.assertTrue(all(a['sections']==['pozostale'] for a in items))

    def test_pagination_stays_in_source_and_preserves_query(self):
        html='<a href="/blog?page=3">Następna</a><a href="/blog?page=5">5</a><a href="https://example.com/blog?page=4">Obca</a>'
        self.assertEqual(collector.next_listing_page(html,'/blog?page=2'),'/blog?page=3')
        self.assertIsNone(collector.next_listing_page(html,'/blog?page=5'))

    def test_global_rss_has_no_topic_filter(self):
        xml='<?xml version="1.0"?><rss><channel><item><title>AI</title><link>https://strefainwestorow.pl/nowy-dzial/ai</link></item><item><title>Obcy</title><link>https://example.com/blog/obcy</link></item></channel></rss>'
        items=collector.discover(xml,{'sections':[]})
        self.assertEqual(len(items),1)
        self.assertEqual(items[0]['title'],'AI')

if __name__ == '__main__':
    unittest.main()
