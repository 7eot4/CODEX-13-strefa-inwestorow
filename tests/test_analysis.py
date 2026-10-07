import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from analysis import analyze, sentences
EXPOSURES=json.loads((ROOT/'docs/data/exposures.json').read_text(encoding='utf-8'))

class AnalysisTests(unittest.TestCase):
    def article(self, title='Deweloperzy zwiększają sprzedaż mieszkań'):
        return {'title':title,'date':'2026-10-07','published_display':'07.10.2026 15:59','sections':['nieruchomosci'],'companies':[], 'body':[
         {'type':'paragraph','text':'Sprzedaż mieszkań wzrosła o 12 proc. wobec poprzedniego roku, a ceny pozostały stabilne.'},
         {'type':'paragraph','text':'Deweloperzy zwiększyli ofertę lokali i rozpoczęli budowę nowych inwestycji w dużych miastach.'},
         {'type':'paragraph','text':'Koszt finansowania pozostaje ważnym czynnikiem dla nabywców mieszkań i ich decyzji zakupowych.'}]}
    def test_synopsis_grounded_and_time(self):
        a=self.article();result=analyze(a,EXPOSURES)
        summary=result['analysis']['summary_sentences']
        self.assertIn(len(summary),(2,3))
        self.assertTrue(all(s in ' '.join(p['text'] for p in a['body']) for s in summary))
        self.assertEqual(result['published_time'],'15:59')
        self.assertEqual(result['published_at'],'2026-10-07T15:59+02:00')
        self.assertTrue(any(c['name']=='Dom Development' for c in result['analysis']['watch_companies']))
    def test_no_fabricated_hour_and_winter_timezone(self):
        a=self.article();a['published_display']='07.10.2026';self.assertIsNone(analyze(a,EXPOSURES)['published_at'])
        a['date']='2026-01-07';a['published_display']='07.01.2026 08:30';self.assertTrue(analyze(a,EXPOSURES)['published_at'].endswith('+01:00'))
    def test_scores_and_no_direction_prediction(self):
        a=analyze(self.article('Spółka publikuje zysk, prognozy i dywidendę'),EXPOSURES)
        self.assertTrue(0<=a['analysis']['interest_score']<=100)
        self.assertTrue(0<=a['analysis']['impact_score']<=100)
        self.assertEqual(a['analysis']['impact_direction'],'Nieokreślony')
        self.assertIn('Brak kalibracji',a['analysis']['limitations'])
    def test_polish_sentence_abbreviations(self):
        parts=sentences('Wynik wzrósł o 12 proc. wobec poprzedniego roku i przekroczył oczekiwania analityków. Spółka zapowiada dalsze inwestycje i rozwój na rynku krajowym.')
        self.assertEqual(len(parts),2)
