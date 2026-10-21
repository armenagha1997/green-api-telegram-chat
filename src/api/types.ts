// DTO-типы GREEN-API, сверено с фикстурами в docs/fixtures/ и разделом 3 CLAUDE.md.

export interface SendMessageResponse {
  idMessage: string
}

export interface CheckAccountResponse {
  exist: boolean
  chatId: string
  username?: string
  phoneNumber?: number
  fromCache?: boolean
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'starting'
  | 'yellowCard'
  | 'sleepMode'
  | (string & {})

export interface GetStateInstanceResponse {
  stateInstance: InstanceState
}

export interface DeleteNotificationResponse {
  result: boolean
  reason?: string
}

export interface TextMessageData {
  textMessage: string
  forwardingScore?: number
  isForwarded?: boolean
}

// В Telegram extendedTextMessage не встречается (текст всегда в textMessageData),
// но тип общий для WhatsApp/MAX на случай смены мессенджера — см. раздел 3 CLAUDE.md.
export interface ExtendedTextMessageData {
  text: string
  forwardingScore?: number
  isForwarded?: boolean
}

export type IncomingMessageData =
  | { typeMessage: 'textMessage'; textMessageData: TextMessageData }
  | { typeMessage: 'extendedTextMessage'; extendedTextMessageData: ExtendedTextMessageData }
  | { typeMessage: string; [key: string]: unknown }

export interface SenderData {
  chatId: string
  chatType?: string
  sender: string
  chatName?: string
  senderName?: string
  senderType?: string
  senderContactName?: string
  // Есть только у WhatsApp/MAX, в Telegram отсутствует — не использовать для матчинга.
  senderPhoneNumber?: number
}

export interface IncomingMessageWebhook {
  typeWebhook: 'incomingMessageReceived'
  instanceData: { idInstance: number; wid: string; typeInstance: string }
  timestamp: number
  idMessage: string
  senderData: SenderData
  messageData: IncomingMessageData
}

// Прочие типы вебхуков (outgoingMessageReceived, stateInstanceChanged и т.п.) —
// не обрабатываем, только удаляем из очереди.
export interface OtherWebhook {
  typeWebhook: string
  [key: string]: unknown
}

export type WebhookBody = IncomingMessageWebhook | OtherWebhook

export interface ReceiveNotificationResponse {
  receiptId: number
  body: WebhookBody
}

export function isIncomingMessageWebhook(body: WebhookBody): body is IncomingMessageWebhook {
  return body.typeWebhook === 'incomingMessageReceived'
}

export function isTextMessage(
  messageData: IncomingMessageData,
): messageData is { typeMessage: 'textMessage'; textMessageData: TextMessageData } {
  return messageData.typeMessage === 'textMessage'
}

export function isExtendedTextMessage(
  messageData: IncomingMessageData,
): messageData is { typeMessage: 'extendedTextMessage'; extendedTextMessageData: ExtendedTextMessageData } {
  return messageData.typeMessage === 'extendedTextMessage'
}
