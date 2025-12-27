import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import * as TE from "fp-ts/TaskEither"
import {APIError} from "@approvio/api"
import {ApprovioConfig} from "../config"

export type ApprovioError = (APIError & {status: number}) | Error

/**
 * Base client for Approvio API.
 */
export abstract class BaseApprovioClient {
  protected readonly axios: AxiosInstance

  constructor(protected readonly config: ApprovioConfig) {
    this.axios = axios.create({
      baseURL: config.endpoint
    })

    this.axios.interceptors.request.use(async (axiosConfig: InternalAxiosRequestConfig) => {
      const accessToken = await config.authenticator.getAccessToken()
      axiosConfig.headers.set("Authorization", `Bearer ${accessToken}`)
      return axiosConfig
    })
  }

  protected handleError(error: unknown): ApprovioError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      if (
        status &&
        data &&
        typeof data === "object" &&
        "message" in data &&
        "code" in data &&
        typeof data.message === "string" &&
        typeof data.code === "string"
      ) {
        return {
          ...(data as APIError),
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

/**
 * Checks if an error has a specific status code.
 */
export function isStatus(error: unknown, status: number): boolean {
  return (
    error !== null && typeof error === "object" && "status" in error && (error as {status?: number}).status === status
  )
}
