import { describe, expect, it } from 'vitest'
import {
  isExtendedTextMessage,
  isIncomingMessageWebhook,
  isTextMessage,
  type IncomingMessageWebhook,
  type OtherWebhook,
  type WebhookBody,
} from './types'

const textMessageWebhook: IncomingMessageWebhook = {
  typeWebhook: 'incomingMessageReceived',
  instanceData: { idInstance: 1101123456, wid: '79876543210@c.us', typeInstance: 'telegram' },
  timestamp: 1763115112,
  idMessage: '1763115112345',
  senderData: {
    chatId: '10000000',
    chatType: 'user',
    sender: '10000000',
    chatName: 'Имя',
    senderName: 'Имя',
    senderType: 'user',
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет', forwardingScore: 0, isForwarded: false },
  },
}

describe('isIncomingMessageWebhook', () => {
  it('распознаёт реальную фикстуру incomingMessageReceived', () => {
    expect(isIncomingMessageWebhook(textMessageWebhook)).toBe(true)
  })

  it('отклоняет прочие типы вебхуков (outgoing, stateInstanceChanged и т.п.)', () => {
    const other: OtherWebhook = { typeWebhook: 'outgoingMessageReceived' }
    expect(isIncomingMessageWebhook(other)).toBe(false)
  })
})

describe('isTextMessage / isExtendedTextMessage', () => {
  it('textMessage — основной формат Telegram', () => {
    expect(isTextMessage(textMessageWebhook.messageData)).toBe(true)
    expect(isExtendedTextMessage(textMessageWebhook.messageData)).toBe(false)
  })

  it('extendedTextMessage — защитная обработка формата WhatsApp/MAX', () => {
    const extended: WebhookBody = {
      ...textMessageWebhook,
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'Длинный текст', forwardingScore: 0, isForwarded: false },
      },
    }
    if (!isIncomingMessageWebhook(extended)) throw new Error('unreachable')
    expect(isExtendedTextMessage(extended.messageData)).toBe(true)
    expect(isTextMessage(extended.messageData)).toBe(false)
  })

  it('прочие типы (imageMessage и т.п.) не распознаются ни как текст, ни как extended', () => {
    const image = { typeMessage: 'imageMessage', fileMessageData: {} }
    expect(isTextMessage(image)).toBe(false)
    expect(isExtendedTextMessage(image)).toBe(false)
  })
})
