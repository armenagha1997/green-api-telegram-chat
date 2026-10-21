# Фикстуры ответов GREEN-API (Telegram-инстанс)

Сохранять реальные ответы API сюда как `*.json`, без `apiTokenInstance` внутри (если он случайно попал в URL
в скриншоте/логе — вырезать). Источник — кнопка **Test** в консоли (`API` → метод → Test) или вызовы из браузера.

## Список фикстур и порядок вызова

1. `getStateInstance.json` — `GET {apiUrl}/waInstance{idInstance}/getStateInstance/{apiTokenInstance}`
   Сначала в состоянии `notAuthorized`, затем повторить после сканирования QR — ожидаем `authorized`.
2. `checkAccount.json` — `POST {apiUrl}/waInstance{idInstance}/checkAccount/{apiTokenInstance}`
   Тело: `{ "phoneNumber": <номер получателя без +, цифрами> }`. Вызывать только после авторизации.
3. `sendMessage.json` — `POST {apiUrl}/waInstance{idInstance}/sendMessage/{apiTokenInstance}`
   Тело: `{ "chatId": "<chatId из checkAccount>", "message": "Тестовое сообщение" }`.
4. Ответить тестовым сообщением с телефона получателя.
5. `receiveNotification.json` — `GET {apiUrl}/waInstance{idInstance}/receiveNotification/{apiTokenInstance}?receiveTimeout=20`
   Сохранить именно входящее `incomingMessageReceived` с текстом.
6. `deleteNotification.json` — `DELETE {apiUrl}/waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`
   `receiptId` — из ответа шага 5.

## Проверка CORS из браузера

Открыть любую страницу (например https://example.com), в DevTools Console выполнить (подставив свои
`apiUrl`/`idInstance`/`apiTokenInstance`):

```js
fetch('https://4100.api.green-api.com/waInstance410022776184/getStateInstance/<apiTokenInstance>')
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error)
```

Если запрос прошёл без ошибки CORS — апишка доступна напрямую из фронтенда, Vite proxy не нужен. Результат
записать в CLAUDE.md, раздел «Решения после этапа 0».
