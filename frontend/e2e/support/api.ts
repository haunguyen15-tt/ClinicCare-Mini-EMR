import { expect, request as playwrightRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import type { Consultation, ConsultationCreate, ConsultationList, ConsultationQuery, Token } from '../../types/api'
import { API_URL, DOCTOR } from './env'

/** A client for the real backend, signed in as the demo doctor: test setup and read-backs. */
export class Backend {
  private constructor(private readonly http: APIRequestContext) {}

  static async signIn(): Promise<Backend> {
    const anonymous = await playwrightRequest.newContext({ baseURL: API_URL })
    const response = await anonymous.post('/auth/login', {
      data: { username: DOCTOR.username, password: DOCTOR.password },
    })
    expect(response.status()).toBe(200)
    const { access_token } = (await response.json()) as Token
    await anonymous.dispose()

    const http = await playwrightRequest.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${access_token}` },
    })
    return new Backend(http)
  }

  async createConsultation(body: ConsultationCreate): Promise<Consultation> {
    const response = await this.http.post('/consultation', { data: body })
    expect(response.status(), await response.text()).toBe(201)
    return (await response.json()) as Consultation
  }

  async listConsultations(query: ConsultationQuery = {}): Promise<ConsultationList> {
    const response = await this.http.get('/consultation', { params: { ...query } })
    expect(response.status()).toBe(200)
    return (await response.json()) as ConsultationList
  }

  async dispose(): Promise<void> {
    await this.http.dispose()
  }
}
