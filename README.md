# Notatnik inwestora

Projekt `CODEX-13-strefa-inwestorow`, katalog `C:\Users\annac\.phvm\CODEX\CODEX-13-strefa-inwestorow`. Rejestr: `C:\Users\annac\.phvm\PROJECTS.md`.

Repozytorium: https://github.com/7eot4/CODEX-13-strefa-inwestorow

Blog: https://7eot4.github.io/CODEX-13-strefa-inwestorow/

Publikacja pełnych tekstów opiera się na potwierdzeniu użytkownika, że posiada zgodę obejmującą automatyczne publikowanie materiałów Strefy Inwestorów. Dokumentu licencyjnego nie sprawdzono. Praw do źródłowych artykułów nie udzielamy odbiorcom repozytorium. Po zmianach: testy, commit, push, weryfikacja Actions i publicznych plików.

## Korzystanie

Sekcje, filtry spółek/dat/rodzaju, pełne teksty, lokalne zakładki i eksport publicznego JSON. Import portfela CSV/TSV/XLSX (do 5 MB) działa wyłącznie lokalnie: zapisuje nazwy, tickery i ISIN, bez ilości, cen, sald i rachunków. Plik nie opuszcza urządzenia. Eksport bieżących pozycji, nie historii transakcji; nazwy można poprawić przed zapisaniem. Nie obsługujemy PDF/starego XLS. Nie potwierdzono adaptera rzeczywistym eksportem brokera. ExcelJS 4.4.0 jest hostowany lokalnie z licencją MIT. Nie ma synchronizacji między urządzeniami.

Karty są pokazywane po 40, z przyciskiem kolejnych; wyszukiwanie obejmuje całą bazę. W rozwijanej kolejce pokazujemy tytuły i odnośniki wszystkich wykrytych tekstów oczekujących na kopię.

„Włącz lokalne AI” pobiera multilingual-e5-small (około 118 MB), tokenizer (17 MB) i silnik (27 MB), bez API i opłat za zapytania. Model jest przypięty do wersji w ai-config.json. Zapytania są przetwarzane lokalnie; Hugging Face otrzymuje zwykłe dane połączenia przy pobieraniu plików. AI porównuje tytuły, podsumowania i nagłówki; wyszukiwanie słowami obejmuje pełny tekst. Pokazujemy maksymalnie 30 wyników AI po filtrach.

Podsumowania 2–3 zdania są wyborem istotnych zdań z tekstu według reguł. Skale znaczenia tematu i potencjału reakcji kursu 0–100 nie oznaczają procentu zmiany, prawdopodobieństwa ani kierunku kursu. Bez cen i konsensusu pewność jest niska; przesłanki i źródła profili powiązanych spółek są rozwijane na karcie. To narzędzie badania wiadomości, nie rekomendacja kupna. Daty pokazują czas źródła; brak czasu jest oznaczony.

Własne ilustracje tematyczne w docs/images, generowane przez scripts/build-artwork.py. Nie przedstawiają rzeczywistych zdarzeń lub wykresów. Animacje mierników działają tylko dla widocznych elementów i respektują zmniejszony ruch.

## Pulpit giełdowy

Kalendarz sesji akcji: GPW, NYSE Tape A, Nasdaq, Xetra, Londyn, Tokio i Hongkong. Wybór dnia pokazuje godziny w Polsce i lokalnie. Status teraz i odliczanie są niezależne od wybranego dnia, odświeżane co 30 sekund przy otwartej stronie. Uwzględniamy weekendy, święta, skrócone sesje, przerwy azjatyckie oraz różne zmiany czasu w Europie/USA. Awaryjnych wstrzymań i zawieszeń instrumentu nie wykrywamy. Sesja główna nie obejmuje wszystkich godzin dostępnych u brokera; aukcje i rozszerzenia opisują notatki i źródła giełd.

