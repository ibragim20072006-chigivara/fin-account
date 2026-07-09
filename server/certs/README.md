# Сертификаты для доверия GigaChat (Сбер)

Node по умолчанию не доверяет корню НУЦ Минцифры, которым подписаны endpoints Сбера
(`gigachat.devices.sberbank.ru`, `ngw.devices.sberbank.ru`). Без этого запросы падают с
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` / `SELF_SIGNED_CERT_IN_CHAIN`.

## Что сделать
1. Скачать корневые сертификаты Минцифры (Russian Trusted Root CA + Sub CA), например с
   gosuslugi.ru (раздел «Национальный удостоверяющий центр») или из документации GigaChat.
2. Склеить их в один файл `russian_trusted_ca.pem` (оба сертификата в PEM, друг за другом) и
   положить рядом с этим README.
3. Указать Node на него переменной окружения процесса:
   - локально: `set NODE_EXTRA_CA_CERTS=./certs/russian_trusted_ca.pem` перед `npm start`;
   - служба на сервере: добавить в WinSW `.xml` службы `karier`:
     `<env name="NODE_EXTRA_CA_CERTS" value="C:\Users\pi\fin-account\server\certs\russian_trusted_ca.pem"/>`

`NODE_EXTRA_CA_CERTS` читается при старте процесса — задавать нужно ДО запуска Node
(поэтому именно как переменная окружения службы/оболочки, а не через `.env`).
