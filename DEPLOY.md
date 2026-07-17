# Развёртывание на Windows-сервере (доступ из интернета)

Приложение работает **одним процессом**: сервер на Node отдаёт и веб-интерфейс, и API,
данные — в базе SQLite (`server/data.db`). Ниже — по шагам на сервере (через AnyDesk).

## 1. Перенести проект на сервер
Проще всего через GitHub:
```
git clone <адрес-репозитория> fin-account
cd fin-account
```
Либо передать папку .zip через панель файлов AnyDesk (без `node_modules`, `web/dist`, `server/data.db`).

## 2. Установить Node.js
Скачать LTS-установщик с https://nodejs.org и установить. Проверка:
```
node -v
```
Нужен Node 22+ (используется встроенный SQLite `node:sqlite`).

## 3. Собрать фронт и поставить зависимости сервера
```
cd web
npm ci
npm run build
cd ../server
npm ci
```

## 4. Настроить сервер (опционально)
Создать `server/.env`:
```
PORT=3001
```
При первом запуске создаётся пустая база `server/data.db`. Первый, кто откроет сайт и
зарегистрируется, становится **администратором**; остальных заводит он в «Настройках».

## 5. Автозапуск как службы Windows
Чтобы работало после перезагрузки и без залогиненного пользователя — **PM2**:
```
npm i -g pm2 pm2-windows-startup
cd server
pm2 start "node --experimental-sqlite src/index.js" --name karier
pm2 save
pm2-startup install
```
Альтернатива — **NSSM** (`nssm install karier` → путь к `node.exe`, аргументы
`--experimental-sqlite C:\...\server\src\index.js`, рабочая папка `server`).

## 6. Доступ из интернета + HTTPS
Пароли ходят по сети — **HTTPS обязателен**. Используется **Tailscale Funnel** —
постоянный публичный HTTPS-адрес без домена, проброса портов и Cloudflare (Tailscale
на сервере уже стоит). Один раз включить Funnel в консоли `login.tailscale.com`
(DNS: MagicDNS + HTTPS Certificates; и подтвердить Funnel для ноды), затем на сервере:
```
tailscale funnel --bg 3001
```
Публичный адрес: `https://<имя-ноды>.<tailnet>.ts.net` (сейчас
`https://desktop-qr005ls.taild384de.ts.net`). Конфиг persists в tailscaled и поднимается
сам при старте службы, адрес постоянный. Отключить: `tailscale funnel --https=443 off`.

Альтернативы: Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:3001` даёт
эфемерный `*.trycloudflare.com`; постоянный — именованный туннель с доменом) либо проброс
порта + обратный прокси с авто-HTTPS (**Caddy**: `reverse_proxy localhost:3001`).

## 7. Брандмауэр
- С Tailscale Funnel / Cloudflare Tunnel наружу порт открывать **не нужно** (сервер наружу закрыт).
- При прямом доступе — открыть в брандмауэре Windows порт прокси/приложения.

> Сервер настроен на работу за локальным прокси (`trust proxy = loopback`): реальный IP
> клиента берётся из `X-Forwarded-For`, который проставляет Funnel/cloudflared/Caddy. Если
> открывать порт напрямую в интернет (без прокси) — этот заголовок можно подделать,
> так что прямой доступ без прокси не рекомендуется.

## Обновление версии
```
git pull
cd web && npm ci && npm run build
cd ../server && npm ci
pm2 restart karier
```

## Бэкапы
Вся база — файл `server/data.db` (+ `-wal`/`-shm`). Периодически копируйте его.

## Распознавание фото документов (Gemini / GigaChat)
Кнопки «сфотографировать» (десктоп «Очередь») и камера в мобильной «Съёмке» шлют фото на
`POST /api/recognize`, сервер распознаёт его и возвращает документ в формате «+ документ».
Фото не сохраняется. Провайдер выбирается в `server/.env` через `RECOGNIZE_PROVIDER`
(`gemini` — по умолчанию, `gigachat` — резерв).

### Gemini (основной)
1. Получить ключ: aistudio.google.com → «Get API key».
2. В `server/.env`: `RECOGNIZE_PROVIDER=gemini`, `GEMINI_API_KEY`; при необходимости
   `GEMINI_MODEL` (default `gemini-3.1-flash-lite` — стабильна на бесплатном тарифе). Топовые
   flash/pro часто отдают 503 (перегрузка) или 429 (квота), а снятые с публикации — 404
   «no longer available». Список доступных на ключе: `GET /v1beta/models` с `x-goog-api-key`.
3. Из РФ до `generativelanguage.googleapis.com` напрямую не достучаться — нужен VPN/прокси на
   самой машине сервера. Через прокси можно завернуть, указав `GEMINI_BASE_URL`.

### GigaChat (резерв, `RECOGNIZE_PROVIDER=gigachat`)
1. developers.sber.ru → проект «GigaChat API» → **Authorization key** и scope
   (`GIGACHAT_API_PERS` — физлица, бесплатный лимит; `GIGACHAT_API_B2B` — юрлица, платно).
2. В `server/.env`: `GIGACHAT_AUTH_KEY`, `GIGACHAT_SCOPE`, `GIGACHAT_MODEL` (см. `.env.example`).
3. Доверие к сертификатам Сбера: PEM корней Минцифры в `server/certs/` + `NODE_EXTRA_CA_CERTS`
   (см. `server/certs/README.md`) — как переменную окружения службы (в WinSW `.xml` через
   `<env>`), т.к. читается до старта Node.

Без ключа выбранного провайдера распознавание вернёт 503, ручной ввод «+ документ» остаётся доступен.

## Безопасность (кратко)
- Только HTTPS наружу (туннель/прокси).
- Пароли хешируются `scrypt`; регистрация после первого пользователя закрыта.
- Файл `server/data.db` и `server/.env` не коммитить (уже в .gitignore).
