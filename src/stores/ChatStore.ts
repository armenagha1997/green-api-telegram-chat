import { makeAutoObservable, runInAction } from 'mobx'
import { ApiError, type GreenApi } from '@/api/greenApi'
import { isExtendedTextMessage, isTextMessage, type IncomingMessageWebhook } from '@/api/types'

export interface Message {
  id: string
  chatId: string
  text: string
  direction: 'in' | 'out'
  timestamp: number
  status: 'sending' | 'sent' | 'error'
}

export interface Chat {
  chatId: string
  phone: string
  name?: string
  messages: Message[]
  unread: number
}

export class ChatStore {
  chats = new Map<string, Chat>()
  activeChatId: string | null = null
  isCreatingChat = false
  createChatError: string | null = null
  private api: GreenApi | null = null

  constructor() {
    makeAutoObservable<this, 'api'>(this, { api: false })
  }

  setApi(api: GreenApi | null): void {
    this.api = api
  }

  get chatList(): Chat[] {
    return [...this.chats.values()].sort((a, b) => {
      const aLast = a.messages.at(-1)?.timestamp ?? 0
      const bLast = b.messages.at(-1)?.timestamp ?? 0
      return bLast - aLast
    })
  }

  get activeChat(): Chat | null {
    return this.activeChatId ? (this.chats.get(this.activeChatId) ?? null) : null
  }

  setActiveChat(chatId: string | null): void {
    this.activeChatId = chatId
    if (chatId) {
      const chat = this.chats.get(chatId)
      if (chat) chat.unread = 0
    }
  }

  async createChat(phone: string): Promise<boolean> {
    const api = this.api
    if (!api) return false
    this.isCreatingChat = true
    this.createChatError = null
    try {
      const result = await api.checkAccount(Number(phone))
      if (this.api !== api) return false // logout произошёл, пока ждали ответ — не применяем
      if (!result.exist) {
        runInAction(() => {
          this.createChatError =
            'Номер не зарегистрирован в Telegram, либо получатель должен добавить вас в контакты и разрешить поиск по номеру телефона.'
          this.isCreatingChat = false
        })
        return false
      }
      runInAction(() => {
        if (!this.chats.has(result.chatId)) {
          this.chats.set(result.chatId, {
            chatId: result.chatId,
            phone,
            name: result.username,
            messages: [],
            unread: 0,
          })
        }
        this.activeChatId = result.chatId
        this.isCreatingChat = false
      })
      return true
    } catch (error) {
      if (this.api !== api) return false // logout произошёл, пока ждали ответ
      runInAction(() => {
        this.createChatError =
          error instanceof ApiError ? error.message : 'Не удалось создать чат'
        this.isCreatingChat = false
      })
      return false
    }
  }

  async send(chatId: string, text: string): Promise<void> {
    const api = this.api
    if (!api) return
    const chat = this.chats.get(chatId)
    if (!chat) return

    const tempId = `tmp-${crypto.randomUUID()}`
    const message: Message = {
      id: tempId,
      chatId,
      text,
      direction: 'out',
      timestamp: Date.now(),
      status: 'sending',
    }
    runInAction(() => {
      chat.messages.push(message)
    })

    try {
      const { idMessage } = await api.sendMessage(chatId, text)
      if (this.api !== api) return // logout произошёл, пока ждали ответ — чат уже сброшен
      runInAction(() => {
        const msg = chat.messages.find((m) => m.id === tempId)
        if (msg) {
          msg.id = idMessage
          msg.status = 'sent'
        }
      })
    } catch {
      if (this.api !== api) return
      runInAction(() => {
        const msg = chat.messages.find((m) => m.id === tempId)
        if (msg) msg.status = 'error'
      })
    }
  }

  retry(chatId: string, messageId: string): void {
    const chat = this.chats.get(chatId)
    const msg = chat?.messages.find((m) => m.id === messageId)
    if (!chat || !msg) return
    chat.messages = chat.messages.filter((m) => m.id !== messageId)
    void this.send(chatId, msg.text)
  }

  handleIncoming(webhook: IncomingMessageWebhook): void {
    let text: string | null = null
    if (isTextMessage(webhook.messageData)) {
      text = webhook.messageData.textMessageData.textMessage
    } else if (isExtendedTextMessage(webhook.messageData)) {
      text = webhook.messageData.extendedTextMessageData.text
    }
    if (text === null) return // не текстовое сообщение — по ТЗ не обрабатываем

    const chatId = webhook.senderData.chatId
    let chat = this.chats.get(chatId)
    if (!chat) {
      chat = {
        chatId,
        phone: '',
        name: webhook.senderData.chatName ?? webhook.senderData.senderName,
        messages: [],
        unread: 0,
      }
      this.chats.set(chatId, chat)
    }

    if (chat.messages.some((m) => m.id === webhook.idMessage)) return // дедупликация

    chat.messages.push({
      id: webhook.idMessage,
      chatId,
      text,
      direction: 'in',
      timestamp: webhook.timestamp * 1000,
      status: 'sent',
    })

    if (this.activeChatId !== chatId) {
      chat.unread += 1
    }
  }

  reset(): void {
    this.chats.clear()
    this.activeChatId = null
    this.isCreatingChat = false
    this.createChatError = null
  }
}
