# fin-account · Карьер-менеджер

Учёт первичных документов карьера: съёмка → распознавание ИИ → проверка в веб-очереди → скачивание выгрузки CSV → отчёты ОПиУ/ДДС. Доступ по ролям (наблюдатель/редактор/администратор).

## Стек
- Frontend: React + Vite в `web/` (без UI-фреймворка, стили в `web/src/styles.css` с токенами из дизайн-хэндоффа)
- Backend: Node + Express + SQLite в `server/` (встроенный `node:sqlite`) — авторизация и хранение данных, раздаёт и API, и `web/dist` одним процессом
- Python + openpyxl в `src/` — отдельная утилита .xlsx-выгрузки

## Структура
- `web/src/api.js` — клиент бэкенда (токен в localStorage `km_token`, методы auth/users/данные) + `initials`, `newId`
- `web/src/state.jsx` — стор (React context): загрузка данных с сервера при входе, дебаунс-сохранение (`api.put*`), `computeReports`
- `web/src/data.js` — `EXPORT_COLUMNS` (фикс. столбцы CSV-отчёта), `ROLES`; `web/src/export.js`/`import.js` — CSV
- `web/src/screens/` — экраны: Register, Queue, Reports, Categories, Settings, Guide + mobile/
- `server/src/` — `db.js` (схема+сид), `auth.js` (scrypt, сессии, middleware ролей), `index.js` (роуты + статика)
- `src/export_xlsx.py`, `src/main.py` — Python-выгрузка (`py src/main.py`)
- `data/`, `output/`, `server/data.db` — в .gitignore

## Пользователи, роли, хранение
- Роли (`ROLES` в data.js и в `server/src/auth.js`): `viewer`/`editor`/`admin`. Гейтинг на клиенте (`canEdit`/`isAdmin`) и на сервере (`requireEditor`/`requireAdmin`).
- Регистрация — только «бутстрап» первого пользователя (→ `admin`); дальше закрыта, пользователей заводит админ в «Настройках» (логин+пароль+роль).
- Данные (документы/категории/пользователи) — в `server/data.db`, общие; сессия по токену переживает перезагрузку. Выгрузка — фиксированный CSV-отчёт (без настраиваемых шаблонов).

## Запуск
- Один процесс: `cd web && npm run build`, затем `cd server && npm start` → http://localhost:3001
- Развёртывание на сервер (из интернета): `DEPLOY.md`
- Python: `py src/main.py`

## Конвенции
- Дизайн-референс: пакет design_handoff_karier_manager (hi-fi, 9 экранов) — при правках UI сверяться с токенами
- Мобильная версия — адаптив того же приложения (breakpoint 768px), не отдельный код
