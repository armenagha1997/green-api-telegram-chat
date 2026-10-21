# Telegram Chat — тестовое задание GREEN-API (Frontend React)

> Положи этот файл в корень репозитория как `CLAUDE.md` — Claude Code будет читать его автоматически.
> Дальше выполняй этапы из раздела «Пошаговый план» по одному, копируя промпт этапа в Claude Code.
>
> **Смена мессенджера:** исходное ТЗ ориентировано на MAX, но инстанс MAX создать не удалось — согласно
> разделу 3 ТЗ («Запасной вариант»), используется **Telegram**-инстанс GREEN-API. Архитектура и требования
> из ТЗ (SendMessage, HTTP API вместо вебхуков, только текст) полностью переносятся — различается только
> раздел 3 (детали конкретного мессенджера). Это объяснить в README.

## 1. Суть задания

Веб-интерфейс чата для отправки и получения **текстовых** сообщений в мессенджере **Telegram** через **GREEN-API**.
Внешний вид — по мотивам веб-клиента Telegram (web.telegram.org). Максимально просто, минимум функций. Срок — 5 дней.

**Пользовательский сценарий (критерий приёмки):**

1. Пользователь открывает сайт и вводит `idInstance` и `apiTokenInstance` из GREEN-API.
2. Вводит номер телефона получателя и создаёт новый чат.
3. Пишет текстовое сообщение и отправляет его в Telegram.
4. Получатель отвечает в Telegram.
5. Пользователь видит ответ в чате.

**Жёсткие требования:**

- Отправка — строго методом `SendMessage`.
- Получение — строго технологией HTTP API (`ReceiveNotification` + `DeleteNotification`), НЕ вебхуки.
- Только текстовые сообщения.
- React.

**Что сдаём на hr@green-api.com** (тема: «Тестовое задание на должность - Фронтенд разработчик React»):
резюме PDF (+ Telegram), ссылка на GitHub, инструкция локального запуска (README), ссылка на задеплоенный сервис (желательно), скриншоты/видео, предпочтительный формат работы (удалёнка / Химки / Астана).

## 2. Стек (только то, что есть в резюме)

| Задача                   | Инструмент                                                |
| ------------------------ | --------------------------------------------------------- |
| UI                       | React 18 + TypeScript (strict)                            |
| Сборка                   | Vite (`react-ts` шаблон)                                  |
| Состояние                | **MobX** + `mobx-react-lite`                              |
| HTTP                     | **Axios** — типизированный API-слой (typed API contracts) |
| Формы и валидация        | **React Hook Form** + **Zod** (`@hookform/resolvers`)     |
| Стили                    | **SASS + CSS Modules**                                    |
| Даты                     | **date-fns** (время сообщений)                            |
| Компоненты (опционально) | **Storybook** для MessageBubble / ChatListItem            |
| Инфраструктура           | Git, **Docker** (nginx для прод-сборки)                   |

**Не добавлять:** Tailwind, UI-киты (MUI/AntD), Redux, React Query, бэкенд. Это чистый фронтенд.

## 3. GREEN-API (Telegram) — сверено с документацией green-api.com/en/telegram/docs

Базовый URL: `{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}`
`apiUrl` берётся из личного кабинета console.green-api.com (у каждого инстанса свой хост). Префикс URL
исторически называется `waInstance` для всех типов инстансов (WhatsApp/Telegram/MAX), это не ошибка.

### Отправка — SendMessage

`POST {apiUrl}/waInstance{idInstance}/sendMessage/{apiTokenInstance}`

```json
{ "chatId": "10000000", "message": "Текст" }
```

Ответ: `{ "idMessage": "1763115112345" }`. Лимит текста — **4096** символов (у MAX/WhatsApp в черновике ТЗ был 4000 — для Telegram используем реальный лимит 4096).

### Получение — HTTP API

1. `GET {apiUrl}/waInstance{idInstance}/receiveNotification/{apiTokenInstance}?receiveTimeout=20`
   (long polling, 5–60 сек; при отсутствии уведомлений тело ответа — `null`)
2. После обработки: `DELETE {apiUrl}/waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`
   — **удалять ЛЮБОЕ уведомление**, даже неинтересное, иначе очередь встанет (FIFO).

Пример входящего текста (реальная форма ответа для Telegram-инстанса, source: green-api.com/en/telegram/docs/api/receiving/notifications-format/incoming-message/TextMessage):

