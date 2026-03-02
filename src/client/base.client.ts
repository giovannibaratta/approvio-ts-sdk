import axios, {AxiosInstance, InternalAxiosRequestConfig} from "axios"
import * as TE from "fp-ts/TaskEither"
import {
  APIError,
  Workflow,
  ListWorkflows200Response,
  WorkflowCreate,
  WorkflowVoteRequest,
  CanVoteResponse,
  ListRoleTemplates200Response,
  ListWorkflowsParams,
  GetWorkflowParams,
  GetEntityInfo200Response
} from "@approvio/api"

import {ApprovioServerConfig, Authenticator} from "../interfaces"
import {isApprovioError, removeTrailingSlash, validateURL} from "./utils"
import {LocationNotFoundError, NetworkError} from "./errors"

export type ApprovioError = (APIError & {status: number}) | Error

const networkCodes = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET"]

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
      if (networkCodes.includes(error.code ?? "")) return new NetworkError(`Network error ${error.code}`)

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
  protected delete<T>(url: string, data?: unknown): TE.TaskEither<ApprovioError, T> {
    return TE.tryCatch(
      async () => {
        const config = data !== undefined ? {data} : undefined
        const response = await this.axios.delete<T>(url, config)
        return response.data
      },
      error => this.handleError(error)
    )
  }

  /**
   * Get workflow details.
   */
  getWorkflow(workflowId: string, params?: GetWorkflowParams): TE.TaskEither<ApprovioError, Workflow> {
    return this.get<Workflow>(`/workflows/${workflowId}`, params as Record<string, unknown>)
  }

  /**
   * List workflows.
   */
  listWorkflows(params?: ListWorkflowsParams): TE.TaskEither<ApprovioError, ListWorkflows200Response> {
    const queryParams: Record<string, unknown> = {
      page: params?.page,
      limit: params?.limit,
      "include-only-non-terminal-state": params?.includeOnlyNonTerminalState,
      include: params?.include
    }
    return this.get<ListWorkflows200Response>("/workflows", queryParams)
  }

  /**
   * Create a new workflow.
   */
  createWorkflow(data: WorkflowCreate): TE.TaskEither<ApprovioError, void> {
    return this.post<void>("/workflows", data)
  }

  /**
   * Vote on a workflow.
   */
  voteOnWorkflow(workflowId: string, data: WorkflowVoteRequest): TE.TaskEither<ApprovioError, unknown> {
    return this.post<unknown>(`/workflows/${workflowId}/vote`, data)
  }

  /**
   * Check if the current entity can vote on a workflow.
   */
  canVoteOnWorkflow(workflowId: string): TE.TaskEither<ApprovioError, CanVoteResponse> {
    return this.get<CanVoteResponse>(`/workflows/${workflowId}/canVote`)
  }

  /**
   * List role templates.
   */
  listRoleTemplates(): TE.TaskEither<ApprovioError, ListRoleTemplates200Response> {
    return this.get<ListRoleTemplates200Response>("/roles")
  }

  /**
   * Get authenticated entity information.
   */
  getEntityInfo(): TE.TaskEither<ApprovioError, GetEntityInfo200Response> {
    return this.get<GetEntityInfo200Response>("/auth/info")
  }
}
