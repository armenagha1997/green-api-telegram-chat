import { makeAutoObservable, runInAction } from 'mobx'
import { ApiError, createGreenApi, type GreenApi } from '@/api/greenApi'

const STORAGE_KEY = 'green-api-auth'

export interface AuthCredentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export class AuthStore {
  idInstance = ''
  apiTokenInstance = ''
  apiUrl = ''
  isAuthenticated = false
  isLoading = false
  error: string | null = null
  api: GreenApi | null = null

  constructor() {
    makeAutoObservable<this, 'api'>(this, { api: false })
    this.restore()
  }

  private restore(): void {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const creds = JSON.parse(raw) as AuthCredentials
      this.idInstance = creds.idInstance
      this.apiTokenInstance = creds.apiTokenInstance
      this.apiUrl = creds.apiUrl
      this.api = createGreenApi(creds)
      this.isAuthenticated = true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  async login(creds: AuthCredentials): Promise<boolean> {
    this.isLoading = true
    this.error = null
    const api = createGreenApi(creds)
    try {
      const { stateInstance } = await api.getStateInstance()
      if (stateInstance !== 'authorized') {
        runInAction(() => {
          this.error = `Инстанс не авторизован (статус: ${stateInstance}). Авторизуйте инстанс в консоли GREEN-API — отсканируйте QR-код в Telegram.`
          this.isLoading = false
        })
        return false
      }
      runInAction(() => {
        this.idInstance = creds.idInstance
        this.apiTokenInstance = creds.apiTokenInstance
        this.apiUrl = creds.apiUrl
        this.api = api
        this.isAuthenticated = true
        this.isLoading = false
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(creds))
      return true
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof ApiError
            ? error.message
            : 'Не удалось подключиться к GREEN-API. Проверьте idInstance, apiTokenInstance и apiUrl.'
        this.isLoading = false
      })
      return false
    }
  }

  logout(): void {
    this.idInstance = ''
    this.apiTokenInstance = ''
    this.apiUrl = ''
    this.api = null
    this.isAuthenticated = false
    this.error = null
    localStorage.removeItem(STORAGE_KEY)
  }
}