```json
{
  "receiptId": 1234567,
  "body": {
    "typeWebhook": "incomingMessageReceived",
    "instanceData": {
      "idInstance": 4100000000,
      "wid": "79876543210@c.us",
      "typeInstance": "telegram"
    },
    "timestamp": 1763115112,
    "idMessage": "1763115112345",
    "senderData": {
      "chatId": "10000000",
      "chatType": "user",
      "sender": "10000000",
      "chatName": "Имя",
      "senderName": "Имя",
      "senderType": "user"
    },
    "messageData": {
      "typeMessage": "textMessage",
      "textMessageData": {
        "textMessage": "Привет",
        "forwardingScore": 0,
        "isForwarded": false
      }
    }
  }
}
```

Обрабатываем `typeWebhook === "incomingMessageReceived"` и `messageData.typeMessage === "textMessage"`.
В отличие от WhatsApp, у Telegram **нет** `extendedTextMessage` — весь текст всегда в `textMessageData.textMessage`.
Поле `senderData.senderPhoneNumber` в Telegram-уведомлениях **отсутствует** (есть только у WhatsApp/MAX) — не
использовать его для матчинга, ориентироваться строго на `chatId`/`sender`. Остальные типы сообщений — просто
удаляем из очереди без обработки.

### ⚠️ Важная особенность Telegram: chatId ≠ номер телефона

- В Telegram `chatId` — числовая строка для личных чатов (`"10000000"`), группы — с минусом (`"-10000000000000"`); это не `79991234567@c.us`.
- **Решение:** при создании чата вызывать `CheckAccount` (`POST .../checkAccount/...`, тело `{ "phoneNumber": 79876543210 }`, ответ `{ "exist": true, "chatId": "10000000", "username": "@username", "phoneNumber": 79876543210, "fromCache": true }`) и хранить чат по `chatId`. Если `exist: false` — показать ошибку «номер не зарегистрирован в Telegram или скрыт настройками приватности».
- Фактический источник: green-api.com/en/telegram/docs/api/service/CheckAccount и .../api/chat-id.
- `CheckAccount` также поддерживает поиск по `username` — не используем, в ТЗ сценарий только по телефону.
- `CheckAccount` — вспомогательный метод; отправка и получение остаются строго `SendMessage` и HTTP API, как требует ТЗ. Объяснить это в README.
- `CheckAccount` дёргать умеренно: при частых повторных проверках одного и того же несуществующего номера Telegram может временно ограничить аккаунт (см. FAQ GREEN-API).

### ⚠️ Ограничения Telegram на первый контакт

По документации GREEN-API/Telegram:

- аккаунту-инстансу разрешено не более **~50 новых чатов с незнакомыми номерами в сутки** — после лимита новые `SendMessage` первому сообщению могут не доходить;
- если у получателя в настройках приватности «Кто может найти меня по номеру» стоит `Мои контакты` или `Никто» — `CheckAccount` не найдёт аккаунт, даже если он существует.

**Что это значит для теста:** получатель (второй аккаунт/друг) должен заранее добавить номер инстанса в контакты Telegram или написать ему первым, и выставить приватность «Все» для поиска по номеру. Иначе `CheckAccount`/`SendMessage` могут не сработать, несмотря на 200 OK.

- В UI: при `exist: false` или ошибке отправки показывать подсказку «Получатель должен добавить вас в контакты Telegram и разрешить поиск по номеру телефона».
- В README: описать это требование в разделе «Как протестировать».
- Фактический ответ `CheckAccount` для тестового номера — сохранить в `docs/fixtures/` на этапе 0.

### Запасной вариант: MAX / WhatsApp

Если Telegram тоже не заработает, ТЗ разрешает MAX или WhatsApp. Поэтому:

- Весь доступ к API — только через `src/api/greenApi.ts`; компоненты и сторы не знают про конкретный мессенджер.
- Формат URL у GREEN-API унифицирован (`/waInstance{id}/{method}/{token}`); различаются в основном `apiUrl` и формат `chatId` (WhatsApp: `79991234567@c.us`, Telegram и MAX: числовой ID через `CheckAccount`).
- Преобразование телефон → `chatId` вынести в одну функцию `resolveChatId(phone)`: для Telegram/MAX — через `CheckAccount`, для WhatsApp — `${digits}@c.us`.
- Переключатель мессенджера в UI не делать (лишняя функция) — достаточно, чтобы замена касалась одного модуля.

### Настройка инстанса (описать в README)

В кабинете: поле Webhook URL **пустое** (иначе `ReceiveNotification` вернёт 400), включить «Получать уведомления о входящих сообщениях».
Авторизация Telegram-инстанса — через QR-код: Telegram на телефоне → Настройки → Устройства → «Привязать десктопное устройство», затем в консоли GREEN-API нажать «Получить QR» и отсканировать (альтернатива — `StartAuthorization` по номеру телефона, но у Telegram код может не приходить; QR надёжнее).
Инстанс должен быть авторизован (статус `authorized`). Один инстанс = один Telegram-аккаунт (один номер).

## 4. Архитектура

```
src/
  api/
    greenApi.ts          # axios-инстанс + типизированные функции
    types.ts             # DTO: SendMessageReq/Res, Notification, CheckAccountRes …
  stores/
    RootStore.ts         # создаёт и связывает сторы, React Context + useStores()
    AuthStore.ts         # idInstance, apiTokenInstance, apiUrl; persist в localStorage
    ChatStore.ts         # чаты, сообщения, activeChatId, send()
    PollingStore.ts      # цикл receive → handle → delete, start/stop, AbortController
  schemas/
    login.ts, newChat.ts, message.ts   # Zod
  components/
    LoginForm/  Sidebar/  ChatListItem/  NewChatModal/
    ChatWindow/  MessageList/  MessageBubble/  MessageInput/  EmptyState/
  styles/
    _variables.scss  global.scss
  App.tsx  main.tsx
