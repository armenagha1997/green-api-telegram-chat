import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GreenApi } from '@/api/greenApi'
import { ApiError } from '@/api/greenApi'
import type { IncomingMessageWebhook } from '@/api/types'
import { ChatStore } from './ChatStore'

function createMockApi(overrides: Partial<GreenApi> = {}): GreenApi {
  return {
    sendMessage: vi.fn(),
    receiveNotification: vi.fn(),
    deleteNotification: vi.fn(),
    checkAccount: vi.fn(),
    getStateInstance: vi.fn(),
    ...overrides,
  } as unknown as GreenApi
}

function incomingText(overrides: Partial<IncomingMessageWebhook> = {}): IncomingMessageWebhook {
  return {
    typeWebhook: 'incomingMessageReceived',
    instanceData: { idInstance: 1, wid: '70000000000@c.us', typeInstance: 'telegram' },
    timestamp: 1700000000,
    idMessage: 'msg-1',
    senderData: { chatId: 'chat-1', sender: 'chat-1', chatName: 'Друг' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    ...overrides,
  }
}

describe('ChatStore.handleIncoming', () => {
  let store: ChatStore

  beforeEach(() => {
    store = new ChatStore()
  })

  it('создаёт новый чат для неизвестного chatId', () => {
    store.handleIncoming(incomingText())
    const chat = store.chats.get('chat-1')
    expect(chat).toBeDefined()
    expect(chat?.name).toBe('Друг')
    expect(chat?.messages).toHaveLength(1)
    expect(chat?.messages[0]).toMatchObject({ text: 'Привет', direction: 'in', status: 'sent' })
  })

  it('дедуплицирует повторное уведомление с тем же idMessage', () => {
    store.handleIncoming(incomingText())
    store.handleIncoming(incomingText())
    expect(store.chats.get('chat-1')?.messages).toHaveLength(1)
  })

  it('увеличивает unread, если чат неактивен', () => {
    store.handleIncoming(incomingText())
    expect(store.chats.get('chat-1')?.unread).toBe(1)
  })

  it('не увеличивает unread, если чат уже открыт', () => {
    store.chats.set('chat-1', { chatId: 'chat-1', phone: '', unread: 0, messages: [] })
    store.setActiveChat('chat-1')
    store.handleIncoming(incomingText())
    expect(store.chats.get('chat-1')?.unread).toBe(0)
  })

  it('обрабатывает extendedTextMessage (защита на случай WhatsApp/MAX)', () => {
    store.handleIncoming(
      incomingText({
        idMessage: 'msg-2',
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'Длинное сообщение' },
        },
      }),
    )
    expect(store.chats.get('chat-1')?.messages[0]?.text).toBe('Длинное сообщение')
  })

  it('игнорирует нетекстовые сообщения и не создаёт чат', () => {
    store.handleIncoming(
      incomingText({ messageData: { typeMessage: 'imageMessage', fileMessageData: {} } }),
    )
    expect(store.chats.size).toBe(0)
  })
})

describe('ChatStore.send', () => {
  let store: ChatStore

  beforeEach(() => {
    store = new ChatStore()
    store.chats.set('chat-1', { chatId: 'chat-1', phone: '79990000000', unread: 0, messages: [] })
  })

  it('оптимистично добавляет сообщение и переводит в sent при успехе', async () => {
    const api = createMockApi({
      sendMessage: vi.fn().mockResolvedValue({ idMessage: 'real-id' }),
    })
    store.setApi(api)

    const sendPromise = store.send('chat-1', 'Тест')
    expect(store.chats.get('chat-1')?.messages[0]?.status).toBe('sending')

    await sendPromise
    const message = store.chats.get('chat-1')?.messages[0]
    expect(message?.status).toBe('sent')
    expect(message?.id).toBe('real-id')
  })

  it('переводит сообщение в error с текстом причины при сбое', async () => {
    const api = createMockApi({
      sendMessage: vi.fn().mockRejectedValue(new ApiError('GREEN-API вернул ошибку 401')),
    })
    store.setApi(api)

    await store.send('chat-1', 'Тест')
    const message = store.chats.get('chat-1')?.messages[0]
    expect(message?.status).toBe('error')
    expect(message?.errorMessage).toBe('GREEN-API вернул ошибку 401')
  })

  it('не применяет отложенный ответ, если api сменился за время запроса (logout)', async () => {
    let resolveSend: (value: { idMessage: string }) => void = () => {}
    const api = createMockApi({
      sendMessage: vi.fn(
        () =>
          new Promise<{ idMessage: string }>((resolve) => {
            resolveSend = resolve
          }),
      ),
    })
    store.setApi(api)

    const sendPromise = store.send('chat-1', 'Тест')
    store.reset() // logout произошёл, пока запрос ещё в полёте
    resolveSend({ idMessage: 'late-id' })
    await sendPromise

    expect(store.chats.size).toBe(0) // чат не воскрес после logout
  })
})

describe('ChatStore.createChat', () => {
  let store: ChatStore

  beforeEach(() => {
    store = new ChatStore()
  })

  it('создаёт чат, если номер существует в Telegram', async () => {
    const api = createMockApi({
      checkAccount: vi
        .fn()
        .mockResolvedValue({ exist: true, chatId: '10000000', username: '@username' }),
    })
    store.setApi(api)

    const ok = await store.createChat('79991234567')
    expect(ok).toBe(true)
    expect(store.chats.get('10000000')).toMatchObject({ name: '@username' })
    expect(store.activeChatId).toBe('10000000')
  })

  it('выставляет понятную ошибку, если номер не зарегистрирован', async () => {
    const api = createMockApi({
      checkAccount: vi.fn().mockResolvedValue({ exist: false, chatId: '' }),
    })
    store.setApi(api)

    const ok = await store.createChat('10000000000')
    expect(ok).toBe(false)
    expect(store.createChatError).toMatch(/не зарегистрирован/)
    expect(store.chats.size).toBe(0)
  })
})
