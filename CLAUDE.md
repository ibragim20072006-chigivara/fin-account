# fin-account · Карьер-менеджер

Учёт первичных документов карьера: съёмка → распознавание ИИ → проверка в веб-очереди → выгрузка в учёт .xlsx → отчёты ОПиУ/ДДС.

## Стек
- Frontend: React + Vite в `web/` (без UI-фреймворка, стили в `web/src/styles.css` с токенами из дизайн-хэндоффа)
- Python + openpyxl в `src/` — выгрузка .xlsx по маппингу «шаблон_учёт.xlsx»

## Структура
- `web/src/data.js` — мок-данные (модель: Document, Line, Category, ExportTemplate)
- `web/src/state.jsx` — стор (React context) и действия
- `web/src/screens/` — экраны: Queue, Reports, Categories, Templates, Settings + mobile/
- `src/export_xlsx.py`, `src/main.py` — выгрузка; `main.py` читает вход из `data/documents.json` (`py src/main.py`)
- `data/`, `output/` — в .gitignore

## Запуск
- Веб: `cd web && npm run dev`
- Python: `py src/main.py` (на машине рабочий интерпретатор — `py`, не `python`)

## Конвенции
- Дизайн-референс: пакет design_handoff_karier_manager (hi-fi, 9 экранов) — при правках UI сверяться с токенами
- Мобильная версия — адаптив того же приложения (breakpoint 768px), не отдельный код

## Ветки
- `main` — стабильная версия
- `feat/<название>` — новые функции
- `fix/<название>` — исправления
