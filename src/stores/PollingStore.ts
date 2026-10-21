import { makeAutoObservable } from 'mobx'
import { isAxiosError } from 'axios'
import type { GreenApi } from '@/api/greenApi'
import { isIncomingMessageWebhook } from '@/api/types'
import type { ChatStore } from './ChatStore'

const RECEIVE_TIMEOUT_SEC = 20
const ERROR_BACKOFF_MS = 4000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isAbortError(error: unknown): boolean {
  return isAxiosError(error) && error.code === 'ERR_CANCELED'
}

export class PollingStore {
  isRunning = false
  private readonly chatStore: ChatStore
  private api: GreenApi | null = null
  private abortController: AbortController | null = null

  constructor(chatStore: ChatStore) {
    this.chatStore = chatStore
    makeAutoObservable<this, 'chatStore' | 'api' | 'abortController'>(this, {
      chatStore: false,
      api: false,
      abortController: false,
    })
  }

  start(api: GreenApi): void {
    if (this.isRunning) return
    this.api = api
    this.isRunning = true
    this.abortController = new AbortController()
    void this.loop()
  }

  stop(): void {
    this.isRunning = false
    this.abortController?.abort()
    this.abortController = null
    this.api = null
  }

  private async loop(): Promise<void> {
    while (this.isRunning && this.api) {
      const signal = this.abortController?.signal
      try {
        const notification = await this.api.receiveNotification(RECEIVE_TIMEOUT_SEC, signal)
        if (!this.isRunning) break
        if (notification) {
          const { receiptId, body } = notification
          if (isIncomingMessageWebhook(body)) {
            this.chatStore.handleIncoming(body)
          }
          await this.api.deleteNotification(receiptId)
        }
      } catch (error) {
        if (!this.isRunning || isAbortError(error)) break
        await delay(ERROR_BACKOFF_MS)
      }
    }
  }
}
