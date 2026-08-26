import axios, {AxiosInstance} from "axios"
import {createAxiosInstance} from "./http"
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
  GetEntityInfo200Response,
  GetWorkflowVotes200Response,
  ListWorkflowVotesParams,
  AuthProvider
} from "@approvio/api"

import {ApprovioServerConfig, Authenticator} from "../interfaces"
import {isApprovioError, removeTrailingSlash, validateURL} from "./utils"
import {LocationNotFoundError, NetworkError} from "./errors"

type SerializablePrimitive = string | number | boolean | null | undefined
type SerializableValue = SerializablePrimitive | SerializablePrimitive[]

/**
 * Validates that a type consists only of values serializeable by Axios as query parameters.
 * Nested objects result in 'never', triggering a TypeScript error if used.
 */
export type SafeQueryParams<T> = {
  [K in keyof T]: T[K] extends SerializableValue ? T[K] : never
}

export type ApprovioError = (APIError & {status: number}) | Error

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
    return this.get<Workflow, GetWorkflowParams>(`/workflows/${workflowId}`, params)
  }

  /**
   * List workflows.
   */
  listWorkflows(params?: ListWorkflowsParams): TE.TaskEither<ApprovioError, ListWorkflows200Response> {
    const queryParams: Record<string, unknown> = {
      page: params?.page,
      limit: params?.limit,
      includeOnlyNonTerminalState: params?.includeOnlyNonTerminalState,
      include: params?.include
    }
    return this.get<ListWorkflows200Response, ListWorkflowsParams>("/workflows", queryParams)
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
  voteOnWorkflow(workflowId: string, data: WorkflowVoteRequest): TE.TaskEither<ApprovioError, void> {
    return this.post<void>(`/workflows/${workflowId}/vote`, data)
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

  listVotes(
    workflowId: string,
    params?: ListWorkflowVotesParams
  ): TE.TaskEither<ApprovioError, GetWorkflowVotes200Response> {
    return this.get<GetWorkflowVotes200Response>(`/workflows/${workflowId}/votes`, params)
  }

  /**
   * Get available authentication providers.
   */
  getAuthProviders(): TE.TaskEither<ApprovioError, AuthProvider[]> {
    return this.get<AuthProvider[]>("/auth/providers")
  }
}
