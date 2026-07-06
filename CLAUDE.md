# fin-account · Карьер-менеджер

Учёт первичных документов карьера: съёмка → распознавание ИИ → проверка в веб-очереди → скачивание выгрузки CSV → отчёты ОПиУ/ДДС. Доступ по ролям (наблюдатель/редактор/администратор).

## Стек
- Frontend: React + Vite в `web/` (без UI-фреймворка, стили в `web/src/styles.css` с токенами из дизайн-хэндоффа)
- Python + openpyxl в `src/` — выгрузка .xlsx по маппингу «шаблон_учёт.xlsx»

## Структура
- `web/src/data.js` — стартовое состояние (пустое: без демо-данных) + `EXPORT_COLUMNS` (схема CSV) и `ROLES`
- `web/src/state.jsx` — стор (React context), действия, `computeReports` (отчёты агрегируются из отгруженных документов)
- `web/src/auth.js` — пользователи/сессия в localStorage; `web/src/export.js` — CSV-выгрузка
- `web/src/screens/` — экраны: Register, Queue, Reports, Categories, Templates, Settings + mobile/
- `src/export_xlsx.py`, `src/main.py` — выгрузка; `main.py` читает вход из `data/documents.json` (`py src/main.py`)
- `data/`, `output/` — в .gitignore

## Пользователи и роли
- Роли (`web/src/data.js` → `ROLES`): `viewer` (просмотр), `editor` (+редактирование), `admin` (+управление пользователями). Гейтинг через `canEdit`/`isAdmin` из стора.
- Первый зарегистрированный пользователь — всегда `admin`. Нет сессии → рендерится `Register`.
- Выгрузка — только скачивание CSV (без почты/Telegram).

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
