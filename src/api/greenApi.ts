import axios, { type AxiosInstance, isAxiosError } from 'axios'
import type {
  CheckAccountResponse,
  DeleteNotificationResponse,
  GetStateInstanceResponse,
  ReceiveNotificationResponse,
  SendMessageResponse,
} from './types'

export class ApiError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.cause = cause
  }
}

function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as { message?: string } | undefined
      return new ApiError(
        data?.message ?? `GREEN-API вернул ошибку ${error.response.status}`,
        error,
      )
    }
    if (error.request) {
      return new ApiError('Нет ответа от GREEN-API — проверьте соединение и apiUrl', error)
    }
  }
  return new ApiError('Неизвестная ошибка запроса к GREEN-API', error)
}

export interface GreenApiConfig {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export function createGreenApi({ apiUrl, idInstance, apiTokenInstance }: GreenApiConfig) {
  const base = `${apiUrl}/waInstance${idInstance}`
  const client: AxiosInstance = axios.create()

  async function sendMessage(chatId: string, message: string): Promise<SendMessageResponse> {
    try {
      const { data } = await client.post<SendMessageResponse>(
        `${base}/sendMessage/${apiTokenInstance}`,
        { chatId, message },
      )
      return data
    } catch (error) {
      throw toApiError(error)
    }
  }

  async function receiveNotification(
    timeoutSec: number,
    signal?: AbortSignal,
  ): Promise<ReceiveNotificationResponse | null> {
    try {
      const { data } = await client.get<ReceiveNotificationResponse | null>(
        `${base}/receiveNotification/${apiTokenInstance}`,
        { params: { receiveTimeout: timeoutSec }, signal },
      )
      return data
    } catch (error) {
      throw toApiError(error)
    }
  }

  async function deleteNotification(receiptId: number): Promise<DeleteNotificationResponse> {
    try {
      const { data } = await client.delete<DeleteNotificationResponse>(
        `${base}/deleteNotification/${apiTokenInstance}/${receiptId}`,
      )
      return data
    } catch (error) {
      throw toApiError(error)
    }
  }

  async function checkAccount(phoneNumber: number): Promise<CheckAccountResponse> {
    try {
      const { data } = await client.post<CheckAccountResponse>(
        `${base}/checkAccount/${apiTokenInstance}`,
        { phoneNumber },
      )
      return data
    } catch (error) {
      throw toApiError(error)
    }
  }

  async function getStateInstance(): Promise<GetStateInstanceResponse> {
    try {
      const { data } = await client.get<GetStateInstanceResponse>(
        `${base}/getStateInstance/${apiTokenInstance}`,
      )
      return data
    } catch (error) {
      throw toApiError(error)
    }
  }

  return { sendMessage, receiveNotification, deleteNotification, checkAccount, getStateInstance }
}

export type GreenApi = ReturnType<typeof createGreenApi>
