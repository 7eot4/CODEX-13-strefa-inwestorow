import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from topics import classify, matches
from update import discover, parse_article

RULES = json.loads((ROOT / 'docs/data/topics.json').read_text(encoding='utf-8'))

class TopicTests(unittest.TestCase):
    def test_company_boundaries_and_accents(self):
        self.assertFalse(matches('marketing i gaming', 'ING'))
        self.assertFalse(matches('rozwój gazety', 'gazow*'))
        self.assertTrue(matches('Żabka poprawia wyniki', 'zabka'))
        self.assertTrue(matches('CD PROJEKT RED publikuje wyniki', 'CD PROJEKT'))

    def test_headline_routes_without_incidental_sector_leak(self):
        result = classify('CD PROJEKT RED zapowiada Wiedźmina', [{'text':'Nowa gra.'},{'text':'Firma wynajmuje biurowce i rozwija produkcję.'}], 'https://strefainwestorow.pl/gaming/wiedzmin', RULES)
        self.assertEqual(result['sections'], ['technologie'])
        self.assertIn('CD PROJEKT', result['companies'])

    def test_multisection_and_roundup(self):
        result = classify('Orlen i XTB: wyniki', [], '', RULES)
        self.assertIn('energia', result['sections'])
        self.assertIn('finanse', result['sections'])
        self.assertIn('skroty', classify('Skrót wiadomości', [], '', RULES, True)['sections'])

    def test_unknown_companies_discovered_for_private_portfolio(self):
        items = discover('<a href="/spolki/nieznana-firma">Nowa Firma ogłasza wyniki za trzeci kwartał</a><a href="https://evil.test/spolki/nieznana-firma">Nowa Firma ogłasza wyniki za trzeci kwartał</a>', RULES)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['sections'], ['pozostale'])

    def test_tables_and_publication_date(self):
        html = '<h1>Wyniki firmy</h1><time datetime="07.10.2026"></time><div class="field--name-field-body"><table><tr><th>Przychody</th><td>'+'dane finansowe '*30+'</td></tr></table><h4>Sekcja</h4></div>'
        result = parse_article(html, False)
        self.assertEqual(result['date'], '2026-10-07')
        self.assertIn('Przychody', result['body'][0]['text'])
        self.assertEqual(result['body'][1]['type'], 'heading')