Kalendarz od 2026 do końca kolejnego roku generuje scripts/build-calendar.py z exchange_calendars 4.13.2. Źródła pierwotne są przy każdym rynku w docs/data/calendar.json. Testy obejmują święta GPW 2026, USA, skróconą sesję o 13:00 ET, różne zmiany czasu oraz przerwę w Tokio. Poza zakresem kalendarza status nie jest potwierdzony.

Widżet TradingView pokazuje stały publiczny zestaw indeksów i spółek. GPW i Xetra: EOD, po zakończeniu sesji, nie bieżące kursy. Inne rynki według oznaczenia dostawcy. Osobna domena widżetu nie może czytać lokalnego portfela; prywatne tickery i plik nie są przekazywane. Danych nie kopiujemy do repozytorium ani nie eksportujemy. Blokada skryptów lub awaria dostawcy może wyłączyć notowania. Dokumentacja: https://www.tradingview.com/widget-docs/markets/ oraz https://www.tradingview.com/widget-docs/faq/data/ .

Decyzja użytkownika 2026-10-11: darmowe widżety obecnie; indywidualny monitoring kursów portfela i alerty do dalszego rozwiązania po uzyskaniu źródła danych z prawem do publikacji wspólnej bazy. Import portfela służy obecnie filtrowaniu artykułów, nie cen.

## Pełny zakres nowych artykułów

Zbieranie nie stosuje filtra branż ani ograniczenia do wybranych prefiksów artykułów. Globalny RSS wydawcy, strona główna i listy działów są sprawdzane co 30 minut (17,47 * * * *, UTC; Actions może opóźnić lub pominąć uruchomienie). Dodajemy też blogi, edukację, analizy, podcasty i czaty z dostępnym tekstem. Nawigacja, notowania i pliki nie są artykułami; datę i korpus potwierdzamy na stronie. Nie omijamy logowania/płatnego dostępu, nie archiwizujemy zdjęć i nie transkrybujemy filmów.

Limity: 60 stron list i 80 tekstów na przebieg. Niedokończone strony pozostają w discovery_pending, teksty w pending; kolejne przebiegi kontynuują pracę. Paginacja kończy się na liście bez nieznanych adresów. Nowe odkrycia mają priorytet nad wcześniejszą kolejką; nieudane pobrania są ponawiane z niższym priorytetem. Jedna awaria nie usuwa zapisanych tekstów. Brak wszystkich źródeł pozostawia bazę bez zmian.

Pełny zakres oznacza brak selekcji tematycznej dla rozpoznanych publikacji; nie jest bezwarunkową gwarancją przechwycenia każdego adresu ani kompletnym historycznym zrzutem serwisu. Źródło może ukryć/usunąć publikację między odczytami; struktura strony może się zmienić. Kolejki i błędy są widoczne na blogu. Sekcje wybierają reguły z docs/data/topics.json; jeden tekst może mieć kilka sekcji.

Wysłanie kodu publikuje ostatnią zapisaną bazę po testach bez pobierania artykułów. Pobieranie wykonuje harmonogram i ręczne uruchomienie Actions → Update archive and publish → Run workflow. W publicznych repozytoriach harmonogram może zostać wyłączony po 60 dniach braku aktywności.

## Uruchomienie i weryfikacja

Python 3.12+: python -m pip install -r requirements.txt, następnie python scripts/update.py i python scripts/build-calendar.py.

Node 24: npm ci --ignore-scripts, npm run build:search; npm run build:client odtwarza lokalny silnik AI. Licencje bibliotek są w docs/vendor.

Testy: python -m unittest discover -s tests -v oraz npm test. Obejmują kolektor/RSS/paginację, analizę, wyszukiwanie, prywatny import CSV/XLSX, UI, kalendarz i izolację portfela od widżetu. Rzeczywisty model i WASM sprawdzono osobno. Pełny widok i rzeczywiste wartości w zewnętrznym widżecie nie zostały sprawdzone w przeglądarce w tej sesji.
