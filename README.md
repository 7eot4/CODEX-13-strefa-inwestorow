# Notatnik inwestora

Archiwum pełnych skrótów wiadomości ze Strefy Inwestorów. Zapisuje treści, sekcje, autorów, daty, adresy źródłowe i czas zapisu. Publikacja opiera się na potwierdzeniu użytkownika z 2026-10-06: posiada zgodę obejmującą automatyczną publikację pełnych tekstów. Nie zweryfikowano dokumentu licencyjnego. Prawa do źródłowych artykułów nie są udzielane odbiorcom przez to repozytorium.

## Użytkowanie

Strona: `docs/index.html` przez serwer HTTP. Filtrowanie po miesiącu i tytułach, czytanie zapisanych pełnych tekstów w `read.html`, lista do przeczytania w przeglądarce, eksport bazy JSON. Nie ma konta ani synchronizacji zakładek między urządzeniami.

## Aktualizacja

`python scripts/update.py` — Python 3.12+, bez dodatkowych bibliotek.

Kolektor sprawdza stronę główną i `/wiadomosci`, respektuje robots.txt, odrzuca obce domeny, usuwa duplikaty i zachowuje wcześniejsze wpisy. Pobiera publiczną treść skrótów bez reklam, skryptów i obrazów, zachowując akapity oraz nagłówki sekcji. Ostatnie dostępne skróty są ponownie odczytywane dla korekt. Nie omija logowania ani płatnego dostępu. Awaria, niekompletna treść lub brak rozpoznanych skrótów zatrzymuje publikację i zachowuje poprzednią bazę. Zmiana struktury serwisu może wymagać poprawy kolektora. Wpisy pominięte między odczytami nie są gwarantowane; należy monitorować zakres listy źródłowej.

GitHub Actions: `17 */2 * * *` (UTC), trwały zapis w repozytorium i publikacja GitHub Pages. GitHub może opóźnić lub pominąć zaplanowany przebieg; w publicznych repozytoriach wyłącza harmonogram po 60 dniach braku aktywności. Status aktualności jest widoczny na stronie. Ręczne uruchomienie: Actions → Update archive and publish → Run workflow.

## Uruchomienie GitHub

Po zatwierdzeniu publikacji: utworzyć repozytorium, wysłać gałąź `main`, ustawić Pages → Source → GitHub Actions. Zweryfikować udany przebieg i opublikowany plik `data/archive.json`.

## Weryfikacja

`python -m unittest discover -s tests -v`

`node --check docs/app.js`

Indywidualne artykuły poza skrótami wiadomości pozostają etapem późniejszym, zgodnie z zakresem użytkownika. Obecny kolektor celowo zbiera tylko skróty wiadomości.