```

**Модели:**

```ts
type Message = {
  id: string // idMessage или временный uuid до ответа API
  chatId: string
  text: string
  direction: 'in' | 'out'
  timestamp: number // ms
  status: 'sending' | 'sent' | 'error'
}
type Chat = { chatId: string; phone: string; name?: string; messages: Message[]; unread: number }
```

**Принципы:**

- Компоненты — `observer`, бизнес-логика только в сторах.
- Отправка оптимистичная: сообщение сразу в списке со статусом `sending`, после ответа — `sent` + реальный `idMessage`, при ошибке — `error` с кнопкой «повторить».
- Polling: один активный цикл; запуск после логина, остановка при логауте/размонтировании; при сетевой ошибке — пауза 3–5 сек и продолжение; дедупликация по `idMessage`.
- Входящее от неизвестного `chatId` — автоматически создать чат в списке.
- Чаты и сообщения — в памяти (опционально localStorage). Креды — в localStorage с кнопкой «Выйти».
- Никаких секретов в коде и логах (`apiTokenInstance` не выводить в console).

## 5. UI (по мотивам web.telegram.org)

- Двухколоночный layout: слева сайдбар (шапка с кнопкой «Новый чат» и «Выйти», список чатов: аватар-инициалы, имя/телефон, последнее сообщение, время, бейдж непрочитанных), справа — окно чата.
- Окно чата: шапка с именем/номером, лента сообщений (исходящие справа, входящие слева, время через date-fns `HH:mm`, разделители по дням), поле ввода внизу (Enter — отправить, Shift+Enter — перенос строки), автоскролл к последнему.
- Пустое состояние справа: «Выберите чат или создайте новый».
- Экран входа: карточка по центру, два поля + опциональное поле `apiUrl`, ссылка на console.green-api.com.
- Цвета — светлая тема в духе Telegram: акцентный синий, сообщения-«пузыри» со скруглениями. Адаптив до ~360px (на мобиле сайдбар и чат — отдельные экраны).
- Не копировать логотипы и фирменные ассеты Telegram — только общий стиль.

## 6. Пошаговый план для Claude Code

Каждый этап — отдельный промпт и отдельный коммит. После каждого этапа: `npm run build` и `npm run lint` без ошибок.

**Этап 0 — Подготовка (вручную, до кода, ~1 час)**

- Зарегистрироваться на console.green-api.com, создать инстанс **Telegram** (тариф Developer бесплатный).
- Авторизовать инстанс: в Telegram на телефоне → Настройки → Устройства → «Привязать десктопное устройство», в консоли GREEN-API нажать «Получить QR» и отсканировать. Дождаться статуса `authorized`.
- Найти второй Telegram-аккаунт для роли получателя (друг/второй телефон). Получатель добавляет номер инстанса в контакты Telegram и/или выставляет приватность «Кто может найти меня по номеру» → «Все».
- Записать `apiUrl`, `idInstance`, `apiTokenInstance` в `.env.local` (шаблон — `.env.example`). Очистить Webhook URL, включить входящие уведомления.
- В кабинете (кнопка Test) по очереди вызвать и **сохранить ответы JSON** в `docs/fixtures/` (шаблоны и имена файлов — в `docs/fixtures/README.md`):
  `getStateInstance` → `checkAccount` (номер получателя) → `sendMessage` → ответить с телефона → `receiveNotification` → `deleteNotification`.
- Проверить CORS: в консоли браузера на любой странице выполнить запрос из `docs/fixtures/README.md`. Результат записать в раздел «Решения» ниже.
- Сделать 3 скриншота web.telegram.org (список чатов, открытый чат, пустое состояние) → `docs/design/`.
- Если Telegram тоже не работает — создать инстанс WhatsApp/MAX и пройти то же самое.
- Создать GitHub-репозиторий, положить туда `CLAUDE.md`, `.env.example`, `.gitignore`, папку `docs/`.

**Решения после этапа 0 (заполнить вручную)**

- Мессенджер: Telegram (MAX недоступен — не удалось создать инстанс)
- Инстанс: `idInstance 410022776184`, тариф `TELEGRAM_DEVELOPER` (console.green-api.com/instanceList/410022776184)
- `apiUrl`: `https://4100.api.green-api.com`
- Статус инстанса: **Неавторизован** — ожидает сканирования QR (Telegram → Настройки → Устройства → «Привязать десктопное устройство»)
- `apiTokenInstance`: сохранён в `.env.local` (не в репозитории) — вставить вручную, скопировав из консоли
- CORS из браузера работает: **да** — запрос с постороннего origin (example.com) к `4100.api.green-api.com` дошёл до сервера (ответ 401 на фиктивный токен, а не ошибка CORS/сети). Vite proxy не нужен.
- `checkAccount` для получателя вернул: `exist: true, chatId: "5964164415", username: "@a97tg"` — см. `docs/fixtures/checkAccount.json`. `sendMessage` на этот chatId доставлен и получен получателем, ответ получателя подтверждён через `GetChatHistory` (`type: "incoming"`) — полный цикл 1:1-чата по номеру телефона работает.
- Хостинг: Vercel / GitHub Pages — ___

