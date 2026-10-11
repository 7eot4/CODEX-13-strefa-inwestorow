"""Public cash-equity session calendar. Times remain UTC until browser formatting."""
import json
from datetime import date, datetime, timezone
from pathlib import Path
import pandas as pd
import exchange_calendars as calendars

ROOT=Path(__file__).resolve().parents[1]
MARKETS=[
 ('gpw','GPW Warszawa','XWAR','Europe/Warsaw','https://www.gpw.pl/szczegoly-sesji','Sesja akcji, obejmuje aukcję zamknięcia. Nie obejmuje instrumentów pochodnych.'),
 ('nyse','NYSE Nowy Jork','XNYS','America/New_York','https://www.nyse.com/trade/hours-calendars','Sesja zasadnicza Tape A; przyjmowanie zleceń od 06:30 ET.'),
 ('nasdaq','Nasdaq','XNYS','America/New_York','https://www.nasdaq.com/market-activity/stock-market-holiday-schedule','Pre-market 04:00–09:30 ET; after-hours 16:00–20:00 ET. Dostęp zależy od brokera. Planowane godziny nocne wymagają osobnej aktualizacji.'),
 ('xetra','Xetra Frankfurt','XETR','Europe/Berlin','https://www.xetra.com/xetra-en/trading/trading-calendar-and-trading-hours','Sesja zasadnicza. Rozszerzone godziny Xetra Retail zależą od brokera i instrumentu.'),
 ('london','LSE Londyn','XLON','Europe/London','https://www.londonstockexchange.com/trade/equity-trading/business-days','Sesja zasadnicza SETS; aukcje mogą kończyć się po podanej godzinie.'),
 ('tokyo','TSE Tokio','XTKS','Asia/Tokyo','https://www.jpx.co.jp/english/equities/trading/domestic/01.html','Dwie części sesji z przerwą obiadową; zamknięcie o 15:30 JST.'),
 ('hongkong','HKEX Hongkong','XHKG','Asia/Hong_Kong','https://www.hkex.com.hk/Services/Trading/Securities/Overview/Trading-Mechanism?sc_lang=en','Przerwa obiadowa. Losowa aukcja zamknięcia kończy się między 16:08 a 16:10 HKT; w dni skrócone inaczej.'),
]
def build(year=None):
 year=year or date.today().year
 result={'generated_at':datetime.now(timezone.utc).isoformat(),'calendar_version':calendars.__version__,'start':f'{min(2026,year)}-01-01','end':f'{year+1}-12-31','markets':[]}
 for ident,name,code,tz,source,note in MARKETS:
  cal=calendars.get_calendar(code,start=result['start'],end=result['end'])
  sessions={}
  for day,row in cal.schedule.iterrows():
   sessions[day.strftime('%Y-%m-%d')]={k:(None if pd.isna(row[k]) else row[k].isoformat()) for k in ['open','break_start','break_end','close']}
  result['markets'].append({'id':ident,'name':name,'timezone':tz,'source':source,'note':note,'sessions':sessions})
 target=ROOT/'docs/data/calendar.json';tmp=target.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8');tmp.replace(target)
 print('Generated',len(result['markets']),'market calendars:',result['start'],result['end'])
if __name__=='__main__':build()
