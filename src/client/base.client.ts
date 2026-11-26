import axios, {AxiosInstance} from "axios"
import {createAxiosInstance} from "./http"
import * as TE from "fp-ts/TaskEither"
import {APIError} from "@approvio/api"

import {ApprovioServerConfig, Authenticator} from "../interfaces"
import {isApprovioError, removeTrailingSlash, validateURL} from "./utils"
import {
  LocationNotFoundError,
  NetworkError,
  OrganizationContextChangedError,
  OrganizationSuspendedError
} from "./errors"

type SerializablePrimitive = string | number | boolean | null | undefined
type SerializableValue = SerializablePrimitive | SerializablePrimitive[]

/**
 * Validates that a type consists only of values serializeable by Axios as query parameters.
 * Nested objects result in 'never', triggering a TypeScript error if used.
 */
export type SafeQueryParams<T> = {
  [K in keyof T]: T[K] extends SerializableValue ? T[K] : never
}

export type ApprovioError =
  | (APIError & {status: number})
  | OrganizationContextChangedError
  | OrganizationSuspendedError
  | Error

export interface Versioned<T> {
  data: T
  etag: string
}

const networkCodes = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET"]

/**
 * Base client for Approvio API.
 */
export abstract class BaseApprovioClient {
  protected readonly axios: AxiosInstance

  constructor(
    protected readonly config: ApprovioServerConfig,
    protected readonly authenticator: Authenticator
  ) {
    validateURL(config.endpoint)

    this.axios = createAxiosInstance({
      baseURL: removeTrailingSlash(config.endpoint),
      paramsSerializer: {
        indexes: null // Removes brackets from array params: key=a&key=b
      }
    })

    this.authenticator.customizeAxios(this.axios)
  }
  protected handleError(error: unknown): ApprovioError {
    if (axios.isAxiosError(error)) {
      if (networkCodes.includes(error.code ?? "")) return new NetworkError(`Network error ${error.code}`)

      const status = error.response?.status
      const data = error.response?.data
      if (status && isApprovioError(data)) {
        if (data.code === "ORGANIZATION_CONTEXT_CHANGED") {
          return new OrganizationContextChangedError(status, data.message)
        }
        if (data.code === "ORGANIZATION_SUSPENDED") {
          return new OrganizationSuspendedError(status, data.message)
        }
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
  protected get<Response, Params extends SafeQueryParams<Params> = Record<string, SerializableValue>>(
    url: string,
    params?: Params
  ): TE.TaskEither<ApprovioError, Response> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.get<Response>(url, {params})
        return response.data
      },
      error => this.handleError(error)
    )
  }

  protected getVersioned<Response, Params extends SafeQueryParams<Params> = Record<string, SerializableValue>>(
    url: string,
    params?: Params
  ): TE.TaskEither<ApprovioError, Versioned<Response>> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.get<Response>(url, {params})
        const etag = response.headers.etag
        if (typeof etag !== "string" || !etag) throw new Error("ETag header was expected but not found")
        return {data: response.data, etag}
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a POST request.
   */
  protected post<T>(url: string, data?: unknown, headers?: Record<string, string>): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = headers ? await this.axios.post<T>(url, data, {headers}) : await this.axios.post<T>(url, data)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  protected postVersioned<T>(
    url: string,
    data: unknown,
    headers?: Record<string, string>
  ): TE.TaskEither<ApprovioError, Versioned<T>> {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.post<T>(url, data, {headers})
        const etag = response.headers.etag
        if (typeof etag !== "string" || !etag) throw new Error("ETag header was expected but not found")
        return {data: response.data, etag}
      },
      error => this.handleError(error)
    )
  }

  protected postWithLocation<T>(
    url: string,
    data?: unknown
  ): TE.TaskEither<
    ApprovioError,
    {
      data: T
      location: string
    }
  > {
    return TE.tryCatch(
      async () => {
        const response = await this.axios.post<T>(url, data)
        const location = response.headers["location"]

        if (!location) throw new LocationNotFoundError()

        return {
          data: response.data,
          location
        }
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a PUT request.
   */
  protected put<T>(url: string, data?: unknown, headers?: Record<string, string>): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = headers ? await this.axios.put<T>(url, data, {headers}) : await this.axios.put<T>(url, data)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  protected patch<T>(url: string, data?: unknown, headers?: Record<string, string>): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const response = headers
          ? await this.axios.patch<T>(url, data, {headers})
          : await this.axios.patch<T>(url, data)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Performs a DELETE request.
   */
  protected delete<T>(url: string, data?: unknown, headers?: Record<string, string>): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const config = data !== undefined || headers ? {data, headers} : undefined
        const response = await this.axios.delete<T>(url, config)
        return response.data
      },
      error => this.handleError(error)
    )
  }
}
