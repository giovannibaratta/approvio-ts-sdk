import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import * as TE from "fp-ts/TaskEither"
import {APIError} from "@approvio/api"
import {ApprovioServerConfig, Authenticator} from "../interfaces"
import {isApprovioError, removeTrailingSlash, validateURL} from "./utils"

export type ApprovioError = (APIError & {status: number}) | Error

/**
 * Base client for Approvio API.
 */
export abstract class BaseApprovioClient {
  protected readonly axios: AxiosInstance

  constructor(protected readonly config: ApprovioServerConfig) {
    validateURL(config.endpoint)

    this.axios = axios.create({
      baseURL: removeTrailingSlash(config.endpoint)
    })

    this.axios.interceptors.request.use(async (axiosConfig: InternalAxiosRequestConfig) => {
      const accessToken = await this.getAuthenticator().getAccessToken()
      axiosConfig.headers.set("Authorization", `Bearer ${accessToken}`)
      return axiosConfig
    })
  }

  abstract getAuthenticator(): Authenticator

  protected handleError(error: unknown): ApprovioError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      if (status && isApprovioError(data)) {
        return {
          ...data,
          status
        }
      }
    }

    if (error instanceof Error) return error

    return new Error(String(error))
  }

  /**
   * Performs a GET request.
   */
  protected get<T>(url: string, params?: Record<string, unknown>): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.get<T>(url, {params})
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a POST request.
   */
  protected post<T>(url: string, data?: unknown): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.post<T>(url, data)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a PUT request.
   */
  protected put<T>(url: string, data?: unknown): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.put<T>(url, data)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a DELETE request.
   */
  protected delete<T>(url: string): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.delete<T>(url)
        return response.data
      },
      error => this.handleError(error)
    )
  }
}