**Важная находка при тестировании `ReceiveNotification`:** self-чат (группа только с самим аккаунтом-инстансом)
не подходит для проверки приёма. Сообщение, отправленное с телефона в такую группу, в `GetChatHistory`
помечается как `"type": "outgoing"` (доказательство — `docs/fixtures/getChatHistory-self-chat-proof.json`),
поэтому `incomingWebhook`/`ReceiveNotification` его никогда не поймает — GREEN-API классифицирует сообщение
по отправителю (тот же аккаунт = исходящее), а не по устройству, с которого оно отправлено. Для полноценной
проверки `ReceiveNotification`/`CheckAccount` нужен реальный второй Telegram-аккаунт (другой человек),
который напишет инстансу. Настройки инстанса приведены к финальному виду: `incomingWebhook: yes`,
`webhookUrl` пустой, остальные webhook-флаги — `no`.

**Первый промпт в Claude Code (режим планирования, Shift+Tab)**

> Прочитай CLAUDE.md, все JSON из docs/fixtures/ и скриншоты из docs/design/. Ничего не пиши в код. Составь подробный план реализации по этапам 1–10 с учётом раздела «Решения». Отметь расхождения между фикстурами и примерами из раздела 3 — типы строим по фикстурам. Задай мне вопросы, если что-то неоднозначно.

**Этап 1 — Скелет проекта**

> Прочитай CLAUDE.md. Создай проект Vite react-ts в текущей папке. Установи mobx, mobx-react-lite, axios, react-hook-form, zod, @hookform/resolvers, date-fns, sass. Настрой TS strict, ESLint + Prettier, алиас `@/` на `src`. Создай структуру папок из раздела 4 с заглушками. Ничего лишнего не добавляй.

**Этап 2 — Типизированный API-слой**

