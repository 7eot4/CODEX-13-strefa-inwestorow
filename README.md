# Notatnik inwestora

Projekt: `CODEX-13-strefa-inwestorow` (CODEX, numer 13). Katalog lokalny: `C:\Users\annac\.phvm\CODEX\CODEX-13-strefa-inwestorow`. Wpis w rejestrze: `C:\Users\annac\.phvm\PROJECTS.md`.

Repozytorium: https://github.com/7eot4/CODEX-13-strefa-inwestorow

Opublikowany blog: https://7eot4.github.io/CODEX-13-strefa-inwestorow/

Po zmianach projektu: wykonać adekwatną weryfikację, commit i push do repozytorium, potwierdzić aktualny stan na GitHub oraz wynik publikacji. Automatyczne aktualizacje bazy wykonują te operacje przez GitHub Actions co 2 godziny.

Archiwum pełnych skrótów wiadomości oraz artykułów o firmach i zagadnieniach inwestycyjnych ze Strefy Inwestorów. Zapisuje treści, sekcje, autorów, daty, adresy źródłowe i czas zapisu. Publikacja opiera się na potwierdzeniu użytkownika z 2026-10-06: posiada zgodę obejmującą automatyczną publikację pełnych tekstów. Nie zweryfikowano dokumentu licencyjnego. Prawa do źródłowych artykułów nie są udzielane odbiorcom przez to repozytorium.

## Użytkowanie

Strona: `docs/index.html` przez serwer HTTP. Sekcje tematyczne, filtry firmy/miesiąca/rodzaju tekstu, wyszukiwanie w treści, czytanie pełnych tekstów w `read.html`, lista do przeczytania i eksport publicznej bazy JSON. Nie ma konta ani synchronizacji zakładek między urządzeniami.

## Sekcje i reguły

`docs/data/topics.json` jest wspólnym źródłem reguł. Sekcje: skróty dnia, makroekonomia i rynki, banki i finanse, energia i surowce, technologie i gaming, przemysł i infrastruktura, handel i konsumpcja, nieruchomości oraz pozostałe wiadomości i spółki.

Nazwy firm, słowa tematyczne i ścieżki działów dopasowuje `scripts/topics.py`. Dla indywidualnego artykułu sekcje wynikają z tytułu, pierwszego akapitu i działu źródłowego; firmy są także rozpoznawane w pełnej treści. Skróty dnia mają wiele sekcji według całej treści. Dopasowanie respektuje granice słów i ignoruje wielkość liter oraz polskie znaki. Wpis może należeć do wielu sekcji. Reguły są przybliżeniem tematu, nie oceną inwestycyjną. Karta artykułu pokazuje przyczyny dopasowania.

## Lokalny import portfela

Na stronie rozwiń „Import portfela z konta maklerskiego”, wybierz plik aktualnych pozycji CSV/TSV/XLSX (maksymalnie 5 MB), sprawdź nazwy w podglądzie, popraw kody na nazwy firm w razie potrzeby i zapisz. Wybierz „Mój portfel”, aby zobaczyć artykuły z dopasowanymi spółkami. Filtr łączy się z sekcją, miesiącem i rodzajem tekstu.

CSV: rozdzielacz przecinek, średnik lub tabulator; UTF-8, UTF-16LE lub Windows-1250. XLSX: pierwszy rozpoznany arkusz wśród pierwszych pięciu. Kolumny Nazwa/Instrument/Walor, Ticker/Symbol, ISIN; obsługiwane są także podstawowe angielskie nazwy. Nie ma dedykowanego adaptera potwierdzonego prawdziwym plikiem konkretnego brokera. PDF i stary XLS nie są obsługiwane. Import historii transakcji nie rekonstruuje portfela — potrzebny jest eksport bieżących pozycji. Instrumenty bez nazwy wymagają jej dopisania; ISIN sam nie występuje zazwyczaj w tekstach.

Plik nie jest wysyłany na serwer. Lokalna pamięć przeglądarki przechowuje tylko nazwę, ticker i ISIN. Ilości, ceny, saldo, wartość pozycji, numer rachunku i nazwa pliku nie są zapisywane. Dopasowanie odbywa się lokalnie w pełnych tekstach wspólnej bazy; GitHub Actions nie zna prywatnej listy firm. Usunięcie listy jest dostępne na stronie. Portfel nie synchronizuje się między urządzeniami. Publiczna baza i jej eksport nie zawierają danych portfela.

Biblioteka XLSX: lokalnie hostowany ExcelJS 4.4.0, licencja MIT w `docs/vendor/exceljs.LICENSE`. Nie jest pobierana z CDN podczas importu.

## Aktualizacja

`python scripts/update.py` — Python 3.12+, bez dodatkowych bibliotek.

Kolektor sprawdza osiem list źródłowych z konfiguracji (strona główna, dwie strony wiadomości i działy tematyczne), respektuje robots.txt, odrzuca obce domeny, usuwa duplikaty i zachowuje wcześniejsze wpisy. Pobiera publiczną treść bez reklam i skryptów, zachowując akapity, nagłówki i tekst tabel. Nie archiwizuje obrazów. Ostatnie dostępne skróty są ponownie odczytywane dla korekt. Nie omija logowania ani płatnego dostępu.

Nowe teksty są zapisywane po potwierdzeniu daty i minimalnej treści. Maksymalnie 80 pobrań na przebieg; reszta pozostaje w trwałej kolejce `pending` do kolejnych odczytów. Nieudane pobrania są ponawiane z niższym priorytetem, bez blokowania innych nowych artykułów. Pojedynczy błąd zostawia poprzedni tekst i jest raportowany w `warnings`; awaria odkrywania wszystkich źródeł pozostawia bazę bez zmian. Wskaźnik strony rozróżnia aktualizację częściową i przeterminowaną. Monitoring obejmuje wpisy widoczne na skonfigurowanych listach, nie całą historię serwisu; między odczytami mogą wystąpić pominięcia. Zmiana struktury źródła może wymagać poprawy kolektora.

GitHub Actions: `17 */2 * * *` (UTC), trwały zapis w repozytorium i publikacja GitHub Pages. GitHub może opóźnić lub pominąć zaplanowany przebieg; w publicznych repozytoriach wyłącza harmonogram po 60 dniach braku aktywności. Status aktualności jest widoczny na stronie. Ręczne uruchomienie: Actions → Update archive and publish → Run workflow.

## Uruchomienie GitHub

Po zatwierdzeniu publikacji: utworzyć repozytorium, wysłać gałąź `main`, ustawić Pages → Source → GitHub Actions. Zweryfikować udany przebieg i opublikowany plik `data/archive.json`.

## Weryfikacja

`python -m unittest discover -s tests -v`

`node --check docs/app.js`

`npm ci --ignore-scripts && npm test` — testy filtrów sekcji i spółek, przeglądarkowej biblioteki XLSX, importu lokalnego, wykluczenia danych finansowych i dopasowania portfela. Przykłady brokerów są wyłącznie syntetyczne. Nie zweryfikowano rzeczywistego eksportu użytkownika ani wyglądu w przeglądarce.

Testy uruchamiają się również w GitHub Actions przed odczytem źródeł i publikacją.