> Реализуй `src/api/types.ts` и `src/api/greenApi.ts` по разделу 3: фабрика `createGreenApi({ apiUrl, idInstance, apiTokenInstance })`, возвращающая `sendMessage`, `receiveNotification(timeoutSec, signal)`, `deleteNotification(receiptId)`, `checkAccount(phone)`, `getStateInstance()`. Типы уведомлений — discriminated union по `typeWebhook`/`typeMessage`. Ошибки axios нормализуй в свой класс `ApiError` с понятным текстом на русском. Проверь в браузере, нет ли проблем с CORS; если есть — добавь proxy в vite.config и опиши в README.

**Этап 3 — Сторы MobX**

> Реализуй RootStore, AuthStore, ChatStore, PollingStore по разделу 4. AuthStore: login() проверяет креды через getStateInstance и требует статус authorized, persist в localStorage, logout() очищает всё и останавливает polling. ChatStore: createChat(phone) через checkAccount, send(text) с оптимистичным обновлением, приём входящего, дедупликация по idMessage, счётчик непрочитанных. PollingStore: бесконечный цикл с AbortController, удаление каждого уведомления после обработки, backoff при ошибках. Добавь Context и хук useStores().

**Этап 4 — Экран входа**

> Сделай LoginForm на React Hook Form + Zod: idInstance (только цифры), apiTokenInstance (непустая строка), apiUrl (URL, по умолчанию пусто — тогда показываем подсказку). Состояние загрузки, текст ошибки от API, кнопка «Войти». Стили — CSS Modules + SASS-переменные.

**Этап 5 — Основной layout и список чатов**

> Сделай двухколоночный layout по разделу 5: Sidebar с ChatListItem, NewChatModal (RHF + Zod: телефон, нормализация к цифрам, проверка длины), EmptyState. Кнопка «Выйти».

**Этап 6 — Окно чата**

> Сделай ChatWindow, MessageList (автоскролл, разделители по дням), MessageBubble (in/out, время через date-fns, статус sending/sent/error + retry), MessageInput (RHF + Zod: 1–4096 символов, Enter — отправить, Shift+Enter — перенос). Сбрасывай unread при открытии чата.

**Этап 7 — Сквозная проверка**

> Пройди сценарий из раздела 1 и найди баги: двойной polling при StrictMode, потеря сообщений при переключении чатов, входящие от неизвестного номера, обрыв сети, logout во время запроса. Исправь найденное. Добавь обработку `extendedTextMessage` на уровне парсера защитно (в Telegram его не бывает, но код общий для WhatsApp/MAX на случай смены мессенджера).

**Этап 8 — Полировка UI**

> Доведи стили до вида в духе web.telegram.org: аватары-инициалы, скругления, тени, hover-состояния, адаптив для мобильной ширины (сайдбар/чат как отдельные экраны). Проверь контрастность и фокус-состояния.

**Этап 9 (опционально) — Storybook и тесты**

> Добавь Storybook со stories для MessageBubble, ChatListItem, MessageInput. Добавь несколько unit-тестов (Vitest) на парсинг уведомлений и ChatStore.

**Этап 10 — Docker, деплой, README**

> Добавь Dockerfile (multi-stage: node build → nginx) и docker-compose.yml. Настрой деплой на GitHub Pages или Vercel. Напиши README на русском: описание, стек и почему он, настройка инстанса GREEN-API (пустой Webhook URL, включённые входящие), локальный запуск (npm и Docker), ссылка на демо, скриншоты, архитектура, объяснение CheckAccount и особенности chatId в Telegram, объяснение почему Telegram вместо MAX (п.0 ТЗ разрешает), ограничения (только текст, данные в памяти).

**Этап 11 — Сдача (вручную)**

- Записать короткое видео сценария (2 устройства: веб-чат + телефон с Telegram), сделать скриншоты в `docs/`.
- Отправить письмо на hr@green-api.com по шаблону из раздела 1.

## 7. Чек-лист перед сдачей

- [ ] Вход по idInstance/apiTokenInstance работает, неверные креды дают понятную ошибку
- [ ] Создание чата по номеру, номер не из Telegram → ошибка
- [ ] Отправка через SendMessage, ответ виден у получателя в Telegram
- [ ] Ответ получателя появляется в чате без перезагрузки (ReceiveNotification + DeleteNotification)
- [ ] Очередь уведомлений не залипает (все удаляются)
- [ ] Только текст, лишних функций нет
- [ ] TS strict, без `any`, lint чистый, build проходит
- [ ] README с инструкцией, Docker, демо-ссылка, скриншоты/видео
- [ ] Токен не попадает в логи и в репозиторий
